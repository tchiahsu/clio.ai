import type { Request, Response } from "express";
import pool from "../../database.js";
import {
    sqlAssertStatementOwned,
    sqlDashboardCategorySpendForStatement,
    sqlDashboardSummaryForStatement,
    sqlDashboardTransactionsForStatement 
} from "../dashboard/sql.js";

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
 * Check if the provided userId is the owner of the given statementId.
 */
async function checkStatementOwner(res: Response, userId: number, statementId: number) {
    const ok = await sqlAssertStatementOwned(pool, userId, statementId);
    
    if (!ok) {
        res.status(404).json({ error: "Statement not found" });
        return false;
    }
    return true;
}

/**
 * Gets the transaction totals (income, spent, net)
 */
export async function getDashboardTransactionTotals(req: Request, res: Response) {
    try {
        const userId = getUserId(req);
        const statementId = toInt(req.query.statementId);

        if (!statementId) return res.status(400).json({ error: "statementId not found" });
        
        const ownership = await checkStatementOwner(res, userId, statementId);
        if (!ownership) return;

        const data = await sqlDashboardSummaryForStatement(pool, userId, statementId);
        res.json({ statementId, data })
    } catch (err) {
        console.error("getDashboardSummary error:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

/**
 * Gets the totals for all categories present in the bank statement
 */
export async function getDashboardCategoryTotals(req: Request, res: Response) {
    try {
        const userId = getUserId(req);
        const statementId = toInt(req.query.statementId);

        if (!statementId) return res.status(400).json({ error: "statementId not found" });
        
        const ownership = await checkStatementOwner(res, userId, statementId);
        if (!ownership) return;

        const data = await sqlDashboardCategorySpendForStatement(pool, userId, statementId);
        res.json({ statementId, data })
    } catch (err) {
        console.error("getDashboardCategory error:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}


/**
 * Gets all the transactions with its dates for the specified bank statement
 */
export async function getDashboardTransactions(req: Request, res: Response) {
    try {
        const userId = getUserId(req);
        const statementId = toInt(req.query.statementId);

        if (!statementId) return res.status(400).json({ error: "statementId not found" });
        
        const ownership = await checkStatementOwner(res, userId, statementId);
        if (!ownership) return;

        const data = await sqlDashboardTransactionsForStatement(pool, userId, statementId);
        res.json({ statementId, data })
    } catch (err) {
        console.error("getDashboardFilter error:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}