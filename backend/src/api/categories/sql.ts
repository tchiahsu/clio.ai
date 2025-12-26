import { Pool } from "pg";

/**
 * Create a new category.  
 */
export async function sqlAddNewCategory(pool: Pool, user_id_p: number, category_name_p: string) {
    const res = await pool.query(
        `
        INSERT INTO categories (user_id, category_name)
        VALUES ($1, $2)
        RETURNING category_id, user_id, category_name
        `,
        [user_id_p, category_name_p]
    );

    return res.rows;
}

/**
 * Delete an existing category.  
 */
export async function sqlDeleteCategory(pool: Pool, category_id_p: number) {
    const res = await pool.query(
        `
        DELETE FROM categories 
        WHERE category_id = $1
        RETURNING category_id  
        `,
        [category_id_p]
    );
    return res.rows[0];
}