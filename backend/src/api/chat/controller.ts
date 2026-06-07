import type { Request, Response } from "express";
import pool from "../../database.js";
import { getUserId, toInt } from "../utils.js";
import {
    sqlChatHistory,
    sqlChatMessages,
    sqlRecentChatMessages,
    sqlNewChat,
    sqlNewMessage,
    sqlDeleteChat,
    sqlChangeChatName,
} from "./sql.js";
import { generateFinancialQuery, formatQueryAnswer } from "../../gemini/gemini.js";

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
 * Flow:
 *   1. Save user message
 *   2. Fetch last 10 messages for context
 *   3. Ask Gemini to generate a SQL query
 *   4. Execute the query safely (SELECT only, user_id enforced)
 *   5. Format the result as a natural language answer
 *   6. Save the LLM response
 *   7. Return both messages to the client
 */
export async function saveChatMessage(req: Request, res: Response) {
    try {
        const userId = getUserId(req);
        const chatId = toInt(req.query.chatId);
        const content = req.body?.content;

        if (!chatId || typeof content !== "string" || !content.trim()) {
            return res.status(400).json({ error: "Invalid input" });
        }

        // ── 1. Save user message ─────────────────────────────────────────────
        const userData = await sqlNewMessage(pool, userId, chatId, "user", content.trim());
        if (!userData) return res.status(404).json({ error: "Chat not found" });

        // ── 2. Fetch recent chat history for context (last 10 messages) ──────
        // Exclude the message we just saved since we already have it
        const recentMessages = await sqlRecentChatMessages(pool, userId, chatId, 10);
        const historyWithoutLatest = recentMessages.filter(
            m => m.messages_id !== userData.messages_id
        );

        // ── 3–5. Generate query, execute, format answer ──────────────────────
        let aiMessage: string;

        try {
            const { sql, params, answer_template, empty_message } =
                await generateFinancialQuery(content.trim(), historyWithoutLatest);

            // Execute with userId always as $1 — this is the security boundary.
            // Gemini's params array contains everything AFTER $1.
            const result = await pool.query(sql, [userId, ...params]);

            aiMessage = formatQueryAnswer(result.rows, answer_template, empty_message);
        } catch (llmErr) {
            // LLM or query failure should not crash the endpoint.
            // Save a graceful error message instead so the chat stays usable.
            console.error("LLM error in saveChatMessage:", llmErr);
            aiMessage = "I had trouble answering that. Could you rephrase the question? For example: 'How much did I spend on food in January?' or 'What are my top 5 expenses?'";
        }

        // ── 6. Save LLM response ─────────────────────────────────────────────
        const aiData = await sqlNewMessage(pool, userId, chatId, "llm", aiMessage);
        if (!aiData) return res.status(404).json({ error: "Chat not found" });

        // ── 7. Return both messages ──────────────────────────────────────────
        res.json({ chatId, userData, aiData });
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