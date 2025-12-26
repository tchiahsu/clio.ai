import express from "express";
import { dashboardRouter } from "./api/dashboard/routes.js";
import { merchantsRouter } from "./api/merchants/routes.js";
import { categoriesRouter } from "./api/categories/routes.js";

export const app = express();

// Reads raw request body, parses JSON and attaches it to request
app.use(express.json());

// To Assign a user id since we doing auth last, fake user basically
app.use((req, _res, next) => {
    (req as any).user = {userId: 1};
    next();
});

// Mount Routers
app.use("/dashboard", dashboardRouter);
app.use("/merchants", merchantsRouter);
app.use("/categories", categoriesRouter);

export default app