import { prisma } from '../../libs/prisma.js';

export class DisabledSlotsRepository {
    async create(data: { startTime: Date; endTime: Date; reason?: string }) {
        return prisma.disabledSlot.create({
            data,
        });
    }

    async findAllFuture(from: Date) {
        return prisma.disabledSlot.findMany({
            where: {
                endTime: {
                    gte: from,
                },
            },
            orderBy: {
                startTime: 'asc',
            },
        });
    }

    async delete(id: string) {
        return prisma.disabledSlot.delete({
            where: { id },
        });
    }

    async findOverlapping(startTime: Date, endTime: Date) {
        return prisma.disabledSlot.findFirst({
            where: {
                OR: [
                    {
                        startTime: { lt: endTime },
                        endTime: { gt: startTime },
                    },
                ],
            },
        });
    }
}

export const disabledSlotsRepository = new DisabledSlotsRepository();
