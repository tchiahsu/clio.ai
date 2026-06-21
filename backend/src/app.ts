import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { dashboardRouter } from "./api/dashboard/routes.js";
import { transactionRouter } from "./api/transactions/routes.js";
import { merchantsRouter } from "./api/merchants/routes.js";
import { categoriesRouter } from "./api/categories/routes.js";
import { accountRouter } from "./api/accounts/routes.js";
import { chatRouter } from "./api/chat/routes.js";
import { statementRouter } from "./api/statements/routes.js";
import authRouter from "./api/auth/routes.js";
import { budgetRouter } from "./api/budgets/routes.js";
import { goalRouter } from "./api/goals/routes.js";
import { requireAuth } from "./middleware/requireAuth.js";

export const app = express();

// Render (and most hosts) put a reverse proxy in front of the app, so requests
// arrive with an X-Forwarded-For header. Trust the first proxy hop so Express
// derives the real client IP — required for express-rate-limit to work and to
// avoid ERR_ERL_UNEXPECTED_X_FORWARDED_FOR. A specific hop count (1) is used
// rather than `true`, which rate-limit flags as overly permissive (spoofable).
app.set("trust proxy", 1);

app.use(express.json());
app.use(cookieParser());
 
// CORS origin is env-driven so the same build works in dev and production.
// In dev, set CORS_ORIGIN=http://localhost:5173 in your .env file.
const corsOrigin = process.env.CORS_ORIGIN ?? "http://localhost:5173";
 
app.use(
    cors({
        origin: corsOrigin,
        credentials: true,
    })
);
 
// Health check — public, lightweight, used by the host's uptime probe.
app.get("/health", (_req, res) => res.json({ ok: true }));

// All API routes live under /api so they don't collide with the static frontend
// served below. The frontend already calls /api/... paths, and in dev Vite
// proxies /api to this server (see frontend/vite.config.ts).
// Public routes — no session required
app.use("/api/auth", authRouter);

// Protected routes — requireAuth middleware gates every handler below this line.
app.use("/api/dashboard", requireAuth, dashboardRouter);
app.use("/api/transaction", requireAuth, transactionRouter);
app.use("/api/merchants", requireAuth, merchantsRouter);
app.use("/api/categories", requireAuth, categoriesRouter);
app.use("/api/accounts", requireAuth, accountRouter);
app.use("/api/chat", requireAuth, chatRouter);
app.use("/api/statement", requireAuth, statementRouter);
app.use("/api/budgets", requireAuth, budgetRouter);
app.use("/api/goals", requireAuth, goalRouter);

// Serve the built frontend from the same origin (single-service deploy). This
// only activates when the build exists, so local dev — where Vite serves the
// frontend on its own port — is unaffected. Registered after the API routes so
// /api/* and /health always win.
const dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendDist = path.resolve(dirname, "../../frontend/dist");
if (fs.existsSync(frontendDist)) {
    app.use(express.static(frontendDist));
    // SPA fallback: any non-API GET returns index.html so client-side routes
    // (e.g. /dashboard) resolve on refresh and deep links.
    app.use((req, res, next) => {
        if (req.method !== "GET" || req.path.startsWith("/api")) return next();
        res.sendFile(path.join(frontendDist, "index.html"));
    });
}

export default app;