import { Router } from "express";
import {
    getMerchantsList,
    updateMerchantName,
    getMerchantsHistory
} from "./controller.js";

export const merchantsRouter = Router();


/**
 * GET /merchants/merchant
 * no param required
 */
merchantsRouter.get("/merchant", getMerchantsList);

/**
 * GET /merchants/merchant
 * must provide newMerchantName and merchantId as params
 */
merchantsRouter.patch("/merchant/:id", updateMerchantName);

/**
 * GET /merchants/merchant
 * must provide merchantId as param
 */
merchantsRouter.get("/merchant/:id", getMerchantsHistory);