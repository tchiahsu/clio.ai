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