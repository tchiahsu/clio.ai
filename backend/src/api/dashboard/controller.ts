import type { Request, Response } from "express";
import pool from "../../database.js";
import { getUserId, getYearMonth } from "../utils.js";
import {
    sqlDashboardCategorySpendForMonth,
    sqlDashboardSummaryForMonth,
    sqlTransactionsForMonth,
    sqlBudgetOverview,
    sqlDashboardDailyTotals,
} from "./sql.js";

const MISSING_PERIOD = { error: "year and month are required" };

/**
 * GET /dashboard/totals?year=YYYY&month=M
 */
export async function getDashboardTransactionTotals(req: Request, res: Response) {
    try {
        const userId = getUserId(req);
        const period = getYearMonth(req);
        if (!period) return res.status(400).json(MISSING_PERIOD);

        const data = await sqlDashboardSummaryForMonth(pool, userId, period.year, period.month);
        res.json({ ...period, data });
    } catch (err) {
        console.error("getDashboardTransactionTotals error:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

/**
 * GET /dashboard/categories?year=YYYY&month=M
 */
export async function getDashboardCategoryTotals(req: Request, res: Response) {
    try {
        const userId = getUserId(req);
        const period = getYearMonth(req);
        if (!period) return res.status(400).json(MISSING_PERIOD);

        const data = await sqlDashboardCategorySpendForMonth(pool, userId, period.year, period.month);
        res.json({ ...period, data });
    } catch (err) {
        console.error("getDashboardCategoryTotals error:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

/**
 * GET /dashboard/transactions?year=YYYY&month=M
 */
export async function getDashboardTransactions(req: Request, res: Response) {
    try {
        const userId = getUserId(req);
        const period = getYearMonth(req);
        if (!period) return res.status(400).json(MISSING_PERIOD);

        const data = await sqlTransactionsForMonth(pool, userId, period.year, period.month);
        res.json({ ...period, data });
    } catch (err) {
        console.error("getDashboardTransactions error:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

/**
 * GET /dashboard/overview?year=YYYY&month=M
 * Selected month + prior month income/spend/savings for the vs-last-month cards.
 */
export async function getBudgetOverview(req: Request, res: Response) {
    try {
        const userId = getUserId(req);
        const period = getYearMonth(req);
        if (!period) return res.status(400).json(MISSING_PERIOD);

        const data = await sqlBudgetOverview(pool, userId, period.year, period.month);
        res.json({ ...period, data });
    } catch (err) {
        console.error("getBudgetOverview error:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

/**
 * GET /dashboard/daily?year=YYYY&month=M
 */
export async function getDashboardDailyTotals(req: Request, res: Response) {
    try {
        const userId = getUserId(req)
        const period = getYearMonth(req);
        if (!period) return res.status(400).json(MISSING_PERIOD);

        const data = await sqlDashboardDailyTotals(pool, userId, period.year, period.month)
        res.json({ ...period, data })
    } catch (err) {
        console.error("getDashboardDailyTotals error:", err)
        return res.status(500).json({ error: "Internal Server Error" })
    }
}
