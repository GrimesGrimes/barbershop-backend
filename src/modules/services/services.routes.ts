import { Router } from 'express';
import { servicesController } from './services.controller.js';

const router = Router();

// GET /services - Get all active services
router.get(
    '/',
    servicesController.getAllServices.bind(servicesController)
);

// GET /services/:id - Get service by ID
router.get(
    '/:id',
    servicesController.getServiceById.bind(servicesController)
);

export default router;
