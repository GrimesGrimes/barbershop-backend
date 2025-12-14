import { Request, Response, NextFunction } from 'express';
import { servicesService } from './services.service.js';
import { sendSuccess } from '../../utils/response.js';

export class ServicesController {
    async getAllServices(_req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const services = await servicesService.getAllServices();
            sendSuccess(res, services);
        } catch (error) {
            next(error);
        }
    }

    async getServiceById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params;
            const service = await servicesService.getServiceById(id);
            sendSuccess(res, service);
        } catch (error) {
            next(error);
        }
    }
}

export const servicesController = new ServicesController();
