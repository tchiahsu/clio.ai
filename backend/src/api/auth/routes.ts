import { Router } from "express";
import rateLimit from "express-rate-limit";
import { postLogin, postLogout, postRegister, getMe } from "./controller.js";
import { requireAuth } from "../../middleware/requireAuth.js";
 
// Limit login and register to 10 attempts per 15 minutes per IP.
// Prevents brute force attacks on the demo accounts.
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many attempts, please try again in 15 minutes" },
});
 
const authRouter = Router();
 
authRouter.post("/login",    authLimiter, postLogin);
authRouter.post("/register", authLimiter, postRegister);
authRouter.post("/logout",   requireAuth, postLogout);
authRouter.get("/me",        requireAuth, getMe);
 
export default authRouter;