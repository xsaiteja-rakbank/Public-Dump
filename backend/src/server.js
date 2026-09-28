import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import apiRouter from './api/routes.js';
import { pluginService } from './plugins/pluginService.js';
import { auditService } from './audit/auditService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'UP', service: 'Kong API Onboarding Platform Backend', timestamp: new Date().toISOString() });
});

// Mount API routes
app.use('/api', apiRouter);

// Serve frontend build if present
const frontendDist = path.resolve(__dirname, '../../frontend/dist');
app.use(express.static(frontendDist));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/health')) {
    return next();
  }
  res.sendFile(path.join(frontendDist, 'index.html'), (err) => {
    if (err) {
      // If frontend dist is not built yet, return friendly message
      res.json({
        message: 'Kong API Onboarding Automation API is running.',
        apiEndpoints: '/api',
        health: '/health'
      });
    }
  });
});

async function startServer() {
  await pluginService.initialize();
  await auditService.init();

  app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`🚀 Kong API Onboarding Backend running at http://localhost:${PORT}`);
    console.log(`   Health: http://localhost:${PORT}/health`);
    console.log(`   API Base: http://localhost:${PORT}/api`);
    console.log(`=======================================================`);
  });
}

startServer().catch(err => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
