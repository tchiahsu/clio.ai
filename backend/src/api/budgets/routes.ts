import { Router } from "express";
import { getBudgets, upsertBudget, deleteBudget } from "./controller.js";

export const budgetRouter = Router();

budgetRouter.get("/", getBudgets);
budgetRouter.post("/", upsertBudget);
budgetRouter.delete("/:id", deleteBudget);