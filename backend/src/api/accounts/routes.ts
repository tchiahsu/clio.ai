import { Router } from "express";
import {
    getAllAccounts,
    getAccountSummary,
    addNewAccount, 
    deleteAccount, 
    getAccountTransactions
} from "./controller.js";

export const accountRouter = Router();

/**
 * GET /accounts/account
 * must provide userId as param
 */
accountRouter.get("/account", getAllAccounts);

/**
 * GET /accounts/account/summary
 * must provide accountId as param
 */
accountRouter.get("/account/summary/:id", getAccountSummary);

/**
 * POST /accounts/account
 * must provide userId, newBankName, newAccountNumber, newAccountType as params
 */
accountRouter.post("/account", addNewAccount);

/**
 * DELETE /accounts/account/:id
 * must provide accountId as param
 */
accountRouter.delete("/account/:id", deleteAccount);

/**
 * GET /accounts/account/transactions
 * must provide accountId as param
 */
accountRouter.get("/account/transactions/:id", getAccountTransactions);
