import { z } from 'zod';

export const createBookingSchema = z.object({
    body: z.object({
        serviceId: z.string().min(1, 'Service ID is required'),
        startTime: z.string().datetime({ message: 'Invalid datetime format' }),
        notes: z.string().max(500).optional()
    })
});

export const availableSlotsQuerySchema = z.object({
    query: z.object({
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in format YYYY-MM-DD'),
        serviceId: z.string().cuid('Invalid service ID').optional()
    })
});

export const getMyBookingsQuerySchema = z.object({
    query: z.object({
        status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED']).optional()
    })
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>['body'];
export type AvailableSlotsQuery = z.infer<typeof availableSlotsQuerySchema>['query'];
export type GetMyBookingsQuery = z.infer<typeof getMyBookingsQuerySchema>['query'];

// Owner types
export interface OwnerBookingsQuery {
    date?: string;   // YYYY-MM-DD (opcional)
    status?: string; // PENDING | CONFIRMED | COMPLETED | CANCELLED
}

export interface UpdateBookingStatusInput {
    status: string;  // luego se convierte a BookingStatus
}

export const createOwnerBlockSchema = z.object({
    body: z.object({
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in format YYYY-MM-DD'),
        startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Format HH:mm').optional(),
        endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Format HH:mm').optional(),
        reason: z.string().optional(),
        fullDay: z.boolean().optional()
    })
});

export type CreateOwnerBlockInput = z.infer<typeof createOwnerBlockSchema>['body'];
