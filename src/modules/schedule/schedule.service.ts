import { scheduleRepository } from './schedule.repository.js';
import {
    CreateDisabledSlotInput,
    GetOwnerBookingsQuery,
    UpdateOwnerScheduleInput
} from './schedule.schemas.js';
import { BadRequestError, NotFoundError } from '../../utils/errors.js';
import { BookingStatus } from '@prisma/client';

export class ScheduleService {
    async createDisabledSlot(input: CreateDisabledSlotInput) {
        const startTime = new Date(input.startTime);
        const endTime = new Date(input.endTime);

        // Validate times
        if (startTime >= endTime) {
            throw new BadRequestError('End time must be after start time');
        }

        if (startTime < new Date()) {
            throw new BadRequestError('Cannot disable slots in the past');
        }

        const disabledSlot = await scheduleRepository.createDisabledSlot({
            startTime,
            endTime,
            reason: input.reason
        });

        return disabledSlot;
    }

    async deleteDisabledSlot(slotId: string) {
        const slot = await scheduleRepository.findDisabledSlotById(slotId);

        if (!slot) {
            throw new NotFoundError('Disabled slot not found');
        }

        await scheduleRepository.deleteDisabledSlot(slotId);

        return {
            message: 'Disabled slot removed successfully'
        };
    }

    async getAllDisabledSlots() {
        return scheduleRepository.getAllDisabledSlots();
    }

    async getOwnerBookings(query: GetOwnerBookingsQuery) {
        const targetDate = new Date(query.date);
        const status = query.status ? (query.status as BookingStatus) : undefined;

        const bookings = await scheduleRepository.getBookingsByDate(targetDate, status);

        return bookings;
    }

    async updateOwnerSchedule(input: UpdateOwnerScheduleInput) {
        // Validate time format
        const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

        if (!timeRegex.test(input.startTime) || !timeRegex.test(input.endTime)) {
            throw new BadRequestError('Invalid time format. Use HH:mm');
        }

        // Validate that start time is before end time
        const [startHour, startMin] = input.startTime.split(':').map(Number);
        const [endHour, endMin] = input.endTime.split(':').map(Number);

        const startMinutes = startHour * 60 + startMin;
        const endMinutes = endHour * 60 + endMin;

        if (startMinutes >= endMinutes) {
            throw new BadRequestError('End time must be after start time');
        }

        const schedule = await scheduleRepository.upsertOwnerSchedule(input);

        return schedule;
    }

    async getAllOwnerSchedules() {
        return scheduleRepository.getAllOwnerSchedules();
    }
}

export const scheduleService = new ScheduleService();
