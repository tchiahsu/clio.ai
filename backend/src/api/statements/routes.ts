import { Router } from "express";
import multer from "multer";
import path from "path";
import {
    postStatementUpload,
    getStatementList,
    getStatementStatus,
    deleteStatement,
} from "./controller.js";

// Store uploaded PDFs in /uploads, preserving the original extension.
// multer is only needed on the upload route — all others are JSON.
const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, "uploads/"),
    filename: (_req, file, cb) => {
        const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
        cb(null, `${unique}${path.extname(file.originalname)}`);
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB max
    fileFilter: (_req, file, cb) => {
        if (file.mimetype === "application/pdf") {
            cb(null, true);
        } else {
            cb(new Error("Only PDF files are accepted"));
        }
    },
});

export const statementRouter = Router();

statementRouter.post("/upload", upload.single("file"), postStatementUpload);
statementRouter.get("/list", getStatementList);
statementRouter.get("/status", getStatementStatus);
statementRouter.delete("/", deleteStatement);