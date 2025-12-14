import { Router } from 'express';
import { disabledSlotsController } from './disabled-slots.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/auth.middleware';
import { UserRole } from '@prisma/client';

const router = Router();

router.use(authenticate);
router.use(requireRole(UserRole.OWNER));

router.post('/', disabledSlotsController.create);
router.get('/', disabledSlotsController.getAll);
router.delete('/:id', disabledSlotsController.delete);

export default router;
