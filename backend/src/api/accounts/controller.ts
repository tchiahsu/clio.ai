import type { Request, Response } from "express";
import pool from "../../database.js";
import {
  sqlAllAccountsList,
  sqlAccountSummary,
  sqlAddAccount,
  sqlDeleteAccount,
  sqlAccountTransaction,
} from "./sql.js";

/**
 * Gets the current userId (fake user id for now).
 * I tell TS that request has extra properties for user.
 */
function getUserId(req: Request): number {
  return (req as any).user?.userId ?? 1;
}

/**
 * Gets the current accountId .
 * I tell TS that request has extra properties for category.
 */
function getAccountId(req: Request): number {
  const id = Number(req.params.id);
  return id;
}

/**
 * Gets all the accounts present.
 */
export async function getAllAccounts(req: Request, res: Response) {
  try {
    const userId = getUserId(req);

    if (!userId) return res.status(400).json({ error: "user id not found" });

    const data = await sqlAllAccountsList(pool, userId);
    res.json({ userId, data });
  } catch (err) {
    console.error("getAllAccounts error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

/**
 * Gets cash flow of the account. 
 */
export async function getAccountSummary(req: Request, res: Response) {
  try {
    const accountId = getAccountId(req);

    if (!accountId)
      return res.status(400).json({ error: "account id not found" });

    const data = await sqlAccountSummary(pool, accountId);
    res.json({ accountId, data });
  } catch (err) {
    console.error("getAccountSummary error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

/**
 * Adds a new account to the table. 
 */
export async function addNewAccount(req: Request, res: Response) {
  try {
    const userId = getUserId(req);
    const newBankName = req.body.newBankName;
    const newAccountNumber = req.body.newAccountNumber;
    const newAccountType = req.body.newAccountType;

    if (!userId) return res.status(400).json({ error: "user id not found" });
    if (!newBankName)
      return res.status(400).json({ error: "new bank name not found" });
    if (!newAccountType)
      return res.status(400).json({ error: "new account type not found" });

    const data = await sqlAddAccount(pool, userId, newBankName, newAccountNumber, newAccountType);
    res.json({ data });
  } catch (err) {
    console.error("addNewAccount error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

/**
 * Deletes account from table. 
 */
export async function deleteAccount(req: Request, res: Response) {
  try {
    const accountId = getAccountId(req);

    if (!accountId)
      return res.status(400).json({ error: "accountId not found" });

    const data = await sqlDeleteAccount(pool, accountId);
    res.json({ accountId, data });
  } catch (err) {
    console.error("deleteAccount error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

/**
 * Gets summary of all transactions of the account. 
 */
export async function getAccountTransactions(req: Request, res: Response) {
  try {
    const accountId = getAccountId(req);

    if (!accountId) return res.status(400).json({ error: "account id not found" });

    const data = await sqlAccountTransaction(pool, accountId);
    res.json({ accountId, data });
  } catch (err) {
    console.error("getAccountTransactions error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
