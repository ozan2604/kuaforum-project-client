import api from './axios';
import type { CreateSalonApplicationDto } from '../types/salon-application';

export const salonApplicationService = {
    apply: async (data: CreateSalonApplicationDto): Promise<void> => {
        await api.post('/SalonApplication/apply', data);
    },

    getPendingApplications: async (): Promise<any[]> => {
        const response = await api.get('/SalonApplication/pending');
        return response.data;
    },

    approve: async (id: string): Promise<void> => {
        await api.put(`/SalonApplication/${id}/approve`);
    },

    reject: async (id: string): Promise<void> => {
        await api.put(`/SalonApplication/${id}/reject`);
    },

    getMyApplication: async (): Promise<any> => {
        const response = await api.get('/SalonApplication/my-application');
        return response.data;
    }
};
