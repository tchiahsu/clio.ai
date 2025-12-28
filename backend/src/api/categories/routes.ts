import { Router } from "express";
import {
    addNewCategory,
    deleteCategory, 
    getUserCategories
} from "./controller.js";

export const categoriesRouter = Router();

/**
 * POST /categories/category
 * must provide newCategoryName as param
 */
categoriesRouter.post("/category", addNewCategory);

/**
 * DELETE /categories/category/:id
 * must provide categoryId as param
 */
categoriesRouter.delete("/category/:id", deleteCategory);

/**
 * GET /categories/category
 * must provide userId as param
 */
categoriesRouter.get("/category", getUserCategories);