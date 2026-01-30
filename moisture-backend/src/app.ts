import express from 'express';
import cors from 'cors';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import plantsRouter from './routes/plants.routes';
import authRouter from './routes/auth.routes';

export function createApp() {
  const app = express();
  app.use(
    cors({
      origin: ['http://localhost:5173', 'http://localhost:8080'],
      credentials: true,
    })
  );
  app.use(express.json());

  const openapiSpec = swaggerJsdoc({
    definition: {
      openapi: '3.0.3',
      info: { title: 'Plants API', version: '1.0.0' },
      servers: [{ url: 'http://localhost:8001' }],
    },
    apis: ['./src/routes/**/*.ts', './src/docs/components.ts'],
  });

  app.get('/api/openapi.json', (_req, res) => res.json(openapiSpec));
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openapiSpec));

  app.use('/api/plants', plantsRouter);
  app.use('/api/auth', authRouter);

  app.get('/api/health', (_req, res) =>
    res.json({ status: 'ok', ts: new Date().toISOString() })
  );

  return app;
}
