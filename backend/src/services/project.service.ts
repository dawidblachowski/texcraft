import prisma from "../config/database";
import FilesService from "./files.service";
import path from 'path';
import logger from "../config/logger";
import PdfService from "../services/pdf.service";
import { DATA_FOLDER } from "../config/env";
import fs from 'fs';

export default class ProjectService {

    static async createProject({ title }: { title: string }, userId: string) {
        if (!title) {
            throw new Error("Tytuł jest wymagany");
        }
        const project = await prisma.project.create({
            data: {
                title,
                userId
            },
        });
        logger.info(`Created project with title: ${title} for user: ${userId}`);
        return project;
    }

    static async getOwnProjects(userId: string) {
        const projects = await prisma.project.findMany({
            where: {
                userId,
                archived: false
            },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true
                    }
                }
            },
            orderBy: {
                updatedAt: 'desc'
            }
        });
        logger.info(`Fetched own projects for user: ${userId}`);
        return projects;
    }

    static async getSharedProjects(userId: string) {
        const projects = await prisma.project.findMany({
            where: {
                sharedWith: {
                    some: {
                        id: userId
                    }
                },
                archived: false
            },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true
                    }
                }
            },
            orderBy: {
                updatedAt: 'desc'
            }
        });
        logger.info(`Fetched shared projects for user: ${userId}`);
        return projects;
    }

    static async getArchivedProjects(userId: string) {
        const projects = await prisma.project.findMany({
            where: {
                OR: [
                    {
                        userId,
                        archived: true,
                    }, 
                    {
                        sharedWith: {
                            some: {
                                id: userId
                            }
                        },
                        archived: true
                    }
                ]
            },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true
                    }
                }
            },
            orderBy: {
                updatedAt: 'desc'
            }
        });
        logger.info(`Fetched archived projects for user: ${userId}`);
        return projects;
    }

    static async getAllProjects(userId: string) {
        const ownProjects = await this.getOwnProjects(userId);
        const sharedProjects = await this.getSharedProjects(userId);
        logger.info(`Fetched all projects for user: ${userId}`);
        return [...ownProjects, ...sharedProjects].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    }

    static async getProjectIfUserHasRights(projectId: string, userId: string) {
        const project = await prisma.project.findFirst({
            where: {
                id: projectId,
                OR: [
                    {
                        userId,
                    },
                    {
                        sharedWith: {
                            some: {
                                id: userId
                            }
                        }
                    }
                ]
            }, 
            include: {
                user: {
                    select: {
                        id: true,
                        email: true
                    }
                }, 
                sharedWith: {
                    select: {
                        id: true,
                        email: true
                    }
                },
            }, 

        });
        logger.info(`Fetched project: ${projectId} for user: ${userId}`);
        return project;
    }

    static async updateProject(projectId: string, { title, description, archived }: { title: string, description: string, archived: boolean }, userId: string) {
        const project = await this.getProjectIfUserHasRights(projectId, userId);
        if (!project) {
            throw new Error("Projekt nie znaleziony");
        }
        if(project.userId !== userId) {
            throw new Error("Nie masz uprawnień do aktualizacji tego projektu");
        }
        const updatedProject = await prisma.project.update({
            where: {
                id: projectId
            },
            data: {
                title,
                description,
                archived
            }
        });
        logger.info(`Updated project: ${projectId} for user: ${userId}`);
        return updatedProject;
    }

    static async deleteProject(projectId: string, userId: string) {
        const project = await this.getProjectIfUserHasRights(projectId, userId);

        if (!project) {
            throw new Error("Projekt nie znaleziony");
        }

        if(project.userId !== userId) {
            throw new Error("Nie masz uprawnień do usunięcia tego projektu");
        }

        try {
            await prisma.project.delete({
                where: {
                    id: projectId
                }
            });
            logger.info(`Deleted project: ${projectId} for user: ${userId}`);
        }
        catch (error) {
            logger.error(`Failed to delete project: ${projectId} for user: ${userId}`);
            throw new Error("Nie udało się usunąć projektu");
        }
    }

    static async shareProject(projectId: string, userEmail: string, userId: string) {
        const project = await this.getProjectIfUserHasRights(projectId, userId);
        if (!project) {
            throw new Error("Projekt nie znaleziony");
        }
        if(project.userId !== userId) { 
            throw new Error("Nie masz uprawnień do udostępnienia tego projektu");
        }
        if(project.sharedWith.some(user => user.email === userEmail)) {
            throw new Error("Projekt już udostępniony temu użytkownikowi");
        }
        const user = await prisma.user.findFirst({
            where: {
                email: userEmail
            }
        });
        if (!user) {
            throw new Error("Użytkownik nie znaleziony");
        }
        if (user.id === userId) {
            throw new Error("Nie możesz udostępnić projektu samemu sobie");
        }
        await prisma.project.update({
            where: {
                id: projectId
            },
            data: {
                sharedWith: {
                    connect: {
                        id: user.id
                    }
                }
            }
        });
        logger.info(`Shared project: ${projectId} with user: ${userEmail} by user: ${userId}`);
    }

    static async unshareProject(projectId: string, userEmail: string, userId: string) {
        const project = await this.getProjectIfUserHasRights(projectId, userId);
        if (!project) {
            throw new Error("Projekt nie znaleziony");
        }
        if(project.userId !== userId) { 
            throw new Error("Nie masz uprawnień do usunięcia udostępnienia tego projektu");
        }
        if(!project.sharedWith.some(user => user.email === userEmail)) {
            throw new Error("Projekt nie jest udostępniony temu użytkownikowi");
        }
        const user = await prisma.user.findFirst({
            where: {
                email: userEmail
            }
        });
        if (!user) {
            throw new Error("Użytkownik nie znaleziony");
        }
        await prisma.project.update({
            where: {
                id: projectId
            },
            data: {
                sharedWith: {
                    disconnect: {
                        id: user.id
                    }
                }
            }
        });
        logger.info(`Unshared project: ${projectId} with user: ${userEmail} by user: ${userId}`);
    }

    static async createTexFile(projectId: string, fileName: string, parentId: string | null, userId: string) {
        const project = await this.getProjectIfUserHasRights(projectId, userId);
        if (!project) {
            throw new Error("Projekt nie znaleziony");
        }
        try {
            await FilesService.createEmptyTexFile(parentId, projectId, fileName);

            const fileRecord = await prisma.file.create({
                data: {
                    filename: fileName,
                    parentId,
                    mimeType: 'text/x-tex',
                    projectId,
                },
            });

            if (!fileRecord) {
                throw new Error("Nie udało się utworzyć pliku");
            }
            logger.info(`Created TeX file: ${fileName} in project: ${projectId} by user: ${userId}`);
            return fileRecord;
        } catch (error) {
            logger.error(`Failed to create TeX file: ${fileName} in project: ${projectId} by user: ${userId}`);
            throw new Error("Nie udało się utworzyć pliku");
        }
    }

    static async uploadFile(projectId: string, parentId: string | null, fileName: string, userId: string) {
        const project = await this.getProjectIfUserHasRights(projectId, userId);
        if (!project) {
            throw new Error("Projekt nie znaleziony");
        }

        const extension = path.extname(fileName).toLowerCase();
        let mimeType = 'application/octet-stream';

        switch (extension) {
            case '.jpg':
            case '.jpeg':
                mimeType = 'image/jpeg';
                break;
            case '.png':
                mimeType = 'image/png';
                break;
            case '.pdf':
                mimeType = 'application/pdf';
                break;
            case '.tex':
                mimeType = 'text/x-tex';
                break;
            // Add more cases as needed
        }

        try {
            const fileRecord = await prisma.file.create({
                data: {
                    filename: fileName,
                    parentId,
                    mimeType,
                    projectId,
                },
            });

            if (!fileRecord) {
                throw new Error("Nie udało się przesłać pliku");
            }
            logger.info(`Uploaded file: ${fileName} to project: ${projectId} by user: ${userId}`);
            return fileRecord;
        } catch (error) {
            if (error instanceof Error) {
                logger.error(`Failed to upload file: ${fileName} to project: ${projectId} by user: ${userId} - ${error.message}`);
                throw new Error(`Nie udało się przesłać pliku: ${error.message}`);
            } else {
                logger.error(`Failed to upload file: ${fileName} to project: ${projectId} by user: ${userId} - Unknown error`);
                throw new Error("Nie udało się przesłać pliku");
            }
        }
    }

    static async getFilesStructure(projectId: string, userId: string) {
        const project = await this.getProjectIfUserHasRights(projectId, userId);
        if (!project) {
            throw new Error("Projekt nie znaleziony");
        }
        const files = await prisma.file.findMany({
            where: {
                projectId,
            },
            include: {
                children: {
                    include: {
                        children: true,
                    },
                },
            },
            orderBy: [
                { isDirectory: 'desc' },
                { filename: 'asc' }
            ]
        });
        logger.info(`Fetched file structure for project: ${projectId} by user: ${userId}`);
        return files;
    }

    static async createDirectory(projectId: string, directoryName: string, parentId: string | null, userId: string) {
        const project = await this.getProjectIfUserHasRights(projectId, userId);
        if (!project) {
            throw new Error("Projekt nie znaleziony");
        }

        const existingDirectory = await prisma.file.findFirst({
            where: {
                filename: directoryName,
                parentId,
                projectId,
                isDirectory: true,
            },
        });

        if (existingDirectory) {
            throw new Error("Katalog o tej nazwie już istnieje");
        }

        try {
            await FilesService.createDirectory(projectId, directoryName);

            const directoryRecord = await prisma.file.create({
                data: {
                    filename: directoryName,
                    parentId,
                    mimeType: null,
                    projectId,
                    isDirectory: true,
                },
            });

            if (!directoryRecord) {
                throw new Error("Nie udało się utworzyć katalogu");
            }
            logger.info(`Created directory: ${directoryName} in project: ${projectId} by user: ${userId}`);
        } catch (error) {
            logger.error(`Failed to create directory: ${directoryName} in project: ${projectId} by user: ${userId}`);
            throw new Error("Nie udało się utworzyć katalogu");
        }
    }

    static async getPdf(projectId: string, userId: string) {
        const project = await this.getProjectIfUserHasRights(projectId, userId);
        if (!project) {
            throw new Error("Projekt nie znaleziony");
        }

        if (!DATA_FOLDER) {
            throw new Error("DATA_FOLDER is not defined");
        }
        const projectDir = path.join(DATA_FOLDER, projectId);

        try {
            await PdfService.ensureTempDir();
            const customFolderPath = await PdfService.createCustomFolder();
            const projectFolderPath = path.join(customFolderPath, 'project');
            const outputFolderPath = path.join(customFolderPath, 'output');
            const mainTexPath = path.join(projectFolderPath, 'main.tex');
            await PdfService.copyRecursiveSync(projectDir, projectFolderPath);
            const { path: pdfPath, logs } = await PdfService.compileLatexToPdf(mainTexPath, outputFolderPath);

            return { pdfPath, logs, customFolderPath };
        } catch (error) {
            logger.error(`Failed to generate PDF for project: ${projectId} by user: ${userId}`);
            if (error instanceof Error) {
                throw { message: error.message, logs: 'logs' in error ? error.logs : undefined };
            } else {
                throw new Error("Nie udało się wygenerować pliku PDF");
            }
        }
    }
}