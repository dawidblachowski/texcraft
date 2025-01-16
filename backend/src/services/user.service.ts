import prisma from "../config/database";
import ProjectService from "./project.service";

export default class UserService {
    static async removeUser(userId: string) {
        try {
            const userProjects = await prisma.project.findMany({
                where: {
                    userId: userId
                }
            });
            userProjects.forEach(project => {
                ProjectService.deleteProject(project.id, userId);
            });
            await prisma.user.delete({
                where: {
                    id: userId
                }
            });
            await prisma.authAccount.deleteMany({
                where: {
                    userId: userId
                }
            });
            await prisma.refreshToken.deleteMany({
                where: {
                    userId: userId
                }
            });
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Nie udało się usunąć użytkownika o ID ${userId}: ${error.message}`);
            } else {
                throw new Error(`Nie udało się usunąć użytkownika o ID ${userId}: Unknown error`);
            }
        }
    }
}