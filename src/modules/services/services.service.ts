import { servicesRepository } from './services.repository.js';
import { NotFoundError } from '../../utils/errors.js';

export class ServicesService {
    async getAllServices() {
        return await servicesRepository.findAll();
    }

    async getServiceById(id: string) {
        const service = await servicesRepository.findById(id);
        if (!service) {
            throw new NotFoundError('Service not found');
        }
        return service;
    }
}

export const servicesService = new ServicesService();
