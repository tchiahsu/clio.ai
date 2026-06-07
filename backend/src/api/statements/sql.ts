
import { Pool } from "pg";
 
export async function sqlStatementList(pool: Pool, userId: number, limit?: number) {
    const hasLimit = limit != null;
    const res = await pool.query(
        `
        SELECT s.statement_id, s.file_name, s.period_end, s.current_status,
               a.bank_name, a.account_number, a.account_type
        FROM statements s
        JOIN accounts a ON s.account_id = a.account_id
        WHERE s.user_id = $1
        ORDER BY s.period_end DESC
        ${hasLimit ? "LIMIT $2" : ""}
        `,
        hasLimit ? [userId, limit] : [userId]
    );
    return res.rows;
}
 
export async function sqlStatementStatus(pool: Pool, userId: number, statementId: number) {
    const res = await pool.query(
        `
        SELECT statement_id, current_status, error_message
        FROM statements
        WHERE user_id = $1 AND statement_id = $2
        `,
        [userId, statementId]
    );
    return res.rows[0] ?? null;
}
 
export async function sqlDeleteStatement(pool: Pool, userId: number, statementId: number) {
    const res = await pool.query(
        `
        DELETE FROM statements
        WHERE user_id = $1 AND statement_id = $2
        RETURNING statement_id
        `,
        [userId, statementId]
    );
    return res.rows[0] ?? null;
}
 
export async function sqlAddStatement(
    pool: Pool,
    userId: number,
    fileName: string,
    fileHash: string
) {
    const res = await pool.query(
        `
        INSERT INTO statements (user_id, file_name, file_hash, uploaded_at)
        VALUES ($1, $2, $3, NOW())
        RETURNING statement_id
        `,
        [userId, fileName, fileHash]
    );
    return res.rows[0];
}
 
export async function sqlValidateStatement(pool: Pool, userId: number, fileHash: string) {
    const res = await pool.query(
        `
        SELECT statement_id FROM statements
        WHERE user_id = $1 AND file_hash = $2
        `,
        [userId, fileHash]
    );
    return res.rows;
}
 
export async function sqlSetStatusProcessing(pool: Pool, userId: number, statementId: number) {
    const res = await pool.query(
        `
        UPDATE statements
        SET current_status = 'processing'
        WHERE user_id = $1 AND statement_id = $2
        RETURNING statement_id
        `,
        [userId, statementId]
    );
    return res.rows[0];
}
 
export async function sqlUpdateStatement(
    pool: Pool,
    userId: number,
    statementId: number,
    accountId: number,
    periodStart: string,
    periodEnd: string
) {
    const res = await pool.query(
        `
        UPDATE statements
        SET
            account_id     = $1,
            period_start   = $2,
            period_end     = $3,
            current_status = 'parsed',
            parsed_at      = NOW(),
            error_message  = NULL
        WHERE statement_id = $4 AND user_id = $5
        RETURNING statement_id, account_id, period_start, period_end, current_status, parsed_at
        `,
        [accountId, periodStart, periodEnd, statementId, userId]
    );
    return res.rows[0];
}
 
/**
 * Mark a statement as fully processed and ready for the dashboard.
 */
export async function sqlSetStatusComplete(pool: Pool, userId: number, statementId: number) {
    const res = await pool.query(
        `
        UPDATE statements
        SET current_status = 'complete'
        WHERE user_id = $1 AND statement_id = $2
        RETURNING statement_id
        `,
        [userId, statementId]
    );
    return res.rows[0];
}
 
/**
 * Mark a statement as failed, recording the error message for diagnostics.
 */
export async function sqlSetStatusFailed(
    pool: Pool,
    userId: number,
    statementId: number,
    errorMessage: string
) {
    const res = await pool.query(
        `
        UPDATE statements
        SET current_status = 'failed',
            error_message  = $3
        WHERE user_id = $1 AND statement_id = $2
        RETURNING statement_id
        `,
        [userId, statementId, errorMessage]
    );
    return res.rows[0];
}