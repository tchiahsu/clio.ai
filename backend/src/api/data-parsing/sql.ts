import { Pool } from "pg";

/**
 * Upsert the aggregated summary for a statement.
 * Called at the end of the parsing pipeline once all transactions are written.
 */
export async function sqlUpsertStatementSummary(
    pool: Pool,
    statementId: number,
    totalIncome: number,
    totalExpenses: number
) {
    const res = await pool.query(
        `
        INSERT INTO statement_summary (statement_id, total_income, total_expenses)
        VALUES ($1, $2, $3)
        ON CONFLICT (statement_id)
            DO UPDATE SET
                total_income   = EXCLUDED.total_income,
                total_expenses = EXCLUDED.total_expenses
        RETURNING summary_id
        `,
        [statementId, totalIncome.toFixed(2), totalExpenses.toFixed(2)]
    );

    return res.rows[0];
}

/**
 * Fetch all unclassified transactions for a statement.
 * These are candidates for the LLM batch classifier.
 * A transaction is unclassified if category_confidence = 0.
 */
export async function sqlGetUnclassifiedTransactions(
    pool: Pool,
    statementId: number,
    userId: number
) {
    const res = await pool.query(
        `
        SELECT transaction_id, description
        FROM transactions
        WHERE statement_id = $1
          AND user_id = $2
          AND category_confidence = 0
        ORDER BY transaction_id ASC
        `,
        [statementId, userId]
    );
    return res.rows as { transaction_id: number; description: string }[];
}
 
/**
 * Update a transaction with LLM-classified merchant and category.
 * Only updates if the category belongs to this user.
 */
export async function sqlUpdateTransactionClassification(
    pool: Pool,
    transactionId: number,
    userId: number,
    merchantId: number | null,
    categoryId: number | null,
    confidence: number
) {
    const res = await pool.query(
        `
        UPDATE transactions
        SET merchant_id          = $3,
            category_id          = $4,
            category_confidence  = $5
        WHERE transaction_id = $1
          AND user_id        = $2
        RETURNING transaction_id
        `,
        [transactionId, userId, merchantId, categoryId, confidence]
    );
    return res.rows[0] ?? null;
}