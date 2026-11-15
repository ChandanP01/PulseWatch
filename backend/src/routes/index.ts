import { Router } from 'express';
import authRoutes from './auth.routes.js';
import monitorRoutes from './monitor.routes.js';
import incidentRoutes from './incident.routes.js';
import teamRoutes from './team.routes.js';
import auditRoutes from './audit.routes.js';
import analyticsRoutes from './analytics.routes.js';

const router = Router();

router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    service: 'PulseWatch Backend API',
  });
});

router.use('/auth', authRoutes);
router.use('/monitors', monitorRoutes);
router.use('/incidents', incidentRoutes);
router.use('/team', teamRoutes);
router.use('/audit', auditRoutes);
router.use('/analytics', analyticsRoutes);

export default router;
