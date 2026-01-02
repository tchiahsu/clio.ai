import { Router } from "express";
import {
  postStatementUpload,
  getStatementList,
  getStatementStatus,
  deleteStatement
} from "./controller.js";

export const statementRouter = Router();

/**
 * POST /statements/
 * triggered when user uploads a bank statement
 */
statementRouter.post("/", postStatementUpload);

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