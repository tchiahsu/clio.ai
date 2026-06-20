import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import pool from "../../database.js";
import { sqlGetUserLogin, sqlCreateUser, sqlGetUserById } from "./sql.js";
import { createSession, deleteSession, getSession } from "./sessionStore.js";
import { getSessionCookies } from "./cookies.js";
import { reseedDemo } from "../../db/reseed.js";

// The account the "View demo" button signs into. Configurable so a deployment
// can point at a different seeded showcase account.
const DEMO_EMAIL = (process.env.DEMO_EMAIL ?? "demo@example.com").toLowerCase();

export async function postLogin(req: Request, res: Response) {
    try {
        const emailInput = req.body?.email;
        const passwordInput = req.body?.password;

        if (typeof emailInput !== "string" || emailInput.trim().length === 0) {
            return res.status(400).json({ error: "email must be provided" });
        }
        if (typeof passwordInput !== "string" || passwordInput.length === 0) {
            return res.status(400).json({ error: "password must be provided" });
        }

        const email = emailInput.trim().toLowerCase();
        const user = await sqlGetUserLogin(pool, email);

        // Use the same error message for "user not found" and "wrong password"
        // to prevent email enumeration attacks.
        if (!user) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const ok = await bcrypt.compare(passwordInput, user.password_hash);
        if (!ok) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const { sessionId } = createSession(user.user_id);
        res.cookie("session", sessionId, getSessionCookies());

        return res.json({
            ok: true,
            user: { id: user.user_id, email: user.email },
        });
    } catch (err) {
        console.error("postLogin error:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

/**
 * Logs the caller into the shared demo account without credentials, so visitors
 * can explore the app with seeded data. No password is checked or exposed — the
 * demo account is intentionally public.
 */
export async function postDemoLogin(_req: Request, res: Response) {
    try {
        // Reset the shared demo data to its seeded baseline so every visit starts
        // from identical state and edits from a previous visit are discarded.
        // A failed reset shouldn't take the demo offline, so we log and continue.
        try {
            await reseedDemo();
        } catch (seedErr) {
            console.error("Demo re-seed failed (serving existing data):", seedErr);
        }

        const user = await sqlGetUserLogin(pool, DEMO_EMAIL);
        if (!user) {
            return res.status(404).json({ error: "Demo account is not available" });
        }

        const { sessionId } = createSession(user.user_id);
        res.cookie("session", sessionId, getSessionCookies());

        return res.json({
            ok: true,
            user: { id: user.user_id, email: user.email },
        });
    } catch (err) {
        console.error("postDemoLogin error:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

/**
 * Invalidates the session cookie, logging the user out.
 * Requires requireAuth middleware — unauthenticated calls never reach here.
 */
export async function postLogout(req: Request, res: Response) {
    try {
        const sessionId = req.cookies?.session as string | undefined;
        deleteSession(sessionId);
        res.clearCookie("session", { path: "/" });
        return res.json({ ok: true });
    } catch (err) {
        console.error("postLogout error:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

/**
 * Registers a new user account.
 * Hashes the password with bcrypt before storing.
 */
export async function postRegister(req: Request, res: Response) {
    try {
        const emailInput = req.body?.email;
        const passwordInput = req.body?.password;
        const firstName = req.body?.firstName;
        const lastName = req.body?.lastName;

        if (typeof emailInput !== "string" || emailInput.trim().length === 0) {
            return res.status(400).json({ error: "email must be provided" });
        }
        if (typeof passwordInput !== "string" || passwordInput.length < 8) {
            return res.status(400).json({ error: "password must be at least 8 characters" });
        }
        if (typeof firstName !== "string" || firstName.trim().length === 0) {
            return res.status(400).json({ error: "firstName must be provided" });
        }
        if (typeof lastName !== "string" || lastName.trim().length === 0) {
            return res.status(400).json({ error: "lastName must be provided" });
        }

        const email = emailInput.trim().toLowerCase();
        const passwordHash = await bcrypt.hash(passwordInput, 12);
        const user = await sqlCreateUser(pool, email, firstName.trim(), lastName.trim(), passwordHash);

        if (!user) {
            return res.status(409).json({ error: "An account with that email already exists" });
        }

        const { sessionId } = createSession(user.user_id);
        res.cookie("session", sessionId, getSessionCookies());

        return res.status(201).json({
            ok: true,
            user: { id: user.user_id, email: user.email },
        });
    } catch (err) {
        console.error("postRegister error:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

/**
 * Returns the currently authenticated user.
 * Used by the frontend on page refresh to check if the session is still valid.
 * Returns 401 if the session has expired — requireAuth handles that before this runs.
 */
export async function getMe(req: Request, res: Response) {
    try {
        const userId = (req as any).user?.userId as number;
        const user = await sqlGetUserById(pool, userId);

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        return res.json({
            ok: true,
            user: { id: user.user_id, email: user.email, firstName: user.first_name, lastName: user.last_name },
        });
    } catch (err) {
        console.error("getMe error:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}