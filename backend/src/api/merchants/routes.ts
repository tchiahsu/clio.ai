import { Router } from "express";
import {
    getMerchantsList,
    updateMerchantName,
    getMerchantsHistory
} from "./controller.js";

export const merchantsRouter = Router();


/**
 * GET /merchants/merchant
 * must provide _______ as param
 */
merchantsRouter.get("/merchant", getMerchantsList);

/**
 * GET /merchants/merchant
 * must provide _______ as param
 */
merchantsRouter.patch("/merchant/:id", updateMerchantName);

/**
 * GET /merchants/merchant
 * must provide _______ as param
 */
merchantsRouter.get("/merchant/:id", getMerchantsHistory);