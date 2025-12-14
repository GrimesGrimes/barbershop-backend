import { prisma } from '../../libs/prisma.js';
import { User, VerificationCode, VerificationPurpose } from '@prisma/client';

export class AuthRepository {
    async createUser(data: {
        fullName: string;
        email: string;
        phone?: string | null;
        username: string;
        passwordHash: string;
    }): Promise<User> {
        return prisma.user.create({
            data
        });
    }

    async findUserByEmail(email: string): Promise<User | null> {
        return prisma.user.findUnique({
            where: { email }
        });
    }

    async findUserByPhone(phone: string): Promise<User | null> {
        return prisma.user.findUnique({
            where: { phone }
        });
    }

    async findUserByUsername(username: string): Promise<User | null> {
        return prisma.user.findUnique({
            where: { username }
        });
    }

    async findUserById(id: string): Promise<User | null> {
        return prisma.user.findUnique({
            where: { id }
        });
    }

    async updateUserPhoneVerified(userId: string, verified: boolean): Promise<User> {
        return prisma.user.update({
            where: { id: userId },
            data: { phoneVerified: verified }
        });
    }

    async updateUserEmailVerified(userId: string, verified: boolean): Promise<User> {
        return prisma.user.update({
            where: { id: userId },
            data: { emailVerified: verified }
        });
    }

    async updateUserPassword(userId: string, passwordHash: string): Promise<User> {
        return prisma.user.update({
            where: { id: userId },
            data: { passwordHash }
        });
    }

    async createVerificationCode(data: {
        userId: string;
        code: string;
        purpose: VerificationPurpose;
        expiresAt: Date;
    }): Promise<VerificationCode> {
        return prisma.verificationCode.create({
            data
        });
    }

    async findValidVerificationCode(
        userId: string,
        code: string,
        purpose: VerificationPurpose
    ): Promise<VerificationCode | null> {
        return prisma.verificationCode.findFirst({
            where: {
                userId,
                code,
                purpose,
                verified: false,
                expiresAt: {
                    gte: new Date()
                }
            }
        });
    }

    async markVerificationCodeAsUsed(id: string): Promise<VerificationCode> {
        return prisma.verificationCode.update({
            where: { id },
            data: { verified: true }
        });
    }

    async deleteExpiredVerificationCodes(): Promise<void> {
        await prisma.verificationCode.deleteMany({
            where: {
                expiresAt: {
                    lt: new Date()
                }
            }
        });
    }
}

export const authRepository = new AuthRepository();
