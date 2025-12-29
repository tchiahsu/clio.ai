import { Pool } from "pg";

/**
 * List of all the different chats (like a preview or a thread)
 */
export async function sqlChatHistory(pool: Pool, userId: number) {
    const res = await pool.query(
        `
        SELECT h.chat_id, h.title, h.created_at FROM chat_history h
        WHERE h.user_id = $1
        ORDER BY h.created_at DESC
        `,
        [userId]
    );

    return res.rows;
}

/**
 * Get the chat messages for a given chat thread
 */
export async function sqlChatMessages(pool: Pool, userId: number, chatId: number) {
    const res = await pool.query(
        `
        SELECT m.messages_id, m.speaker_type, m.message_content, m.created_at FROM chat_messages m
        JOIN chat_history h ON m.chat_id = h.chat_id
        WHERE h.user_id = $1
        AND m.chat_id = $2
        ORDER BY m.created_at ASC, m.messages_id ASC
        `,
        [userId, chatId]
    );

    return res.rows;
}

/**
 * Create a new chat thread
 */
export async function sqlNewChat(pool: Pool, userId: number, title: string) {
    const res = await pool.query(
        `
        INSERT INTO chat_history (user_id, title)
        VALUES ($1, $2)
        RETURNING chat_id, user_id, title, created_at
        `,
        [userId, title]
    );

    return res.rows[0] ?? null;
}

/**
 * Save chat messages that have been sent
 */
export async function sqlNewMessage(pool: Pool, userId: number, chatId: number, speakerType: "user" | "llm", message: string) {
    const res = await pool.query(
        `
        INSERT INTO chat_messages (chat_id, speaker_type, message_content)
        SELECT h.chat_id, $3::speaker, $4
        FROM chat_history h
        WHERE h.chat_id = $1
        AND h.user_id = $2
        RETURNING messages_id, chat_id, speaker_type, message_content, created_at
        `,
        [chatId, userId, speakerType, message]
    );

    return res.rows[0] ?? null;
}

/**
 * Delete a chat thread and all its associated messages
 */
export async function sqlDeleteChat(pool: Pool, userId: number, chatId: number) {
    const res = await pool.query(
        `
        DELETE FROM chat_history
        WHERE chat_id = $1
        AND user_id = $2
        RETURNING chat_id
        `,
        [chatId, userId]
    );

    return res.rows[0] ?? null;
}

/**
 * Change the name of the chat thread
 */
export async function sqlChangeChatName(pool: Pool, userId: number, chatId: number, title: string) {
    const res = await pool.query(
        `
        UPDATE chat_history
        SET title = $3
        WHERE chat_id = $1
        AND user_id = $2
        RETURNING chat_id, title, created_at
        `,
        [chatId, userId, title]
    )

    return res.rows[0] ?? null;
}