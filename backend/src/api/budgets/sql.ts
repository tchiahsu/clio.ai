import { Pool } from "pg";

/**
 * Get all budgets for a statement with actual spending per category.
 */
export async function sqlGetBudgets(pool: Pool, userId: number, statementId: number) {
    const res = await pool.query(
        `
        SELECT 
            b.budget_id,
            b.category_id,
            b.category_name,
            b.amount AS budgeted,
            COALESCE(SUM(CASE WHEN t.amount < 0 THEN -t.amount ELSE 0 END), 0) AS spent
        FROM budgets b
        LEFT JOIN categories c ON c.category_id = b.category_id
        LEFT JOIN transactions t ON t.category_id = c.category_id
            AND t.statement_id = $2
            AND t.user_id = $1
        WHERE b.user_id = $1 AND b.statement_id = $2
        GROUP BY b.budget_id, b.category_id, b.category_name, b.amount
        ORDER BY spent DESC
        `,
        [userId, statementId]
    );
    return res.rows;
}

/**
 * Get total budgeted amount for a statement (sum of all category budgets).
 */
export async function sqlGetTotalBudget(pool: Pool, userId: number, statementId: number) {
    const res = await pool.query(
        `
        SELECT COALESCE(SUM(amount), 0) AS total_budgeted
        FROM budgets
        WHERE user_id = $1 AND statement_id = $2
        `,
        [userId, statementId]
    );
    return res.rows[0];
}

/**
 * Upsert a budget for a category+statement.
 */
export async function sqlUpsertBudget(
    pool: Pool,
    userId: number,
    categoryName: string,
    statementId: number,
    amount: number
) {
    const res = await pool.query(
        `
        INSERT INTO budgets (user_id, category_id, category_name, statement_id, amount)
        VALUES (
            $1,
            (SELECT MIN(category_id) FROM categories WHERE user_id = $1 AND category_name = $2),
            $2,
            $3,
            $4
        )
        ON CONFLICT (user_id, category_name, statement_id)
        DO UPDATE SET amount = EXCLUDED.amount
        RETURNING *
        `,
        [userId, categoryName, statementId, amount]
    );
    return res.rows[0];
}

/**
 * Delete a budget by id.
 */
export async function sqlDeleteBudget(pool: Pool, userId: number, budgetId: number) {
    const res = await pool.query(
        `
        DELETE FROM budgets
        WHERE budget_id = $1 AND user_id = $2
        RETURNING *
        `,
        [budgetId, userId]
    );
    return res.rows[0];
} 