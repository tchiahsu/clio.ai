import type { Request, Response } from "express";
import pool from "../../database.js";
import { getUserId, toInt, getParamId } from "../utils.js";
import { sqlGetBudgets, sqlGetTotalBudget, sqlUpsertBudget, sqlDeleteBudget } from "./sql.js";

/**
 * GET /budgets?statementId=N
 */
export async function getBudgets(req: Request, res: Response) {
    try {
        const userId = getUserId(req);
        const statementId = toInt(req.query.statementId);
        if (!statementId) return res.status(400).json({ error: "statementId not found" });
        const data = await sqlGetBudgets(pool, userId, statementId);
        const total = await sqlGetTotalBudget(pool, userId, statementId);
        res.json({ statementId, data, total_budgeted: total.total_budgeted });
    } catch (err) {
        console.error("getBudgets error:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

/**
 * POST /budgets
 * Body: { categoryId, statementId, amount }
 */
export async function upsertBudget(req: Request, res: Response) {
    try {
        const userId = getUserId(req);
        const { categoryId, statementId, amount } = req.body;
        if (!categoryId || !statementId || amount === undefined) {
            return res.status(400).json({ error: "categoryId, statementId and amount are required" });
        }
        const data = await sqlUpsertBudget(pool, userId, categoryId, statementId, amount);
        res.json({ data });
    } catch (err) {
        console.error("upsertBudget error:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

/**
 * DELETE /budgets/:id
 */
export async function deleteBudget(req: Request, res: Response) {
    try {
        const userId = getUserId(req);
        const budgetId = getParamId(req);
        if (!budgetId) return res.status(400).json({ error: "budgetId not found" });
        const data = await sqlDeleteBudget(pool, userId, budgetId);
        if (!data) return res.status(404).json({ error: "Budget not found" });
        res.json({ data });
    } catch (err) {
        console.error("deleteBudget error:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}