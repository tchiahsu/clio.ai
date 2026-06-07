import { Router } from "express";
import { postLogin, postLogout, postRegister } from "./controller.js";
import { requireAuth } from "../../middleware/requireAuth.js";
 
const authRouter = Router();
 
authRouter.post("/login", postLogin);
authRouter.post("/register", postRegister);
authRouter.post("/logout", requireAuth, postLogout);
 
export default authRouter;