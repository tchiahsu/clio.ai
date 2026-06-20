import type { Request, Response } from "express";
import pool from "../../database.js";
import { getUserId, getParamId, getYearMonth } from "../utils.js";
import { sqlGetBudgets, sqlGetTotalBudget, sqlUpsertBudget, sqlDeleteBudget } from "./sql.js";

/**
 * GET /budgets?year=YYYY&month=M
 */
export async function getBudgets(req: Request, res: Response) {
    try {
        const userId = getUserId(req);
        const period = getYearMonth(req);
        if (!period) return res.status(400).json({ error: "year and month are required" });

        const data = await sqlGetBudgets(pool, userId, period.year, period.month);
        const total = await sqlGetTotalBudget(pool, userId, period.year, period.month);
        res.json({ ...period, data, total_budgeted: total.total_budgeted });
    } catch (err) {
        console.error("getBudgets error:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

/**
 * POST /budgets
 * Body: { categoryName, year, month, amount }
 */
export async function upsertBudget(req: Request, res: Response) {
    try {
        const userId = getUserId(req);
        const { categoryName, amount } = req.body;
        const period = getYearMonth(req);

        if (!categoryName) return res.status(400).json({ error: "categoryName not found" });
        if (!period) return res.status(400).json({ error: "year and month are required" });
        if (amount === undefined) return res.status(400).json({ error: "amount not found" });

        const data = await sqlUpsertBudget(pool, userId, categoryName, period.year, period.month, amount);
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
