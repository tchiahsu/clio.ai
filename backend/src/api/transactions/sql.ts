import { Pool } from "pg";

/**
 * Verify that a statement exists and belongs to the user.
 */
export async function sqlLatestStatementId(pool: Pool, userId: number) {
    const res = await pool.query(
        `
        SELECT statement_id FROM statements
        WHERE user_id = $1
        ORDER BY period_end DESC, statement_id DESC
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

/**
 * Get transaction details for a single transaction
 */
export async function sqlGetTransactionDetail(pool: Pool, transactionId: number, userId: number) {
    const res = await pool.query(
        `
        SELECT t.*, a.account_number, a.bank_name, a.account_type, c.category_name, m.merchant_name FROM transactions t
        JOIN accounts a ON t.account_id = a.account_id
        LEFT JOIN categories c ON t.category_id = c.category_id
        LEFT JOIN merchants m ON t.merchant_id = m.merchant_id
        WHERE t.transaction_id = $1
        AND t.user_id = $2
        `,
        [transactionId, userId]
    );

    return res.rows[0] ?? null;
}

/**
 * Change category of a transaction
 */
export async function sqlPatchTransactionCategory(pool: Pool, userId: number, categoryId: number, transactionId: number) {
    const res = await pool.query(
        `
        UPDATE transactions t
        SET category_id = c.category_id,
            category_confidence = 1.0
        FROM categories c
        WHERE t.transaction_id = $1
        AND t.user_id = $2
        AND c.category_id = $3
        AND c.user_id = t.user_id
        RETURNING t.transaction_id, t.category_id, t.category_confidence;
        `,
        [transactionId, userId, categoryId]
    );

    return res.rows[0] ?? null;
}

/**
 * Change merchant name
 */
export async function sqlPatchTransactionMerchant(pool: Pool, userId: number, transactionId: number, merchantId: number) {
    const res = await pool.query(
        `
        UPDATE transactions t
        SET merchant_id = m.merchant_id
        FROM merchants m
        WHERE t.transaction_id = $1
        AND t.user_id = $2
        AND m.merchant_id = $3
        RETURNING t.transaction_id, t.merchant_id;
        `,
        [transactionId, userId, merchantId]
    );

    return res.rows[0] ?? null;
}