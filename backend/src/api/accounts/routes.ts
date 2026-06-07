import { Router } from "express";
import {
    getAllAccounts,
    getAccountSummary,
    addNewAccount,
    deleteAccount,
    getAccountTransactions,
} from "./controller.js";
 
export const accountRouter = Router();
 
accountRouter.get("/", getAllAccounts);
accountRouter.get("/:id/summary", getAccountSummary);
accountRouter.get("/:id/transactions", getAccountTransactions);
accountRouter.post("/", addNewAccount);
accountRouter.delete("/:id", deleteAccount);
 