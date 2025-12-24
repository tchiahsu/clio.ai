import { Router } from "express";
import {
    getDashboardCategory,
    getDashboardFilter,
    getDashboardSummary 
} from "./controller.js";

export const dashboardRouter = Router();

/**
 * GET /dashboard/transaction/summary
 */
dashboardRouter.get("/transaction/totals", getDashboardSummary);

/**
 * GET /dashboard/transaction/summary
 */
dashboardRouter.get("/transaction/category", getDashboardCategory);

/**
 * GET /dashboard/transaction/summary
 */
dashboardRouter.get("/transaction", getDashboardFilter);
