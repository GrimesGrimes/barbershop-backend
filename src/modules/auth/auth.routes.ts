import { Router } from 'express';
import { authController } from './auth.controller.js';
import { validate } from '../../middleware/validation.middleware.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import {
    registerSchema,
    loginSchema,
    verifyEmailRequestSchema,
    verifyEmailConfirmSchema,
    passwordResetRequestSchema,
    passwordResetConfirmSchema
} from './auth.schemas.js';

const router = Router();

// POST /auth/register
router.post(
    '/register',
    validate(registerSchema),
    authController.register.bind(authController)
);

// POST /auth/login
router.post(
    '/login',
    validate(loginSchema),
    authController.login.bind(authController)
);

// POST /auth/verify-email/request
router.post(
    '/verify-email/request',
    authenticate,
    validate(verifyEmailRequestSchema),
    authController.requestEmailVerification.bind(authController)
);

// POST /auth/verify-email/confirm
router.post(
    '/verify-email/confirm',
    authenticate,
    validate(verifyEmailConfirmSchema),
    authController.confirmEmailVerification.bind(authController)
);

// Phone verification routes removed as per requirement
/*
// POST /auth/verify-phone/request
router.post(
    '/verify-phone/request',
    validate(verifyPhoneRequestSchema),
    authController.requestPhoneVerification.bind(authController)
);

// POST /auth/verify-phone/confirm
router.post(
    '/verify-phone/confirm',
    validate(verifyPhoneConfirmSchema),
    authController.confirmPhoneVerification.bind(authController)
);
*/

// POST /auth/password-reset/request
router.post(
    '/password-reset/request',
    validate(passwordResetRequestSchema),
    authController.requestPasswordReset.bind(authController)
);

// POST /auth/password-reset/confirm
router.post(
    '/password-reset/confirm',
    validate(passwordResetConfirmSchema),
    authController.confirmPasswordReset.bind(authController)
);

export default router;
