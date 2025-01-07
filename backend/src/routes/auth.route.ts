import { Router } from "express";
import AuthController from "@/controllers/auth.controller";
import cookieParser from "cookie-parser";

const router = Router();

router.use(cookieParser());

//local
router.post("/register", AuthController.register);
router.post("/login", AuthController.localLogin);
router.post("/refresh", AuthController.refreshTokens);
router.post("/logout", AuthController.logout);

//oauth
router.get("/oauth2", AuthController.oauth2Login);
router.get("/oauth2/callback", AuthController.oauth2Callback);

export default router;