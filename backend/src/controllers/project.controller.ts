import { User } from "@prisma/client";
import { Request, Response, NextFunction } from "express";
import ProjectService from "@/services/project.service";

export class ProjectController {
    static async getProjects(req: Request, res: Response, next: any) {
        res.send("Not Implemented");
    }

    static async createProject(req: Request, res: Response, next: any) {
        res.send("Not Implemented");
    }

    static async getProject(req: Request, res: Response, next: any) {
        res.send("Not Implemented");
    }

    static async updateProject(req: Request, res: Response, next: any) {
        res.send("Not Implemented");
    }

    static async deleteProject(req: Request, res: Response, next: any) {
        res.send("Not Implemented");
    }

    static async getSharedProjects(req: Request, res: Response, next: any) {
        res.send("Not Implemented");
    }

    static async shareProject(req: Request, res: Response, next: any) {
        res.send("Not Implemented");
    }

    static async unshareProject(req: Request, res: Response, next: any) {
        res.send("Not Implemented");
    }

    static async getSharedProjectsByUser(req: Request, res: Response, next: any) {
        res.send("Not Implemented");
    }

    static async getMyProjects(req: Request, res: Response, next: any) {
        res.send("Not Implemented");
    }

}