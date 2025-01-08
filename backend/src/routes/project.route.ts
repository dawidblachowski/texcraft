import { Router } from "express";
import { ProjectController } from "@/controllers/project.controller";
import { isAuthenticated } from "@/middlewares/isAuthenticated";
import { upload } from "@/middlewares/upload";

const router = Router();

router.get("/shared/", isAuthenticated, ProjectController.getSharedProjects);
router.post("/share/:projectId/:userEmail", isAuthenticated, ProjectController.shareProject);
router.delete("/share/:projectId/:userEmail", isAuthenticated, ProjectController.unshareProject);
router.get("/archive", isAuthenticated, ProjectController.getArchivedProjects);
router.get("/my", isAuthenticated, ProjectController.getMyProjects);
router.get("/", isAuthenticated, ProjectController.getProjects);
router.post("/", isAuthenticated, ProjectController.createProject);

router.post("/:id/files/tex", isAuthenticated, ProjectController.createTexFile);
router.post("/:id/files/upload", isAuthenticated, upload.single('file'), ProjectController.uploadFile);
router.get("/:id/files/structure", isAuthenticated, ProjectController.getFilesStructure);

router.get("/:id", isAuthenticated, ProjectController.getProject);
router.put("/:id", isAuthenticated, ProjectController.updateProject);
router.delete("/:id", isAuthenticated, ProjectController.deleteProject);


export default router;