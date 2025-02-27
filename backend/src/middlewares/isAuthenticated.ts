import { User } from '@prisma/client';
import { Request, Response, NextFunction } from 'express';
import passport from 'passport';

export const isAuthenticated = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  passport.authenticate('jwt', { session: false }, (err: Error, user: User) => {
    if (err || !user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    // Attach user to req
    req.user = user;
    return next();
  })(req, res, next);
};
