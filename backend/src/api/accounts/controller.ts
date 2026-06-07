import type { Request, Response } from "express";
import pool from "../../database.js";
import { getUserId, getParamId } from "../utils.js";
import {
    sqlAllAccountsList,
    sqlAccountSummary,
    sqlAddAccount,
    sqlDeleteAccount,
    sqlAccountTransaction,
} from "./sql.js";
 
/**
 * GET /accounts
 */
export async function getAllAccounts(req: Request, res: Response) {
    try {
        const userId = getUserId(req);
        const data = await sqlAllAccountsList(pool, userId);
        res.json({ userId, data });
    } catch (err) {
        console.error("getAllAccounts error:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}
 
/**
 * GET /accounts/:id/summary
 */
export async function getAccountSummary(req: Request, res: Response) {
    try {
        const userId = getUserId(req);
        const accountId = getParamId(req);
 
        if (!accountId) return res.status(400).json({ error: "account id not found" });
 
        const data = await sqlAccountSummary(pool, accountId, userId);
        res.json({ accountId, data });
    } catch (err) {
        console.error("getAccountSummary error:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}
 
/**
 * POST /accounts
 * Body: { bankName, accountNumber, accountType }
 */
export async function addNewAccount(req: Request, res: Response) {
    try {
        const userId = getUserId(req);
        const { bankName, accountNumber, accountType } = req.body ?? {};
 
        if (!bankName)     return res.status(400).json({ error: "bankName not found" });
        if (!accountNumber) return res.status(400).json({ error: "accountNumber not found" });
        if (!accountType)  return res.status(400).json({ error: "accountType not found" });
 
        const data = await sqlAddAccount(pool, userId, bankName, accountNumber, accountType);
        res.json({ data });
    } catch (err) {
        console.error("addNewAccount error:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}
 
/**
 * DELETE /accounts/:id
 * Ownership is verified inside sqlDeleteAccount — users can only delete
 * their own accounts.
 */
export async function deleteAccount(req: Request, res: Response) {
    try {
        const userId = getUserId(req);
        const accountId = getParamId(req);
 
        if (!accountId) return res.status(400).json({ error: "accountId not found" });
 
        const data = await sqlDeleteAccount(pool, accountId, userId);
 
        if (!data) return res.status(404).json({ error: "Account not found" });
 
        res.json({ accountId, data });
    } catch (err) {
        console.error("deleteAccount error:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}
 
/**
 * GET /accounts/:id/transactions
 */
export async function getAccountTransactions(req: Request, res: Response) {
    try {
        const userId = getUserId(req);
        const accountId = getParamId(req);
 
        if (!accountId) return res.status(400).json({ error: "account id not found" });
 
        const data = await sqlAccountTransaction(pool, accountId, userId);
        res.json({ accountId, data });
    } catch (err) {
        console.error("getAccountTransactions error:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}
