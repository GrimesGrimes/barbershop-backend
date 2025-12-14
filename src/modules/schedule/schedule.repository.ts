import { prisma } from '../../libs/prisma.js';
import { DisabledSlot, Booking, BookingStatus, OwnerSchedule } from '@prisma/client';

export class ScheduleRepository {
    async createDisabledSlot(data: {
        startTime: Date;
        endTime: Date;
        reason?: string;
    }): Promise<DisabledSlot> {
        return prisma.disabledSlot.create({
            data
        });
    }

    async deleteDisabledSlot(id: string): Promise<DisabledSlot> {
        return prisma.disabledSlot.delete({
            where: { id }
        });
    }

    async findDisabledSlotById(id: string): Promise<DisabledSlot | null> {
        return prisma.disabledSlot.findUnique({
            where: { id }
        });
    }

    async getAllDisabledSlots(): Promise<DisabledSlot[]> {
        return prisma.disabledSlot.findMany({
            orderBy: {
                startTime: 'asc'
            }
        });
    }

    async getBookingsByDate(date: Date, status?: BookingStatus): Promise<Booking[]> {
        const dayStart = new Date(date);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(date);
        dayEnd.setHours(23, 59, 59, 999);

        return prisma.booking.findMany({
            where: {
                startTime: {
                    gte: dayStart,
                    lt: dayEnd
                },
                ...(status && { status })
            },
            include: {
                client: {
                    select: {
                        id: true,
                        fullName: true,
                        phone: true
                    }
                },
                service: true
            },
            orderBy: {
                startTime: 'asc'
            }
        });
    }

    async upsertOwnerSchedule(data: {
        weekday: number;
        startTime: string;
        endTime: string;
        active?: boolean;
    }): Promise<OwnerSchedule> {
        return prisma.ownerSchedule.upsert({
            where: { weekday: data.weekday },
            update: {
                startTime: data.startTime,
                endTime: data.endTime,
                ...(data.active !== undefined && { active: data.active })
            },
            create: data
        });
    }

    async getAllOwnerSchedules(): Promise<OwnerSchedule[]> {
        return prisma.ownerSchedule.findMany({
            orderBy: {
                weekday: 'asc'
            }
        });
    }
}

export const scheduleRepository = new ScheduleRepository();
