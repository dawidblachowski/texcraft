import { Request, Response, NextFunction } from "express";
import AuthService from "@/services/auth.service";
import passport from "passport";
import { User } from "@prisma/client";

import { ErrorResponseDto } from "@shared/dto/errorResponse.dto";
import { UserTokensDto } from "@shared/dto/user.dto";

import { REFRESH_TOKEN_EXPIRES_IN } from "@/config/env";

export default class AuthController {
    static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
        /*  #swagger.tags = ['Auth']
            #swagger.description = 'Register a new user'
            
        */
        const { email, password } = req.body;
        if(!email || !password) {
            res.status(400).json({ message: "Email and password are required" } as ErrorResponseDto);
            return;
        }
        try {
            const user = await AuthService.register(email, password);
            res.status(201).json(user);
            return;
        } catch (error) {
            res.status(500).json({ message: (error as Error).message } as ErrorResponseDto);
            return;
        }
    }

    static async localLogin(req: Request, res: Response, next: NextFunction): Promise<void> {
        /*  #swagger.tags = ['Auth']
            #swagger.description = 'Login with email and password'
        */
       const { email, password } = req.body; 
        passport.authenticate(
            'local', 
            { session: false },
            async (error: Error, user: User | false, info: unknown) => {
                if(error || !user) {
                    res.status(401).json({ message: "Invalid email or password" } as ErrorResponseDto);
                    return;
                }
                try {
                    if(!user) {
                        throw new Error("User not found");
                    }
                    const tokens = await AuthService.generateNewTokens(user);
                    //set httpOnly cookie with refresh token
                    if (!REFRESH_TOKEN_EXPIRES_IN) {
                        throw new Error("REFRESH_TOKEN_EXPIRES_IN is not defined");
                    }
                    const maxAge = AuthService.formatMaxAge(REFRESH_TOKEN_EXPIRES_IN);
                    res.cookie('refreshToken', tokens.refreshToken, {
                        httpOnly: true,
                        maxAge,
                    });

                    //and return access token
                    res.status(200).json({accessToken: tokens.accessToken});
                    return;
                }
                catch (e) {
                    res.status(500).json({ message: (e as Error).message } as ErrorResponseDto);
                    return;
                }
            }
        )(req, res, next);
    }

    static async refreshTokens(req: Request, res: Response, next: NextFunction): Promise<void> {
        /*  #swagger.tags = ['Auth']
            #swagger.description = 'Refresh access token'
        */
        const { refreshToken } = req.cookies;
        if(!refreshToken) {
            res.status(400).json({ message: "Refresh token is required" } as ErrorResponseDto);
            return;
        }
        try {
            const tokens = await AuthService.refreshTokens(refreshToken);
            //set httpOnly cookie with refresh token
            if (!REFRESH_TOKEN_EXPIRES_IN) {
                throw new Error("REFRESH_TOKEN_EXPIRES_IN is not defined");
            }
            const maxAge = AuthService.formatMaxAge(REFRESH_TOKEN_EXPIRES_IN);
            res.cookie('refreshToken', tokens.refreshToken, {
                httpOnly: true,
                maxAge,
            });

            //and return access token
            res.status(200).json({accessToken: tokens.accessToken});
            return;
        } catch (error) {
            res.status(500).json({ message: (error as Error).message } as ErrorResponseDto);
            return;
        }
    }
}