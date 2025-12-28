import type { Request, Response } from "express";
import pool from "../../database.js";
import {
    sqlChatHistory,
    sqlChatMessages,
    sqlNewChat,
    sqlNewMessage,
    sqlDeleteChat,
    sqlChangeChatName
} from "../chat/sql.js";

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
 * Get the list of all chat threads for a given user.
 */
export async function getChatHistory(req: Request, res: Response) {
    try {
        const userId = getUserId(req);

        const data = await sqlChatHistory(pool, userId);
        res.json({ userId, data });
    } catch (err) {
        console.error("", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

/**
 * Get the messages inside the specified chat thread.
 */
export async function getChatMessages(req: Request, res: Response) {
    try {
        const userId = getUserId(req);
        const chatId = toInt(req.query.chatId);

        if (!chatId) return res.status(400).json({ error: "chat id not found" });

        const data = await sqlChatMessages(pool, userId, chatId);
        res.json({ chatId, data });
    } catch (err) {
        console.error("", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

/**
 * Create a new chat thread.
 */
export async function createNewChat(req: Request, res: Response) {
    try {
        const userId = getUserId(req);
        const title = req.body?.title as string;

        if (typeof title !== "string" || !title.trim()) return res.status(400).json({ error: "title not found." });

        const data = await sqlNewChat(pool, userId, title);
        res.json({ userId, data });
    } catch (err) {
        console.error("", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

/**
 * Save all newly sent messages.
 */
export async function saveChatMessage(req: Request, res: Response) {
    try {
        const userId = getUserId(req);
        const chatId = toInt(req.query.chatId);
        const content = req.body?.content;

        if (!chatId || typeof content !== "string") {
            return res.status(400).json({ error: "Invalid input" });
        }
        
        const userData = await sqlNewMessage(pool, userId, chatId, "user", content);

        if (!userData) return res.status(404).json({ error: "Chat not found" });

        // const aiMessage = await runLLM(content);
        // const aiData = await sqlNewMessage(pool, userId, chatId, "llm", aiMessage);

        // if (!aiData) return res.status(404).json({ error: "Chat not found" });

        // Add LLM data as well
        res.json({ chatId, userData });

    } catch (err) {
        console.error("", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

/**
 * Delete a chat thread and all its messages.
 */
export async function deleteChatThreads(req: Request, res: Response) {
    try {
        const userId = getUserId(req);
        const chatId = toInt(req.query.chatId);

        if (!chatId) return res.status(400).json({ error: "Invalid chat id" });

        const data = await sqlDeleteChat(pool, userId, chatId);
        res.json({ chatId, data });
    } catch (err) {
        console.error("", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

/**
 * Change the name of a chat thread.
 */
export async function changeChatName(req: Request, res: Response) {
    try {
        const userId = getUserId(req);
        const chatId = toInt(req.query.chatId);
        const title = req.body?.title as string;

        if (!chatId) return res.status(400).json({ error: "Invalid chat id" });
        if (typeof title !== "string" || !title.trim()) return res.status(400).json({ error: "new title not found" });

        const data = await sqlChangeChatName(pool, userId, chatId, title);
        res.json({ chatId, data });
    } catch (err) {
        console.error("", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}