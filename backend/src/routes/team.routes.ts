import { Router } from 'express';
import * as teamController from '../controllers/team.controller.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';

const router = Router();

router.use(authenticate);

router.get('/', teamController.listMembers);
router.post(
  '/invite',
  authorize('admin'),
  validate(teamController.inviteMemberSchema),
  teamController.inviteMember
);
router.patch(
  '/:id/role',
  authorize('admin'),
  validate(teamController.updateRoleSchema),
  teamController.updateRole
);
router.delete('/:id', authorize('admin'), teamController.removeMember);

export default router;
