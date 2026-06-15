import type { Request, Response } from "express";
import pool from "../../database.js";
import { getUserId, toInt, getParamId } from "../utils.js";
import { sqlGetGoals, sqlCreateGoal, sqlUpdateGoal, sqlDeleteGoal } from "./sql.js";

/**
 * GET /goals
 */
export async function getGoals(req: Request, res: Response) {
    try {
        const userId = getUserId(req);
        const data = await sqlGetGoals(pool, userId);
        res.json({ data });
    } catch (err) {
        console.error("getGoals error:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

/**
 * POST /goals
 * Body: { title, targetAmount, savedAmount, deadline }
 */
export async function createGoal(req: Request, res: Response) {
    try {
        const userId = getUserId(req);
        const { title, targetAmount, savedAmount, deadline } = req.body;
        if (!title || !targetAmount) {
            return res.status(400).json({ error: "title and targetAmount are required" });
        }
        const data = await sqlCreateGoal(pool, userId, title, targetAmount, savedAmount ?? 0, deadline ?? null);
        res.json({ data });
    } catch (err) {
        console.error("createGoal error:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

/**
 * PATCH /goals/:id
 * Body: { title, targetAmount, savedAmount, deadline }
 */
export async function updateGoal(req: Request, res: Response) {
    try {
        const userId = getUserId(req);
        const goalId = getParamId(req);
        if (!goalId) return res.status(400).json({ error: "goalId not found" });
        const { title, targetAmount, savedAmount, deadline } = req.body;
        const data = await sqlUpdateGoal(pool, userId, goalId, title, targetAmount, savedAmount, deadline ?? null);
        if (!data) return res.status(404).json({ error: "Goal not found" });
        res.json({ data });
    } catch (err) {
        console.error("updateGoal error:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

/**
 * DELETE /goals/:id
 */
export async function deleteGoal(req: Request, res: Response) {
    try {
        const userId = getUserId(req);
        const goalId = getParamId(req);
        if (!goalId) return res.status(400).json({ error: "goalId not found" });
        const data = await sqlDeleteGoal(pool, userId, goalId);
        if (!data) return res.status(404).json({ error: "Goal not found" });
        res.json({ data });
    } catch (err) {
        console.error("deleteGoal error:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}