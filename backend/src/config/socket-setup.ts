import { Server, Socket } from 'socket.io';
import { isAuthenticated } from '../middlewares/isAuthenticated';
import logger from './logger';
import FilesService from '@/services/files.service';
import ProjectService from '@/services/project.service';
import * as Y from 'yjs';

const fileMap = new Map<string, Y.Doc>();

export function configureSocketIO(io: Server) {
  logger.info('Configuring Socket.IO');

  io.use((socket: Socket, next) => {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.query?.token ||
      socket.handshake.headers?.authorization?.replace('Bearer ', '');

    if (!token) {
      logger.error('Authentication error: No token provided');
      return next(new Error('Authentication error: No token provided'));
    }

    const req: any = { headers: { authorization: `Bearer ${token}` } };
    const res: any = {
      status: () => res,
      json: () => res,
    };

    isAuthenticated(req, res, (err) => {
      if (err) {
        logger.error('Authentication error');
        return next(new Error('Authentication error'));
      }
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
      const userAuthenticatedForProject =
        await ProjectService.getProjectIfUserHasRights(projectId, socket.data.user.id);
      if (!userAuthenticatedForProject) {
        logger.error(
          `User ${socket.data.user.id} is not authorized to access project ${projectId}`
        );
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

    socket.on('joinProjectFile', async (projectId: string, fileId: string) => {
      const userAuthenticatedForProject =
        await ProjectService.getProjectIfUserHasRights(projectId, socket.data.user.id);
      if (!userAuthenticatedForProject) {
        logger.error(
          `User ${socket.data.user.id} is not authorized to access project ${projectId}`
        );
        return;
      }

      try {
        const file = await FilesService.getFileById(fileId);
        if (!file || file.projectId !== projectId) {
          logger.error(`File ${fileId} does not belong to project ${projectId}`);
          return;
        }
        socket.join(`project:file:${fileId}`);
        logger.info(`User joined project ${projectId} file ${fileId}`);

        if (!fileMap.has(fileId)) {
          const ydoc = new Y.Doc();
          fileMap.set(fileId, ydoc);

          const filePath = await FilesService.getFilePathFromFile(file);
          const fileContent = await FilesService.getFileContent(projectId, filePath);
          ydoc.getText('monaco').insert(0, fileContent);

          logger.info(`Created Y.Doc for file ${fileId}`);
        }

        const ydoc = fileMap.get(fileId)!;
        const syncUpdate = Y.encodeStateAsUpdate(ydoc);
        socket.emit('yjs-sync', fileId, syncUpdate);

        logger.info(`Sent Y.Doc sync update for file ${fileId} to user ${socket.data.user.id}`);
      } catch (error) {
        logger.error(`Error while user joined file ${fileId}: ${error}`);
        return;
      }
    });

    socket.on('yjs-update', (fileId: string, update: Uint8Array) => {
      const ydoc = fileMap.get(fileId);
      if (!ydoc) {
        logger.warn(`No Y.Doc found for file ${fileId}`);
        return;
      }
      Y.applyUpdate(ydoc, update);
      socket.to(`project:file:${fileId}`).emit('yjs-update', fileId, update);
    });

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected with user: ${socket.data.user.email}`);
    });
  });
}
