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

export async function sqlAddMerchant(pool: Pool, merchant_name_p: string) {
    const res = await pool.query(
        `
        INSERT INTO merchants (merchant_name)
        VALUES ($1)
        ON CONFLICT (merchant_name) DO NOTHING
        RETURNING merchant_id;
        `,
        [merchant_name_p]
    )

    // Inserted successfully
    if (res.rows.length > 0) {
        return res.rows[0].merchant_id;
    }

    // Already existed → fetch it
    const selectRes = await pool.query(
        `
        SELECT merchant_id
        FROM merchants
        WHERE merchant_name = $1;
        `,
        [merchant_name_p]
    );

    return selectRes.rows[0].merchant_id;
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