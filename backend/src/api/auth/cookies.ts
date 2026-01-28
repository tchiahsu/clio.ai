import type { CookieOptions } from "express";

export function getSessionCookies() : CookieOptions{
    return {
        httpOnly: true, // prevents use of JavaScript injections (hacking)
        secure: false, // send cookie without HTTPS, change to true later on 
        sameSite: "lax", // send cookies between allowed sites
        path: "/", // make cookie available in all routes 
        maxAge: 1000 * 60 * 60 * 5, // cookies expire after 5 hours 
    };
}