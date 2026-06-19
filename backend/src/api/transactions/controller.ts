import type { Request, Response } from "express";
import pool from "../../database.js";
import { getUserId, getYearMonth, toInt } from "../utils.js";
import { sqlTransactionsForMonth } from "../dashboard/sql.js";
import {
    sqlAllTransactions,
    sqlGetTransactionDetail,
    sqlPatchTransactionCategory,
    sqlPatchTransactionMerchant,
} from "./sql.js";

/**
 * GET /transaction?scope=month|all[&year=YYYY&month=M]
 *
 * scope=all   → every transaction the user has, across all accounts and months.
 * scope=month → all of the user's transactions in the given month, across every
 *               account (the default; matches the month-wide totals elsewhere).
 */
export async function getTransactionList(req: Request, res: Response) {
    try {
        const userId = getUserId(req);
        const scope = (req.query.scope as string | undefined) ?? "month";

        if (scope === "all") {
            const data = await sqlAllTransactions(pool, userId);
            return res.json({ scope: "all", data });
        }

        const period = getYearMonth(req);
        if (!period) {
            return res.status(400).json({ error: "year and month are required when scope=month" });
        }

        const data = await sqlTransactionsForMonth(pool, userId, period.year, period.month);
        res.json({ scope: "month", ...period, data });
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