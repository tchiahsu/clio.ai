import { Router } from "express";
import { postLogin } from "./controller.js";

const router = Router();

router.post("/login", postLogin);

export default router;