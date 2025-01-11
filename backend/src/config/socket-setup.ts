import { Server, Socket } from 'socket.io';
import * as Y from 'yjs';
import { isAuthenticated } from '../middlewares/isAuthenticated';
import logger from './logger';
import FilesService from '@/services/files.service';
import ProjectService from '@/services/project.service';
import { LRUCache } from 'lru-cache';

const fileMap = new Map<string, Y.Doc>();

const projectAccessCache = new LRUCache<string, boolean>({
  max: 500, 
  ttl: 1000 * 60 * 5,
});

async function getCachedProjectAccess(userId: string, projectId: string): Promise<boolean> {
  const cacheKey = `${userId}:${projectId}`;
  if (projectAccessCache.has(cacheKey)) {
    return projectAccessCache.get(cacheKey) as boolean;
  }

  const hasAccess = !!(await ProjectService.getProjectIfUserHasRights(projectId, userId));
  projectAccessCache.set(cacheKey, hasAccess);
  return hasAccess;
}

export function configureSocketIO(io: Server) {
  logger.info('Configuring Socket.IO');

  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;

    if (!token) {
      logger.error('Authentication error: No token provided');
      return next(new Error('Authentication error: No token provided'));
    }

    const req: any = { headers: { authorization: `Bearer ${token}` } };
    const res: any = { status: () => res, json: () => res };

    isAuthenticated(req, res, (err) => {
      if (err || !req.user) {
        logger.error('Authentication failed');
        return next(new Error('Authentication error'));
      }

      socket.data.user = req.user;
      logger.info(`User authenticated: ${req.user.id}`);
      next();
    });
  });

  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.data.user?.email || 'Unknown User'}`);

    // Validate project access helper
    async function validateProjectAccess(projectId:string) {
      const hasAccess = await getCachedProjectAccess(socket.data.user.id, projectId);
      if (!hasAccess) {
        logger.error(
          `Unauthorized access attempt by user ${socket.data.user.id} to project ${projectId}`
        );
        socket.emit('error', 'Unauthorized access');
        return false;
      }
      return true;
    }

    socket.on('joinProjectFileList', async (projectId) => {
      logger.debug(`joinProjectFileList event received for projectId: ${projectId}`);
      try {
        if (!(await validateProjectAccess(projectId))) return;

        socket.join(`project:fileList:${projectId}`);
        logger.info(`Socket joined project file list room: project:fileList:${projectId}`);

        const files = await FilesService.getFilesStructureForProject(projectId);
        logger.debug(`Files structure for project ${projectId}: ${JSON.stringify(files)}`);
        socket.emit('fileList', files);
      } catch (error) {
        logger.error('Error in joinProjectFileList:', error);
        socket.emit('error', 'Error joining project file list');
      }
    });

    socket.on('joinProjectFile', async (projectId, fileId) => {
      try {
        if (!(await validateProjectAccess(projectId))) return;

        const roomName = `project-${projectId}:file-${fileId}`;
        socket.join(roomName);
        logger.info(`Socket joined file room: ${roomName}`);

        if (!fileMap.has(fileId)) {
          const doc = new Y.Doc();
          fileMap.set(fileId, doc);

          const fileContent = await FilesService.getFileContent(fileId);
          if (fileContent) {
            const ytext = doc.getText(fileId);
            ytext.insert(0, fileContent);
          }
        }

        const doc = fileMap.get(fileId);
        if (doc) {
          socket.emit('sync', Y.encodeStateAsUpdate(doc));
        } else {
          logger.error(`Document not found for file ${fileId}`);
        }
      } catch (error) {
        logger.error('Error in joinProjectFile:', error);
        socket.emit('error', 'Error joining project file');
      }
    });

    socket.on('update', async (projectId, fileId, update) => {
      try {
        if (!(await validateProjectAccess(projectId))) return;

        const doc = fileMap.get(fileId);
        if (doc) {
          try {
            Y.applyUpdate(doc, new Uint8Array(update));
          } catch (error) {
            logger.error(`Error applying update to document for file ${fileId}:`, error);
            socket.emit('error', 'Error applying update to document');
          }

          socket.to(`project-${projectId}:file-${fileId}`).emit('update', update);
        } else {
          logger.error(`No document found for file ${fileId}`);
        }
      } catch (error) {
        logger.error('Error in update:', error);
        socket.emit('error', 'Error updating file');
      }
    });

    socket.on('awareness-update', async (projectId, fileId, update) => {
      try {
        if (!(await validateProjectAccess(projectId))) return;

        socket.to(`project-${projectId}:file-${fileId}`).emit('awareness-update', update);
      } catch (error) {
        logger.error('Error in awareness-update:', error);
        socket.emit('error', 'Error in awareness update');
      }
    });

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.data.user?.email || 'Unknown User'}`);
    });
  });
}
