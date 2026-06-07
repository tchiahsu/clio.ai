import crypto from "crypto";
 
type Session = {
    userId: number;
    expiration: number; // Unix ms timestamp
};
 
const sessions = new Map<string, Session>();
 
// 5-hour session lifetime — must match cookie maxAge in cookies.ts
const SESSION_TTL_MS = 1000 * 60 * 60 * 5;
 
// Sweep expired sessions from memory every 15 minutes.
// Without this, long-running servers accumulate stale entries indefinitely.
const CLEANUP_INTERVAL_MS = 1000 * 60 * 15;
 
const cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [id, session] of sessions.entries()) {
        if (now > session.expiration) {
            sessions.delete(id);
        }
    }
}, CLEANUP_INTERVAL_MS);
 
// Allow the Node.js process to exit cleanly even if this interval is still active.
cleanupTimer.unref();
 
/**
 * Create a new session for the given user.
 * Returns the session ID to be stored in a cookie.
 */
export function createSession(userId: number): { sessionId: string; expiration: number } {
    const sessionId = crypto.randomBytes(24).toString("hex");
    const expiration = Date.now() + SESSION_TTL_MS;
    sessions.set(sessionId, { userId, expiration });
    return { sessionId, expiration };
}
 
/**
 * Look up a session by ID. Returns undefined if missing or expired.
 * Expired sessions are deleted on first access.
 */
export function getSession(sessionId: string | undefined): Session | undefined {
    if (!sessionId) return undefined;
 
    const session = sessions.get(sessionId);
    if (!session) return undefined;
 
    if (Date.now() > session.expiration) {
        sessions.delete(sessionId);
        return undefined;
    }
 
    return session;
}
 
/**
 * Invalidate a session immediately (logout, password change, etc.).
 */
export function deleteSession(sessionId: string | undefined): void {
    if (sessionId) sessions.delete(sessionId);
}