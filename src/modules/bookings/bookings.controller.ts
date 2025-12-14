import { Request, Response, NextFunction } from 'express';
import { bookingsService } from './bookings.service.js';
import { sendSuccess, sendCreated } from '../../utils/response.js';
import { AuthRequest } from '../../middleware/auth.middleware.js';
import { CreateBookingInput, AvailableSlotsQuery, GetMyBookingsQuery, OwnerBookingsQuery, UpdateBookingStatusInput } from './bookings.schemas.js';

export class BookingsController {
    async getServices(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const services = await bookingsService.getServices();
        sendSuccess(res, { services });
    } catch (error) {
        next(error);
    }
}

    async getAvailableSlots(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const query: AvailableSlotsQuery = req.query as any;
            const slots = await bookingsService.getAvailableSlots(query);
            sendSuccess(res, { slots });
        } catch (error) {
            next(error);
        }
    }

    async createBooking(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const clientId = req.user!.userId;
            const input: CreateBookingInput = req.body;
            const booking = await bookingsService.createBooking(clientId, input);
            sendCreated(res, booking, 'Booking created successfully');
        } catch (error) {
            next(error);
        }
    }

    async getMyBookings(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const clientId = req.user!.userId;
            const query: GetMyBookingsQuery = req.query as any;
            const bookings = await bookingsService.getMyBookings(clientId, query);
            sendSuccess(res, { bookings });
        } catch (error) {
            next(error);
        }
    }

    async getOwnerBookings(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const query: OwnerBookingsQuery = req.query as any;
            const bookings = await bookingsService.getOwnerBookings(query);
            sendSuccess(res, { bookings });
        } catch (error) {
            next(error);
        }
    }

    async updateBookingStatus(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params;
            const body: UpdateBookingStatusInput = req.body;
            const booking = await bookingsService.updateBookingStatus(id, body);
            sendSuccess(res, { booking });
        } catch (error) {
            next(error);
        }
    }

    async createOwnerBlock(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const result = await bookingsService.createOwnerBlock(req.body);
            sendCreated(res, result);
        } catch (error) {
            next(error);
        }
    }

    async deleteOwnerBlock(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params;
            await bookingsService.deleteOwnerBlock(id);
            sendSuccess(res, { message: 'Block deleted' });
        } catch (error) {
            next(error);
        }
    }

    async getOwnerBlocks(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const { date } = req.query as { date: string };
            const blocks = await bookingsService.getOwnerBlocks(date);
            sendSuccess(res, { blocks });
        } catch (error) {
            next(error);
        }
    }
}

export const bookingsController = new BookingsController();
