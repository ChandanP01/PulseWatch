import { Router } from 'express';
import * as monitorController from '../controllers/monitor.controller.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';

const router = Router();

router.use(authenticate);

router.get('/', monitorController.listMonitors);
router.post(
  '/',
  authorize('member'),
  validate(monitorController.createMonitorSchema),
  monitorController.createMonitor
);

router.get('/:id', monitorController.getMonitor);
router.put(
  '/:id',
  authorize('member'),
  validate(monitorController.updateMonitorSchema),
  monitorController.updateMonitor
);
router.delete('/:id', authorize('admin'), monitorController.deleteMonitor);

router.patch('/:id/toggle', authorize('member'), monitorController.toggleMonitor);
router.post('/:id/check-now', authorize('member'), monitorController.checkNow);
router.get('/:id/heartbeats', monitorController.getHeartbeats);

export default router;
