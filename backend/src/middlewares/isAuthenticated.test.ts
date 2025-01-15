import { Request, Response, NextFunction } from 'express';
import { isAuthenticated } from './isAuthenticated';
import passport from 'passport';

jest.mock('passport');

describe('isAuthenticated middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  it('should call next if user is authenticated', () => {
    const user = { id: '123', email: 'test@example.com' };
    (passport.authenticate as jest.Mock).mockImplementation((strategy, options, callback) => {
      return (req: Request, res: Response, next: NextFunction) => {
        callback(null, user);
      };
    });

    isAuthenticated(req as Request, res as Response, next);

    expect(req.user).toEqual(user);
    expect(next).toHaveBeenCalled();
  });

  it('should return 401 if there is an error during authentication', () => {
    const error = new Error('Authentication error');
    (passport.authenticate as jest.Mock).mockImplementation((strategy, options, callback) => {
      return (req: Request, res: Response, next: NextFunction) => {
        callback(error, null);
      };
    });

    isAuthenticated(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Unauthorized' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 if user is not authenticated', () => {
    (passport.authenticate as jest.Mock).mockImplementation((strategy, options, callback) => {
      return (req: Request, res: Response, next: NextFunction) => {
        callback(null, null);
      };
    });

    isAuthenticated(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Unauthorized' });
    expect(next).not.toHaveBeenCalled();
  });
});