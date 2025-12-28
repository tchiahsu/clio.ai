import { Pool } from "pg";

/**
 * List of all merchant information. 
 */
export async function sqlMerchantsInfo(pool: Pool, userId: number) {
    const res = await pool.query(
        `
        SELECT * FROM merchants m
        JOIN transactions t ON m.merchant_id = t.merchant_id
        WHERE t.user_id = $1
        ORDER BY merchant_name DESC
        `,
        [userId]
    );

    return res.rows;
}

/**
 * Update merchant name.  
 */
export async function sqlMerchantNameUpdate(pool: Pool, merchant_name_p: string, merchantId: number,  userId: number) {
    const res = await pool.query(
        `
        UPDATE merchants m
        SET merchant_name = $1
        FROM transactions t
        WHERE m.merchant_id = t.merchant_id AND m.merchant_id = $2 AND t.user_id = $3
        `,
        [merchant_name_p, merchantId, userId]
    );

    return res.rows;
}

/**
 * Get merchant transaction history.  
 */
export async function sqlMerchantTransactions(pool: Pool, merchantId: number, userId: number) {
    const res = await pool.query(
        `
        SELECT * FROM transactions t
        WHERE t.merchant_id = $1 AND t.user_id = $2
        `,
        [merchantId, userId]
    );

    return res.rows;
}