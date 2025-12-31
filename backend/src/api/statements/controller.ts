import type { Request, Response } from "express";
import pool from "../../database.js";
import {
  sqlStatementList,
  sqlStatementStatus,
  sqlDeleteStatement
} from "../statements/sql.js";

/**
 * Req.query is always a string, so number must be converted into integers.
 */
function toInt(v: any): number | undefined {
    if (v === undefined) return undefined;
    const n = Number(v);

    // Truncate number (round down) if its finite, else its undefined.
    return Number.isFinite(n) ? Math.trunc(n) : undefined;
}

/**
 * Gets the current userId (fake user id for now).
 * I tell TS that request has extra properties for user.
 */
function getUserId(req: Request): number {
    return (req as any).user?.userId ?? 1;
}

/**
 * Get a list of bank statements for the user
 */
export async function getStatementList(req: Request, res: Response) {
  try {
    const userId = getUserId(req);
    const limit = toInt(req.query.limit);

    if (limit != null && limit < 0) return res.status(400).json({ error: "limit must be >= 0" });

    const data = await sqlStatementList(pool, userId, limit);
    res.json({ data, limit: limit ?? null });
  } catch (err) {
    console.error("Error getting the transaction list:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

/**
 * Get the processing status for the statement
 */
export async function getStatementStatus(req: Request, res: Response) {
  try {
    const userId = getUserId(req);
    const statementId = toInt(req.query.statementId);

    if (statementId == null || statementId <= 0) return res.status(400).json({ error: "statement id not found" });

    const data = await sqlStatementStatus(pool, userId, statementId);
    if (!data) {
      return res.status(404).json({ error: "statement not found" })
    }

    res.json({ statementId, data });
  } catch (err) {
    console.error("Error getting the transaction list:", err);
    return res.json({ error: "Internal Server Error" });
  }
}

/**
 * Delete the statement id and all its data
 */
export async function deleteStatement(req: Request, res: Response) {
  try {
    const userId = getUserId(req);
    const statementId = toInt(req.query.statementId);

    if (!statementId) return res.status(400).json({ error: "statement id not found" });

    const data = await sqlDeleteStatement(pool, userId, statementId);

    if (!data) return res.status(404).json({ error: "statement not found" });

    res.json({ data });
  } catch (err) {
    console.error("Error getting the transaction list:", err);
    return res.json({ error: "Internal Server Error" });
  }
}
