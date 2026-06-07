import { Router } from "express";
import {
    getUserCategories,
    addNewCategory,
    deleteCategory,
} from "./controller.js";

export const categoriesRouter = Router();

categoriesRouter.get("/", getUserCategories);
categoriesRouter.post("/", addNewCategory);
categoriesRouter.delete("/:id", deleteCategory);