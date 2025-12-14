import { prisma } from '../../libs/prisma.js';
import { Booking, BookingStatus, OwnerSchedule, DisabledSlot, Service } from '@prisma/client';

export class BookingsRepository {
    async createBooking(data: {
        clientId: string;
        serviceId: string;
        startTime: Date;
        endTime: Date;
        notes?: string;
    }): Promise<Booking> {
        return prisma.booking.create({
            data,
            include: {
                service: true,
                client: {
                    select: {
                        id: true,
                        fullName: true,
                        phone: true
                    }
                }
            }
        });
    }

    async findBookingsByDateRange(startDate: Date, endDate: Date): Promise<Booking[]> {
        return prisma.booking.findMany({
            where: {
                startTime: {
                    gte: startDate,
                    lt: endDate
                },
                status: {
                    in: ['PENDING', 'CONFIRMED']
                }
            },
            orderBy: {
                startTime: 'asc'
            }
        });
    }

    async findBookingsByClient(clientId: string, status?: BookingStatus): Promise<Booking[]> {
        return prisma.booking.findMany({
            where: {
                clientId,
                ...(status && { status })
            },
            include: {
                service: true
            },
            orderBy: {
                startTime: 'desc'
            }
        });
    }

    async getOwnerScheduleByWeekday(weekday: number): Promise<OwnerSchedule | null> {
        return prisma.ownerSchedule.findFirst({
            where: {
                weekday,
                active: true
            }
        });
    }

    async getDisabledSlotsByDateRange(startDate: Date, endDate: Date): Promise<DisabledSlot[]> {
        return prisma.disabledSlot.findMany({
            where: {
                OR: [
                    {
                        AND: [
                            { startTime: { lte: endDate } },
                            { endTime: { gte: startDate } }
                        ]
                    }
                ]
            }
        });
    }

    async findServiceById(serviceId: string): Promise<Service | null> {
        return prisma.service.findUnique({
            where: { id: serviceId, active: true }
        });
    }

    async getAllActiveServices(): Promise<Service[]> {
        return prisma.service.findMany({
            where: { active: true }
        });
    }

    async checkBookingConflict(startTime: Date, endTime: Date): Promise<boolean> {
        const conflictingBooking = await prisma.booking.findFirst({
            where: {
                status: {
                    in: ['PENDING', 'CONFIRMED']
                },
                OR: [
                    {
                        AND: [
                            { startTime: { lt: endTime } },
                            { endTime: { gt: startTime } }
                        ]
                    }
                ]
            }
        });

        return !!conflictingBooking;
    }
    async findBookingsForOwner(date?: Date, status?: BookingStatus) {
        let start: Date | undefined;
        let end: Date | undefined;

        if (date) {
            start = new Date(date.getTime());
            start.setHours(0, 0, 0, 0);

            end = new Date(date.getTime());
            end.setHours(23, 59, 59, 999);
        }

        return prisma.booking.findMany({
            where: {
                ...(start && end && {
                    startTime: {
                        gte: start,
                        lt: end,
                    },
                }),
                ...(status && { status }),
            },
            include: {
                client: true,
                service: true,
            },
            orderBy: { startTime: 'asc' },
        });
    }

    async findBookingById(id: string) {
        return prisma.booking.findUnique({
            where: { id },
            include: { client: true, service: true },
        });
    }

    async updateBookingStatus(id: string, status: BookingStatus) {
        return prisma.booking.update({
            where: { id },
            data: { status },
            include: { client: true, service: true },
        });
    }

    async findUpcomingBookingsForOwner(from: Date, status?: BookingStatus) {
        return prisma.booking.findMany({
            where: {
                startTime: {
                    gte: from,
                },
                ...(status && { status }),
            },
            include: {
                client: true,
                service: true,
            },
            orderBy: {
                startTime: 'asc',
            },
        });
    }

    async createDisabledSlot(data: { startTime: Date; endTime: Date; reason?: string }) {
        return prisma.disabledSlot.create({ data });
    }

    async deleteDisabledSlot(id: string) {
        return prisma.disabledSlot.delete({ where: { id } });
    }

    async getDisabledSlotsByDate(date: Date) {
        const start = new Date(date);
        start.setHours(0, 0, 0, 0);
        const end = new Date(date);
        end.setHours(23, 59, 59, 999);
        return prisma.disabledSlot.findMany({
            where: {
                startTime: { gte: start, lte: end }
            }
        });
    }
}

export const bookingsRepository = new BookingsRepository();
