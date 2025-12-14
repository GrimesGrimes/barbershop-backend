// src/libs/mailer.ts
import nodemailer from 'nodemailer';

const host = process.env.EMAIL_HOST;
const port = process.env.EMAIL_PORT ? Number(process.env.EMAIL_PORT) : 587;
const user = process.env.EMAIL_USER;
const pass = process.env.EMAIL_PASS;
const from = process.env.EMAIL_FROM || process.env.EMAIL_USER;

if (!host || !port || !user || !pass) {
    console.warn(
        '[MAILER] Faltan variables de entorno para el correo. Revisa EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS.'
    );
}

export const mailer = nodemailer.createTransport({
    host,
    port,
    secure: process.env.EMAIL_SECURE === 'true', // true para 465, false para 587
    auth: {
        user,
        pass,
    },
    tls: process.env.NODE_ENV !== 'production' ? { rejectUnauthorized: false } : undefined,
});

if (process.env.NODE_ENV === 'development') {
    mailer.verify((error) => {
        if (error) {
            console.error('[MAILER] Error verificando transporter:', error);
        } else {
            console.log('[MAILER] Transporte de correo listo para enviar');
        }
    });
}

export async function sendMail(options: {
    to: string;
    subject: string;
    html?: string;
    text?: string;
}) {
    if (!from) {
        throw new Error('EMAIL_FROM no está configurado');
    }

    const info = await mailer.sendMail({
        from,
        ...options,
    });

    console.log('[MAILER] Email enviado:', info.messageId);
    return info;
}
