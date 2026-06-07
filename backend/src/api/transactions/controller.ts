import type { Request, Response } from "express";
import pool from "../../database.js";
import { getUserId, toInt } from "../utils.js";
import { sqlAssertStatementOwned, sqlDashboardTransactionsForStatement } from "../dashboard/sql.js";
import {
    sqlLatestStatementId,
    sqlAllTransactions,
    sqlGetTransactionDetail,
    sqlPatchTransactionCategory,
    sqlPatchTransactionMerchant,
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
 * GET /transaction?scope=latest|statement|all[&statementId=N]
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
                return res.status(400).json({ error: "statementId required when scope=statement" });
            }
            statementId = statementIdParam;
        } else {
            statementId = await sqlLatestStatementId(pool, userId);
            if (statementId === null) {
                return res.status(404).json({ error: "No statements found" });
            }
        }

        const ownership = await checkStatementOwner(res, userId, statementId);
        if (!ownership) return;

        const data = await sqlDashboardTransactionsForStatement(pool, userId, statementId);
        res.json({ scope: scope === "statement" ? "statement" : "latest", statementId, data });
    } catch (err) {
        console.error("getTransactionList error:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

/**
 * GET /transaction/detail?transactionId=N
 */
export async function getTransactionDetail(req: Request, res: Response) {
    try {
        const userId = getUserId(req);
        const transactionId = toInt(req.query.transactionId);

        if (!transactionId) return res.status(400).json({ error: "transactionId not found" });

        const data = await sqlGetTransactionDetail(pool, transactionId, userId);

        if (!data) return res.status(404).json({ error: "Transaction not found" });

        res.json({ transactionId, data });
    } catch (err) {
        console.error("getTransactionDetail error:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

/**
 * PATCH /transaction/category?transactionId=N&categoryId=N
 */
export async function patchTransactionCategory(req: Request, res: Response) {
    try {
        const userId = getUserId(req);
        const categoryId = toInt(req.query.categoryId);
        const transactionId = toInt(req.query.transactionId);

        if (!categoryId)    return res.status(400).json({ error: "categoryId not found" });
        if (!transactionId) return res.status(400).json({ error: "transactionId not found" });

        const data = await sqlPatchTransactionCategory(pool, userId, categoryId, transactionId);

        if (!data) return res.status(404).json({ error: "Transaction or category not found" });

        res.json({ transactionId, categoryId, data });
    } catch (err) {
        console.error("patchTransactionCategory error:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

/**
 * PATCH /transaction/merchant?transactionId=N&merchantId=N
 */
export async function patchTransactionMerchant(req: Request, res: Response) {
    try {
        const userId = getUserId(req);
        const transactionId = toInt(req.query.transactionId);
        const merchantId = toInt(req.query.merchantId);

        if (!transactionId) return res.status(400).json({ error: "transactionId not found" });
        if (!merchantId)    return res.status(400).json({ error: "merchantId not found" });

        const data = await sqlPatchTransactionMerchant(pool, userId, transactionId, merchantId);

        if (!data) return res.status(404).json({ error: "Transaction or merchant not found" });

        res.json({ transactionId, merchantId, data });
    } catch (err) {
        console.error("patchTransactionMerchant error:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}