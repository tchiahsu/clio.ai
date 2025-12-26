import { Pool } from "pg";

/**
 * Verify that a statement exists and belongs to the user.
 */
export async function sqlLatestStatementId(pool: Pool, userId: number): Promise<number> {
    const res = await pool.query(
        `
        SELECT statement_id FROM statements
        WHERE user_id = $1
        ORDER BY period_end DESK, statement_id DESC
        LIMIT 1
        `,
        [userId]
    )

    return res.rows[0]?.statement_id ?? null;
}

/**
 * Get all the transaction information
 */
export async function sqlAllTransactions(pool: Pool, userId: number) {
    const res = await pool.query(
        `
        SELECT t.transaction_id, t.transaction_date, t.description, t.amount, a.bank_name, a.account_type, m.merchant_name, c.category_name, t.category_confidence, t.statement_id
        FROM transactions t
        JOIN accounts a ON a.account_id = t.account_id
        LEFT JOIN merchants m ON m.merchant_id = t.merchant_id
        LEFT JOIN categories c ON c.category_id = t.category_id
        WHERE t.user_id = $1
        ORDER BY t.transaction_date DESC, t.transaction_id DESC
        `,
        [userId]
    );

    return res.rows;
}
