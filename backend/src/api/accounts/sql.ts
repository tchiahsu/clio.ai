import { Pool } from "pg";
 
/**
 * List all accounts for a user.
 */
export async function sqlAllAccountsList(pool: Pool, userId: number) {
    const res = await pool.query(
        `
        SELECT account_id, bank_name, account_type
        FROM accounts
        WHERE user_id = $1
        ORDER BY account_id DESC
        `,
        [userId]
    );
    return res.rows;
}
 
/**
 * Get balance total and masked account number for a specific account.
 * userId check ensures users can only access their own accounts.
 */
export async function sqlAccountSummary(pool: Pool, accountId: number, userId: number) {
    const res = await pool.query(
        `
        SELECT
            COALESCE(SUM(t.amount), 0) AS account_total,
            a.account_number
        FROM accounts a
        LEFT JOIN transactions t ON t.account_id = a.account_id
        WHERE a.account_id = $1
          AND a.user_id = $2
        GROUP BY a.account_number
        `,
        [accountId, userId]
    );
    return res.rows[0] ?? null;
}
 
/**
 * Upsert an account. If the (user_id, account_number) pair already exists,
 * update the bank_name and account_type instead of erroring.
 */
export async function sqlAddAccount(
    pool: Pool,
    userId: number,
    bankName: string,
    accountNumber: string,
    accountType: string
) {
    const res = await pool.query(
        `
        INSERT INTO accounts (user_id, bank_name, account_number, account_type)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (user_id, account_number)
            DO UPDATE SET
                bank_name    = EXCLUDED.bank_name,
                account_type = EXCLUDED.account_type
        RETURNING account_id, user_id, bank_name, account_number, account_type
        `,
        [userId, bankName, accountNumber, accountType]
    );
    return res.rows[0];
}
 
/**
 * Delete an account only if it belongs to the given user.
 * Returns null (no rows) if the account doesn't exist or belongs to someone else.
 */
export async function sqlDeleteAccount(pool: Pool, accountId: number, userId: number) {
    const res = await pool.query(
        `
        DELETE FROM accounts
        WHERE account_id = $1
          AND user_id = $2
        RETURNING account_id
        `,
        [accountId, userId]
    );
    return res.rows[0] ?? null;
}
 
/**
 * All transactions for an account, scoped to the authenticated user.
 */
export async function sqlAccountTransaction(pool: Pool, accountId: number, userId: number) {
    const res = await pool.query(
        `
        SELECT
            t.transaction_id,
            t.transaction_date,
            t.description,
            t.amount,
            t.category_confidence,
            m.merchant_name,
            c.category_name
        FROM transactions t
        LEFT JOIN merchants m ON m.merchant_id = t.merchant_id
        LEFT JOIN categories c ON c.category_id = t.category_id
        WHERE t.account_id = $1
          AND t.user_id = $2
        ORDER BY t.transaction_date DESC, t.transaction_id DESC
        `,
        [accountId, userId]
    );
    return res.rows;
}