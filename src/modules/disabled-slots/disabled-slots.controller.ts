import { Request, Response, NextFunction } from 'express';
import { disabledSlotsService } from './disabled-slots.service';
import { z } from 'zod';

const createDisabledSlotSchema = z.object({
    startTime: z.string().datetime(),
    endTime: z.string().datetime(),
    reason: z.string().optional(),
});

export class DisabledSlotsController {
    async create(req: Request, res: Response, next: NextFunction) {
        try {
            const validated = createDisabledSlotSchema.parse(req.body);
            const slot = await disabledSlotsService.createDisabledSlot({
                startTime: new Date(validated.startTime),
                endTime: new Date(validated.endTime),
                reason: validated.reason,
            });
            res.status(201).json(slot);
        } catch (error) {
            next(error);
        }
    }

    async getAll(_req: Request, res: Response, next: NextFunction) {
        try {
            const slots = await disabledSlotsService.getFutureDisabledSlots();
            res.json(slots);
        } catch (error) {
            next(error);
        }
    }

    async delete(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            await disabledSlotsService.deleteDisabledSlot(id);
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }
}

export const disabledSlotsController = new DisabledSlotsController();
