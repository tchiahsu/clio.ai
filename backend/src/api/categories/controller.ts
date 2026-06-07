import type { Request, Response } from "express";
import pool from "../../database.js";
import { getUserId, getParamId } from "../utils.js";
import { sqlAddNewCategory, sqlDeleteCategory, sqlGetCategories } from "./sql.js";

/**
 * GET /categories
 */
export async function getUserCategories(req: Request, res: Response) {
    try {
        const userId = getUserId(req);
        const data = await sqlGetCategories(pool, userId);
        res.json({ userId, data });
    } catch (err) {
        console.error("getUserCategories error:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

/**
 * POST /categories
 * Body: { categoryName: string, subcategoryName: string }
 *
 * Fix: the original controller only passed categoryName, omitting subcategoryName.
 * Both are required by the schema's unique constraint and the SQL function.
 */
export async function addNewCategory(req: Request, res: Response) {
    try {
        const userId = getUserId(req);
        const { categoryName, subcategoryName } = req.body ?? {};

        if (typeof categoryName !== "string" || !categoryName.trim()) {
            return res.status(400).json({ error: "categoryName not found" });
        }
        if (typeof subcategoryName !== "string" || !subcategoryName.trim()) {
            return res.status(400).json({ error: "subcategoryName not found" });
        }

        const data = await sqlAddNewCategory(
            pool,
            userId,
            categoryName.trim(),
            subcategoryName.trim()
        );
        res.json({ userId, categoryName, subcategoryName, data });
    } catch (err) {
        console.error("addNewCategory error:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

/**
 * DELETE /categories/:id
 */
export async function deleteCategory(req: Request, res: Response) {
    try {
        const userId = getUserId(req);
        const categoryId = getParamId(req);

        if (!categoryId) return res.status(400).json({ error: "categoryId not found" });

        const data = await sqlDeleteCategory(pool, categoryId, userId);

        if (!data) return res.status(404).json({ error: "Category not found" });

        res.json({ categoryId, data });
    } catch (err) {
        console.error("deleteCategory error:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}