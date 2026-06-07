import { Router } from "express";
import {
    getTransactionList,
    getTransactionDetail,
    patchTransactionCategory,
    patchTransactionMerchant,
} from "./controller.js";

export const transactionRouter = Router();

transactionRouter.get("/", getTransactionList);
transactionRouter.get("/detail", getTransactionDetail);
transactionRouter.patch("/category", patchTransactionCategory);
transactionRouter.patch("/merchant", patchTransactionMerchant);