import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import bcrypt from 'bcrypt';
import prisma from './database';
import { JWT_ACCESS_SECRET } from './env';

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
                if(!authAccount || !authAccount.password) {
                    return done(null, false);
                }
                const match = await bcrypt.compare(password, authAccount.password);
                if(!match) {
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

export default passport;