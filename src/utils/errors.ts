export class AppError extends Error {
    constructor(
        public statusCode: number,
        public message: string,
        public isOperational = true
    ) {
        super(message);
        Object.setPrototypeOf(this, AppError.prototype);
        Error.captureStackTrace(this, this.constructor);
    }
}

export class BadRequestError extends AppError {
    constructor(message: string = 'Bad Request') {
        super(400, message);
    }
}

export class UnauthorizedError extends AppError {
    constructor(message: string = 'Unauthorized') {
        super(401, message);
    }
}

export class ForbiddenError extends AppError {
    constructor(message: string = 'Forbidden') {
        super(403, message);
    }
}

export class NotFoundError extends AppError {
    constructor(message: string = 'Resource not found') {
        super(404, message);
    }
}

export class ConflictError extends AppError {
    constructor(message: string = 'Conflict') {
        super(409, message);
    }
}

export class InternalServerError extends AppError {
    constructor(message: string = 'Internal Server Error') {
        super(500, message);
    }
}

/**
 * Error específico para cuando se requiere verificación de email
 * El frontend puede detectar este error por el código 'EMAIL_NOT_VERIFIED'
 */
export class EmailNotVerifiedError extends AppError {
    public code: string = 'EMAIL_NOT_VERIFIED';

    constructor(message: string = 'Debes verificar tu correo electrónico para realizar esta acción.') {
        super(403, message);
    }
}
