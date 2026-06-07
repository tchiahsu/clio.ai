import { Router } from "express";
import {
    getMerchantsList,
    updateMerchantName,
    getMerchantsHistory,
} from "./controller.js";

export const merchantsRouter = Router();

merchantsRouter.get("/", getMerchantsList);
merchantsRouter.patch("/", updateMerchantName);
merchantsRouter.get("/history", getMerchantsHistory);
