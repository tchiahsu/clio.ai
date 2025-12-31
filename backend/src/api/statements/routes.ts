import { Router } from "express";
import {
  getStatementList,
  getStatementStatus,
  deleteStatement
} from "./controller.js";

export const statementRouter = Router();

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