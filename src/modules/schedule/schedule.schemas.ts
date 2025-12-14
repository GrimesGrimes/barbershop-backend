import { z } from 'zod';

export const createDisabledSlotSchema = z.object({
    body: z.object({
        startTime: z.string().datetime('Invalid datetime format'),
        endTime: z.string().datetime('Invalid datetime format'),
        reason: z.string().max(200).optional()
    })
});

export const getOwnerBookingsQuerySchema = z.object({
    query: z.object({
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in format YYYY-MM-DD'),
        status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED']).optional()
    })
});

export const updateOwnerScheduleSchema = z.object({
    body: z.object({
        weekday: z.number().int().min(0).max(6),
        startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be in format HH:mm'),
        endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be in format HH:mm'),
        active: z.boolean().optional()
    })
});

export type CreateDisabledSlotInput = z.infer<typeof createDisabledSlotSchema>['body'];
export type GetOwnerBookingsQuery = z.infer<typeof getOwnerBookingsQuerySchema>['query'];
export type UpdateOwnerScheduleInput = z.infer<typeof updateOwnerScheduleSchema>['body'];
