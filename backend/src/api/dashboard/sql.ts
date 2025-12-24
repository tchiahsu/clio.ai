import { Pool } from "pg";

/**
 * Verify that a statement exists and belongs to the user.
 */
export async function sqlAssertStatementOwned(pool: Pool, userId: number, statementId: number): Promise<boolean> {
    const res = await pool.query(
        `
        SELECT 1 FROM statements
        WHERE statement_id = $1
        AND user_id = $2
        `,
        [statementId, userId]
    )

    return res.rows.length > 0;
}

/**
 * Dashboard summary: income, expenses, net.
 */
export async function sqlDashboardSummaryForStatement(pool: Pool, userId: number, statementId: number) {
    const res = await pool.query(
        `
        SELECT
            COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0) AS total_income,
            COALESCE(SUM(CASE WHEN amount < 0 THEN -amount ELSE 0 END), 0) AS total_expenses,
            COALESCE(SUM(amount), 0) as net
        FROM transactions
        WHERE user_id = $1 AND statement_id = $2
        `,
        [userId, statementId]
    )

    return res.rows[0]
}

/**
 * Spending breakdown by category for a statement.
 */
export async function sqlDashboardCategorySpendForStatement(pool: Pool, userId: number, statementId: number) {
    const res = await pool.query(
        `
        SELECT c.category_id, c.category_name, COALESCE(SUM(CASE WHEN t.amount < 0 THEN -t.amount ELSE 0 END), 0) AS spent
        FROM transactions t
        LEFT JOIN categories c ON c.category_id = t.category_id
        WHERE t.user_id = $1 AND t.statement_id = $2
        GROUP BY c.category_id, c.category_name
        ORDER BY spent DESC
        `,
        [userId, statementId]
    );

    return res.rows;
}

/**
 * Full transaction list for a statement.
 */
export async function sqlDashboardTransactionsForStatement(pool: Pool, userId: number, statementId: number) {
    const res = await pool.query(
        `
        SELECT t.transaction_id, t.transaction_date, t.description, t.amount, a.bank_name, a.account_type, m.merchant_name, c.category_name, t.category_confidence FROM transactions t
        JOIN accounts a ON a.account_id = t.account_id
        LEFT JOIN merchants m ON m.merchant_id = t.merchant_id
        LEFT JOIN categories c ON c.category_id = t.category_id
        WHERE t.user_id = $1 AND t.statement_id = $2
        ORDER BY t.transaction_date DESC, t.transaction_id DESC
        `,
        [userId, statementId]
    );

    return res.rows;
}