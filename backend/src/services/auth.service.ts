import prisma from "../config/database";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import logger from "../config/logger";

import emailValidator from "../validators/email.validator";
import passwordValidator from "../validators/password.validator";

import { User } from "@prisma/client";

import {
    ACCESS_TOKEN_EXPIRES_IN,
    REFRESH_TOKEN_EXPIRES_IN,
    JWT_ACCESS_SECRET,
    JWT_REFRESH_SECRET, 
} from "../config/env";

export default class AuthService {
    static async register(email: string, password: string) {
        //validate email and password
        if(!email || !password) {
            throw new Error("Email and password are required");
        }

        const emailError = emailValidator(email);
        if(emailError) {
            throw new Error(emailError);
        }

        const passwordError = passwordValidator(password);
        if(passwordError) {
            throw new Error(passwordError);
        }

        //check if user with provided email already exists
        const existingUser = await prisma.authAccount.findUnique({
            where: {
                provider_providerAccountId: {
                    provider: 'local', 
                    providerAccountId: email
                }
            }
        });
        if(existingUser) {
            throw new Error("User with this email already exists");
        }

        //create user
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await prisma.user.create({
            data: {
                email: email, 
                authAccounts: {
                    create: [
                        {
                            provider: 'local', 
                            providerAccountId: email,
                            password: hashedPassword
                        }
                    ]
                }
            }
        }); 
        logger.info(`User registered with email: ${email}`);
        return newUser;
    }

    static async generateNewTokens(user: User) {
        const accessToken = await this.generateAccessToken(user);
        const refreshToken = await this.generateRefreshToken(user);

        //save refresh token to database
        await prisma.refreshToken.create({
            data: {
                token: refreshToken,
                userId: user.id
            }
        });
        logger.info(`Generated new tokens for user: ${user.email}`);
        return { accessToken, refreshToken };
    }

    static async generateAccessToken(user: User) {
        if (!JWT_ACCESS_SECRET) {
            throw new Error("JWT_ACCESS_SECRET is not defined");
        }
        const token = jwt.sign({ id: user.id }, JWT_ACCESS_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES_IN });
        logger.info(`Generated access token for user: ${user.email}`);
        return token;
    }

    static async generateRefreshToken(user: User) {
        if (!JWT_REFRESH_SECRET) {
            throw new Error("JWT_REFRESH_SECRET is not defined");
        }
        const token = jwt.sign({ id: user.id }, JWT_REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES_IN });
        logger.info(`Generated refresh token for user: ${user.email}`);
        return token;
    }

    static async refreshTokens(refreshToken: string) {
        //verify refresh token
        if (!JWT_REFRESH_SECRET) {
            throw new Error("JWT_REFRESH_SECRET is not defined");
        }

        //get user id from refresh token
        let userId: string;
        try {
            const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as { id: string };
            userId = decoded.id;
        } catch (e) {
            logger.warn(`Invalid refresh token: ${refreshToken}`);
            throw new Error("Invalid refresh token");
        }

        //check if refresh token is in database
        const dbToken = await prisma.refreshToken.findUnique({
            where: {
                token: refreshToken
            }
        });
        if (!dbToken) {
            logger.warn(`Refresh token not found in database: ${refreshToken}`);
            throw new Error("Invalid refresh token");
        }

        //get user
        const user = await prisma.user.findUnique({
            where: {
                id: userId
            }
        });
        if (!user) {
            logger.warn(`User not found for refresh token: ${refreshToken}`);
            throw new Error("User not found");
        }

        //generate new tokens
        const accessToken = await this.generateAccessToken(user);
        const newRefreshToken = await this.generateRefreshToken(user);

        //update refresh token in database
        await prisma.refreshToken.update({
            where: {
                token: refreshToken
            },
            data: {
                token: newRefreshToken
            }
        });
        logger.info(`Refreshed tokens for user: ${user.email}`);
        return { accessToken, refreshToken: newRefreshToken };
    }

    static formatMaxAge(maxAge: string) {
        const timeValue = parseInt(maxAge.slice(0, -1));
        const timeUnit = maxAge.slice(-1);

        switch (timeUnit) {
            case 'm':
                return timeValue * 60 * 1000;
            case 'h':
                return timeValue * 60 * 60 * 1000;
            case 'd':
                return timeValue * 60 * 60 * 24 * 1000;
            default:
                throw new Error("Invalid time unit in max age");
        }
    }
}