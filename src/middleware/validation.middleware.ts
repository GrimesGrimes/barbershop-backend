import { Request, Response, NextFunction } from 'express';
import { AnyZodObject } from 'zod';

export const validate = (schema: AnyZodObject) => {
    return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
        try {
            /* console.log('[Validation] Body:', JSON.stringify(req.body, null, 2)); */ // Uncomment for debug
            await schema.parseAsync({
                body: req.body,
                query: req.query,
                params: req.params
            });
            next();
        } catch (error) {
            console.error('[Validation Error]:', error);
            next(error);
        }
    };
};
