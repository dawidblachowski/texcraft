import { Request, Response, NextFunction } from "express";
import { UserController } from "./user.controller";
import { User } from "@prisma/client";

describe("UserController", () => {
    describe("getProfile", () => {
        it("should return user profile with status 200", async () => {
            const mockUser: User = {
                id: '123123123',
                email: "test@example.com",
                role: "USER",
                createdAt: new Date(),
                updatedAt: new Date()
            };

            const req = {
                user: mockUser
            } as Request;

            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            } as unknown as Response;

            const next = jest.fn() as NextFunction;

            await UserController.getProfile(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ user: mockUser });
        });
    });
});
