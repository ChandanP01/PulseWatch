import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/register', validate(authController.registerSchema), authController.register);
router.post('/login', validate(authController.loginSchema), authController.login);
router.post('/refresh', validate(authController.refreshSchema), authController.refresh);
router.get('/me', authenticate, authController.getMe);
router.put('/profile', authenticate, validate(authController.updateProfileSchema), authController.updateProfile);

export default router;
