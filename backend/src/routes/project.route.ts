import { Router } from "express";
import { ProjectController } from "@/controllers/project.controller";
import { isAuthenticated } from "@/middlewares/isAuthenticated";

const router = Router();

router.get("/shared/", isAuthenticated, ProjectController.getSharedProjects);
router.post("/share/:projectId/:userEmail", isAuthenticated, ProjectController.shareProject);
router.delete("/share/:projectId/:userEmail", isAuthenticated, ProjectController.unshareProject);
router.get("/archive", isAuthenticated, ProjectController.getArchivedProjects);
router.get("/my", isAuthenticated, ProjectController.getMyProjects);
router.get("/", isAuthenticated, ProjectController.getProjects);
router.post("/", isAuthenticated, ProjectController.createProject);
router.get("/:id", isAuthenticated, ProjectController.getProject);
router.put("/:id", isAuthenticated, ProjectController.updateProject);
router.delete("/:id", isAuthenticated, ProjectController.deleteProject);


export default router;