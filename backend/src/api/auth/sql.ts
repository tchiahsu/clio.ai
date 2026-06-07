import type { Pool } from "pg";

/**
 * Fetch login credentials for a user by email.
 */
export async function sqlGetUserLogin(pool: Pool, email: string) {
    const res = await pool.query(
        `
        SELECT user_id, email, password_hash
        FROM users
        WHERE email = $1
        `,
        [email]
    );

    if (res.rows.length === 0) return undefined;

    return res.rows[0] as {
        user_id: number;
        email: string;
        password_hash: string;
    };
}

/**
 * Fetch a user by ID — used by GET /auth/me.
 */
export async function sqlGetUserById(pool: Pool, userId: number) {
    const res = await pool.query(
        `
        SELECT user_id, email, first_name, last_name
        FROM users
        WHERE user_id = $1
        `,
        [userId]
    );

    if (res.rows.length === 0) return undefined;

    return res.rows[0] as {
        user_id: number;
        email: string;
        first_name: string;
        last_name: string;
    };
}

/**
 * Insert a new user. Returns the created user, or undefined if the email
 * already exists (ON CONFLICT DO NOTHING produces 0 rows).
 */
export async function sqlCreateUser(
    pool: Pool,
    email: string,
    firstName: string,
    lastName: string,
    passwordHash: string
) {
    const res = await pool.query(
        `
        INSERT INTO users (email, first_name, last_name, password_hash)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (email) DO NOTHING
        RETURNING user_id, email
        `,
        [email, firstName, lastName, passwordHash]
    );

    return res.rows[0] as { user_id: number; email: string } | undefined;
}