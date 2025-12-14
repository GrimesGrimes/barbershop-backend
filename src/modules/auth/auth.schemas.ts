import { z } from 'zod';

// Phone number validation (Colombian format example, adjust as needed)
const phoneRegex = /^\+?[1-9]\d{1,14}$/;

export const registerSchema = z.object({
    body: z.object({
        fullName: z.string().min(2, 'Full name must be at least 2 characters').max(100),
        email: z.string().email('Invalid email format'), // REQUIRED
        phone: z.string().regex(phoneRegex, 'Invalid phone number format').optional().nullable(), // OPTIONAL
        username: z.string().min(3, 'Username must be at least 3 characters').max(30),
        password: z.string().min(6, 'Password must be at least 6 characters')
    })
});

export const loginSchema = z.object({
    body: z.object({
        credential: z.string().min(1, 'Phone, username or email is required'), // Can be phone, username or email
        password: z.string().min(1, 'Password is required')
    })
});

export const verifyPhoneRequestSchema = z.object({
    body: z.object({
        phone: z.string().regex(phoneRegex, 'Invalid phone number format')
    })
});

export const verifyPhoneConfirmSchema = z.object({
    body: z.object({
        phone: z.string().regex(phoneRegex, 'Invalid phone number format'),
        code: z.string().length(6, 'Verification code must be 6 digits')
    })
});

export const passwordResetRequestSchema = z.object({
    body: z.object({
        email: z.string().email('Invalid email format')
    })
});

export const passwordResetConfirmSchema = z.object({
    body: z.object({
        email: z.string().email('Invalid email format'),
        code: z.string().length(6, 'Verification code must be 6 digits'),
        newPassword: z.string().min(6, 'Password must be at least 6 characters')
    })
});

export const verifyEmailRequestSchema = z.object({});

export const verifyEmailConfirmSchema = z.object({
    body: z.object({
        code: z.string().length(6, 'Verification code must be 6 digits')
    })
});

export type RegisterInput = z.infer<typeof registerSchema>['body'];
export type LoginInput = z.infer<typeof loginSchema>['body'];
export type VerifyPhoneRequestInput = z.infer<typeof verifyPhoneRequestSchema>['body'];
export type VerifyPhoneConfirmInput = z.infer<typeof verifyPhoneConfirmSchema>['body'];
export type VerifyEmailRequestInput = z.infer<typeof verifyEmailRequestSchema>; // Empty
export type VerifyEmailConfirmInput = z.infer<typeof verifyEmailConfirmSchema>['body'];
export type PasswordResetRequestInput = z.infer<typeof passwordResetRequestSchema>['body'];
export type PasswordResetConfirmInput = z.infer<typeof passwordResetConfirmSchema>['body'];
