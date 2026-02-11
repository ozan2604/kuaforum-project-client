import api from './axios';
import type { Appointment, CreateAppointmentDto, UpdateAppointmentStatusDto, AppointmentStatus } from '../types/appointment';

export const appointmentService = {
    // Get appointments for a specific shop (Salon Owner)
    getShopAppointments: async (shopId: string): Promise<Appointment[]> => {
        const response = await api.get<Appointment[]>(`/Appointment/shop/${shopId}`);
        return response.data;
    },

    // Get my appointments (Customer) - useful if we reuse types
    getMyAppointments: async (): Promise<Appointment[]> => {
        const response = await api.get<Appointment[]>('/Appointment/my-appointments');
        return response.data;
    },

    // Create appointment (Customer)
    createAppointment: async (data: CreateAppointmentDto): Promise<void> => {
        await api.post('/Appointment', data);
    },

    // Update status (Salon Owner)
    updateStatus: async (id: string, status: AppointmentStatus): Promise<void> => {
        const payload: UpdateAppointmentStatusDto = { status };
        await api.put(`/Appointment/${id}/status`, payload);
    }
};
