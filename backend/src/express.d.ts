import 'express';
import { User as PrismaUser } from '@prisma/client';

declare global {
    namespace Express {
        interface User extends PrismaUser {}
        interface Request extends Express.Request {
            user?: User;
            io?: import('socket.io').Server;
        }
    }
}
