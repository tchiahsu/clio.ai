import { Router } from "express";
import {
  postStatementUpload,
  getStatementList,
  getStatementStatus,
  deleteStatement
} from "./controller.js";

import multer from "multer";

export const statementRouter = Router();
const upload = multer({ dest: "uploads/"})

/**
 * POST /statements/
 * triggered when user uploads a bank statement
 */
statementRouter.post("/", upload.single("bank_statement"), postStatementUpload);

/**
 * GET /statement/
 * must provide limit for the number of statements
 */
statementRouter.get("/", getStatementList);

/**
 * GET /statement/status
 * must provide userId and statementId as param
 */
statementRouter.get("/status", getStatementStatus);

/**
 * DELETE /statement/
 * must provide userId and statementId as param
 */
statementRouter.delete("/", deleteStatement);