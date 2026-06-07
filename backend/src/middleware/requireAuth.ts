
import type { Request, Response, NextFunction } from "express";
import { getSession } from "../api/auth/sessionStore.js";
 
/**
 * Express middleware that validates the session cookie and attaches
 * the authenticated user to req.user.
 *
 * Mount this on any router (or individual route) that requires authentication.
 * Unauthenticated requests are rejected with 401 before reaching the handler.
 *
 * Usage:
 *   router.use(requireAuth);              // protect the whole router
 *   router.get("/route", requireAuth, handler);  // protect one route
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
    const sessionId = req.cookies?.session as string | undefined;
    const session = getSession(sessionId);
 
    if (!session) {
        res.status(401).json({ error: "Unauthorized — please log in" });
        return;
    }
 
    // Attach user info so downstream handlers can read it via getUserId(req)
    (req as any).user = { userId: session.userId };
    next();
}
