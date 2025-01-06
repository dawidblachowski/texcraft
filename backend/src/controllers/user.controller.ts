import { User } from "@prisma/client";
import { Request, Response, NextFunction } from "express";

export class UserController {
    static async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
        /*  #swagger.tags = ['User']
            #swagger.description = 'Get user profile'
        */
        const user = req.user as User;
        res.status(200).json({ user });
    }
}