import { Request, Response, NextFunction } from "express";
import ProjectService from "@/services/project.service";
import path from 'path';
import sanitize from 'sanitize-filename';

const handleError = (error: unknown, res: Response) => {
    if (error instanceof Error) {
        res.status(400).json({ message: error.message });
    } else {
        res.status(400).json({ message: "An unknown error occurred" });
    }
};

export class ProjectController {
    static async getProjects(req: Request, res: Response, next: any) {
        /*     #swagger.tags = ['Project']
                #swagger.description = 'Get all projects'
        */
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const userId = req.user.id;
        try {
            const projects = await ProjectService.getAllProjects(userId);
            res.status(200).json(projects);
        } catch (error) {
            handleError(error, res);
        }
    }

    static async createProject(req: Request, res: Response, next: any): Promise<void> {
        /*     #swagger.tags = ['Project']
               #swagger.description = 'Create a new project'
       */
        const { title } = req.body;
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const userId = req.user.id;
        try {
            const project = await ProjectService.createProject({ title }, userId);
            res.status(201).json(project);
        } catch (error) {
            handleError(error, res);
        }
    }

    static async getProject(req: Request, res: Response, next: any) {
        /*     #swagger.tags = ['Project']
                #swagger.description = 'Get a project by id'
        */
        if (!req.user) { res.status(401).json({ message: "Unauthorized" }); return; }
        const userId = req.user.id;
        const projectId = req.params.id;

        try {
            const project = await ProjectService.getProjectIfUserHasRights(projectId, userId);
            if (!project) {
                res.status(404).json({ message: "Project not found" });
                return;
            }
            res.status(200).json(project);
        } catch (error) {
            handleError(error, res);
        }
    }

    static async updateProject(req: Request, res: Response, next: any) {
        /*     #swagger.tags = ['Project']
                #swagger.description = 'Update a project by id'
        */
        const { title, description, archived } = req.body;
        const projectId = req.params.id;
        if (!req.user) { res.status(401).json({ message: "Unauthorized" }); return; }
        const userId = req.user.id;

        try {
            const project = await ProjectService.updateProject(projectId, { title, description, archived }, userId);
            res.status(200).json(project);
        } catch (error) {
            handleError(error, res);
        }
    }

    static async deleteProject(req: Request, res: Response, next: any) {
        /*     #swagger.tags = ['Project']
                #swagger.description = 'Delete a project by id'
        */
        const projectId = req.params.id;
        if (!req.user) { res.status(401).json({ message: "Unauthorized" }); return; }
        const userId = req.user.id;

        try {
            await ProjectService.deleteProject(projectId, userId);
            res.status(204).json();
        } catch (error) {
            handleError(error, res);
        }
    }

    static async getSharedProjects(req: Request, res: Response, next: any) {
        /*     #swagger.tags = ['Project']
                #swagger.description = 'Get all projects shared with the authenticated user'
        */
        if (!req.user) { res.status(401).json({ message: "Unauthorized" }); return; }
        const userId = req.user.id;
        try {
            const projects = await ProjectService.getSharedProjects(userId);
            res.status(200).json(projects);
        } catch (error) {
            handleError(error, res);
        }
    }

    static async shareProject(req: Request, res: Response, next: any) {
        /*     #swagger.tags = ['Project']
                #swagger.description = 'Share a project with a user'
        */
        const projectId = req.params.projectId;
        const userEmail = req.params.userEmail;
        if (!req.user) { res.status(401).json({ message: "Unauthorized" }); return; }
        const userId = req.user.id;
        if (!projectId || !userEmail) {
            res.status(400).json({ message: "Invalid request" });
            return;
        }

        try {
            await ProjectService.shareProject(projectId, userEmail, userId);
            res.status(200).json();
        } catch (error) {
            handleError(error, res);
        }
    }

    static async unshareProject(req: Request, res: Response, next: any) {
        /*     #swagger.tags = ['Project']
                #swagger.description = 'Unshare a project with a user'
        */
        const projectId = req.params.projectId;
        const userEmail = req.params.userEmail;
        if (!req.user) { res.status(401).json({ message: "Unauthorized" }); return; }
        const userId = req.user.id;
        if (!projectId || !userEmail) {
            res.status(400).json({ message: "Invalid request" });
            return;
        }

        try {
            await ProjectService.unshareProject(projectId, userEmail, userId);
            res.status(200).json();
        } catch (error) {
            handleError(error, res);
        }
    }

    static async getMyProjects(req: Request, res: Response, next: NextFunction): Promise<void> {
        /*     #swagger.tags = ['Project']
                #swagger.description = 'Get all projects owned by the authenticated user'
        */
        if (!req.user) { res.status(401).json({ message: "Unauthorized" }); return; }
        const userId = req.user.id;
        try {
            const projects = await ProjectService.getOwnProjects(userId);
            res.status(200).json(projects);
        } catch (error) {
            handleError(error, res);
        }
    }

    static async getArchivedProjects(req: Request, res: Response, next: any) {
        /*     #swagger.tags = ['Project']
                #swagger.description = 'Get all archived projects'
        */
        if (!req.user) { res.status(401).json({ message: "Unauthorized" }); return; }
        const userId = req.user.id;
        try {
            const projects = await ProjectService.getArchivedProjects(userId);
            res.status(200).json(projects);
        } catch (error) {
            handleError(error, res);
        }
    }

    static async createTexFile(req: Request, res: Response, next: any) {
        /*     #swagger.tags = ['ProjectFile']
                #swagger.description = 'Create a new text file in a project'
        */
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const userId = req.user.id;
        const projectId = req.params.id;

        let fileName, parentId;
        try {
            fileName = sanitize(req.body.fileName);
            parentId = req.body.parentId || null;
        } catch (error) {
            res.status(400).json({ message: "Invalid file name or parent ID" });
            return;
        }

        try {
            const file = await ProjectService.createTexFile(projectId, fileName, parentId, userId);
            res.status(201).json(file);
        } catch (error) {
            handleError(error, res);
        }
    }

    static async uploadFile(req: Request, res: Response, next: any) {
        /*     #swagger.tags = ['ProjectFile']
                #swagger.description = 'Upload a file to a project'
        */
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const userId = req.user.id;
        const projectId = req.params.id;
        if (!req.file) {
            res.status(400).json({ message: "No file uploaded" });
            return;
        }
        const fileName = sanitize(req.file.originalname);
        const parentId = req.body.parentId || null;

        try {
            const file = await ProjectService.uploadFile(projectId, parentId, fileName, userId);
            res.status(201).json(file);
        } catch (error) {
            handleError(error, res);
        }
    }

    static async getFilesStructure(req: Request, res: Response, next: any) {
        /*     #swagger.tags = ['ProjectFile']
                #swagger.description = 'Get the file structure of a project'
        */
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const userId = req.user.id;
        const projectId = req.params.id;
        try {
            const structure = await ProjectService.getFilesStructure(projectId, userId);
            res.status(200).json(structure);
        } catch (error) {
            handleError(error, res);
        }
    }

    static async createFolder(req: Request, res: Response, next: any) {
        /*     #swagger.tags = ['ProjectFile']
                #swagger.description = 'Create a new folder in a project'
        */
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const userId = req.user.id;
        const projectId = req.params.id;

        let folderName, folderPath;
        try {
            folderName = sanitize(req.body.folderName);
            folderPath = sanitize(req.body.folderPath || "");
        } catch (error) {
            res.status(400).json({ message: "Invalid folder name or path" });
            return;
        }

        if (folderPath.includes('..')) {
            res.status(400).json({ message: "Nieprawidłowa ścieżka folderu" });
            return;
        }

        try {
            await ProjectService.createDirectory(projectId, folderName, folderPath, userId);
            res.status(201).json({ message: "Folder utworzony" });
        } catch (error) {
            handleError(error, res);
        }
    }

    static async createDirectory(req: Request, res: Response, next: any) {
        /*     #swagger.tags = ['ProjectFile']
                #swagger.description = 'Create a new directory in a project'
        */
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const userId = req.user.id;
        const projectId = req.params.id;

        let directoryName, parentId;
        try {
            directoryName = sanitize(req.body.directoryName);
            parentId = req.body.parentId || null;
        } catch (error) {
            res.status(400).json({ message: "Invalid directory name or parent ID" });
            return;
        }

        try {
            await ProjectService.createDirectory(projectId, directoryName, parentId, userId);
            res.status(201).json({ message: "Katalog utworzony" });
        } catch (error) {
            handleError(error, res);
        }
    }

}