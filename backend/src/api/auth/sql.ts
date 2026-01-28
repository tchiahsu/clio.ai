import type { Pool } from "pg";

/**
 * Get log in information from user.   
 */
export async function sqlGetUserLogin(pool: Pool, email: string){
    const rest = await pool.query(
        `
        SELECT user_id, email, password_hash
        FROM users
        WHERE email = $1
        `, 
        [email]
    );

    if (rest.rows.length === 0) return undefined;

    return rest.rows[0] as {
        user_id: number;
        email: string;
        password_hash: string;
    };
}