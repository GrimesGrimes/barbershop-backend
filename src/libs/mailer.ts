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
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 10_000,
    tls: process.env.NODE_ENV !== 'production' ? { rejectUnauthorized: false } : undefined,
});

// Optional: Validate connection ONLY if using SMTP
if (!process.env.RESEND_API_KEY && process.env.NODE_ENV === 'development') {
    mailer.verify((error) => {
        if (error) {
            console.error('[MAILER] Error verificando transporter SMTP:', error);
        } else {
            console.log('[MAILER] Transporte SMTP listo');
        }
    });
}

export async function sendMail(options: {
    to: string;
    subject: string;
    html?: string;
    text?: string;
}) {
    // 1. Priority: Use Resend API (HTTP) if available - Bypasses SMTP port blocks
    if (process.env.RESEND_API_KEY) {
        try {
            const res = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.RESEND_API_KEY}`
                },
                body: JSON.stringify({
                    from: from, // Ensure this sender is verified in Resend
                    to: options.to,
                    subject: options.subject,
                    html: options.html,
                    text: options.text
                })
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(`Resend API Error: ${JSON.stringify(errorData)}`);
            }

            const data = await res.json() as { id: string };
            console.log('[MAILER] Email enviado vía Resend API:', data.id);
            return { messageId: data.id };
        } catch (error) {
            console.error('[MAILER] Falló envío con Resend, intentando fallback SMTP...', error);
            // Fallback to SMTP below if desired, or just throw
            throw error;
        }
    }

    // 2. Fallback: SMTP (Nodemailer)
    if (!from) {
        throw new Error('EMAIL_FROM no está configurado');
    }

    try {
        const info = await mailer.sendMail({
            from,
            ...options,
        });

        console.log('[MAILER] Email enviado vía SMTP:', info.messageId);
        return info;
    } catch (error) {
        console.error('[MAILER] Error crítico enviando email (SMTP):', error);
        throw error;
    }
}
