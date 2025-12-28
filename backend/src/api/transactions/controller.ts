import type { Request, Response } from "express";
import pool from "../../database.js";
import { sqlAssertStatementOwned, sqlDashboardTransactionsForStatement } from "../dashboard/sql.js";
import {
    sqlLatestStatementId,
    sqlAllTransactions,
    sqlGetTransactionDetail,
    sqlPatchTransactionCategory,
    sqlPatchTransactionMerchant
} from "../transactions/sql.js";

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
 * Gets all the transactions of for the given time period
 */
export async function getTransactionList(req: Request, res: Response) {
    try {
        const userId = getUserId(req);
        const scope = (req.query.scope as string | undefined) ?? "latest";
        const statementIdParam = toInt(req.query.statementId);

        if (scope === "all") {
            const data = await sqlAllTransactions(pool, userId);
            return res.json({ scope: "all", data });
        }

        let statementId: number | null;

        if (scope === "statement") {
            if (statementIdParam === undefined) {
                return res.status(400).json({ error: "statementId required when scope=statement" })
            }
            statementId = statementIdParam;
        } else {
            statementId = await sqlLatestStatementId(pool, userId);
            if (statementId === null) return res.status(400).json({ error: "No statements found" });
        }

        const ownership = await checkStatementOwner(res, userId, statementId);
        if (!ownership) return;

        const data = await sqlDashboardTransactionsForStatement(pool, userId, statementId);
        res.json({ scope: scope === "statement" ? "statement" : "latest", statementId, data })
    } catch (err) {
        console.error("Error getting the transaction list:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

/**
 * Get the transaction details for a single transaction
 */
export async function getTransactionDetail(req: Request, res: Response) {
    try {
        const userId = getUserId(req);
        const transactionId = toInt(req.query.transactionId);

        if (!transactionId) return res.status(400).json({ error: "transactionId not found" });

        const data = await sqlGetTransactionDetail(pool, transactionId, userId);
        res.json({ transactionId, data });
    } catch (err) {
        console.error("Error getting transaction details:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

/**
 * Change the category name of a transaction (assumes the new cateogry already exists)
 */
export async function patchTransactionCategory(req: Request, res: Response) {
    try {
        const userId = getUserId(req);
        const categoryId = toInt(req.query.categoryId);
        const transactionId = toInt(req.query.transactionId);

        if (!categoryId) return res.status(400).json({ error: "category id not found" });
        if (!transactionId) return res.status(400).json({ error: "transaction id not found"});

        const data = await sqlPatchTransactionCategory(pool, userId, categoryId, transactionId);
        res.json({ transactionId, categoryId, data });
    } catch (err) {
        console.error("Error updating transaction category name:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

/**
 * Change the merchant name of a transaction (assumes the new merchant name already exists)
 */
export async function patchTransactionMerchant(req: Request, res: Response) {
    try {
        const userId = getUserId(req);
        const transactionId = toInt(req.query.transactionId);
        const merchantId = toInt(req.query.merchantId);

        if (!transactionId) return res.status(400).json({ error: "transaction id not found" });
        if (!merchantId) return res.status(400).json({ error: "merchant id not found" });

        const data = await sqlPatchTransactionMerchant(pool, userId, transactionId, merchantId);
        res.json({ transactionId, merchantId, data});
    } catch (err) {
        console.error("Error updating transaction merchant name:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}