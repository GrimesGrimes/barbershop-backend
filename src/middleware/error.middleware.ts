import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors.js';
import { ZodError } from 'zod';

export const errorMiddleware = (
    err: Error,
    _req: Request,
    res: Response,
    _next: NextFunction
): void => {
    // Handle Zod validation errors
    if (err instanceof ZodError) {
        const errors = err.errors.map(e => ({
            path: e.path.join('.'),
            message: e.message
        }));

        res.status(400).json({
            success: false,
            error: 'Validation Error',
            details: errors
        });
        return;
    }

    // Handle custom application errors
    if (err instanceof AppError) {
        const response: Record<string, unknown> = {
            success: false,
            message: err.message
        };

        // Include error code if available (e.g., 'EMAIL_NOT_VERIFIED')
        if ('code' in err && typeof err.code === 'string') {
            response.code = err.code;
        }

        res.status(err.statusCode).json(response);
        return;
    }

    // Handle unknown errors
    console.error('❌ Unhandled Error:', err);

    const isDevelopment = process.env.NODE_ENV === 'development';

    res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        ...(isDevelopment && { stack: err.stack, details: err.message })
    });
};
