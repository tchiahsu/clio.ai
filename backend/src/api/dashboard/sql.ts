import { Pool } from "pg";

// The app is month-centric: every dashboard query is scoped to a calendar month
// across ALL of the user's accounts (income lands on checking, spend on the
// credit card, so a single-account view never reflects the real month). The
// month is passed as ($2 = year, $3 = month) and turned into the half-open range
// [make_date(year,month,1), +1 month). Internal transfers (credit-card payments,
// savings transfers) are excluded from income/expense totals: a card payment
// settles purchases already counted as spend on the card, so counting both would
// double-count. Uncategorized (NULL) transactions still count.

/**
 * Dashboard summary for a month: income, expenses, net (transfers excluded).
 */
export async function sqlDashboardSummaryForMonth(pool: Pool, userId: number, year: number, month: number) {
    const res = await pool.query(
        `
        SELECT
            COALESCE(SUM(CASE WHEN t.amount > 0 THEN t.amount ELSE 0 END), 0) AS total_income,
            COALESCE(SUM(CASE WHEN t.amount < 0 THEN -t.amount ELSE 0 END), 0) AS total_expenses,
            COALESCE(SUM(t.amount), 0) as net
        FROM transactions t
        LEFT JOIN categories cat ON cat.category_id = t.category_id
        WHERE t.user_id = $1
          AND t.transaction_date >= make_date($2, $3, 1)
          AND t.transaction_date <  make_date($2, $3, 1) + INTERVAL '1 month'
          AND cat.category_name IS DISTINCT FROM 'transfers'
        `,
        [userId, year, month]
    )

    return res.rows[0]
}

/**
 * Spending breakdown by category for a month. "spent" is aggregated across all
 * of the user's accounts and matched to the month's budgets by top-level
 * category_name, so the dashboard cards agree with the budget page.
 */
export async function sqlDashboardCategorySpendForMonth(pool: Pool, userId: number, year: number, month: number) {
    const res = await pool.query(
        `
        WITH spend AS (
            SELECT cat.category_name,
                   SUM(-t.amount) AS spent
            FROM transactions t
            JOIN categories cat ON cat.category_id = t.category_id
            WHERE t.user_id = $1
              AND t.amount < 0
              AND t.transaction_date >= make_date($2, $3, 1)
              AND t.transaction_date <  make_date($2, $3, 1) + INTERVAL '1 month'
            GROUP BY cat.category_name
        )
        SELECT b.category_id,
            b.category_name,
            b.amount AS budgeted,
            COALESCE(s.spent, 0) AS spent
        FROM budgets b
        LEFT JOIN spend s ON s.category_name = b.category_name
        WHERE b.user_id = $1 AND b.period_start = make_date($2, $3, 1)
        ORDER BY spent DESC
        `,
        [userId, year, month]
    );

    return res.rows;
}

/**
 * Full transaction list across all of the user's accounts for a month. Returns
 * account info (bank_name, account_type) so the client can tag each row with its
 * source account, and category_id so it can match by category.
 */
export async function sqlTransactionsForMonth(pool: Pool, userId: number, year: number, month: number) {
    const res = await pool.query(
        `
        SELECT t.transaction_id, t.transaction_date, t.description, t.amount,
            a.account_id, a.bank_name, a.account_type, a.account_number,
            m.merchant_name, c.category_name, t.category_id, t.category_confidence, t.statement_id
        FROM transactions t
        JOIN accounts a ON a.account_id = t.account_id
        LEFT JOIN merchants m ON m.merchant_id = t.merchant_id
        LEFT JOIN categories c ON c.category_id = t.category_id
        WHERE t.user_id = $1
          AND t.transaction_date >= make_date($2, $3, 1)
          AND t.transaction_date <  make_date($2, $3, 1) + INTERVAL '1 month'
        ORDER BY t.transaction_date DESC, t.transaction_id DESC
        `,
        [userId, year, month]
    );

    return res.rows;
}

/**
 * Daily income and spending totals for a month (transfers excluded).
 * Used for the Net This Month line chart on the dashboard.
 */
export async function sqlDashboardDailyTotals(pool: Pool, userId: number, year: number, month: number) {
    const res = await pool.query(
        `
        SELECT
            t.transaction_date,
            COALESCE(SUM(CASE WHEN t.amount > 0 THEN t.amount ELSE 0 END), 0) AS daily_income,
            COALESCE(SUM(CASE WHEN t.amount < 0 THEN -t.amount ELSE 0 END), 0) AS daily_spending
        FROM transactions t
        LEFT JOIN categories cat ON cat.category_id = t.category_id
        WHERE t.user_id = $1
          AND t.transaction_date >= make_date($2, $3, 1)
          AND t.transaction_date <  make_date($2, $3, 1) + INTERVAL '1 month'
          AND cat.category_name IS DISTINCT FROM 'transfers'
        GROUP BY t.transaction_date
        ORDER BY t.transaction_date ASC
        `,
        [userId, year, month]
    )
    return res.rows
}

/**
 * Budget overview for the selected month and the month before it: income,
 * spending, savings (transfers excluded) for each, so the UI can show a
 * vs-last-month comparison. Row 0 is the selected month, row 1 the prior month.
 */
export async function sqlBudgetOverview(pool: Pool, userId: number, year: number, month: number) {
    const res = await pool.query(
        `
        WITH months AS (
            SELECT make_date($2, $3, 1) AS period_start
            UNION ALL
            SELECT (make_date($2, $3, 1) - INTERVAL '1 month')::date
        ),
        agg AS (
            SELECT m.period_start,
                COALESCE(SUM(CASE WHEN t.amount > 0 THEN t.amount ELSE 0 END), 0) AS total_income,
                COALESCE(SUM(CASE WHEN t.amount < 0 THEN -t.amount ELSE 0 END), 0) AS total_expenses
            FROM months m
            LEFT JOIN transactions t ON t.user_id = $1
                AND t.transaction_date >= m.period_start
                AND t.transaction_date <  m.period_start + INTERVAL '1 month'
            LEFT JOIN categories cat ON cat.category_id = t.category_id
                AND cat.category_name = 'transfers'
            WHERE cat.category_id IS NULL
            GROUP BY m.period_start
        )
        SELECT
            to_char(period_start, 'YYYY-MM-DD') AS date,
            total_income,
            total_expenses,
            total_income - total_expenses AS savings
        FROM agg
        ORDER BY period_start DESC
        `,
        [userId, year, month]
    );
    return res.rows;
}
