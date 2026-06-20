import fs from "fs";
import path from "path";
import type { Pool } from "pg";
import pool from "../database.js";

/**
 * Locate db_seeding.sql, covering whether the process runs with its cwd at the
 * backend dir (the Render/local default) or at the repo root. Override with
 * SEED_SQL_PATH if your layout differs.
 */
function resolveSeedPath(): string {
    const candidates = [
        process.env.SEED_SQL_PATH,
        path.resolve(process.cwd(), "../database/db_seeding.sql"),
        path.resolve(process.cwd(), "database/db_seeding.sql"),
    ].filter(Boolean) as string[];

    const found = candidates.find((p) => fs.existsSync(p));
    if (!found) {
        throw new Error(
            `Seed SQL not found. Set SEED_SQL_PATH. Tried: ${candidates.join(", ")}`
        );
    }
    return found;
}

// The file is read once and cached — it never changes at runtime.
let cachedSql: string | null = null;
function loadSeedSql(): string {
    if (cachedSql == null) cachedSql = fs.readFileSync(resolveSeedPath(), "utf8");
    return cachedSql;
}

// Coalesce concurrent re-seeds: if a reset is already running, additional demo
// logins await that same run instead of truncating/reinserting on top of it.
let inFlight: Promise<void> | null = null;

async function runSeed(p: Pool): Promise<void> {
    const sql = loadSeedSql();
    const client = await p.connect();
    try {
        // The seed file manages its own BEGIN/COMMIT and seeds the RNG
        // (setseed), so a single simple-query batch reproduces the exact same
        // demo data every time.
        await client.query(sql);
    } finally {
        client.release();
    }
}

/**
 * Reset all demo data to its deterministic seeded baseline. Called on each demo
 * login so every visitor starts from the same state, and any edits made during a
 * previous visit are discarded on the next entry. Concurrent calls share one run.
 */
export function reseedDemo(p: Pool = pool): Promise<void> {
    if (inFlight) return inFlight;
    inFlight = runSeed(p).finally(() => {
        inFlight = null;
    });
    return inFlight;
}
