import { usersRepository } from './users.repository';
import { UpdateProfileInput, ChangePasswordInput, UpdateBarbershopInput } from './users.schemas';
import { NotFoundError, BadRequestError } from '../../utils/errors';
import bcrypt from 'bcrypt';

export class UsersService {
    async getUserProfile(userId: string) {
        const user = await usersRepository.findUserById(userId);

        if (!user) {
            throw new NotFoundError('User not found');
        }

        // Retornar objeto limpio
        return {
            id: user.id,
            fullName: user.fullName,
            phone: user.phone,
            username: user.username,
            role: user.role,
            phoneVerified: user.phoneVerified,
            email: user.email,
            avatarUrl: user.avatarUrl,
            gender: user.gender,
            birthDate: user.birthDate,
            notificationChannel: user.notificationChannel,
            marketingOptIn: user.marketingOptIn,
            language: user.language,
            createdAt: user.createdAt,
            barbershop: user.barbershop, // Si existe
            emailVerified: user.emailVerified,
        };
    }

    async updateUserProfile(userId: string, input: UpdateProfileInput) {
        const user = await usersRepository.findUserById(userId);

        if (!user) {
            throw new NotFoundError('User not found');
        }

        // TODO: Validar email único si cambia

        await usersRepository.updateUser(userId, input);

        return this.getUserProfile(userId);
    }

    async changePassword(userId: string, input: ChangePasswordInput) {
        const user = await usersRepository.findUserById(userId);
        if (!user) throw new NotFoundError('User not found');

        const isValid = await bcrypt.compare(input.currentPassword, user.passwordHash);
        if (!isValid) {
            throw new BadRequestError('Contraseña actual incorrecta');
        }

        const hashedPassword = await bcrypt.hash(input.newPassword, 10);
        await usersRepository.updateUser(userId, { passwordHash: hashedPassword });
    }

    async updateBarbershop(userId: string, input: UpdateBarbershopInput) {
        const user = await usersRepository.findUserById(userId);
        if (!user) throw new NotFoundError('User not found');
        if (user.role !== 'OWNER') throw new BadRequestError('Solo el dueño puede tener barbería');

        const barbershop = await usersRepository.upsertBarbershop(userId, input);
        return barbershop;
    }
}

export const usersService = new UsersService();
