import { Request, Response, NextFunction } from "express";
import ProjectService from "@/services/project.service";

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
            if (error instanceof Error) {
                res.status(400).json({ message: error.message });
            } else {
                res.status(400).json({ message: "An unknown error occurred" });
            }
            return;
        }
    }

    static async createProject(req: Request, res: Response, next: any) : Promise<void> {
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
            if (error instanceof Error) {
                res.status(400).json({ message: error.message });
            } else {
                res.status(400).json({ message: "An unknown error occurred" });
            }
        }
        finally {
            return;
        }
    }

    static async getProject(req: Request, res: Response, next: any) {
        /*     #swagger.tags = ['Project']
                #swagger.description = 'Get a project by id'
        */
       if(!req.user) { res.status(401).json({ message: "Unauthorized" }); return; } 
       const userId = req.user.id;
       const projectId = req.params.id;
       
        try {
            const project = await ProjectService.getProjectIfUserHasRights(projectId, userId);
            if(!project) {
                res.status(404).json({ message: "Project not found" });
                return;
            }
            res.status(200).json(project);
        } catch (error) {
            if (error instanceof Error) {
                res.status(400).json({ message: error.message });
            } else {
                res.status(400).json({ message: "An unknown error occurred" });
            }
            return;
        }
    }

    static async updateProject(req: Request, res: Response, next: any) {
        const { title, description, archived } = req.body;
        const projectId = req.params.id;
        if(!req.user) { res.status(401).json({ message: "Unauthorized" }); return; }
        const userId = req.user.id;

        try {
            const project = await ProjectService.updateProject(projectId, { title, description, archived }, userId);
            res.status(200).json(project);
        } catch (error) {
            if (error instanceof Error) {
                res.status(400).json({ message: error.message });
            } else {
                res.status(400).json({ message: "An unknown error occurred" });
            }
            return;
        }

    }

    static async deleteProject(req: Request, res: Response, next: any) {
        /*     #swagger.tags = ['Project']
                #swagger.description = 'Delete a project by id'
        */
        const projectId = req.params.id;
        if(!req.user) { res.status(401).json({ message: "Unauthorized" }); return; }
        const userId = req.user.id;

        try {
            await ProjectService.deleteProject(projectId, userId);
            res.status(204).json();
        } catch (error) {
            if (error instanceof Error) {
                res.status(400).json({ message: error.message });
            } else {
                res.status(400).json({ message: "An unknown error occurred" });
            }
            return;
        }
    }

    static async getSharedProjects(req: Request, res: Response, next: any) {
        /*     #swagger.tags = ['Project']
                #swagger.description = 'Get all projects shared with the authenticated user'
        */
        if(!req.user) { res.status(401).json({ message: "Unauthorized" }); return; }
        const userId = req.user.id;
        try {
            const projects = await ProjectService.getSharedProjects(userId);
            res.status(200).json(projects);
        } catch (error) {
            if (error instanceof Error) {
                res.status(400).json({ message: error.message });
            } else {
                res.status(400).json({ message: "An unknown error occurred" });
            }
            return;
        }
    }

    static async shareProject(req: Request, res: Response, next: any) {
        /*     #swagger.tags = ['Project']
                #swagger.description = 'Share a project with a user'
        */
        const projectId = req.params.projectId;
        const userEmail = req.params.userEmail;
        if(!req.user) { res.status(401).json({ message: "Unauthorized" }); return; }
        const userId = req.user.id;
        if(!projectId || !userEmail) {
            res.status(400).json({ message: "Invalid request" });
            return;
        }

        try {
            await ProjectService.shareProject(projectId, userEmail, userId);
            res.status(200).json();
        } catch (error) {
            if (error instanceof Error) {
                res.status(400).json({ message: error.message });
            } else {
                res.status(400).json({ message: "An unknown error occurred" });
            }
            return;
        }
    }

    static async unshareProject(req: Request, res: Response, next: any) {
        res.send("Not Implemented7");
    }

    static async getMyProjects(req: Request, res: Response, next: NextFunction) : Promise<void> {
        /*     #swagger.tags = ['Project']
                #swagger.description = 'Get all projects owned by the authenticated user'
        */  
        if(!req.user) { res.status(401).json({ message: "Unauthorized" }); return; }
        const userId = req.user.id;
        try {
            const projects = await ProjectService.getOwnProjects(userId);
            res.status(200).json(projects);
        } catch (error) {
            if (error instanceof Error) {
                res.status(400).json({ message: error.message });
            } else {
                res.status(400).json({ message: "An unknown error occurred" });
            }
            return;
        }
    }

    static async getArchivedProjects(req: Request, res: Response, next: any) {
        /*     #swagger.tags = ['Project']
                #swagger.description = 'Get all archived projects'
        */
        if(!req.user) { res.status(401).json({ message: "Unauthorized" }); return; }
        const userId = req.user.id;
        try {
            const projects = await ProjectService.getArchivedProjects(userId);
            res.status(200).json(projects);
        } catch (error) {
            if (error instanceof Error) {
                res.status(400).json({ message: error.message });
            } else {
                res.status(400).json({ message: "An unknown error occurred" });
            }
            return;
        }
    }

}