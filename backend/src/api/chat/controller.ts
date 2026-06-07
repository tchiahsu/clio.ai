import type { Request, Response } from "express";
import pool from "../../database.js";
import { getUserId, toInt } from "../utils.js";
import {
    sqlChatHistory,
    sqlChatMessages,
    sqlNewChat,
    sqlNewMessage,
    sqlDeleteChat,
    sqlChangeChatName,
} from "./sql.js";

/**
 * GET /chat/history
 */
export async function getChatHistory(req: Request, res: Response) {
    try {
        const userId = getUserId(req);
        const data = await sqlChatHistory(pool, userId);
        res.json({ userId, data });
    } catch (err) {
        console.error("getChatHistory error:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

/**
 * GET /chat/messages?chatId=N
 */
export async function getChatMessages(req: Request, res: Response) {
    try {
        const userId = getUserId(req);
        const chatId = toInt(req.query.chatId);

        if (!chatId) return res.status(400).json({ error: "chatId not found" });

        const data = await sqlChatMessages(pool, userId, chatId);
        res.json({ chatId, data });
    } catch (err) {
        console.error("getChatMessages error:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

/**
 * POST /chat
 * Body: { title: string }
 */
export async function createNewChat(req: Request, res: Response) {
    try {
        const userId = getUserId(req);
        const title = req.body?.title as string;

        if (typeof title !== "string" || !title.trim()) {
            return res.status(400).json({ error: "title not found" });
        }

        const data = await sqlNewChat(pool, userId, title.trim());
        res.json({ userId, data });
    } catch (err) {
        console.error("createNewChat error:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

/**
 * POST /chat/message?chatId=N
 * Body: { content: string }
 *
 * Saves the user's message. LLM response is a TODO — stub is left in place
 * with clear comments so it's easy to wire in.
 */
export async function saveChatMessage(req: Request, res: Response) {
    try {
        const userId = getUserId(req);
        const chatId = toInt(req.query.chatId);
        const content = req.body?.content;

        if (!chatId || typeof content !== "string" || !content.trim()) {
            return res.status(400).json({ error: "Invalid input" });
        }

        // Save the user's message
        const userData = await sqlNewMessage(pool, userId, chatId, "user", content.trim());
        if (!userData) return res.status(404).json({ error: "Chat not found" });

        // ── LLM integration (TODO) ─────────────────────────────────────────
        // When ready, uncomment and wire in your LLM handler:
        //
        // const aiMessage = await runLLM(content, userId);
        // const aiData = await sqlNewMessage(pool, userId, chatId, "llm", aiMessage);
        // if (!aiData) return res.status(404).json({ error: "Chat not found" });
        // return res.json({ chatId, userData, aiData });
        // ──────────────────────────────────────────────────────────────────

        res.json({ chatId, userData });
    } catch (err) {
        console.error("saveChatMessage error:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

/**
 * DELETE /chat?chatId=N
 */
export async function deleteChatThreads(req: Request, res: Response) {
    try {
        const userId = getUserId(req);
        const chatId = toInt(req.query.chatId);

        if (!chatId) return res.status(400).json({ error: "chatId not found" });

        const data = await sqlDeleteChat(pool, userId, chatId);

        if (!data) return res.status(404).json({ error: "Chat not found" });

        res.json({ chatId, data });
    } catch (err) {
        console.error("deleteChatThreads error:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

/**
 * PATCH /chat/name?chatId=N
 * Body: { title: string }
 */
export async function changeChatName(req: Request, res: Response) {
    try {
        const userId = getUserId(req);
        const chatId = toInt(req.query.chatId);
        const title = req.body?.title as string;

        if (!chatId) return res.status(400).json({ error: "chatId not found" });
        if (typeof title !== "string" || !title.trim()) {
            return res.status(400).json({ error: "title not found" });
        }

        const data = await sqlChangeChatName(pool, userId, chatId, title.trim());

        if (!data) return res.status(404).json({ error: "Chat not found" });

        res.json({ chatId, data });
    } catch (err) {
        console.error("changeChatName error:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}