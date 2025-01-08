import prisma from "@/config/database";

export default class ProjectService {

    static async createProject({ title }: { title: string }, userId: string) {
        if (!title) {
            throw new Error("Title is required");
        }
        const project = await prisma.project.create({
            data: {
                title,
                userId
            },
        });
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
        return projects;
    }

    static async getAllProjects(userId: string) {
        const ownProjects = await this.getOwnProjects(userId);
        const sharedProjects = await this.getSharedProjects(userId);
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
            }
        });
        return project;
    }

    static async updateProject(projectId: string, { title, description, archived }: { title: string, description: string, archived: boolean }, userId: string) {
        const project = await this.getProjectIfUserHasRights(projectId, userId);
        if (!project) {
            throw new Error("Project not found");
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
        return updatedProject;
    }

    static async deleteProject(projectId: string, userId: string) {
        const project = await this.getProjectIfUserHasRights(projectId, userId);

        if (!project) {
            throw new Error("Project not found");
        }

        if(project.userId !== userId) {
            throw new Error("You do not have rights to delete this project");
        }

        try {
            await prisma.project.delete({
                where: {
                    id: projectId
                }
            });
        }
        catch (error) {
            throw new Error("Could not delete project");
        }
    }
}