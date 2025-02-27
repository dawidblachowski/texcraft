import { Request, Response, NextFunction } from "express";
import ProjectService from "../services/project.service";
import path from 'path';
import fs from 'fs';
import sanitize from 'sanitize-filename';
import logger from "../config/logger";

const handleError = (error: unknown, res: Response) => {
    if (error instanceof Error) {
        logger.error(error.message);
        res.status(400).json({ message: error.message });
    } else {
        logger.error("An unknown error occurred");
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
        logger.info(`Fetching all projects for user: ${userId}`);
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
        logger.info(`Creating project for user: ${userId} with title: ${title}`);
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
        logger.info(`Fetching project: ${projectId} for user: ${userId}`);

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
        logger.info(`Updating project: ${projectId} for user: ${userId}`);

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
        logger.info(`Deleting project: ${projectId} for user: ${userId}`);

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
        logger.info(`Fetching shared projects for user: ${userId}`);
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
        logger.info(`Sharing project: ${projectId} with user: ${userEmail} by user: ${userId}`);

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
        logger.info(`Unsharing project: ${projectId} with user: ${userEmail} by user: ${userId}`);

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
        logger.info(`Fetching owned projects for user: ${userId}`);
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
        logger.info(`Fetching archived projects for user: ${userId}`);
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
        logger.info(`Creating text file: ${fileName} in project: ${projectId} by user: ${userId}`);

        try {
            const file = await ProjectService.createTexFile(projectId, fileName, parentId, userId);
            // Emit socket event
            if (req.io) {
                const files = await ProjectService.getFilesStructure(projectId, userId);
                req.io.to(`project:fileList:${projectId}`).emit('fileList', files);
                logger.info(`Emitting file list event for project: ${projectId} with files: ${JSON.stringify(files)}`);
            }
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
        logger.info(`Uploading file: ${fileName} to project: ${projectId} by user: ${userId}`);

        try {
            const file = await ProjectService.uploadFile(projectId, parentId, fileName, userId);
            // Emit socket event
            if (req.io) {
                const files = await ProjectService.getFilesStructure(projectId, userId);
                req.io.to(`project:fileList:${projectId}`).emit('fileList', files);
                logger.info(`Emitting file list event for project: ${projectId} with files: ${JSON.stringify(files)}`);
            }
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
        logger.info(`Fetching file structure for project: ${projectId} by user: ${userId}`);
        try {
            const structure = await ProjectService.getFilesStructure(projectId, userId);
            // Emit socket event
            if (req.io) {
                req.io.to(`project:fileList:${projectId}`).emit('fileList', structure);
                logger.info(`Emitting file list event for project: ${projectId} with files: ${JSON.stringify(structure)}`);
            }
            res.status(200).json(structure);
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
        logger.info(`Creating directory: ${directoryName} in project: ${projectId} by user: ${userId}`);

        try {
            await ProjectService.createDirectory(projectId, directoryName, parentId, userId);
            // Emit socket event
            if (req.io) {
                const files = await ProjectService.getFilesStructure(projectId, userId);
                req.io.to(`project:fileList:${projectId}`).emit('fileList', files);
                logger.info(`Emitting file list event for project: ${projectId} with files: ${JSON.stringify(files)}`);
            }
            res.status(201).json({ message: "Katalog utworzony" });
        } catch (error) {
            handleError(error, res);
        }
    }

    static async getPdf(req: Request, res: Response, next: any) {
        /*     #swagger.tags = ['ProjectFile']
                #swagger.description = 'Get a PDF file for a project'
        */
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const userId = req.user.id;
        const projectId = req.params.id;
        logger.info(`Generating PDF for project: ${projectId} by user: ${userId}`);
        let customFolderPath: string = '';
        try {
            const { pdfPath, logs, customFolderPath: cfp } = await ProjectService.getPdf(projectId, userId);
            customFolderPath = cfp;
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=${path.basename(pdfPath)}`);
            const stream = fs.createReadStream(pdfPath);
            stream.pipe(res);
            stream.on('close', () => {
            fs.rmdirSync(customFolderPath, { recursive: true });
            logger.info(`Temporary folder ${customFolderPath} deleted after streaming PDF for project: ${projectId}`);
            });
        } catch (error) {
            if (error instanceof Error) {
                res.status(400).json({ message: error.message, logs: (error as any).logs });
                logger.error(`Error generating PDF for project: ${projectId} - ${error.message}`);
            } else {
                handleError(error, res);
            }
            if (fs.existsSync(customFolderPath)) {
                fs.rmdirSync(customFolderPath, { recursive: true });
                logger.info(`Temporary folder ${customFolderPath} deleted after error for project: ${projectId}`);
            }
        }
    }

    static async moveFile(req: Request, res: Response, next: any) {
        /*     #swagger.tags = ['ProjectFile']
                #swagger.description = 'Move a file in a project'
        */
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const userId = req.user.id;
        const projectId = req.params.id;
        const { fileId, parentId } = req.body;
        logger.info(`Moving file: ${fileId} to directory: ${parentId} in project: ${projectId} by user: ${userId}`);

        try {
            await ProjectService.moveFileInProject(projectId, fileId, parentId || null, userId);
            // Emit socket event
            if (req.io) {
                const files = await ProjectService.getFilesStructure(projectId, userId);
                req.io.to(`project:fileList:${projectId}`).emit('fileList', files);
                logger.info(`Emitting file list event for project: ${projectId} with files: ${JSON.stringify(files)}`);
            }
            res.status(200).json({ message: "Plik przeniesiony" });
        } catch (error) {
            handleError(error, res);
        }
    }

    static async removeFile(req: Request, res: Response, next: any) {
        /*     #swagger.tags = ['ProjectFile']
                #swagger.description = 'Remove a file from a project'
        */
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const userId = req.user.id;
        const projectId = req.params.id;
        const fileId = req.params.fileId;
        logger.info(`Removing file: ${fileId} from project: ${projectId} by user: ${userId}`);

        try {
            await ProjectService.removeFile(projectId, fileId, userId);
            // Emit socket event
            if (req.io) {
                const files = await ProjectService.getFilesStructure(projectId, userId);
                req.io.to(`project:fileList:${projectId}`).emit('fileList', files);
                logger.info(`Emitting file list event for project: ${projectId} with files: ${JSON.stringify(files)}`);
            }
            res.status(200).json({ message: "Plik usunięty" });
        } catch (error) {
            handleError(error, res);
        }
    }

    static async getFile(req: Request, res: Response, next:any)
    {
        /*     #swagger.tags = ['ProjectFile']
                #swagger.description = 'Get a file by id'
        */
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const userId = req.user.id;
        const projectId = req.params.id;
        const fileId = req.params.fileId;
        logger.info(`Fetching file: ${fileId} from project: ${projectId} by user: ${userId}`);

        try {
            const file = await ProjectService.getFile(projectId, fileId, userId);
            res.status(200).json(file);
        } catch (error) {
            handleError(error, res);
        }
    }

    static async getFileContent(req: Request, res: Response, next: any) {
        /*     #swagger.tags = ['ProjectFile']
                #swagger.description = 'Get the content of a file'
        */
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const userId = req.user.id;
        const projectId = req.params.id;
        const fileId = req.params.fileId;
        logger.info(`Fetching content of file: ${fileId} from project: ${projectId} by user: ${userId}`);

        try {
            const content = await ProjectService.getFileContent(projectId, fileId, userId);
            res.setHeader('Content-Type', 'application/octet-stream');
            res.status(200).send(content);
        } catch (error) {
            handleError(error, res);
        }
    }

}