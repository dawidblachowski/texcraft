import { Server, Socket } from 'socket.io';
import { isAuthenticated } from '../middlewares/isAuthenticated';
import logger from './logger';
import FilesService from '@/services/files.service';
import ProjectService from '@/services/project.service';

export function configureSocketIO(io: Server) {
  logger.info('Configuring Socket.IO');
  // Store io in global req
  (global as any).req = { io };

  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth?.token
      || socket.handshake.query?.token
      || socket.handshake.headers?.authorization?.replace('Bearer ', '');

    if (!token) {
      logger.error('Authentication error: No token provided');
      return next(new Error('Authentication error: No token provided'));
    }

    const req: any = {
      headers: { authorization: `Bearer ${token}` },
    };
    const res: any = {
      status: () => res,
      json: () => res,
    };

    isAuthenticated(req, res, (err) => {
      if (err) {
        logger.error('Authentication error');
        return next(new Error('Authentication error'));
      }
      // Attach the user to the socket
      if (!req.user) {
        logger.error('Authentication error: No user found');
        return next(new Error('Authentication error: No user found'));
      }
      socket.data.user = req.user;
      logger.info(`User authenticated: ${req.user.id}`);
      return next();
    });
  });

  io.on('connection', (socket) => {
    logger.info(`Socket connected with user: ${socket.data.user.email}`);

    socket.on('joinProjectFileList', async (projectId: string) => {
      const userAuthenticatedForProject = await ProjectService.getProjectIfUserHasRights(projectId, socket.data.user.id);
      if (!userAuthenticatedForProject) {
        logger.error(`User ${socket.data.user.id} is not authorized to access project ${projectId}`);
        return;
      }
      socket.join(`project:fileList:${projectId}`);

      const files = await FilesService.getFilesStructureForProject(projectId);

      if (files) {
        io.to(`project:fileList:${projectId}`).emit('fileList', files);
        logger.info(`Emitting file list event for project: ${projectId}`);
      }
      logger.info(`User joined project ${projectId} file list`);

    });

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected with user: ${socket.data.user.email}`);
    });
  });
}
