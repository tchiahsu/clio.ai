import type { Request, Response } from "express";
import pool from "../../database.js";
import {
    sqlMerchantsInfo,
    sqlMerchantNameUpdate,
    sqlMerchantTransactions,
} from "../merchants/sql.js";

/**
 * Gets the current merchandID (fake merchant id for now).
 * I tell TS that request has extra properties for merchant.
 */
function getMerchandId(req: Request): number {
    return (req as any).merchant?.merchantId ?? 1;
}

/**
 * Gets the current userId (fake user id for now).
 * I tell TS that request has extra properties for user.
 */
function getUserId(req: Request): number {
    return (req as any).user?.userId ?? 1;
}

/**
 * Gets all the merchants information
 */
export async function getMerchantsList(req: Request, res: Response) {
    try {
        const userId = getUserId(req);

        const data = await sqlMerchantsInfo(pool, userId);
        res.json({data})
    } catch (err) {
        console.error("getMerchantsInfo error:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

/**
 * Updates the name of the merchant with the name provided
 */
export async function updateMerchantName(req: Request, res: Response) {
    try {
        const merchantId = getMerchandId(req);
        const newMerchantName = req.body.newMerchantName;
        const userId = getUserId(req);

        if (!merchantId) return res.status(400).json({ error: "merchandId not found" });
        if (!newMerchantName) return res.status(400).json({ error: "new merchant name not found" });
        
        const data = await sqlMerchantNameUpdate(pool, newMerchantName, merchantId, userId);
        res.json({ merchantId, newMerchantName})
    } catch (err) {
        console.error("updateMerchantName error:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

/**
 * Get the transaction history of a specific merchant 
 */
export async function getMerchantsHistory(req: Request, res: Response) {
    try {
        const merchantId = getMerchandId(req);
        const userId = getUserId(req);

        if (!merchantId) return res.status(400).json({ error: "merchandId not found" });  

        const data = await sqlMerchantTransactions(pool, merchantId, userId);
        res.json({merchantId, data })
    } catch (err) {
        console.error("getMerchantsInfo error:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}