import { Router } from "express";
import {
    getChatHistory,
    getChatMessages,
    createNewChat,
    saveChatMessage,
    deleteChatThreads,
    changeChatName
} from "./controller.js";

export const chatRouter = Router();

/**
 * GET /chat/history
 * must provide userId as param
 */
chatRouter.get("/history", getChatHistory);

/**
 * GET /chat/messages
 * must provide userId and chatId as params
 */
chatRouter.get("/messages", getChatMessages);

/**
 * POST /chat/new
 * must provide userId as params and new title as body
 */
chatRouter.post("/new", createNewChat);

/**
 * POST /chat/messages
 * must provide userId and chatId as params, and speakerType and message in body
 */
chatRouter.post("/messages", saveChatMessage);

/**
 * DELETE /chat/thread
 * must provide userId and chatId as params
 */
chatRouter.delete("/thread", deleteChatThreads);

/**
 * PATCH /chat/name
 * must provide userId and chatId as params, and title as body
 */
chatRouter.patch("/name", changeChatName);