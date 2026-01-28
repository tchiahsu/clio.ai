import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import pool from "../../database.js";
import { sqlGetUserLogin } from "./sql.js";
import { createSession } from "./sessionStore.js";
import { getSessionCookies } from "./cookies.js";
import { error } from "node:console";

export async function postLogin(req: Request, res: Response){
    try{
        const emailInput = req.body?.email;
        const passwordInput = req.body?.password;

        // check if email and password were provided 
        if (typeof emailInput !== "string" || emailInput.trim().length === 0){
            return res.status(400).json({error: "email must be provided"});
        }
        
        if (typeof passwordInput !== "string" || passwordInput.length === 0){
            return res.status(400).json({error: "password must be provided"});
        }

        const email = emailInput.trim().toLowerCase();
        const password = passwordInput;
        const user = await sqlGetUserLogin(pool, email);

        if (!user) {
            return res.status(401).json({error: "Invalid user info given"});
        }

        const ok = await bcrypt.compare(password, user.password_hash);
        if (ok === false){
            return res.status(401).json({error: "Invalid user info given"});
        }

        const { sessionId } = createSession(user.user_id);

        res.cookie("session", sessionId, getSessionCookies());

        return res.json({
            ok: true,
            user: {
                id: user.user_id, 
                email: user.email,
            },
        });

    } catch (err) {
        console.error("postLogin error:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}