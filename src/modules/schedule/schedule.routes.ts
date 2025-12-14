import { Router } from 'express';
import { scheduleController } from './schedule.controller.js';
import { authenticate, requireRole } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validation.middleware.js';
import {
    createDisabledSlotSchema,
    getOwnerBookingsQuerySchema,
    updateOwnerScheduleSchema
} from './schedule.schemas.js';
import { UserRole } from '@prisma/client';

const router = Router();

// All routes require authentication and OWNER role
router.use(authenticate);
router.use(requireRole(UserRole.OWNER));

// GET /schedule/bookings?date=YYYY-MM-DD
router.get(
    '/bookings',
    validate(getOwnerBookingsQuerySchema),
    scheduleController.getOwnerBookings.bind(scheduleController)
);

// POST /schedule/disabled-slots
router.post(
    '/disabled-slots',
    validate(createDisabledSlotSchema),
    scheduleController.createDisabledSlot.bind(scheduleController)
);

// GET /schedule/disabled-slots
router.get(
    '/disabled-slots',
    scheduleController.getAllDisabledSlots.bind(scheduleController)
);

// DELETE /schedule/disabled-slots/:id
router.delete(
    '/disabled-slots/:id',
    scheduleController.deleteDisabledSlot.bind(scheduleController)
);

// PUT /schedule/owner-schedule
router.put(
    '/owner-schedule',
    validate(updateOwnerScheduleSchema),
    scheduleController.updateOwnerSchedule.bind(scheduleController)
);

// GET /schedule/owner-schedule
router.get(
    '/owner-schedule',
    scheduleController.getAllOwnerSchedules.bind(scheduleController)
);

export default router;
