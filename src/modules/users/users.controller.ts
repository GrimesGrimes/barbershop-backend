import { Request, Response, NextFunction } from 'express';
import { usersService } from './users.service';
import { updateProfileSchema, changePasswordSchema, updateBarbershopSchema } from './users.schemas';

export class UsersController {
    async getMe(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).user.userId;
            const profile = await usersService.getUserProfile(userId);
            res.json(profile);
        } catch (error) {
            next(error);
        }
    }

    async updateMe(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).user.userId;
            const validated = updateProfileSchema.parse(req);
            const updated = await usersService.updateUserProfile(userId, validated.body);
            res.json(updated);
        } catch (error) {
            next(error);
        }
    }

    async changePassword(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).user.userId;
            const validated = changePasswordSchema.parse(req);
            await usersService.changePassword(userId, validated.body);
            res.json({ success: true, message: 'Contraseña actualizada' });
        } catch (error) {
            next(error);
        }
    }

    async updateBarbershop(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).user.userId;
            const validated = updateBarbershopSchema.parse(req);
            const barbershop = await usersService.updateBarbershop(userId, validated.body);
            res.json(barbershop);
        } catch (error) {
            next(error);
        }
    }
}

export const usersController = new UsersController();
