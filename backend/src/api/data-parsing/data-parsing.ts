import fs from "fs";
import * as pdfParseModule from "pdf-parse";
import pool from "../../database.js";
import extractAccountInfo from "./extract-account.js";
import extractTransactions from "./extract-transactions.js";
import { sqlAddMerchant } from "../merchants/sql.js";
import { sqlAddNewCategory } from "../categories/sql.js";
import { sqlAddTransaction } from "../transactions/sql.js";
import {
    sqlSetStatusProcessing,
    sqlUpdateStatement,
    sqlSetStatusFailed,
    sqlSetStatusComplete,
} from "../statements/sql.js";
import { sqlAddAccount } from "../accounts/sql.js";
import { sqlUpsertStatementSummary } from "./sql.js";

// pdf-parse ESM exports the function differently across versions.
// This handles both: a direct callable module and a { default } shape.
const pdfParse: (buf: Buffer) => Promise<{ text: string }> =
    (pdfParseModule as any).default ?? (pdfParseModule as any);

async function pdfToText(filePath: string): Promise<string> {
    const buffer = fs.readFileSync(filePath);
    const result = await pdfParse(buffer);
    return result.text;
}

/**
 * The main PDF → database pipeline.
 *
 * Called asynchronously from the upload endpoint (fire-and-forget).
 * Updates statement status at each stage so the client can poll /statement/status.
 *
 * Stages:
 *   queued → processing → parsed → complete
 *                              ↘ failed  (on any unhandled error)
 */
export async function dataParsing(
    statementId: number,
    filePath: string,
    userId: number
): Promise<void> {
    await sqlSetStatusProcessing(pool, userId, statementId);

    try {
        // ── 1. Extract raw text from PDF ────────────────────────────────────
        const text = await pdfToText(filePath);

        // ── 2. Extract account metadata ─────────────────────────────────────
        const accountInfo = extractAccountInfo(text);

        if (!accountInfo.bank_name || !accountInfo.account_num) {
            throw new Error("Could not extract bank name or account number from statement");
        }
        if (!accountInfo.period_start || !accountInfo.period_end) {
            throw new Error("Could not extract statement period from statement");
        }

        // ── 3. Upsert account row ────────────────────────────────────────────
        const account = await sqlAddAccount(
            pool,
            userId,
            accountInfo.bank_name,
            accountInfo.account_num,
            "checking"
        );
        const accountId: number = account.account_id;

        // ── 4. Update statement with parsed metadata ─────────────────────────
        await sqlUpdateStatement(
            pool,
            userId,
            statementId,
            accountId,
            accountInfo.period_start,
            accountInfo.period_end
        );

        // ── 5. Extract transactions ──────────────────────────────────────────
        const transactions = extractTransactions(text);

        if (!transactions) {
            throw new Error("Transaction extraction returned null — statement format may not be supported");
        }

        let totalIncome = 0;
        let totalExpenses = 0;
        let imported = 0;
        let skipped = 0;

        // ── 6. Persist each transaction ──────────────────────────────────────
        for (const tx of transactions) {
            if (!tx.date || tx.amount === undefined) {
                skipped++;
                continue;
            }

            try {
                // Upsert merchant (global table — canonical name)
                let merchantId: number | null = null;
                if (tx.merchant) {
                    merchantId = await sqlAddMerchant(pool, tx.merchant);
                }

                // Upsert category (per-user table)
                let categoryId: number | null = null;
                if (tx.category && tx.subcategory) {
                    const categoryRows = await sqlAddNewCategory(
                        pool,
                        userId,
                        tx.category,
                        tx.subcategory
                    );
                    categoryId = categoryRows[0]?.category_id ?? null;
                }

                await sqlAddTransaction(
                    pool,
                    userId,
                    accountId,
                    statementId,
                    tx.date,
                    tx.raw ?? tx.date,
                    tx.amount,
                    merchantId,
                    categoryId,
                    tx.confidence ?? 0
                );

                if (tx.amount > 0) totalIncome += tx.amount;
                else totalExpenses += Math.abs(tx.amount);

                imported++;
            } catch (txErr) {
                // Log the bad row and continue — one bad transaction should
                // never abort the entire statement import.
                skipped++;
                console.error(
                    `[dataParsing] Statement ${statementId}: skipped transaction on ${tx.date} (${tx.raw}):`,
                    txErr instanceof Error ? txErr.message : txErr
                );
            }
        }

        // ── 7. Write statement summary ───────────────────────────────────────
        await sqlUpsertStatementSummary(pool, statementId, totalIncome, totalExpenses);

        // ── 8. Mark complete ─────────────────────────────────────────────────
        await sqlSetStatusComplete(pool, userId, statementId);

        console.log(
            `[dataParsing] Statement ${statementId}: ${imported} imported, ${skipped} skipped.`
        );
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[dataParsing] Statement ${statementId} failed:`, message);
        await sqlSetStatusFailed(pool, userId, statementId, message.slice(0, 128));
    } finally {
        // Remove the uploaded PDF from disk regardless of outcome.
        fs.unlink(filePath, (err) => {
            if (err) console.error(`[dataParsing] Failed to delete file ${filePath}:`, err);
        });
    }
}