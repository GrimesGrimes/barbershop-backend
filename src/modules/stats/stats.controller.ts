import { Request, Response, NextFunction } from 'express';
import { statsService } from './stats.service';
import { z } from 'zod';

const getStatsSchema = z.object({
    from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(), // YYYY-MM-DD
    to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),   // YYYY-MM-DD
});

export class StatsController {
    async getOwnerStats(req: Request, res: Response, next: NextFunction) {
        try {
            const validation = getStatsSchema.safeParse(req.query);

            if (!validation.success) {
                res.status(400).json({ error: 'Invalid date format' });
                return;
            }

            const { from: fromQuery, to: toQuery } = validation.data;

            // Si no vienen, por defecto: inicio de mes hasta hoy
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

            let from = startOfMonth;
            let to = now;

            if (fromQuery) {
                const [y, m, d] = fromQuery.split('-').map(Number);
                from = new Date(y, m - 1, d);
            }

            if (toQuery) {
                const [y, m, d] = toQuery.split('-').map(Number);
                to = new Date(y, m - 1, d);
            }

            const stats = await statsService.getOwnerStats({ from, to });
            res.json(stats);
        } catch (error) {
            next(error);
        }
    }
}

export const statsController = new StatsController();
