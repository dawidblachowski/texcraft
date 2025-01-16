import { User } from "@prisma/client";
import { Request, Response, NextFunction } from "express";
import UserService from "../services/user.service";
import logger from "../config/logger";

export class UserController {
    static async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
        /*  #swagger.tags = ['User']
            #swagger.description = 'Get user profile'
        */
        const user = req.user as User;
        res.status(200).json({ user });
    }

    static async deleteUser(req: Request, res: Response, next: NextFunction): Promise<void> {
        /*  #swagger.tags = ['User']
            #swagger.description = 'Delete user'
        */
        const user = req.user as User;
        try {
            await UserService.removeUser(user.id);
            res.status(200).json({ message: 'User deleted' });
        } catch (error) {
            const err = error as Error;
            logger.error(`Failed to delete user ${user.id}: ${err.message}`);
            next(error);
        }
    }
}