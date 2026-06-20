import { Pool } from "pg";
 
/**
 * List all accounts for a user.
 */
export async function sqlAllAccountsList(pool: Pool, userId: number) {
    const res = await pool.query(
        `
        SELECT a.account_id, a.bank_name, a.account_type, a.account_number,
            COALESCE(SUM(t.amount), 0) AS account_total
        FROM accounts a
        LEFT JOIN transactions t ON t.account_id = a.account_id
        WHERE a.user_id = $1
        GROUP BY a.account_id, a.bank_name, a.account_type, a.account_number
        ORDER BY a.account_id DESC
        `,
        [userId]
    );
    return res.rows;
}
 
/**
 * Get the all-time balance, the selected month's spend, and masked account
 * number for a specific account. account_total is the running all-time balance;
 * spent_this_month is scoped to the selected month ($3 = year, $4 = month) and
 * excludes internal transfers, matching how spend is counted everywhere else.
 * userId check ensures users can only access their own accounts.
 */
export async function sqlAccountSummary(pool: Pool, accountId: number, userId: number, year: number, month: number) {
    const res = await pool.query(
        `
       SELECT
            COALESCE(SUM(t.amount), 0) AS account_total,
            COALESCE(SUM(CASE WHEN t.amount < 0
                AND t.transaction_date >= make_date($3, $4, 1)
                AND t.transaction_date <  make_date($3, $4, 1) + INTERVAL '1 month'
                AND cat.category_name IS DISTINCT FROM 'transfers'
                THEN -t.amount ELSE 0 END), 0) AS spent_this_month,
            a.account_number,
            a.bank_name,
            a.account_type
        FROM accounts a
        LEFT JOIN transactions t ON t.account_id = a.account_id
        LEFT JOIN categories cat ON cat.category_id = t.category_id
        WHERE a.account_id = $1
        AND a.user_id = $2
        GROUP BY a.account_number, a.bank_name, a.account_type
        `,
        [accountId, userId, year, month]
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
 * Transactions for an account in the selected month ($3 = year, $4 = month),
 * scoped to the authenticated user.
 */
export async function sqlAccountTransaction(pool: Pool, accountId: number, userId: number, year: number, month: number) {
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
          AND t.transaction_date >= make_date($3, $4, 1)
          AND t.transaction_date <  make_date($3, $4, 1) + INTERVAL '1 month'
        ORDER BY t.transaction_date DESC, t.transaction_id DESC
        `,
        [accountId, userId, year, month]
    );
    return res.rows;
}