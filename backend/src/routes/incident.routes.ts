import { Router } from 'express';
import * as incidentController from '../controllers/incident.controller.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';

const router = Router();

router.use(authenticate);

router.get('/', incidentController.listIncidents);
router.get('/:id', incidentController.getIncident);
router.post('/:id/acknowledge', authorize('member'), incidentController.acknowledgeIncident);

export default router;
