import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import authRouter from './routes/auth.routes';
import projectRouter from './routes/project.routes';
import { mongoSanitize } from './middlewares/sanitize.middleware';
import { errorHandler } from './middlewares/error.middleware';
import { ENV } from './config/env';

const app = express();

// Security headers — explicit CSP for a REST API:
// defaultSrc/formAction/frameAncestors all 'none' since we serve no HTML.
// crossOriginResourcePolicy 'cross-origin' is required so browser clients
// can actually read CORS-enabled responses.
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'none'"],
        frameAncestors: ["'none'"],
        formAction: ["'none'"],
      },
    },
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }),
);

app.use(cors());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Strip $ and . from user-supplied keys to block NoSQL operator injection
app.use(mongoSanitize);

if (ENV.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRouter);
app.use('/api/projects', projectRouter);

app.use(errorHandler);

export default app;
