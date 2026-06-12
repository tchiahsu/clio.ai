import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { dashboardRouter } from "./api/dashboard/routes.js";
import { transactionRouter } from "./api/transactions/routes.js";
import { merchantsRouter } from "./api/merchants/routes.js";
import { categoriesRouter } from "./api/categories/routes.js";
import { accountRouter } from "./api/accounts/routes.js";
import { chatRouter } from "./api/chat/routes.js";
import { statementRouter } from "./api/statements/routes.js";
import authRouter from "./api/auth/routes.js";
import { requireAuth } from "./middleware/requireAuth.js";

export const app = express();

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
 
// Public routes — no session required
app.use("/auth", authRouter);
 
// Protected routes — requireAuth middleware gates every handler below this line
// app.use("/dashboard", requireAuth, dashboardRouter);
// app.use("/transaction", requireAuth, transactionRouter);
// app.use("/merchants", requireAuth, merchantsRouter);
// app.use("/categories", requireAuth, categoriesRouter);
// app.use("/accounts", requireAuth, accountRouter);
// app.use("/chat", requireAuth, chatRouter);
// app.use("/statement", requireAuth, statementRouter);

// BYPASSING AUTH FOR DESIGN PURPOSES (DELETE THIS LATER!!!)
app.use("/dashboard", dashboardRouter);
app.use("/transaction", transactionRouter);
app.use("/merchants", merchantsRouter);
app.use("/categories", categoriesRouter);
app.use("/accounts", accountRouter);
app.use("/chat", chatRouter);
app.use("/statement", statementRouter);

export default app;