import { Pool } from "pg";

// Budgets are monthly household targets, keyed by the first day of the month
// (period_start). Spending for that month is aggregated across ALL of the user's
// accounts and matched by top-level category_name (a budget stores one
// representative subcategory id, but transactions span many subcategories), so
// the number reflects the whole month regardless of which account the spend
// landed on. The month is passed as ($2 = year, $3 = month).

/**
 * Get all budgets for a month with actual spending per category.
 */
export async function sqlGetBudgets(pool: Pool, userId: number, year: number, month: number) {
    const res = await pool.query(
        `
        WITH spend AS (
            SELECT cat.category_name,
                   SUM(-t.amount) AS spent
            FROM transactions t
            JOIN categories cat ON cat.category_id = t.category_id
            WHERE t.user_id = $1
              AND t.amount < 0
              AND t.transaction_date >= make_date($2, $3, 1)
              AND t.transaction_date <  make_date($2, $3, 1) + INTERVAL '1 month'
            GROUP BY cat.category_name
        )
        SELECT
            b.budget_id,
            b.category_id,
            b.category_name,
            b.amount AS budgeted,
            COALESCE(s.spent, 0) AS spent
        FROM budgets b
        LEFT JOIN spend s ON s.category_name = b.category_name
        WHERE b.user_id = $1 AND b.period_start = make_date($2, $3, 1)
        ORDER BY spent DESC
        `,
        [userId, year, month]
    );
    return res.rows;
}

/**
 * Get total budgeted amount for a month (sum of all category budgets).
 */
export async function sqlGetTotalBudget(pool: Pool, userId: number, year: number, month: number) {
    const res = await pool.query(
        `
        SELECT COALESCE(SUM(amount), 0) AS total_budgeted
        FROM budgets
        WHERE user_id = $1 AND period_start = make_date($2, $3, 1)
        `,
        [userId, year, month]
    );
    return res.rows[0];
}

/**
 * Upsert a budget for a category in a given month.
 */
export async function sqlUpsertBudget(
    pool: Pool,
    userId: number,
    categoryName: string,
    year: number,
    month: number,
    amount: number
) {
    const res = await pool.query(
        `
        INSERT INTO budgets (user_id, category_id, category_name, period_start, amount)
        VALUES (
            $1,
            (SELECT MIN(category_id) FROM categories WHERE user_id = $1 AND category_name = $2),
            $2,
            make_date($3, $4, 1),
            $5
        )
        ON CONFLICT (user_id, category_name, period_start)
        DO UPDATE SET amount = EXCLUDED.amount
        RETURNING *
        `,
        [userId, categoryName, year, month, amount]
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
