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
    },

    // Get Employee Availability
    getAvailability: async (employeeId: string, date: string): Promise<import('../types/appointment').EmployeeAvailabilityDto> => {
        const response = await api.get<import('../types/appointment').EmployeeAvailabilityDto>(`/Appointment/availability`, {
            params: { employeeId, date }
        });
        return response.data;
    },
    getReviewableAppointment: async (shopId: string): Promise<Appointment | null> => {
        const response = await api.get<Appointment>(`/Appointment/reviewable?shopId=${shopId}`);
        if (!response.data) return null;
        return response.data;
    }
};
