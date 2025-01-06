import express from 'express';
import apiRouter from './routes/api.route';
import swaggerUi from 'swagger-ui-express';
import swaggerFile from './config/swagger-output.json';
import { PORT, NODE_ENV } from './config/env';
import bodyParser from 'body-parser';

import passport from 'passport';
import './config/passport';
import { initOAuth2Strategy } from './config/passport';


async function main() {
  const app = express();

  app.use(express.json());
  app.use(bodyParser.json());
  app.use(passport.initialize());
  await initOAuth2Strategy();

  app.use('/api', apiRouter);
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerFile));

  if (NODE_ENV === 'development') {
    require('./config/swagger');
  }

  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

main().catch((error) => {
  console.error("Error", error);
  process.exit(1);
});