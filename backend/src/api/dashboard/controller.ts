import type { Request, Response } from "express";
import pool from "../../database.js";
import { getUserId, toInt, getParamId } from "../utils.js";
import {
    sqlAssertStatementOwned,
    sqlDashboardCategorySpendForStatement,
    sqlDashboardSummaryForStatement,
    sqlDashboardTransactionsForStatement,
    sqlBudgetOverview,
    sqlDashboardDailyTotals,
} from "./sql.js";

async function checkStatementOwner(res: Response, userId: number, statementId: number) {
    const ok = await sqlAssertStatementOwned(pool, userId, statementId);
    if (!ok) {
        res.status(404).json({ error: "Statement not found" });
        return false;
    }
    return true;
}

/**
 * GET /dashboard/totals?statementId=N
 */
export async function getDashboardTransactionTotals(req: Request, res: Response) {
    try {
        const userId = getUserId(req);
        const statementId = toInt(req.query.statementId);

        if (!statementId) return res.status(400).json({ error: "statementId not found" });

        const ownership = await checkStatementOwner(res, userId, statementId);
        if (!ownership) return;

        const data = await sqlDashboardSummaryForStatement(pool, userId, statementId);
        res.json({ statementId, data });
    } catch (err) {
        console.error("getDashboardTransactionTotals error:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

/**
 * GET /dashboard/categories?statementId=N
 */
export async function getDashboardCategoryTotals(req: Request, res: Response) {
    try {
        const userId = getUserId(req);
        const statementId = toInt(req.query.statementId);

        if (!statementId) return res.status(400).json({ error: "statementId not found" });

        const ownership = await checkStatementOwner(res, userId, statementId);
        if (!ownership) return;

        const data = await sqlDashboardCategorySpendForStatement(pool, userId, statementId);
        res.json({ statementId, data });
    } catch (err) {
        console.error("getDashboardCategoryTotals error:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

/**
 * GET /dashboard/transactions?statementId=N
 */
export async function getDashboardTransactions(req: Request, res: Response) {
    try {
        const userId = getUserId(req);
        const statementId = toInt(req.query.statementId);

        if (!statementId) return res.status(400).json({ error: "statementId not found" });

        const ownership = await checkStatementOwner(res, userId, statementId);
        if (!ownership) return;

        const data = await sqlDashboardTransactionsForStatement(pool, userId, statementId);
        res.json({ statementId, data });
    } catch (err) {
        console.error("getDashboardTransactions error:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

/**
 * GET /dashboard/accounts/:id/budget
 */
export async function getBudgetOverview(req: Request, res: Response) {
    try {
        const userId = getUserId(req);
        const accountId = getParamId(req);

        if (!accountId) return res.status(400).json({ error: "accountId not found" });

        const data = await sqlBudgetOverview(pool, userId, accountId);
        res.json({ userId, accountId, data });
    } catch (err) {
        console.error("getBudgetOverview error:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

/**
 * GET /dashboard/daily?statementId=N
 */
export async function getDashboardDailyTotals(req: Request, res: Response) {
    try {
        const userId = getUserId(req)
        const statementId = toInt(req.query.statementId)
        if (!statementId) return res.status(400).json({ error: "statementId not found" })
        const ownership = await checkStatementOwner(res, userId, statementId)
        if (!ownership) return
        const data = await sqlDashboardDailyTotals(pool, userId, statementId)
        res.json({ statementId, data })
    } catch (err) {
        console.error("getDashboardDailyTotals error:", err)
        return res.status(500).json({ error: "Internal Server Error" })
    }
}