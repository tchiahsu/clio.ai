import { Router } from "express";
import {
    getDashboardCategoryTotals,
    getDashboardTransactions,
    getDashboardTransactionTotals
} from "./controller.js";

export const dashboardRouter = Router();

/**
 * GET /dashboard/transaction/totals
 * must provide statementId as param
 */
dashboardRouter.get("/transaction/totals", getDashboardTransactionTotals);

/**
 * GET /dashboard/transaction/category
 * must provide statementId as param
 */
dashboardRouter.get("/transaction/category", getDashboardCategoryTotals);

/**
 * GET /dashboard/transaction
 * must provide statementId as param
 */
dashboardRouter.get("/transaction", getDashboardTransactions);
