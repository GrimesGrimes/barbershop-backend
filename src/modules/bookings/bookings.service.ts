import { bookingsRepository } from './bookings.repository.js';
import { usersRepository } from '../users/users.repository.js';
import { CreateBookingInput, AvailableSlotsQuery, GetMyBookingsQuery, OwnerBookingsQuery, UpdateBookingStatusInput } from './bookings.schemas.js';
import { BadRequestError, NotFoundError, EmailNotVerifiedError } from '../../utils/errors.js';
import { BookingStatus } from '@prisma/client';
import { SERVICE_DURATION_MIN, SLOT_TOTAL_MIN, addMinutes } from '../../utils/time.js';

interface TimeSlot {
    startTime: string;
    endTime: string;
    available: boolean;
}

export class BookingsService {

    // Fixed slots - as per requirements (35 min service + 5 min break = 40 min total)
    // Morning: 09:00, 09:40, 10:20, 11:00 (ends 11:40)
    // Afternoon: 14:00, 14:40, 15:20, 16:00, 16:40, 17:20 (ends 18:00)
    private readonly MORNING_SLOTS = ['09:00', '09:40', '10:20', '11:00'];
    private readonly AFTERNOON_SLOTS = ['14:00', '14:40', '15:20', '16:00', '16:40', '17:20'];

    /**
     * Helper to construct a definitive Date object for a YYYY-MM-DD + HH:mm string in local time (America/Lima)
     * We assume the inputs are in the context of the user's timezone.
     */
    private getSlotDate(dateStr: string, timeStr: string): Date {
        // Construct string with fixed offset for Peru (UTC-5)
        // Format: YYYY-MM-DDTHH:mm:00.000-05:00
        return new Date(`${dateStr}T${timeStr}:00.000-05:00`);
    }

    /**
     * Check if a time slot overlaps with disabled slots
     */
    private isSlotDisabled(
        slotStart: Date,
        slotEnd: Date,
        disabledSlots: Array<{ startTime: Date; endTime: Date }>
    ): boolean {
        return disabledSlots.some(disabled => {
            // Check overlap
            return slotStart < disabled.endTime && slotEnd > disabled.startTime;
        });
    }

    /**
     * Check if a time slot overlaps with existing bookings
     */
    private isSlotBooked(
        slotStart: Date,
        slotEnd: Date,
        bookings: Array<{ startTime: Date; endTime: Date }>
    ): boolean {
        return bookings.some(booking => {
            // Check overlap
            return slotStart < booking.endTime && slotEnd > booking.startTime;
        });
    }

    /**
     * Get all active services
     */
    async getServices() {
        return bookingsRepository.getAllActiveServices();
    }

    /**
     * Generate all possible time slots for a given date based on FIXED BLOCKS.
     */
    async getAvailableSlots(query: AvailableSlotsQuery): Promise<TimeSlot[]> {
        const { date } = query; // YYYY-MM-DD

        // Calculate weekday in Peru context (if needed for strict schedule in future)
        // const dayInPeru = new Date(`${date}T00:00:00.000-05:00`);
        // const weekdayLocal = dayInPeru.getDay();

        // Get owner schedule - OPTIONAL. 
        // We logic allows slots even if schedule is missing or fails, ensuring availability shows up.
        // If strict business hours are required later, we can re-enable the check.
        // const ownerSchedule = await bookingsRepository.getOwnerScheduleByWeekday(weekdayLocal);

        // Define day range for queries
        const dayStart = new Date(`${date}T00:00:00.000-05:00`);
        const dayEnd = new Date(`${date}T23:59:59.999-05:00`);

        const existingBookings = await bookingsRepository.findBookingsByDateRange(dayStart, dayEnd);
        const disabledSlots = await bookingsRepository.getDisabledSlotsByDateRange(dayStart, dayEnd);

        // Check if FULL DAY is disabled (heuristic: disabled slot covers the whole work day or entire day)
        const isFullDayDisabled = disabledSlots.some(d =>
            d.startTime.getTime() <= dayStart.getTime() && d.endTime.getTime() >= dayEnd.getTime()
        );

        if (isFullDayDisabled) {
            return [];
        }

        const slots: TimeSlot[] = [];
        const allSlotTimes = [...this.MORNING_SLOTS, ...this.AFTERNOON_SLOTS];

        const now = new Date();
        const PAST_TOLERANCE_MS = 60_000;
        const nowWithTolerance = new Date(now.getTime() - PAST_TOLERANCE_MS);

        for (const timeStr of allSlotTimes) {
            const slotStart = this.getSlotDate(date, timeStr);
            const slotEnd = addMinutes(slotStart, SLOT_TOTAL_MIN); // 40 mins

            // Check past
            if (slotStart.getTime() < nowWithTolerance.getTime()) {
                continue; // Skip past slots
            }

            // Check disabled
            if (this.isSlotDisabled(slotStart, slotEnd, disabledSlots)) {
                continue;
            }

            // Check bookings
            if (this.isSlotBooked(slotStart, slotEnd, existingBookings)) {
                continue;
            }

            slots.push({
                startTime: slotStart.toISOString(),
                endTime: slotEnd.toISOString(),
                available: true
            });
        }

        return slots;
    }

    /**
     * Create a new booking
     */
    async createBooking(clientId: string, input: CreateBookingInput) {
        // Verify service exists
        const service = await bookingsRepository.findServiceById(input.serviceId);
        if (!service) {
            throw new NotFoundError('Servicio no encontrado');
        }

        const user = await usersRepository.findUserById(clientId);
        if (!user?.emailVerified) {
            throw new EmailNotVerifiedError('Para poder reservar una cita, primero debes verificar tu correo electrónico.');
        }

        const startTime = new Date(input.startTime);
        const endTime = addMinutes(startTime, SERVICE_DURATION_MIN); // 35 min effective service

        // Check past
        const now = new Date();
        const nowWithTolerance = new Date(now.getTime() - 60_000);
        if (startTime.getTime() < nowWithTolerance.getTime()) {
            throw new BadRequestError('No se puede reservar en el pasado.');
        }

        // Check conflict (Bookings)
        const hasConflict = await bookingsRepository.checkBookingConflict(startTime, endTime);
        if (hasConflict) {
            throw new BadRequestError('Este horario ya está reservado por otro cliente.');
        }

        // Check disabled
        const dayStart = new Date(startTime);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(startTime);
        dayEnd.setHours(23, 59, 59, 999);

        const disabledSlots = await bookingsRepository.getDisabledSlotsByDateRange(dayStart, dayEnd);
        if (this.isSlotDisabled(startTime, endTime, disabledSlots)) {
            throw new BadRequestError('Este horario ha sido inhabilitado por el barbero.');
        }

        // Create booking
        const booking = await bookingsRepository.createBooking({
            clientId,
            serviceId: input.serviceId,
            startTime,
            endTime,
            notes: input.notes
        });

        // Notify Admin (Fire and forget)
        this.sendAdminNotification(booking, user, service);

        return booking;
    }

    /**
     * Send email notification to admin asynchronously (fire and forget)
     */
    private async sendAdminNotification(booking: any, user: any, service: any) {
        try {
            // Lazy import to avoid circular dep if any, or just direct use
            const { notifyNewBooking } = await import('../notifications/email.service.js');
            await notifyNewBooking({
                bookingId: booking.id,
                date: booking.startTime,
                serviceName: service.name,
                clientName: user.fullName,
                clientEmail: user.email,
                clientPhone: user.phone
            });
        } catch (error) {
            console.error('[BookingsService] Error sending admin notification:', error);
        }
    }

    /**
     * Owner Block Management
     */
    async createOwnerBlock(input: { date: string; startTime?: string; endTime?: string; reason?: string; fullDay?: boolean }) {
        // Parse date in Peru context
        const dayStart = new Date(`${input.date}T00:00:00.000-05:00`);
        const dayEnd = new Date(`${input.date}T23:59:59.999-05:00`);

        let blockStart: Date;
        let blockEnd: Date;

        if (input.fullDay) {
            blockStart = dayStart;
            blockEnd = dayEnd;
        } else if (input.startTime && input.endTime) {
            blockStart = this.getSlotDate(input.date, input.startTime);
            blockEnd = this.getSlotDate(input.date, input.endTime);
        } else {
            throw new BadRequestError('Debes especificar horario o marcar día completo.');
        }

        return bookingsRepository.createDisabledSlot({
            startTime: blockStart,
            endTime: blockEnd,
            reason: input.reason
        });
    }

    async deleteOwnerBlock(id: string) {
        return bookingsRepository.deleteDisabledSlot(id);
    }

    async getOwnerBlocks(date: string) {
        const targetDate = new Date(`${date}T00:00:00.000-05:00`);
        return bookingsRepository.getDisabledSlotsByDate(targetDate);
    }

    // Existing methods
    async getMyBookings(clientId: string, query: GetMyBookingsQuery) {
        const bookings = await bookingsRepository.findBookingsByClient(clientId, query.status as BookingStatus);
        return bookings;
    }

    async getOwnerBookings(query: OwnerBookingsQuery) {
        const status = query.status ? (query.status as BookingStatus) : undefined;
        if (query.date) {
            const [year, month, day] = query.date.split('-').map(Number);
            const date = new Date(year, month - 1, day, 0, 0, 0, 0);
            return bookingsRepository.findBookingsForOwner(date, status);
        }
        const now = new Date();
        return bookingsRepository.findUpcomingBookingsForOwner(now, status);
    }

    async updateBookingStatus(bookingId: string, input: UpdateBookingStatusInput) {
        const status = input.status as BookingStatus;
        if (!['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'].includes(status)) {
            throw new BadRequestError('Invalid status');
        }
        const existing = await bookingsRepository.findBookingById(bookingId);
        if (!existing) throw new NotFoundError('Booking not found');
        const updatedBooking = await bookingsRepository.updateBookingStatus(bookingId, status);

        // Notify Client (Fire and forget)
        this.sendClientStatusNotification(updatedBooking);

        return updatedBooking;
    }

    private async sendClientStatusNotification(booking: any) {
        try {
            const { notifyBookingStatusChange } = await import('../notifications/email.service.js');
            await notifyBookingStatusChange({
                clientEmail: booking.client.email,
                clientName: booking.client.fullName,
                serviceName: booking.service.name,
                date: booking.startTime,
                status: booking.status
            });
        } catch (error) {
            console.error('[BookingsService] Error sending client status notification:', error);
        }
    }
}


export const bookingsService = new BookingsService();
