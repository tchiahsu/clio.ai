import { Pool } from "pg";

export async function sqlGetGoals(pool: Pool, userId: number) {
    const res = await pool.query(
        `
        SELECT goal_id, title, target_amount, saved_amount, deadline, created_at
        FROM goals
        WHERE user_id = $1
        ORDER BY created_at DESC
        `,
        [userId]
    );
    return res.rows;
}

export async function sqlCreateGoal(
    pool: Pool,
    userId: number,
    title: string,
    targetAmount: number,
    savedAmount: number,
    deadline: string | null
) {
    const res = await pool.query(
        `
        INSERT INTO goals (user_id, title, target_amount, saved_amount, deadline)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
        `,
        [userId, title, targetAmount, savedAmount, deadline]
    );
    return res.rows[0];
}

export async function sqlUpdateGoal(
    pool: Pool,
    userId: number,
    goalId: number,
    title: string,
    targetAmount: number,
    savedAmount: number,
    deadline: string | null
) {
    const res = await pool.query(
        `
        UPDATE goals
        SET title = $3, target_amount = $4, saved_amount = $5, deadline = $6
        WHERE goal_id = $1 AND user_id = $2
        RETURNING *
        `,
        [goalId, userId, title, targetAmount, savedAmount, deadline]
    );
    return res.rows[0];
}

export async function sqlDeleteGoal(pool: Pool, userId: number, goalId: number) {
    const res = await pool.query(
        `
        DELETE FROM goals
        WHERE goal_id = $1 AND user_id = $2
        RETURNING *
        `,
        [goalId, userId]
    );
    return res.rows[0];
}