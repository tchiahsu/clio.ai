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

export const app = express();

// Reads raw request body, parses JSON and attaches it to request
app.use(express.json());
// Parse cookies for auth 
app.use(cookieParser());

// Send cookies from the browser to the server 
// currently usingn local host, needs to be updated later 
app.use(
    cors({
        origin: "http://localhost:5173",
        credentials: true,
    })
);

// Mount Routers
app.use("/auth", authRouter);
app.use("/dashboard", dashboardRouter);
app.use("/transaction", transactionRouter);
app.use("/merchants", merchantsRouter);
app.use("/categories", categoriesRouter);
app.use("/accounts", accountRouter);
app.use("/chat", chatRouter);
app.use("/statement", statementRouter);

export default app;