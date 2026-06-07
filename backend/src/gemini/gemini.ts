/**
 * gemini.ts
 * Central service for all Gemini API interactions.
 * Used by:
 *   - Job 1: chat question answering via natural language → SQL
 *   - Job 2: batch transaction classification fallback
 */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL   = "gemini-2.5-flash";
const GEMINI_URL     = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

// ─────────────────────────────────────────────────────────────────────────────
// Shared fetch helper
// ─────────────────────────────────────────────────────────────────────────────

async function callGemini(systemPrompt: string, userMessage: string): Promise<string> {
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not set in environment variables");

    const body = {
        system_instruction: {
            parts: [{ text: systemPrompt }]
        },
        contents: [
            { role: "user", parts: [{ text: userMessage }] }
        ],
        generationConfig: {
            temperature: 0.1,       // Low temperature — we want precise, factual answers
            maxOutputTokens: 1024,
        }
    };

    const res = await fetch(GEMINI_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Gemini API error ${res.status}: ${err}`);
    }

    const data = await res.json() as any;
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) throw new Error("Gemini returned an empty response");

    return text.trim();
}

// ─────────────────────────────────────────────────────────────────────────────
// Job 1 — Chat: Natural language → SQL → answer
// ─────────────────────────────────────────────────────────────────────────────

// The clio schema described in plain terms for the LLM.
// Keeping this concise reduces token usage without losing accuracy.
const SCHEMA_CONTEXT = `
PostgreSQL schema (search_path = clio):

users: user_id, email, first_name, last_name
accounts: account_id, user_id, bank_name, account_number, account_type
statements: statement_id, user_id, account_id, period_start, period_end, current_status ('queued'|'processing'|'parsed'|'complete'|'failed')
transactions: transaction_id, user_id, account_id, statement_id, merchant_id, category_id, category_confidence, transaction_date (DATE), description, amount (NUMERIC, positive=income negative=expense)
merchants: merchant_id, merchant_name
merchant_overrides: override_id, user_id, merchant_id, display_name  ← user's custom merchant name, takes priority over merchants.merchant_name
categories: category_id, user_id, category_name, subcategory_name
statement_summary: summary_id, statement_id, starting_balance, ending_balance, total_income, total_expenses
chat_history: chat_id, user_id, title, created_at
chat_messages: messages_id, chat_id, speaker_type ('user'|'llm'), message_content, created_at

Key relationships:
- transactions JOIN merchants ON merchant_id (use COALESCE(mo.display_name, m.merchant_name) with LEFT JOIN merchant_overrides mo ON mo.merchant_id = m.merchant_id AND mo.user_id = $1)
- transactions JOIN categories ON category_id
- amount < 0 = expense, amount > 0 = income
- Always filter by user_id = $1 on every table that has user_id
`;

const CHAT_SYSTEM_PROMPT = `
You are a personal finance assistant for the Clio app. You help users understand their spending by answering questions about their transactions.

The user's transaction data is from 2025. When a user says "January" they mean January 2025. When they say "last month" assume the most recent month with data is February 2025. Always use 2025 for year references unless the user explicitly states otherwise.

You have access to the user's financial data via PostgreSQL. When a user asks a question, you must:
1. Generate a safe, parameterized PostgreSQL SELECT query to answer it
2. Return ONLY a valid JSON object — no markdown, no backticks, no explanation outside JSON

Rules for SQL generation:
- ONLY generate SELECT statements — never INSERT, UPDATE, DELETE, DROP, or any DDL
- Always include WHERE user_id = $1 (or the equivalent join condition) on every table
- Use COALESCE(mo.display_name, m.merchant_name) with LEFT JOIN merchant_overrides mo ON mo.merchant_id = t.merchant_id AND mo.user_id = $1 when showing merchant names
- For date filtering: use explicit DATE literals like DATE '2025-01-01' — never rely on CURRENT_DATE since it may be wrong
- For January 2025: transaction_date >= DATE '2025-01-01' AND transaction_date < DATE '2025-02-01'
- For February 2025: transaction_date >= DATE '2025-02-01' AND transaction_date < DATE '2025-03-01'
- For spending questions: SUM expenses as ABS(SUM(amount)) WHERE amount < 0, always alias the result as "spent"
- For income questions: SUM WHERE amount > 0, always alias the result as "total"
- For list queries: always include merchant_name and amount columns
- Limit results to 20 rows unless the user asks for more
- Always ORDER BY something meaningful (usually transaction_date DESC or amount ASC)
- Column aliases must be simple lowercase words matching the placeholder in answer_template exactly

Return this exact JSON shape:
{
  "sql": "<parameterized SQL using $1 for user_id, $2+ for other params>",
  "params": [<additional params after user_id — do NOT include user_id here>],
  "answer_template": "<use {column_alias} placeholders that exactly match your SELECT aliases, e.g. 'You spent {spent} on food in January'>",
  "empty_message": "<message if query returns no rows, e.g. 'No food transactions found'>"
}

${SCHEMA_CONTEXT}
`.trim();

export type GeminiQueryResult = {
    sql: string;
    params: any[];
    answer_template: string;
    empty_message: string;
};

/**
 * Ask Gemini to generate a SQL query for a user's financial question.
 * Includes the last N messages of chat history for conversational context.
 */
export async function generateFinancialQuery(
    question: string,
    chatHistory: { speaker_type: string; message_content: string }[]
): Promise<GeminiQueryResult> {
    // Build conversation context from last 10 messages
    const historyContext = chatHistory.length > 0
        ? "Recent conversation:\n" + chatHistory
            .map(m => `${m.speaker_type === "user" ? "User" : "Assistant"}: ${m.message_content}`)
            .join("\n") + "\n\n"
        : "";

    const userMessage = `${historyContext}User question: ${question}`;

    const raw = await callGemini(CHAT_SYSTEM_PROMPT, userMessage);

    // Strip any accidental markdown code fences
    const cleaned = raw.replace(/```json|```/g, "").trim();

    try {
        const parsed = JSON.parse(cleaned) as GeminiQueryResult;

        // Safety check — never allow non-SELECT queries
        const sqlUpper = parsed.sql.trim().toUpperCase();
        if (!sqlUpper.startsWith("SELECT")) {
            throw new Error("Gemini generated a non-SELECT query — rejected for safety");
        }

        return parsed;
    } catch (err) {
        throw new Error(`Failed to parse Gemini response as JSON: ${raw}`);
    }
}

/**
 * Format raw query results into a human-readable answer using the template.
 * Handles common result shapes: single aggregate, list of rows, empty.
 */
export function formatQueryAnswer(
    rows: any[],
    answerTemplate: string,
    emptyMessage: string
): string {
    if (rows.length === 0) return emptyMessage;

    // Single row with a single value (e.g. SUM, COUNT)
    if (rows.length === 1) {
        const row = rows[0];
        const keys = Object.keys(row);

        let answer = answerTemplate;
        for (const key of keys) {
            let value = row[key];

            // Format numbers as currency if they look like amounts
            if (typeof value === "string" && !isNaN(Number(value))) {
                const num = Number(value);
                if (key.includes("amount") || key.includes("total") || key.includes("balance") || key.includes("spent") || key.includes("income") || key.includes("expense")) {
                    value = `$${Math.abs(num).toFixed(2)}`;
                }
            }

            answer = answer.replace(`{${key}}`, String(value ?? "N/A"));
        }

        // If the template still has unreplaced placeholders, fall back to a
        // plain description of the first row's values
        if (answer.includes("{")) {
            answer = keys.map(k => {
                const v = row[k];
                const num = Number(v);
                if (!isNaN(num) && v !== null) return `$${Math.abs(num).toFixed(2)}`;
                return String(v ?? "N/A");
            }).join(", ");
        }

        return answer;
    }

    // Multiple rows — build a list
    return rows.map((row, i) => {
        const parts = Object.entries(row).map(([k, v]) => {
            const num = Number(v);
            if (!isNaN(num) && v !== null && (k.includes("amount") || k.includes("total") || k.includes("spent"))) {
                return `$${Math.abs(num).toFixed(2)}`;
            }
            return String(v ?? "N/A");
        });
        return `${i + 1}. ${parts.join(" — ")}`;
    }).join("\n");
}

// ─────────────────────────────────────────────────────────────────────────────
// Job 2 — Batch transaction classifier
// ─────────────────────────────────────────────────────────────────────────────

export type ClassificationResult = {
    description: string;
    merchant: string;
    category: string;
    subcategory: string;
    confidence: number;
};

const CLASSIFIER_SYSTEM_PROMPT = `
You are a transaction classifier for a personal finance app.

You will receive a JSON array of raw bank transaction descriptions.
For each one, return a classification with merchant name, category, subcategory, and confidence.

Valid category/subcategory pairs:
food: fast_food, dining_out, food_delivery, groceries, bakery, coffee, alcohol
transport: fuel, rideshare, parking, public_transport, car_payment, car_insurance, car_maintenance, transportation
shopping: shopping, clothing, electronics, home_goods, home_maintenance, personal_care
entertainment: streaming, music, video_games, entertainment, events
subscriptions: software, cloud_services, subscriptions
health: pharmacy, healthcare, fitness
travel: lodging, flights, travel
income: salary, interest, income
transfers: transfers
bills: insurance, utilities, rent, mortgage, phone, internet, fees, taxes
education: education, books
pets: pets
giving: donations, gifts
misc: misc

Rules:
- merchant should be a clean, recognizable name (e.g. "Starbucks" not "STARBUCKS #1234 123-456-7890")
- confidence should be 0.0-1.0 based on how certain you are
- if truly unrecognizable, use merchant "Unknown", category "misc", subcategory "misc", confidence 0.1
- Return ONLY a valid JSON array — no markdown, no backticks, no explanation

Return this exact shape:
[
  {
    "description": "<original description>",
    "merchant": "<clean merchant name>",
    "category": "<category>",
    "subcategory": "<subcategory>",
    "confidence": <number>
  }
]
`.trim();

/**
 * Classify a batch of unrecognized transaction descriptions using Gemini.
 * Called after the rule engine fails (confidence = 0) for a set of transactions.
 */
export async function classifyTransactions(
    descriptions: string[]
): Promise<ClassificationResult[]> {
    if (descriptions.length === 0) return [];

    const userMessage = JSON.stringify(descriptions);
    const raw = await callGemini(CLASSIFIER_SYSTEM_PROMPT, userMessage);
    const cleaned = raw.replace(/```json|```/g, "").trim();

    try {
        const results = JSON.parse(cleaned) as ClassificationResult[];
        return results;
    } catch (err) {
        console.error("[classifyTransactions] Failed to parse Gemini response:", raw);
        // Return empty so the caller can fall back to misc gracefully
        return [];
    }
}