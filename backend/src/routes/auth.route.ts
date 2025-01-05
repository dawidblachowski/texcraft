import { Router } from "express";
import AuthController from "@/controllers/auth.controller";
import cookieParser from "cookie-parser";

const router = Router();

router.use(cookieParser());

router.post("/register", AuthController.register);
router.post("/login", AuthController.localLogin);
router.post("/refresh", AuthController.refreshTokens);

export default router;