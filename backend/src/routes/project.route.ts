import { Router } from "express";
import { ProjectController } from "@/controllers/project.controller";
import { isAuthenticated } from "@/middlewares/isAuthenticated";

const router = Router();

router.get("/", isAuthenticated, ProjectController.getProjects);
router.post("/", isAuthenticated, ProjectController.createProject);
router.get("/:id", isAuthenticated, ProjectController.getProject);
router.put("/:id", isAuthenticated, ProjectController.updateProject);
router.delete("/:id", isAuthenticated, ProjectController.deleteProject);
router.get("/shared/", isAuthenticated, ProjectController.getSharedProjects);
router.post("/share/:projectId/:userId", isAuthenticated, ProjectController.shareProject);
router.delete("/share/:projectId/:userId", isAuthenticated, ProjectController.unshareProject);
router.get("/shared/:userId", isAuthenticated, ProjectController.getSharedProjectsByUser);
router.get("/my", isAuthenticated, ProjectController.getMyProjects);


export default router;