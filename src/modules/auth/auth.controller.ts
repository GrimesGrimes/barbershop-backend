import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service.js';
import { sendSuccess } from '../../utils/response.js';
import {
    RegisterInput,
    LoginInput,
    VerifyEmailConfirmInput,
    PasswordResetRequestInput,
    PasswordResetConfirmInput
} from './auth.schemas.js';

export class AuthController {
    async register(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const input: RegisterInput = req.body;
            const result = await authService.register(input);
            sendSuccess(res, result, result.message, 201);
        } catch (error) {
            next(error);
        }
    }

    async login(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const input: LoginInput = req.body;
            const result = await authService.login(input);
            sendSuccess(res, result);
        } catch (error) {
            next(error);
        }
    }

    // Phone verification removed
    /*
        async requestPhoneVerification(req: Request, res: Response, next: NextFunction): Promise<void> {
            // Removed
        }
    
        async confirmPhoneVerification(req: Request, res: Response, next: NextFunction): Promise<void> {
            // Removed
        }
    */

    async requestPasswordReset(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const input: PasswordResetRequestInput = req.body;
            const result = await authService.requestPasswordReset(input);
            sendSuccess(res, result);
        } catch (error) {
            next(error);
        }
    }

    async confirmPasswordReset(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const input: PasswordResetConfirmInput = req.body;
            const result = await authService.confirmPasswordReset(input);
            sendSuccess(res, result);
        } catch (error) {
            next(error);
        }
    }

    async requestEmailVerification(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = (req as any).user.userId;
            const result = await authService.requestEmailVerification(userId);
            sendSuccess(res, result);
        } catch (error) {
            next(error);
        }
    }

    async confirmEmailVerification(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = (req as any).user.userId;
            const input: VerifyEmailConfirmInput = req.body;
            const result = await authService.confirmEmailVerification(userId, input);
            sendSuccess(res, result);
        } catch (error) {
            next(error);
        }
    }
}

export const authController = new AuthController();
