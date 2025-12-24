import { Router } from "express";
import {
    getDashboardCategory,
    getDashboardFilter,
    getDashboardSummary 
} from "./controller.js";

export const dashboardRouter = Router();

/**
 * GET /dashboard/transaction/totals
 * must provide statementId as param
 */
dashboardRouter.get("/transaction/totals", getDashboardSummary);

/**
 * GET /dashboard/transaction/category
 * must provide statementId as param
 */
dashboardRouter.get("/transaction/category", getDashboardCategory);

/**
 * GET /dashboard/transaction
 * must provide statementId as param
 */
dashboardRouter.get("/transaction", getDashboardFilter);
