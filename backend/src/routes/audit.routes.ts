import { Router } from 'express';
import * as auditController from '../controllers/audit.controller.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';

const router = Router();

router.use(authenticate);
router.get('/', authorize('admin'), auditController.listAuditLogs);

export default router;
