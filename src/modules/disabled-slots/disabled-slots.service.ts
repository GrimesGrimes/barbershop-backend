import { disabledSlotsRepository } from './disabled-slots.repository';
import { BadRequestError, NotFoundError } from '../../utils/errors';

export class DisabledSlotsService {
    async createDisabledSlot(data: { startTime: Date; endTime: Date; reason?: string }) {
        const { startTime, endTime, reason } = data;

        if (startTime >= endTime) {
            throw new BadRequestError('La hora de inicio debe ser anterior a la hora de fin');
        }

        const now = new Date();
        if (endTime <= now) {
            throw new BadRequestError('No se pueden bloquear horarios en el pasado');
        }

        // Verificar solapamientos con otros bloqueos
        const overlapping = await disabledSlotsRepository.findOverlapping(startTime, endTime);
        if (overlapping) {
            throw new BadRequestError('El horario seleccionado se solapa con otro bloqueo existente');
        }

        // TODO: Verificar solapamientos con reservas existentes?
        // Por ahora asumimos que el dueño es responsable de revisar antes de bloquear.

        return disabledSlotsRepository.create({ startTime, endTime, reason });
    }

    async getFutureDisabledSlots() {
        const now = new Date();
        return disabledSlotsRepository.findAllFuture(now);
    }

    async deleteDisabledSlot(id: string) {
        try {
            return await disabledSlotsRepository.delete(id);
        } catch (error) {
            throw new NotFoundError('Bloqueo no encontrado');
        }
    }
}

export const disabledSlotsService = new DisabledSlotsService();
