import { Pool } from "pg";

/**
 * Get a list of all the accounts pertaining to the user.
 */
export async function sqlAllAccountsList (pool: Pool, userId: number) {
    const res = await pool.query(
        `
        SELECT account_id, bank_name, account_type FROM accounts
        WHERE user_id = $1
        ORDER BY account_id DESC
        `,
        [userId]
    );
    return res.rows;
}

/**
 * Get a account totals and digits of a specific account. 
 */
export async function sqlAccountSummary (pool: Pool, account_id_p: number) {
     const res = await pool.query(
        `
        SELECT COALESCE(SUM(t.amount), 0) AS account_total, a.account_number FROM accounts a
        JOIN transactions t ON t.account_id = a.account_id
        WHERE a.account_id = $1
        GROUP BY a.account_number
        `,
        [account_id_p]
    );
    return res.rows;
}

/**
 * Add a new account.  
 */
export async function sqlAddAccount(
  pool: Pool,
  user_id_p: number,
  bank_name_p: string,
  account_number_p: string,
  account_type_p: string
) {
  const res = await pool.query(
    `
    INSERT INTO accounts (user_id, bank_name, account_number, account_type)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (user_id, account_number) DO UPDATE
      SET bank_name = EXCLUDED.bank_name
    RETURNING account_id, user_id, bank_name, account_number, account_type
    `,
    [user_id_p, bank_name_p, account_number_p, account_type_p]
  );
  return res.rows[0];
}

/**
 * Delete an existing account.  
 */
export async function sqlDeleteAccount (pool: Pool, account_id_p: number) {
    const res = await pool.query(
        `
        DELETE FROM accounts 
        WHERE account_id = $1
        RETURNING account_id  
        `,
        [account_id_p]
    );
    return res.rows[0];
}

/**
 * Get all transactions associated to the account. 
 */
export async function sqlAccountTransaction (pool: Pool, account_id_p: number) {
    const res = await pool.query(
        `
        SELECT * FROM transactions
        WHERE account_id = $1
        ORDER BY transaction_id DESC
        `,
        [account_id_p]
    );
    return res.rows;
}

