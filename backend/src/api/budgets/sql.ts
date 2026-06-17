import { Pool } from "pg";

/**
 * Get all budgets for a statement with actual spending per category.
 */
export async function sqlGetBudgets(pool: Pool, userId: number, statementId: number) {
    const res = await pool.query(
        `
        SELECT 
            cat_budgets.category_name,
            cat_budgets.category_id,
            cat_budgets.budgeted,
            COALESCE(SUM(CASE WHEN t.amount < 0 THEN -t.amount ELSE 0 END), 0) AS spent
        FROM (
            SELECT c.category_name, MIN(c.category_id) AS category_id, SUM(b.amount) AS budgeted
            FROM budgets b
            JOIN categories c ON c.category_id = b.category_id
            WHERE b.user_id = $1 AND b.statement_id = $2
            GROUP BY c.category_name
        ) cat_budgets
        LEFT JOIN categories c ON c.category_name = cat_budgets.category_name AND c.user_id = $1
        LEFT JOIN transactions t ON t.category_id = c.category_id
            AND t.statement_id = $2
            AND t.user_id = $1
        GROUP BY cat_budgets.category_name, cat_budgets.category_id, cat_budgets.budgeted
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
    categoryId: number,
    statementId: number,
    amount: number
) {
    const res = await pool.query(
        `
        INSERT INTO budgets (user_id, category_id, statement_id, amount)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (user_id, category_id, statement_id)
        DO UPDATE SET amount = EXCLUDED.amount
        RETURNING *
        `,
        [userId, categoryId, statementId, amount]
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