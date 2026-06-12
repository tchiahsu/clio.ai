import { Router } from "express";
import {
    getChatHistory,
    getChatMessages,
    createNewChat,
    saveChatMessage,
    deleteChatThreads,
    changeChatName,
    getRecentChats,
} from "./controller.js";
 
export const chatRouter = Router();
 
chatRouter.get("/history", getChatHistory);
chatRouter.get("/recent", getRecentChats);
chatRouter.get("/messages", getChatMessages);
chatRouter.post("/", createNewChat);
chatRouter.post("/message", saveChatMessage);
chatRouter.delete("/", deleteChatThreads);
chatRouter.patch("/name", changeChatName);