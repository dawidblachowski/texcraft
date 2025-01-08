import prisma from "@/config/database";

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
        }
        catch (error) {
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
    }
}