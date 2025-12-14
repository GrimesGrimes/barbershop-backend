import { z } from 'zod';

export const updateProfileSchema = z.object({
    body: z.object({
        fullName: z.string().min(2).max(100).optional(),
        email: z.string().email().optional(), // We don't want empty string for email
        phone: z.string().min(5).max(20).optional().nullable(), // Added phone
        avatarUrl: z.string().url().optional().nullable(),
        gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY']).optional(),
        birthDate: z.string().datetime().optional().nullable(), // Allow ISO string or null
        notificationChannel: z.enum(['WHATSAPP', 'SMS', 'EMAIL']).optional(),
        marketingOptIn: z.boolean().optional(),
        language: z.string().optional(),
    })
});

export const changePasswordSchema = z.object({
    body: z.object({
        currentPassword: z.string().min(1),
        newPassword: z.string().min(6),
    })
});

export const updateBarbershopSchema = z.object({
    body: z.object({
        name: z.string().min(1).optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
        city: z.string().optional(),
        description: z.string().optional(),
        openTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
        closeTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
        slotMinutes: z.number().int().min(5).max(180).optional(),
        logoUrl: z.string().url().optional().or(z.literal('')),
        bookingPolicy: z.string().optional(),
    })
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>['body'];
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>['body'];
export type UpdateBarbershopInput = z.infer<typeof updateBarbershopSchema>['body'];
