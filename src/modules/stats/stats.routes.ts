import { Router } from 'express';
import { statsController } from './stats.controller';
import { authenticate, requireRole } from '../../middleware/auth.middleware';
import { UserRole } from '@prisma/client';

const router = Router();

router.use(authenticate);
router.use(requireRole(UserRole.OWNER));

router.get('/', statsController.getOwnerStats);

export default router;
