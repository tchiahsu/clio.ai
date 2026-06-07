import type { Request, Response } from "express";
import pool from "../../database.js";
import { getUserId, toInt } from "../utils.js";
import {
    sqlMerchantsInfo,
    sqlUpsertMerchantOverride,
    sqlMerchantTransactions,
} from "./sql.js";

export async function getMerchantsList(req: Request, res: Response) {
    try {
        const userId = getUserId(req);
        const data = await sqlMerchantsInfo(pool, userId);
        res.json({ data });
    } catch (err) {
        console.error("getMerchantsList error:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

export async function updateMerchantName(req: Request, res: Response) {
    try {
        const userId = getUserId(req);
        const merchantId = toInt(req.body?.merchantId);
        const displayName = req.body?.displayName;

        if (!merchantId) return res.status(400).json({ error: "merchantId not found" });
        if (typeof displayName !== "string" || !displayName.trim()) {
            return res.status(400).json({ error: "displayName not found" });
        }

        const data = await sqlUpsertMerchantOverride(pool, userId, merchantId, displayName.trim());
        res.json({ merchantId, displayName: displayName.trim(), data });
    } catch (err) {
        console.error("updateMerchantName error:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

export async function getMerchantsHistory(req: Request, res: Response) {
    try {
        const userId = getUserId(req);
        const merchantId = toInt(req.query.merchantId);

        if (!merchantId) return res.status(400).json({ error: "merchantId not found" });

        const data = await sqlMerchantTransactions(pool, merchantId, userId);
        res.json({ merchantId, data });
    } catch (err) {
        console.error("getMerchantsHistory error:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}