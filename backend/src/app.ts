import express from "express";
import { dashboardRouter } from "./api/dashboard/routes.js";

export const app = express();

// Reads raw request body, parses JSON and attaches it to request
app.use(express.json());

// To Assign a user id since we doing auth last, fake user basically
app.use((req, _res, next) => {
    (req as any).user = {userId: 1};
    next();
});

app.use((req, _res, next) => {
    console.log("INCOMING:", req.method, req.originalUrl);
    next();
})

// Mount Routers
app.use("/dashboard", dashboardRouter);

export default app