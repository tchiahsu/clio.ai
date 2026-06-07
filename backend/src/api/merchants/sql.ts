import { Pool } from "pg";

export async function sqlMerchantsInfo(pool: Pool, userId: number) {
    const res = await pool.query(
        `
        SELECT DISTINCT
            m.merchant_id,
            COALESCE(mo.display_name, m.merchant_name) AS merchant_name
        FROM merchants m
        JOIN transactions t ON m.merchant_id = t.merchant_id
        LEFT JOIN merchant_overrides mo
            ON mo.merchant_id = m.merchant_id AND mo.user_id = $1
        WHERE t.user_id = $1
        ORDER BY merchant_name ASC
        `,
        [userId]
    );
    return res.rows;
}

export async function sqlUpsertMerchantOverride(
    pool: Pool,
    userId: number,
    merchantId: number,
    displayName: string
) {
    const res = await pool.query(
        `
        INSERT INTO merchant_overrides (user_id, merchant_id, display_name)
        VALUES ($1, $2, $3)
        ON CONFLICT (user_id, merchant_id)
            DO UPDATE SET display_name = EXCLUDED.display_name
        RETURNING override_id, user_id, merchant_id, display_name
        `,
        [userId, merchantId, displayName]
    );
    return res.rows[0] ?? null;
}

export async function sqlMerchantTransactions(pool: Pool, merchantId: number, userId: number) {
    const res = await pool.query(
        `
        SELECT
            t.transaction_id,
            t.transaction_date,
            t.description,
            t.amount,
            t.category_confidence,
            COALESCE(mo.display_name, m.merchant_name) AS merchant_name,
            c.category_name
        FROM transactions t
        JOIN merchants m ON m.merchant_id = t.merchant_id
        LEFT JOIN merchant_overrides mo
            ON mo.merchant_id = t.merchant_id AND mo.user_id = $2
        LEFT JOIN categories c ON c.category_id = t.category_id
        WHERE t.merchant_id = $1
          AND t.user_id = $2
        ORDER BY t.transaction_date DESC, t.transaction_id DESC
        `,
        [merchantId, userId]
    );
    return res.rows;
}

export async function sqlAddMerchant(pool: Pool, merchantName: string) {
    const res = await pool.query(
        `
        INSERT INTO merchants (merchant_name)
        VALUES ($1)
        ON CONFLICT (merchant_name) DO NOTHING
        RETURNING merchant_id
        `,
        [merchantName]
    );

    if (res.rows.length > 0) return res.rows[0].merchant_id as number;

    const selectRes = await pool.query(
        `SELECT merchant_id FROM merchants WHERE merchant_name = $1`,
        [merchantName]
    );
    return selectRes.rows[0].merchant_id as number;
}