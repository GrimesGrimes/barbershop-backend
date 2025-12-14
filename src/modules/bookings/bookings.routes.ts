import { Router } from 'express';
import { bookingsController } from './bookings.controller.js';
import { authenticate, requireRole } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validation.middleware.js';
import { UserRole } from '@prisma/client';
import {
    createBookingSchema,
    availableSlotsQuerySchema,
    getMyBookingsQuerySchema,
    createOwnerBlockSchema
} from './bookings.schemas.js';

const router = Router();

// GET /bookings/services (public or authenticated)
router.get(
    '/services',
    bookingsController.getServices.bind(bookingsController)
);

// GET /bookings/available-slots?date=YYYY-MM-DD&serviceId=xxx (public or authenticated)
router.get(
    '/available-slots',
    validate(availableSlotsQuerySchema),
    bookingsController.getAvailableSlots.bind(bookingsController)
);

// All routes below require authentication
router.use(authenticate);

// POST /bookings
router.post(
    '/',
    validate(createBookingSchema),
    bookingsController.createBooking.bind(bookingsController)
);

// GET /bookings/me
router.get(
    '/me',
    validate(getMyBookingsQuerySchema),
    bookingsController.getMyBookings.bind(bookingsController)
);

// Owner routes
router.get(
    '/owner/bookings',
    requireRole(UserRole.OWNER),
    bookingsController.getOwnerBookings.bind(bookingsController)
);

router.patch(
    '/:id/status',
    requireRole(UserRole.OWNER),
    bookingsController.updateBookingStatus.bind(bookingsController)
);

// Block management (Owner only)
router.post(
    '/blocks',
    requireRole(UserRole.OWNER),
    validate(createOwnerBlockSchema),
    bookingsController.createOwnerBlock.bind(bookingsController)
);

router.get(
    '/blocks',
    requireRole(UserRole.OWNER),
    bookingsController.getOwnerBlocks.bind(bookingsController)
);

router.delete(
    '/blocks/:id',
    requireRole(UserRole.OWNER),
    bookingsController.deleteOwnerBlock.bind(bookingsController)
);

export default router;
