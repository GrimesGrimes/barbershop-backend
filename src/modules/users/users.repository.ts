import { prisma } from '../../libs/prisma.js';
import { User, Barbershop } from '@prisma/client';

export class UsersRepository {
    async findUserById(id: string) {
        return prisma.user.findUnique({
            where: { id },
            include: { barbershop: true }
        });
    }

    async updateUser(id: string, data: any): Promise<User> {
        return prisma.user.update({
            where: { id },
            data
        });
    }

    async findUserByUsername(username: string): Promise<User | null> {
        return prisma.user.findUnique({
            where: { username }
        });
    }

    async upsertBarbershop(ownerId: string, data: any): Promise<Barbershop> {
        return prisma.barbershop.upsert({
            where: { ownerId },
            create: { ...data, ownerId },
            update: data
        });
    }
    async findOwners(): Promise<User[]> {
        return prisma.user.findMany({
            where: { role: 'OWNER' }
        });
    }
}

export const usersRepository = new UsersRepository();
