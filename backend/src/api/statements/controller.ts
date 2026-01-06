import type { Request, Response } from "express";
import { createHash } from "crypto";
import {
  sqlStatementList,
  sqlStatementStatus,
  sqlDeleteStatement,
  sqlAddStatement,
  sqlValidateStatement
} from "../statements/sql.js";

import fs from "fs";
import pool from "../../database.js";
import dataParsing from "../data-parsing/data-parsing.js";

/**
 * Req.query is always a string, so number must be converted into integers.
 */
function toInt(v: any): number | undefined {
    if (v === undefined) return undefined;
    const n = Number(v);

    // Truncate number (round down) if its finite, else its undefined.
    return Number.isFinite(n) ? Math.trunc(n) : undefined;
}

/**
 * Gets the current userId (fake user id for now).
 * I tell TS that request has extra properties for user.
 */
function getUserId(req: Request): number {
    return (req as any).user?.userId ?? 1;
}

/**
 * Hash a file by path
 */
function hashFile(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = createHash("sha256");
    const stream = fs.createReadStream(filePath);

    stream.on("error", reject);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("end", () => resolve(hash.digest("hex")));
  })
}

/**
 * Initiates the upload logic by saving the file to disk, and triggering
 * the data parsing pipeline. Returns the status of the bank statemenet uploaded
 */
export async function postStatementUpload(req: Request, res: Response) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const userId = getUserId(req);
    const filePath = req.file.path;
    const fileName = req.file.filename;

    // Hash the file
    const fileHash = await hashFile(filePath);

    // Check sql to see if it exists
    const exists = await sqlValidateStatement(pool, userId, fileHash);
    if (exists && exists.length > 0) return res.status(409).json({ error: "You have already added this bank statement" });

    // Create a statement row
    const newStatement = await sqlAddStatement(pool, userId, fileName, fileHash);
    const statementId = newStatement.statement_id;

    // Trigger the pipeline
    // dataParsing(statementId, filePath);

    // Return
    return res.status(202).json({ statementId, status: "processing", });
  } catch (err) {
    console.error("Error uploading bank statement:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

/**
 * Get a list of bank statements for the user
 */
export async function getStatementList(req: Request, res: Response) {
  try {
    const userId = getUserId(req);
    const limit = toInt(req.query.limit);

    if (limit != null && limit < 0) return res.status(400).json({ error: "limit must be >= 0" });

    const data = await sqlStatementList(pool, userId, limit);
    res.json({ data, limit: limit ?? null });
  } catch (err) {
    console.error("Error getting the transaction list:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

/**
 * Get the processing status for the statement
 */
export async function getStatementStatus(req: Request, res: Response) {
  try {
    const userId = getUserId(req);
    const statementId = toInt(req.query.statementId);

    if (statementId == null || statementId <= 0) return res.status(400).json({ error: "statement id not found" });

    const data = await sqlStatementStatus(pool, userId, statementId);
    if (!data) {
      return res.status(404).json({ error: "statement not found" })
    }

    res.json({ statementId, data });
  } catch (err) {
    console.error("Error getting the transaction list:", err);
    return res.json({ error: "Internal Server Error" });
  }
}

/**
 * Delete the statement id and all its data
 */
export async function deleteStatement(req: Request, res: Response) {
  try {
    const userId = getUserId(req);
    const statementId = toInt(req.query.statementId);

    if (!statementId) return res.status(400).json({ error: "statement id not found" });

    const data = await sqlDeleteStatement(pool, userId, statementId);

    if (!data) return res.status(404).json({ error: "statement not found" });

    res.json({ data });
  } catch (err) {
    console.error("Error getting the transaction list:", err);
    return res.json({ error: "Internal Server Error" });
  }
}
