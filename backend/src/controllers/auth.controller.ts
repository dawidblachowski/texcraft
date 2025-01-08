import { Request, Response, NextFunction } from "express";
import AuthService from "@/services/auth.service";
import passport from "passport";
import { User } from "@prisma/client";

import { REFRESH_TOKEN_EXPIRES_IN } from "@/config/env";
import prisma from "@/config/database";

export default class AuthController {
    static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
        /*  #swagger.tags = ['Auth']
            #swagger.description = 'Register a new user'
            
        */
        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).json({ message: "Email and password are required" });
            return;
        }
        try {
            const user = await AuthService.register(email, password);
            res.status(201).json(user);
            return;
        } catch (error) {
            res.status(500).json({ message: (error as Error).message });
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
                if (error || !user) {
                    res.status(401).json({ message: "Invalid email or password" });
                    return;
                }
                try {
                    if (!user) {
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
                        secure: process.env.NODE_ENV === 'production' ? true : false, // Ensure this is false in development
                        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // Set sameSite to 'lax' in development
                    });

                    //and return access token
                    res.status(200).json({ accessToken: tokens.accessToken });
                    return;
                }
                catch (e) {
                    res.status(500).json({ message: (e as Error).message });
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
        if (!refreshToken) {
            res.status(400).json({ message: "Refresh token is required" });
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
                secure: process.env.NODE_ENV === 'production' ? true : false, // Ensure this is false in development
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // Set sameSite to 'lax' in development
            });

            //and return access token
            res.status(200).json({ accessToken: tokens.accessToken });
            return;
        } catch (error) {
            res.status(500).json({ message: (error as Error).message });
            return;
        }
    }

    // OAuth2: Step 1: redirect to provider
    static async oauth2Login(req: Request, res: Response, next: any) {
        /*  #swagger.tags = ['Auth']
            #swagger.description = 'Login with OAuth2 provider'
        */
        passport.authenticate('custom-oauth2', {
            session: false,
            scope: ['openid', 'email', 'profile'],
        })(req, res, next);
    }

    // OAuth2: Step 2: callback from provider
    static async oauth2Callback(req: Request, res: Response, next: any) {
        /*  #swagger.tags = ['Auth']
            #swagger.description = 'Callback from OAuth2 provider'
        */
        passport.authenticate('custom-oauth2', { session: false }, async (err: Error, user: User) => {
            if (err) {
                return res.redirect(`/login?error=${encodeURIComponent(err.message)}`);
            }
            if (!user) {
                return res.redirect(`/login?error=${encodeURIComponent('OAuth2 login failed')}`);
            }
            try {
                // Generate tokens
                const tokens = await AuthService.generateNewTokens(user);

                // Set httpOnly cookie with refresh token
                if (!REFRESH_TOKEN_EXPIRES_IN) {
                    throw new Error('REFRESH_TOKEN_EXPIRES_IN is not defined');
                }
                const maxAge = AuthService.formatMaxAge(REFRESH_TOKEN_EXPIRES_IN);
                res.cookie('refreshToken', tokens.refreshToken, {
                    httpOnly: true,
                    maxAge,
                    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // Set sameSite to 'lax' in development
                    secure: process.env.NODE_ENV === 'production' ? true : false, // Ensure this is false in development
                });

                // Return access token
                return res.redirect(`/auth/callback?accessToken=${encodeURIComponent(tokens.accessToken)}`);
            } catch (error) {
                res.redirect(`/login?error=${encodeURIComponent((error as Error).message)}`);
            }
        })(req, res, next);
    }

    static async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
        /*  #swagger.tags = ['Auth']
            #swagger.description = 'Logout'
        */
        const refreshToken = req.cookies.refreshToken;
        res.clearCookie('refreshToken');

        prisma.refreshToken.delete({
            where:
            {
                token: refreshToken
            }
        });
        res.status(200).json({ message: 'Logged out' });
    }
}