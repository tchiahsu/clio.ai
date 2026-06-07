import type { Request, Response } from "express";
import { createHash } from "crypto";
import {
    sqlStatementList,
    sqlStatementStatus,
    sqlDeleteStatement,
    sqlAddStatement,
    sqlValidateStatement,
} from "./sql.js";
import fs from "fs";
import pool from "../../database.js";
import { getUserId, toInt } from "../utils.js";
import { dataParsing } from "../data-parsing/data-parsing.js";
 
/**
 * Hash a file by streaming it through SHA-256.
 * Returns a 64-character hex digest.
 */
function hashFile(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const hash = createHash("sha256");
        const stream = fs.createReadStream(filePath);
        stream.on("error", reject);
        stream.on("data", (chunk) => hash.update(chunk));
        stream.on("end", () => resolve(hash.digest("hex")));
    });
}
 
/**
 * POST /statement/upload
 * Accepts a PDF via multipart/form-data (multer must be wired on the router).
 * Deduplicates by SHA-256 hash, inserts a statements row, and triggers parsing.
 */
export async function postStatementUpload(req: Request, res: Response) {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }
 
        const userId = getUserId(req);
        const filePath = req.file.path;
        const fileName = req.file.filename;
 
        // Reject duplicates before doing any DB work
        const fileHash = await hashFile(filePath);
        const exists = await sqlValidateStatement(pool, userId, fileHash);
        if (exists && exists.length > 0) {
            return res.status(409).json({ error: "You have already added this bank statement" });
        }
 
        // Insert the statement row (status defaults to 'queued')
        const newStatement = await sqlAddStatement(pool, userId, fileName, fileHash);
        const statementId: number = newStatement.statement_id;
 
        // Kick off the async parsing pipeline.
        // We intentionally do NOT await — the client polls /statement/status.
        dataParsing(statementId, filePath, userId).catch((err) => {
            console.error(`Parsing pipeline failed for statement ${statementId}:`, err);
        });
 
        return res.status(202).json({ statementId, status: "processing" });
    } catch (err) {
        console.error("postStatementUpload error:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}
 
/**
 * GET /statement/list?limit=N
 */
export async function getStatementList(req: Request, res: Response) {
    try {
        const userId = getUserId(req);
        const limit = toInt(req.query.limit);
 
        if (limit != null && limit < 0) {
            return res.status(400).json({ error: "limit must be >= 0" });
        }
 
        const data = await sqlStatementList(pool, userId, limit);
        res.json({ data, limit: limit ?? null });
    } catch (err) {
        console.error("getStatementList error:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}
 
/**
 * GET /statement/status?statementId=N
 */
export async function getStatementStatus(req: Request, res: Response) {
    try {
        const userId = getUserId(req);
        const statementId = toInt(req.query.statementId);
 
        if (!statementId || statementId <= 0) {
            return res.status(400).json({ error: "statementId not found" });
        }
 
        const data = await sqlStatementStatus(pool, userId, statementId);
 
        if (!data) return res.status(404).json({ error: "Statement not found" });
 
        res.json({ statementId, data });
    } catch (err) {
        console.error("getStatementStatus error:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}
 
/**
 * DELETE /statement?statementId=N
 */
export async function deleteStatement(req: Request, res: Response) {
    try {
        const userId = getUserId(req);
        const statementId = toInt(req.query.statementId);
 
        if (!statementId) return res.status(400).json({ error: "statementId not found" });
 
        const data = await sqlDeleteStatement(pool, userId, statementId);
 
        if (!data) return res.status(404).json({ error: "Statement not found" });
 
        res.json({ data });
    } catch (err) {
        console.error("deleteStatement error:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}
