import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './env.js';
import { errorHandler } from './middleware/errorHandler.js';
import routes from './routes/index.js';

export function createApp(): express.Express {
  const app = express();

  app.use(cors({ origin: env.APP_URL, credentials: true }));
  app.use(cookieParser());
  app.use(express.json());
  app.use('/api', routes);
  app.use(errorHandler);

  return app;
}
