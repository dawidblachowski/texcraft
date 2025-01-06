import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { Strategy as OAuth2Strategy } from 'passport-oauth2';
import bcrypt from 'bcrypt';
import prisma from './database';
import { JWT_ACCESS_SECRET } from './env';
import axios from 'axios';
import {
    OAUTH2_DISCOVERY_URL, 
    OAUTH2_CLIENT_ID,
    OAUTH2_CLIENT_SECRET
} from './env';

//local strategy
passport.use(
    new LocalStrategy(
        {
            usernameField: 'email',
            passwordField: 'password',
        },
        async (email, password, done) => {
            try {
                const authAccount = await prisma.authAccount.findUnique({
                    where: {
                        provider_providerAccountId: {
                            provider: 'local',
                            providerAccountId: email
                        }
                    },
                    include: {
                        user: true
                    }
                });
                if (!authAccount || !authAccount.password) {
                    return done(null, false);
                }
                const match = await bcrypt.compare(password, authAccount.password);
                if (!match) {
                    return done(null, false);
                }
                return done(null, authAccount.user);
            }
            catch (error) {
                done(error);
            }
        }
    )
);

//jwt strategy
passport.use(
    new JwtStrategy(
        {
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: JWT_ACCESS_SECRET as string
        },
        async (payload, done) => {
            try {
                const user = await prisma.user.findUnique({ where: { id: payload.id } });
                if (!user) {
                    return done(null, false);
                }
                return done(null, user);
            } catch (err) {
                return done(err, false);
            }
        }
    )
);

//oauth strategy
async function initOAuth2Strategy() {
    if (!OAUTH2_DISCOVERY_URL || !OAUTH2_CLIENT_ID || !OAUTH2_CLIENT_SECRET) {
        console.log('Skipping OAuth2 strategy init: missing .env config');
        return;
    }

    try {
        // Fetch discovery data
        const discovery = await axios.get(OAUTH2_DISCOVERY_URL);
        const { authorization_endpoint, token_endpoint, userinfo_endpoint } = discovery.data;

        if (!authorization_endpoint || !token_endpoint || !userinfo_endpoint) {
            console.log('Missing required endpoints in discovery document');
            return;
        }

        // Create the strategy
        const strategy = new OAuth2Strategy(
            {
                authorizationURL: authorization_endpoint,
                tokenURL: token_endpoint,
                clientID: OAUTH2_CLIENT_ID,
                clientSecret: OAUTH2_CLIENT_SECRET,
                callbackURL: '/api/auth/oauth2/callback'
            },
            async (accessToken: string, refreshToken: string, profile: any, done: (error: any, user?: any) => void) => {
                try {
                    const userinfo = await axios.get(userinfo_endpoint, {
                        headers: { Authorization: `Bearer ${accessToken}` }
                    });

                    // Extract the user info
                    const { sub, email } = userinfo.data;
                    const provider = 'custom-oauth2';
                    const providerAccountId = sub || email;

                    // Check if there's an existing AuthAccount
                    let authAccount = await prisma.authAccount.findUnique({
                        where: {
                            provider_providerAccountId: {
                                provider,
                                providerAccountId
                            }
                        },
                        include: { user: true }
                    });

                    if (!authAccount) {
                        // If we have an email, try to see if there's an existing user with that email
                        let user = null;
                        if (email) {
                            user = await prisma.user.findUnique({ where: { email } });
                        }

                        if (!user) {
                            // Create a new user
                            user = await prisma.user.create({
                                data: {
                                    email: email || undefined,
                                    authAccounts: {
                                        create: {
                                            provider,
                                            providerAccountId,
                                            password: null // no password for OAuth2
                                        }
                                    }
                                }
                            });
                        } else {
                            // Attach a new AuthAccount to the existing user
                            await prisma.authAccount.create({
                                data: {
                                    provider,
                                    providerAccountId,
                                    userId: user.id
                                }
                            });
                        }

                        // Reload the newly created AuthAccount
                        authAccount = await prisma.authAccount.findUnique({
                            where: {
                                provider_providerAccountId: {
                                    provider,
                                    providerAccountId
                                }
                            },
                            include: { user: true }
                        });
                    }

                    // Return the user
                    return done(null, authAccount?.user);
                } catch (err) {
                    return done(err);
                }
            }
        );

        passport.use('custom-oauth2', strategy);
        console.log('Initialized OAuth2 strategy');
    } catch (err) {
        console.log('Error initializing OAuth2 strategy:', err);
    }
}

export { initOAuth2Strategy };
export default passport;