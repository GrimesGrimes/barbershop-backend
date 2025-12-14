import { Response, NextFunction } from 'express';
import { scheduleService } from './schedule.service.js';
import { sendSuccess, sendCreated } from '../../utils/response.js';
import { AuthRequest } from '../../middleware/auth.middleware.js';
import {
    CreateDisabledSlotInput,
    GetOwnerBookingsQuery,
    UpdateOwnerScheduleInput
} from './schedule.schemas.js';

export class ScheduleController {
    async getOwnerBookings(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const query: GetOwnerBookingsQuery = req.query as any;
            const bookings = await scheduleService.getOwnerBookings(query);
            sendSuccess(res, { bookings });
        } catch (error) {
            next(error);
        }
    }

    async createDisabledSlot(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const input: CreateDisabledSlotInput = req.body;
            const disabledSlot = await scheduleService.createDisabledSlot(input);
            sendCreated(res, disabledSlot, 'Time slot disabled successfully');
        } catch (error) {
            next(error);
        }
    }

    async deleteDisabledSlot(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params;
            const result = await scheduleService.deleteDisabledSlot(id);
            sendSuccess(res, result);
        } catch (error) {
            next(error);
        }
    }

    async getAllDisabledSlots(_req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const disabledSlots = await scheduleService.getAllDisabledSlots();
            sendSuccess(res, { disabledSlots });
        } catch (error) {
            next(error);
        }
    }

    async updateOwnerSchedule(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const input: UpdateOwnerScheduleInput = req.body;
            const schedule = await scheduleService.updateOwnerSchedule(input);
            sendSuccess(res, schedule, 'Schedule updated successfully');
        } catch (error) {
            next(error);
        }
    }

    async getAllOwnerSchedules(_req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const schedules = await scheduleService.getAllOwnerSchedules();
            sendSuccess(res, { schedules });
        } catch (error) {
            next(error);
        }
    }
}

export const scheduleController = new ScheduleController();
