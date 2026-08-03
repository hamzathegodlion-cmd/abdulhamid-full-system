import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

import authRoutes from './server/routes/authRoutes';
import productRoutes from './server/routes/productRoutes';
import inventoryRoutes from './server/routes/inventoryRoutes';
import salesRoutes from './server/routes/salesRoutes';
import cashierRoutes from './server/routes/cashierRoutes';
import dashboardRoutes from './server/routes/dashboardRoutes';
import reportRoutes from './server/routes/reportRoutes';
import customerRoutes from './server/routes/customerRoutes';
import supplierRoutes from './server/routes/supplierRoutes';
import categoryRoutes from './server/routes/categoryRoutes';
import auditRoutes from './server/routes/auditRoutes';
import userRoutes from './server/routes/userRoutes';
import { errorHandler } from './server/middleware';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON Body Parser
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Static Uploads
  const publicUploads = path.join(process.cwd(), 'public', 'uploads');
  app.use('/uploads', express.static(publicUploads));

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', system: 'SmartPOS Engine', timestamp: new Date().toISOString() });
  });

  // Mount API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/products', productRoutes);
  app.use('/api/inventory', inventoryRoutes);
  app.use('/api/sales', salesRoutes);
  app.use('/api/cashiers', cashierRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/reports', reportRoutes);
  app.use('/api/customers', customerRoutes);
  app.use('/api/suppliers', supplierRoutes);
  app.use('/api/categories', categoryRoutes);
  app.use('/api/audit', auditRoutes);
  app.use('/api/users', userRoutes);

  // Global Error Handler
  app.use(errorHandler);

  // Serve Frontend / Vite Middleware
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SmartPOS Server] Running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Fatal server boot error:', err);
  process.exit(1);
});
