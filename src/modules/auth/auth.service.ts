import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { authRepository } from './auth.repository.js';
import {
    RegisterInput,
    LoginInput,
    VerifyEmailConfirmInput,
    PasswordResetRequestInput,
    PasswordResetConfirmInput
} from './auth.schemas.js';
import {
    BadRequestError,
    UnauthorizedError,
    ConflictError,
    NotFoundError
} from '../../utils/errors.js';
import { VerificationPurpose } from '@prisma/client';
import { sendVerificationEmail } from '../notifications/email.service.js';

const SALT_ROUNDS = 10;
const VERIFICATION_CODE_EXPIRY_MINUTES = 10;

export class AuthService {
    private generateVerificationCode(): string {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    private async hashPassword(password: string): Promise<string> {
        return bcrypt.hash(password, SALT_ROUNDS);
    }

    private async comparePassword(password: string, hash: string): Promise<boolean> {
        return bcrypt.compare(password, hash);
    }

    private generateToken(userId: string, role: string): string {
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            throw new Error('JWT_SECRET not configured');
        }

        return jwt.sign(
            { userId, role },
            secret,
            { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn'] }
        );
    }

    async register(input: RegisterInput) {
        // Check if email already exists
        const existingEmail = await authRepository.findUserByEmail(input.email);
        if (existingEmail) {
            throw new ConflictError('Email already registered');
        }

        // Check if phone already exists (only if provided)
        if (input.phone) {
            const existingPhone = await authRepository.findUserByPhone(input.phone);
            if (existingPhone) {
                throw new ConflictError('Phone number already registered');
            }
        }

        // Check if username already exists
        const existingUsername = await authRepository.findUserByUsername(input.username);
        if (existingUsername) {
            throw new ConflictError('Username already taken');
        }

        // Hash password
        const passwordHash = await this.hashPassword(input.password);

        // Create user
        const user = await authRepository.createUser({
            fullName: input.fullName,
            email: input.email,
            phone: input.phone || null,
            username: input.username,
            passwordHash
        });

        // Generate token
        const token = this.generateToken(user.id, user.role);

        // Send email verification code
        await this.requestEmailVerification(user.id);

        return {
            user: {
                id: user.id,
                fullName: user.fullName,
                email: user.email,
                phone: user.phone,
                username: user.username,
                role: user.role,
                emailVerified: user.emailVerified,
                phoneVerified: user.phoneVerified
            },
            token,
            message: 'Registration successful. A verification code has been sent to your email.'
        };
    }

    async login(input: LoginInput) {
        let user: any = await authRepository.findUserByUsername(input.credential);

        if (!user) {
            // Try to find by phone if credential looks like a phone, or just check both queues?
            // Since phone is optional, it might be null.
            // We can check phone only if input looks phone-ish or plain query
            user = await authRepository.findUserByPhone(input.credential);

            // Also check by email
            if (!user) {
                user = await authRepository.findUserByEmail(input.credential);
            }
        }

        if (!user) {
            throw new UnauthorizedError('Invalid credentials');
        }

        // Verify password
        const isPasswordValid = await this.comparePassword(input.password, user.passwordHash);
        if (!isPasswordValid) {
            throw new UnauthorizedError('Invalid credentials');
        }

        // Generate token
        const token = this.generateToken(user.id, user.role);

        // NOTE: Users CAN login even if email is not verified.
        // The restriction for emailVerified is applied when creating bookings (in bookings.service.ts)
        // This allows users to navigate the app and verify their email after login.

        return {
            user: {
                id: user.id,
                fullName: user.fullName,
                email: user.email,
                phone: user.phone,
                username: user.username,
                role: user.role,
                emailVerified: user.emailVerified,
                phoneVerified: user.phoneVerified
            },
            token
        };
    }

    // New: Request Email Verification
    async requestEmailVerification(userId: string) {
        const user = await authRepository.findUserById(userId);
        if (!user) {
            throw new NotFoundError('User not found');
        }

        if (user.emailVerified) {
            throw new BadRequestError('Email already verified');
        }

        // Generate verification code
        const code = this.generateVerificationCode();
        const expiresAt = new Date(Date.now() + VERIFICATION_CODE_EXPIRY_MINUTES * 60 * 1000);

        await authRepository.createVerificationCode({
            userId: user.id,
            code,
            purpose: VerificationPurpose.EMAIL_VERIFICATION,
            expiresAt
        });

        // Send email
        if (process.env.NODE_ENV === 'development') {
            console.log(`[DEV] CÓDIGO DE VERIFICACIÓN PARA ${user.email} => ${code}`);
        }

        try {
            await sendVerificationEmail(user.email, code);
        } catch (error) {
            console.error('Error sending verification email:', error);
            // We log but don't crash, user can retry
        }

        return {
            message: 'Verification code sent to your email'
        };
    }

    // New: Confirm Email Verification
    async confirmEmailVerification(userId: string, input: VerifyEmailConfirmInput) {
        const user = await authRepository.findUserById(userId);
        if (!user) {
            throw new NotFoundError('User not found');
        }

        const verificationCode = await authRepository.findValidVerificationCode(
            user.id,
            input.code,
            VerificationPurpose.EMAIL_VERIFICATION
        );

        if (!verificationCode) {
            throw new BadRequestError('Invalid or expired verification code');
        }

        // Mark code as used
        await authRepository.markVerificationCodeAsUsed(verificationCode.id);

        // Update user status
        const updatedUser = await authRepository.updateUserEmailVerified(user.id, true);

        return {
            user: {
                id: updatedUser.id,
                fullName: updatedUser.fullName,
                email: updatedUser.email,
                phone: updatedUser.phone,
                username: updatedUser.username,
                role: updatedUser.role,
                emailVerified: updatedUser.emailVerified,
                phoneVerified: updatedUser.phoneVerified
            },
            message: 'Email verified successfully'
        };
    }

    // Phone Verification logic removed

    // async requestPhoneVerification...
    // async confirmPhoneVerification...

    async requestPasswordReset(input: PasswordResetRequestInput) {
        const user = await authRepository.findUserByEmail(input.email);
        if (!user) {
            // Security: Don't reveal if user exists
            return {
                message: 'If the email is registered, a reset code will be sent'
            };
        }

        const code = this.generateVerificationCode();
        const expiresAt = new Date(Date.now() + VERIFICATION_CODE_EXPIRY_MINUTES * 60 * 1000);

        await authRepository.createVerificationCode({
            userId: user.id,
            code,
            purpose: VerificationPurpose.PASSWORD_RESET,
            expiresAt
        });

        // Send email (Reuse existing email service or create new function for reset)
        // For now using sendVerificationEmail as generic or adaptable
        await sendVerificationEmail(user.email!, code);

        return {
            message: 'If the email is registered, a reset code will be sent'
        };
    }

    async confirmPasswordReset(input: PasswordResetConfirmInput) {
        const user = await authRepository.findUserByEmail(input.email);
        if (!user) throw new BadRequestError('Invalid verification code');

        const code = await authRepository.findValidVerificationCode(
            user.id,
            input.code,
            VerificationPurpose.PASSWORD_RESET
        );

        if (!code) throw new BadRequestError('Invalid or expired verification code');

        const passwordHash = await this.hashPassword(input.newPassword);
        await authRepository.updateUserPassword(user.id, passwordHash);
        await authRepository.markVerificationCodeAsUsed(code.id);

        return { message: 'Password reset successfully' };
    }
}

export const authService = new AuthService();
