import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class ServicesRepository {
    async findAll() {
        return await prisma.service.findMany({
            where: {
                active: true
            },
            orderBy: {
                name: 'asc'
            }
        });
    }

    async findById(id: string) {
        return await prisma.service.findUnique({
            where: { id }
        });
    }
}

export const servicesRepository = new ServicesRepository();
