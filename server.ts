/**
 * Full-Stack Application Server
 * Express Backend + Vite Middleware (Full-Stack Unified Dev & Prod)
 */
import express, { Request, Response, NextFunction } from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer as createViteServer } from 'vite';
import { config } from './server/config.js';
import { db } from './server/database.js';
import { authMiddleware } from './server/security.js';
import { authRouter } from './server/routes/auth.js';
import { itemsRouter } from './server/routes/items.js';
import { systemRouter } from './server/routes/system.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function bootstrap() {
  const app = express();

  // Basic Middlewares
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // CORS Headers
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', config.CORS_ORIGIN);
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // Telemetry & Request Tracking
  app.use((req, _res, next) => {
    if (req.path.startsWith('/api')) {
      db.incrementRequests();
    }
    next();
  });

  // Attach token authentication
  app.use(authMiddleware as any);

  // Mount API Routers
  app.use('/api/auth', authRouter);
  app.use('/api/items', itemsRouter);
  app.use('/api', systemRouter);

  // Global Error Handler for API
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error('API Error:', err);
    res.status(err.status || 500).json({
      error: 'Internal Server Error',
      message: err.message || 'An unexpected server error occurred.',
    });
  });

  // Frontend Integration
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    // Vite Dev Server middleware mode
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: '0.0.0.0',
        port: config.PORT,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });

    app.use(vite.middlewares);
  } else {
    // Production static files
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(config.PORT, config.HOST, () => {
    console.log(`🚀 FullStack Hub server running at http://${config.HOST}:${config.PORT}`);
    console.log(`⚡ API endpoints mounted at http://${config.HOST}:${config.PORT}/api`);
  });
}

bootstrap().catch((err) => {
  console.error('Fatal bootstrap error:', err);
  process.exit(1);
});
