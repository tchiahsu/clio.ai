import type { Request, Response } from "express";
import pool from "../../database.js";
import { sqlAddNewCategory, sqlDeleteCategory } from "../categories/sql.js";

/**
 * Gets the current userId (fake user id for now).
 * I tell TS that request has extra properties for user.
 */
function getUserId(req: Request): number {
  return (req as any).user?.userId ?? 1;
}

/**
 * Gets the current categoryId .
 * I tell TS that request has extra properties for category.
 */
function getCategoryId(req: Request): number {
  const id = Number(req.params.id);
  return id;
}

/**
 * Adds a new category to table.
 */
export async function addNewCategory(req: Request, res: Response) {
  try {
    const userId = getUserId(req);
    const newCategoryName = req.body.newCategoryName;

    if (!newCategoryName)
      return res.status(400).json({ error: "new category name not found" });

    const data = await sqlAddNewCategory(pool, userId, newCategoryName);
    res.json({ userId, newCategoryName, data });
  } catch (err) {
    console.error("addNewCategory error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

/**
 * Deletes category from table.
 */
export async function deleteCategory(req: Request, res: Response) {
  try {
    const categoryId = getCategoryId(req);

    if (!categoryId)
      return res.status(400).json({ error: "categoryId not found" });

    const data = await sqlDeleteCategory(pool, categoryId);
    res.json({ categoryId, data });
  } catch (err) {
    console.error("getMerchantsInfo error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
