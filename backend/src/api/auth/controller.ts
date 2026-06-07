import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import pool from "../../database.js";
import { sqlGetUserLogin, sqlCreateUser } from "./sql.js";
import { createSession, deleteSession } from "./sessionStore.js";
import { getSessionCookies } from "./cookies.js";

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
 * Invalidates the session cookie, logging the user out.
 * Requires requireAuth middleware — unauthenticated calls never reach here.
 */
export async function postLogout(req: Request, res: Response) {
    try {
        const sessionId = req.cookies?.session as string | undefined;
        deleteSession(sessionId);

        // Clear the cookie on the client side too
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

        // Hash with cost factor 12 — good balance of security and speed
        const passwordHash = await bcrypt.hash(passwordInput, 12);

        const user = await sqlCreateUser(pool, email, firstName.trim(), lastName.trim(), passwordHash);

        if (!user) {
            // sqlCreateUser returns null on duplicate email (ON CONFLICT DO NOTHING)
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
