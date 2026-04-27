import { Pool } from "pg";

/**
 * Create a new category for a given user.  
 */
export async function sqlAddNewCategory(
  pool: Pool,
  user_id_p: number,
  category_name_p: string,
  subcategory_name_p: string
) {
  const res = await pool.query(
    `
    INSERT INTO categories (user_id, category_name, subcategory_name)
    VALUES ($1, $2, $3)
    ON CONFLICT (user_id, category_name, subcategory_name) DO NOTHING
    RETURNING category_id, user_id, category_name, subcategory_name
    `,
    [user_id_p, category_name_p, subcategory_name_p]
  );
  return res.rows;
}

/**
 * Delete an existing category for a given user.  
 */
export async function sqlDeleteCategory(pool: Pool, category_id_p: number, userId: number) {
    const res = await pool.query(
        `
        DELETE FROM categories 
        WHERE category_id = $1 AND user_id = $2
        RETURNING category_id  
        `,
        [category_id_p, userId]
    );
    return res.rows[0];
}

/**
 * Get all categories for given user. 
 */
export async function sqlGetCategories(pool: Pool, userId: number) {
    const res = await pool.query(
        `
        SELECT * FROM categories 
        WHERE user_id = $1
        `,
        [userId]
    );
    return res.rows;
}