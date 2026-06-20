import type { CookieOptions } from "express";

// HTTPS-only cookies in production (Render serves over HTTPS); plain HTTP locally
// so dev still works. Override explicitly with COOKIE_SECURE=true|false.
const secure =
    process.env.COOKIE_SECURE != null
        ? process.env.COOKIE_SECURE === "true"
        : process.env.NODE_ENV === "production";

export function getSessionCookies() : CookieOptions{
    return {
        httpOnly: true, // prevents use of JavaScript injections (hacking)
        secure, // require HTTPS in production
        // 'lax' is correct because the frontend reaches the API same-origin via
        // the static-site /api rewrite, so requests are not cross-site.
        sameSite: "lax", // send cookies between allowed sites
        path: "/", // make cookie available in all routes
        maxAge: 1000 * 60 * 60 * 5, // cookies expire after 5 hours
    };
}