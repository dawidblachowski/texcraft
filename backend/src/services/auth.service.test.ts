import prisma from "../config/database";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import logger from "../config/logger";
import AuthService from "./auth.service";
import { User } from "@prisma/client";

jest.mock("../config/database", () => ({
    __esModule: true,
    default: {
        authAccount: {
            findUnique: jest.fn(),
        },
        user: {
            create: jest.fn(),
        },
        refreshToken: {
            create: jest.fn(),
        },
    },
}));
jest.mock('bcrypt');
jest.mock('jsonwebtoken');
jest.mock("../config/logger");

describe('AuthService', () => {
    describe('register', () => {
        it('should throw an error if email or password is missing', async () => {
            await expect(AuthService.register('', 'password')).rejects.toThrow("Email and password are required");
            await expect(AuthService.register('email@example.com', '')).rejects.toThrow("Email and password are required");
        });

        it('should throw an error if email is invalid', async () => {
            jest.mock('../validators/email.validator', () => jest.fn(() => "Email is invalid"));
            await expect(AuthService.register('invalid-email', 'password')).rejects.toThrow("Email is invalid");
        });

        it('should throw an error if user already exists', async () => {
            (prisma.authAccount.findUnique as jest.Mock).mockResolvedValue({ id: 'existing-user-id' });
            await expect(AuthService.register('email@example.com', '!Password123')).rejects.toThrow("User with this email already exists");
        });

        it('should create a new user', async () => {
            (prisma.authAccount.findUnique as jest.Mock).mockResolvedValue(null);
            (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
            (prisma.user.create as jest.Mock).mockResolvedValue({ id: 'new-user-id', email: 'email@example.com' });

            const newUser = await AuthService.register('email@example.com', '!Password123');
            expect(newUser).toEqual({ id: 'new-user-id', email: 'email@example.com' });
        });
    });

    describe('generateNewTokens', () => {
        it('should generate new tokens', async () => {
            const user = { id: 'user-id', email: 'email@example.com' } as User;
            jest.spyOn(AuthService, 'generateAccessToken').mockResolvedValue('access-token');
            jest.spyOn(AuthService, 'generateRefreshToken').mockResolvedValue('refresh-token');
            (prisma.refreshToken.create as jest.Mock).mockResolvedValue({ refreshToken: 'refresh-token', userId: 'user-id' });

            const tokens = await AuthService.generateNewTokens(user);
            expect(tokens).toEqual({ accessToken: 'access-token', refreshToken: 'refresh-token' });
        });
    });

    describe('generateAccessToken', () => {
        it('should generate an access token', async () => {
            process.env.JWT_ACCESS_SECRET = 'access-secret';
            const user = { id: 'user-id', email: 'email@example.com' } as User;
            (jwt.sign as jest.Mock).mockReturnValue('access-token');

            const token = await AuthService.generateAccessToken(user);
            expect(token).toBe('access-token');
        });
    });

    describe('generateRefreshToken', () => {
        it('should generate a refresh token', async () => {
            process.env.JWT_REFRESH_SECRET = 'refresh-secret';
            const user = { id: 'user-id', email: 'email@example.com' } as User;
            (jwt.sign as jest.Mock).mockReturnValue('refresh-token');

            const token = await AuthService.generateRefreshToken(user);
            expect(token).toBe('refresh-token');
        });
    });

    describe('formatMaxAge', () => {
        it('should throw an error for invalid time unit', () => {
            expect(() => AuthService.formatMaxAge('10x')).toThrow("Invalid time unit in max age");
        });

        it('should format max age correctly', () => {
            expect(AuthService.formatMaxAge('10m')).toBe(10 * 60 * 1000);
            expect(AuthService.formatMaxAge('1h')).toBe(1 * 60 * 60 * 1000);
            expect(AuthService.formatMaxAge('1d')).toBe(1 * 60 * 60 * 24 * 1000);
        });
    });
});
