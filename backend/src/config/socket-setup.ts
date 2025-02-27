import { Server, Socket } from 'socket.io';
import * as Y from 'yjs';
import { isAuthenticated } from '../middlewares/isAuthenticated';
import logger from './logger';
import FilesService from '../services/files.service';
import ProjectService from '../services/project.service';
import { LRUCache } from 'lru-cache';

const fileMap = new Map<string, Y.Doc>();
const saveDebounceTimers = new Map<string, NodeJS.Timeout>();
const fileRemovalTimers = new Map<string, NodeJS.Timeout>();

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

function scheduleFileRemoval(fileId: string) {
  if (fileRemovalTimers.has(fileId)) {
    clearTimeout(fileRemovalTimers.get(fileId));
  }

  const timer = setTimeout(() => {
    fileMap.delete(fileId);
    fileRemovalTimers.delete(fileId);
    logger.info(`File ${fileId} removed from memory due to inactivity.`);
  }, 1000 * 60 * 5); // 5 minutes

  fileRemovalTimers.set(fileId, timer);
}

function resetFileRemovalTimer(fileId: string) {
  if (fileRemovalTimers.has(fileId)) {
    clearTimeout(fileRemovalTimers.get(fileId));
    fileRemovalTimers.delete(fileId);
  }
  scheduleFileRemoval(fileId);
}

async function saveFile(fileId: string) {
  if (!fileMap.has(fileId)) {
    logger.error(`Cannot save file. No document found for fileId: ${fileId}`);
    return;
  }

  try {
    const doc = fileMap.get(fileId);
    if (doc) {
      const ytext = doc.getText(fileId);
      const docContentString = ytext.toString();
      await FilesService.saveFileContent(fileId, docContentString);
      logger.info(`File ${fileId} saved successfully.`);
    }
  } catch (error) {
    logger.error(`Error saving file ${fileId}:`, error);
  }
  resetFileRemovalTimer(fileId);
}

function scheduleFileSave(fileId: string) {
  if (saveDebounceTimers.has(fileId)) {
    clearTimeout(saveDebounceTimers.get(fileId)); 
  }

  const timer = setTimeout(() => {
    saveFile(fileId); 
    saveDebounceTimers.delete(fileId); 
  }, 5000); 

  saveDebounceTimers.set(fileId, timer);
  resetFileRemovalTimer(fileId);
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

    async function validateProjectAccess(projectId: string) {
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
      try {
        if (!(await validateProjectAccess(projectId))) return;

        socket.join(`project:fileList:${projectId}`);
        logger.info(`Socket joined project file list room: project:fileList:${projectId}`);

        const files = await FilesService.getFilesStructureForProject(projectId);
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

          const mimeType = await FilesService.getFileMimeType(fileId);
          if(!mimeType.includes('text')) {
            logger.error(`File ${fileId} is not a text file`);
            socket.emit('error', 'Plik nie jest plikiem  tekstowym.');
            return;
          }
            const fileContentBuffer = await FilesService.getFileContent(fileId);
            const fileContent = new TextDecoder('utf-8').decode(fileContentBuffer);
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
        resetFileRemovalTimer(fileId);
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

          // Schedule the file save
          scheduleFileSave(fileId);
        } else {
          logger.error(`No document found for file ${fileId}`);
        }
        resetFileRemovalTimer(fileId);
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

    socket.on('saveFile', async (projectId, fileId) => {
      try {
        if (!(await validateProjectAccess(projectId))) return;
        await saveFile(fileId);
        socket.emit('fileSaved', fileId);
      } catch (error) {
        logger.error('Error in saveFile:', error);
        socket.emit('error', 'Error saving file');
      }
    });

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.data.user?.email || 'Unknown User'}`);
    });
  });
}
