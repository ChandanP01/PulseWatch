import { Router } from 'express';
import * as analyticsController from '../controllers/analytics.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);
router.get('/overview', analyticsController.getOverview);

export default router;
