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
import {
    sqlGetUnclassifiedTransactions,
    sqlUpdateTransactionClassification,
} from "./sql.js";
import { classifyTransactions } from "../../gemini/gemini.js";

// pdf-parse ESM exports the function differently across versions.
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
 * Stages:
 *   queued → processing → parsed → complete
 *                              ↘ failed
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
                let merchantId: number | null = null;
                if (tx.merchant) {
                    merchantId = await sqlAddMerchant(pool, tx.merchant);
                }

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

        // ── 9. Batch classify unrecognized transactions (Job 2) ──────────────
        // Runs AFTER the statement is marked complete so the user can see their
        // data immediately. Unclassified rows get updated in the background.
        // This is fire-and-forget — failures are logged but don't affect status.
        batchClassify(statementId, userId).catch((err) => {
            console.error(`[batchClassify] Statement ${statementId} classification failed:`, err);
        });

    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[dataParsing] Statement ${statementId} failed:`, message);
        await sqlSetStatusFailed(pool, userId, statementId, message.slice(0, 128));
    } finally {
        fs.unlink(filePath, (err) => {
            if (err) console.error(`[dataParsing] Failed to delete file ${filePath}:`, err);
        });
    }
}

/**
 * Job 2 — Batch LLM classifier.
 *
 * After the rule engine runs, some transactions remain at confidence=0 (misc).
 * This function fetches those, sends their descriptions to Gemini in one call,
 * and updates the database with the classifications.
 *
 * Called after sqlSetStatusComplete so the user isn't waiting for this.
 */
async function batchClassify(statementId: number, userId: number): Promise<void> {
    const unclassified = await sqlGetUnclassifiedTransactions(pool, statementId, userId);

    if (unclassified.length === 0) {
        console.log(`[batchClassify] Statement ${statementId}: no unclassified transactions.`);
        return;
    }

    console.log(
        `[batchClassify] Statement ${statementId}: classifying ${unclassified.length} transactions.`
    );

    const descriptions = unclassified.map(t => t.description);
    const classifications = await classifyTransactions(descriptions);

    if (classifications.length === 0) {
        console.log(`[batchClassify] Statement ${statementId}: Gemini returned no classifications.`);
        return;
    }

    let updated = 0;

    for (const result of classifications) {
        // Find the matching transaction by description
        const tx = unclassified.find(t => t.description === result.description);
        if (!tx) continue;

        // Skip if Gemini returned misc with low confidence — not worth updating
        if (result.category === "misc" && result.confidence <= 0.3) continue;

        try {
            // Upsert merchant
            let merchantId: number | null = null;
            if (result.merchant && result.merchant !== "Unknown") {
                merchantId = await sqlAddMerchant(pool, result.merchant);
            }

            // Upsert category
            let categoryId: number | null = null;
            if (result.category && result.subcategory) {
                const categoryRows = await sqlAddNewCategory(
                    pool,
                    userId,
                    result.category,
                    result.subcategory
                );
                categoryId = categoryRows[0]?.category_id ?? null;
            }

            await sqlUpdateTransactionClassification(
                pool,
                tx.transaction_id,
                userId,
                merchantId,
                categoryId,
                result.confidence
            );

            updated++;
        } catch (err) {
            console.error(
                `[batchClassify] Failed to update transaction ${tx.transaction_id}:`,
                err instanceof Error ? err.message : err
            );
        }
    }

    console.log(
        `[batchClassify] Statement ${statementId}: updated ${updated}/${unclassified.length} transactions.`
    );
}