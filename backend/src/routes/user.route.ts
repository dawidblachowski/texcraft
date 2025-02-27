import { UserController } from "../controllers/user.controller";
import { isAuthenticated } from "../middlewares/isAuthenticated";
import { Router } from "express";

const router = Router();

router.get("/profile", isAuthenticated, UserController.getProfile);

export default router;