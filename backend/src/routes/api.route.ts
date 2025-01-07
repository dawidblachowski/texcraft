import { Router } from "express";
import AuthRouter from "./auth.route";
import UserRouter from "./user.route";  
import ProjectRouter from "./project.route";

const router = Router();

router.use("/auth", AuthRouter);
router.use("/user", UserRouter);
router.use("/project", ProjectRouter);

export default router;