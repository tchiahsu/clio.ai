import { Pool } from "pg";

/**
 * List of all merchant information. 
 */
export async function sqlMerchantsInfo(pool: Pool) {
    const res = await pool.query(
        `
        SELECT * FROM merchants m
        ORDER BY merchant_name DESC
        `,
    );

    return res.rows;
}

/**
 * Update merchant name.  
 */
export async function sqlMerchantNameUpdate(pool: Pool, merchant_name_p: string, merchantId: number) {
    const res = await pool.query(
        `
        UPDATE merchants 
        SET merchant_name = $1
        WHERE merchant_id = $2
        `,
        [merchant_name_p, merchantId]
    );

    return res.rows;
}

/**
 * Get merchant transaction history.  
 */
export async function sqlMerchantTransactions(pool: Pool, merchantId: number) {
    const res = await pool.query(
        `
        SELECT * FROM transactions t
        WHERE merchant_id = $1
        `,
        [merchantId]
    );

    return res.rows;
}