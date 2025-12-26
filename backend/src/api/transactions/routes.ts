import { Router } from "express";
import {
    getTransactionList
} from "./controller.js";

export const transactionRouter = Router();

/**
 * GET /transasction/
 * must provide scope as param
 * - scope="all" nothing else
 * - scope="statement" also provide statementId as param
 */
transactionRouter.get("/all", getTransactionList);