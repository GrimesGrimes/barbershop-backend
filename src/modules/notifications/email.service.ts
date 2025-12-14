// src/modules/notifications/email.service.ts
import { sendMail } from '../../libs/mailer.js';
import { usersRepository } from '../users/users.repository.js'; // Import repository

export async function sendVerificationEmail(email: string, code: string) {
  const subject = 'Código de verificación - Barbería';
  const text = `Tu código de verificación para Barbería es: ${code}. No lo compartas con nadie.`;

  const html = `
    <div style="font-family: sans-serif; line-height: 1.5;">
      <h2>Verificación de cuenta</h2>
      <p>Tu código de verificación para <strong>Barbería</strong> es:</p>
      <p style="font-size: 24px; font-weight: bold; letter-spacing: 4px;">
        ${code}
      </p>
      <p>Este código es válido por unos minutos. Si tú no solicitaste este código, puedes ignorar este mensaje.</p>
    </div>
  `;

  await sendMail({
    to: email,
    subject,
    text,
    html,
  });
}

export async function notifyNewBooking(data: {
  bookingId: string;
  date: Date;
  serviceName: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string | null;
}) {
  // 1. Get all owners from DB
  const owners = await usersRepository.findOwners();

  if (owners.length === 0) {
    console.warn('[EmailService] No owners found to send booking notification.');
    return;
  }

  const subject = '🔔 Nueva Reserva Pendiente';

  // Format date nicely (Peru Time)
  const formattedDate = new Intl.DateTimeFormat('es-PE', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: 'America/Lima',
  }).format(new Date(data.date));

  const text = `Nueva reserva pendiente:\nCliente: ${data.clientName}\nServicio: ${data.serviceName}\nFecha: ${formattedDate}\nEmail: ${data.clientEmail}\nTeléfono: ${data.clientPhone || 'No registrado'}`;

  const html = `
    <div style="font-family: sans-serif; line-height: 1.5; color: #333;">
      <h2 style="color: #d4af37;">✂ Nueva Reserva Pendiente</h2>
      <p>Se ha registrado una nueva reserva en el sistema.</p>
      
      <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; border-left: 4px solid #d4af37;">
        <p><strong>Cliente:</strong> ${data.clientName}</p>
        <p><strong>Email:</strong> ${data.clientEmail}</p>
        <p><strong>Teléfono:</strong> ${data.clientPhone || '<span style="color:#999">No registrado</span>'}</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 10px 0;" />
        <p><strong>Servicio:</strong> ${data.serviceName}</p>
        <p><strong>Fecha y Hora:</strong> ${formattedDate}</p>
      </div>

      <p style="margin-top: 20px;">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/owner/bookings" 
           style="background: #d4af37; color: #fff; text-decoration: none; padding: 10px 20px; border-radius: 5px; font-weight: bold;">
           Ver en Panel Administrativo
        </a>
      </p>
    </div>
  `;

  // 2. Send email to ALL owners
  const emailPromises = owners.map(owner =>
    sendMail({
      to: owner.email,
      subject,
      text,
      html,
    })
  );

  await Promise.all(emailPromises);
}

export async function notifyBookingStatusChange(data: {
  clientEmail: string;
  clientName: string;
  serviceName: string;
  date: Date;
  status: 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'PENDING';
}) {
  let subject = '';
  let statusMessage = '';
  let color = '';

  const formattedDate = new Intl.DateTimeFormat('es-PE', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: 'America/Lima',
  }).format(new Date(data.date));

  switch (data.status) {
    case 'CONFIRMED':
      subject = '✅ Reserva Confirmada - Barbería';
      statusMessage = 'Tu reserva ha sido confirmada.';
      color = '#16a34a'; // Green
      break;
    case 'CANCELLED':
      subject = '❌ Reserva Cancelada - Barbería';
      statusMessage = 'Tu reserva ha sido cancelada.';
      color = '#dc2626'; // Red
      break;
    case 'COMPLETED':
      subject = '✂ Reserva Completada - Barbería';
      statusMessage = '¡Gracias por visitarnos! Tu reserva ha sido marcada como completada.';
      color = '#0f766e'; // Teal
      break;
    default:
      return; // Ignore other statuses for now (emails usually for firm actions)
  }

  const html = `
    <div style="font-family: sans-serif; line-height: 1.5; color: #333;">
      <h2 style="color: ${color};">${subject}</h2>
      <p>Hola <strong>${data.clientName}</strong>,</p>
      <p>${statusMessage}</p>
      
      <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; border-left: 4px solid ${color};">
        <p><strong>Servicio:</strong> ${data.serviceName}</p>
        <p><strong>Fecha y Hora:</strong> ${formattedDate}</p>
      </div>

      <p style="margin-top: 20px;">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/app/my-bookings" 
           style="background: #333; color: #fff; text-decoration: none; padding: 10px 20px; border-radius: 5px; font-weight: bold;">
           Ver mis reservas
        </a>
      </p>
    </div>
  `;

  await sendMail({
    to: data.clientEmail,
    subject,
    html,
  });
}
