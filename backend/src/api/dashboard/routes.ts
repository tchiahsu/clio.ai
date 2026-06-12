import { Router } from "express";
import {
    getDashboardTransactionTotals,
    getDashboardCategoryTotals,
    getDashboardTransactions,
    getBudgetOverview,
    getDashboardDailyTotals,
} from "./controller.js";

export const dashboardRouter = Router();

dashboardRouter.get("/totals", getDashboardTransactionTotals);
dashboardRouter.get("/categories", getDashboardCategoryTotals);
dashboardRouter.get("/transactions", getDashboardTransactions);
dashboardRouter.get("/accounts/:id/budget", getBudgetOverview);
dashboardRouter.get("/daily", getDashboardDailyTotals);

