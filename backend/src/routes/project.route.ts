import { Router } from "express";
import { ProjectController } from "../controllers/project.controller";
import { isAuthenticated } from "../middlewares/isAuthenticated";
import { upload, handleUploadErrors } from "../middlewares/upload";

const router = Router();

router.get("/shared/", isAuthenticated, ProjectController.getSharedProjects);
router.post("/share/:projectId/:userEmail", isAuthenticated, ProjectController.shareProject);
router.delete("/share/:projectId/:userEmail", isAuthenticated, ProjectController.unshareProject);
router.get("/archive", isAuthenticated, ProjectController.getArchivedProjects);
router.get("/my", isAuthenticated, ProjectController.getMyProjects);
router.get("/", isAuthenticated, ProjectController.getProjects);
router.post("/", isAuthenticated, ProjectController.createProject);

router.post("/:id/files/tex", isAuthenticated, ProjectController.createTexFile);
router.post("/:id/files/upload", isAuthenticated, upload, handleUploadErrors, ProjectController.uploadFile);
router.put("/:id/files/move", isAuthenticated, ProjectController.moveFile);
router.get("/:id/files/structure", isAuthenticated, ProjectController.getFilesStructure);
router.get("/:id/files/:fileId/content", isAuthenticated, ProjectController.getFileContent);
router.delete("/:id/files/:fileId", isAuthenticated, ProjectController.removeFile);
router.get("/:id/files/:fileId", isAuthenticated, ProjectController.getFile);


router.post("/:id/directories", isAuthenticated, ProjectController.createDirectory);
router.get("/:id/pdf", isAuthenticated, ProjectController.getPdf);

router.get("/:id", isAuthenticated, ProjectController.getProject);
router.put("/:id", isAuthenticated, ProjectController.updateProject);
router.delete("/:id", isAuthenticated, ProjectController.deleteProject);

export default router;