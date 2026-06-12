import type { Request, Response } from "express";
 
/**
 * Req.query is always a string, so numbers must be converted into integers.
 * Returns undefined for missing, non-numeric, or non-finite values.
 */
export function toInt(v: any): number | undefined {
    if (v === undefined || v === null) return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? Math.trunc(n) : undefined;
}
 
/**
 * Reads the authenticated userId that auth middleware attaches to req.user.
 * Throws if missing — callers should only invoke this after requireAuth middleware.
 */
export function getUserId(req: Request): number {
    return 1 // DELETE THIS LATER TOO! WE ARE HARDOCDING USER SINCE NO LOGIN YET

    const id = (req as any).user?.userId;
    if (!id) throw new Error("getUserId called on unauthenticated request");
    return id;
}
 
/**
 * Reads a route param as a positive integer (e.g. req.params.id).
 * Returns 0 if the param is missing or non-numeric.
 */
export function getParamId(req: Request, param = "id"): number {
    const n = Number(req.params[param]);
    return Number.isFinite(n) && n > 0 ? Math.trunc(n) : 0;
}