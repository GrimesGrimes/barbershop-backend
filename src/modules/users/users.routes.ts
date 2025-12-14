import { Router } from 'express';
import { usersController } from './users.controller';
import { authenticate, requireRole } from '../../middleware/auth.middleware';
import { UserRole } from '@prisma/client';

const router = Router();

router.use(authenticate);

router.get('/me', usersController.getMe);
router.put('/me', usersController.updateMe);
router.put('/me/password', usersController.changePassword);

router.put('/owner/profile', requireRole(UserRole.OWNER), usersController.updateBarbershop);

export default router;
