import { Pool } from "pg";

export async function sqlStatementList(pool: Pool, userId: number, limit?: number) {
  const hasLimit = limit != null;

  const res = await pool.query(
    `
    SELECT s.statement_id, s.file_name, s.period_end, a.bank_name, a.account_number, a.account_type FROM statements s
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
    SELECT s.statement_id, s.current_status FROM statements s
    WHERE s.user_id = $1
    AND s.statement_id = $2
    `,
    [userId, statementId]
  );

  return res.rows[0] ?? null;
}

export async function sqlDeleteStatement(pool: Pool, userId: number, statementId: number) {
  const res = await pool.query(
    `
    DELETE from statements
    WHERE user_id = $1
    AND statement_id = $2
    RETURNING statement_id
    `,
    [userId, statementId]
  );

  return res.rows[0] ?? null;
}