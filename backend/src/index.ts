import express from 'express';
import apiRouter from './routes/api.route';
import swaggerUi from 'swagger-ui-express';
import swaggerFile from './config/swagger-output.json';
import { PORT, NODE_ENV } from './config/env';
import bodyParser from 'body-parser';
import passport from 'passport';
import './config/passport';
import { initOAuth2Strategy } from './config/passport';
import { Request, Response, NextFunction } from 'express';
import logger from './config/logger';
import { Server } from 'socket.io';
import http from 'http';
import { configureSocketIO } from './config/socket-setup';
import path from 'path';

async function main() {
  const app = express();

  app.use(express.json());
  app.use(bodyParser.json());
  app.use(passport.initialize());
  await initOAuth2Strategy();
  
  app.use((req: Request, res: Response, next: NextFunction) => {
    logger.info(`${req.method} ${req.url}`);
    next();
  });

  const server = http.createServer(app);
  const io = new Server(server, {
    cors: {
      origin: '*',
    },
  });

  configureSocketIO(io);
  // Middleware to store io in req object
  app.use((req: Request, res: Response, next: NextFunction) => {
    req.io = io;
    next();
  });

  app.use('/api', apiRouter);
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerFile));

  app.use(express.static(path.resolve(__dirname, './public')));

  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, './public/index.html'));
  });
  
  server.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
  });

  return server;
}

const server = main().catch((error) => {
  console.error("Error", error);
  process.exit(1);
});

export default server;