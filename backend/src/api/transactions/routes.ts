import { Router } from "express";
import {
    getTransactionList,
    getTransactionDetail,
    patchTransactionCategory,
    patchTransactionMerchant
} from "./controller.js";

export const transactionRouter = Router();

/**
 * GET /transasction/all
 * must provide scope as param
 * - scope="all" nothing else
 * - scope="statement" also provide statementId as param
 */
transactionRouter.get("/all", getTransactionList);

/**
 * GET /transaction/detail
 * must provide userId and transactionId as param
 */
transactionRouter.get("/detail", getTransactionDetail);

/**
 * GET /transaction/category
 * must provide userId, transactionId and categoryId as param
 */
transactionRouter.patch("/category", patchTransactionCategory);

/**
 * GET /transaction/merchant
 * must provide userId, transactionId and merchantId as param
 */
transactionRouter.patch("/merchant", patchTransactionMerchant);
