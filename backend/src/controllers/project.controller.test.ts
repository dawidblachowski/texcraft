import { Request, Response } from "express";
import { ProjectController } from "./project.controller";
import ProjectService from "../services/project.service";
import logger from "../config/logger";

jest.mock("../services/project.service");
jest.mock("../config/logger");

describe("ProjectController", () => {
    let req: Partial<Request>;
    let res: Partial<Response>;
    let next: jest.Mock;

    beforeEach(() => {
        req = {
            user: { id: "userId", email: "test@example.pl", role: "USER", createdAt: new Date(), updatedAt: new Date() },
            params: {},
            body: {},
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            setHeader: jest.fn()
        };
        next = jest.fn();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("getProjects", () => {
        it("should return 401 if user is not authenticated", async () => {
            req.user = undefined;
            await ProjectController.getProjects(req as Request, res as Response, next);
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ message: "Unauthorized" });
        });

        it("should return projects for authenticated user", async () => {
            const projects = [{ id: "project1" }];
            (ProjectService.getAllProjects as jest.Mock).mockResolvedValue(projects);
            await ProjectController.getProjects(req as Request, res as Response, next);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(projects);
        });

        it("should handle errors", async () => {
            const error = new Error("Test error");
            (ProjectService.getAllProjects as jest.Mock).mockRejectedValue(error);
            await ProjectController.getProjects(req as Request, res as Response, next);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: error.message });
        });
    });

    describe("createProject", () => {
        it("should return 401 if user is not authenticated", async () => {
            req.user = undefined;
            await ProjectController.createProject(req as Request, res as Response, next);
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ message: "Unauthorized" });
        });

        it("should create a project for authenticated user", async () => {
            const project = { id: "project1" };
            req.body = { title: "New Project" };
            (ProjectService.createProject as jest.Mock).mockResolvedValue(project);
            await ProjectController.createProject(req as Request, res as Response, next);
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(project);
        });

        it("should handle errors", async () => {
            const error = new Error("Test error");
            (ProjectService.createProject as jest.Mock).mockRejectedValue(error);
            await ProjectController.createProject(req as Request, res as Response, next);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: error.message });
        });
    });

    describe("getProject", () => {
        it("should return 401 if user is not authenticated", async () => {
            req.user = undefined;
            await ProjectController.getProject(req as Request, res as Response, next);
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ message: "Unauthorized" });
        });

        it("should return project for authenticated user", async () => {
            const project = { id: "project1" };
            req.params = { id: "project1" } as any;
            (ProjectService.getProjectIfUserHasRights as jest.Mock).mockResolvedValue(project);
            await ProjectController.getProject(req as Request, res as Response, next);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(project);
        });

        it("should handle errors", async () => {
            const error = new Error("Test error");
            req.params = { id: "project1" } as any;
            (ProjectService.getProjectIfUserHasRights as jest.Mock).mockRejectedValue(error);
            await ProjectController.getProject(req as Request, res as Response, next);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: error.message });
        });
    });

    describe("updateProject", () => {
        it("should return 401 if user is not authenticated", async () => {
            req.user = undefined;
            await ProjectController.updateProject(req as Request, res as Response, next);
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ message: "Unauthorized" });
        });

        it("should update project for authenticated user", async () => {
            const project = { id: "project1" };
            req.params = { id: "project1" } as any;
            req.body = { title: "Updated Project" };
            (ProjectService.updateProject as jest.Mock).mockResolvedValue(project);
            await ProjectController.updateProject(req as Request, res as Response, next);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(project);
        });

        it("should handle errors", async () => {
            const error = new Error("Test error");
            req.params = { id: "project1" } as any;
            (ProjectService.updateProject as jest.Mock).mockRejectedValue(error);
            await ProjectController.updateProject(req as Request, res as Response, next);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: error.message });
        });
    });

    describe("deleteProject", () => {
        it("should return 401 if user is not authenticated", async () => {
            req.user = undefined;
            await ProjectController.deleteProject(req as Request, res as Response, next);
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ message: "Unauthorized" });
        });

        it("should delete project for authenticated user", async () => {
            req.params = { id: "project1" } as any;
            (ProjectService.deleteProject as jest.Mock).mockResolvedValue(undefined);
            await ProjectController.deleteProject(req as Request, res as Response, next);
            expect(res.status).toHaveBeenCalledWith(204);
            expect(res.json).toHaveBeenCalledWith();
        });

        it("should handle errors", async () => {
            const error = new Error("Test error");
            req.params = { id: "project1" } as any;
            (ProjectService.deleteProject as jest.Mock).mockRejectedValue(error);
            await ProjectController.deleteProject(req as Request, res as Response, next);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: error.message });
        });
    });

});
