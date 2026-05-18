import api from './axios';
import axios from 'axios';
import type { Appointment, CreateAppointmentDto, CreateManualAppointmentDto, UpdateAppointmentStatusDto, AppointmentStatus, NoShowResultDto } from '../types/appointment';

export interface CreateGuestAppointmentRequest {
    customerName: string;
    customerPhone: string;
    otp: string;
    shopId: string;
    serviceIds: string[];
    shopEmployeeId: string;
    startTime: string;
    note?: string;
}

export type GuestOtpStatus = 'OTP_SENT' | 'PHONE_EXISTS';

// Auth interceptor olmayan public istek — token gönderilmez, 401'de login'e yönlendirmez
const publicApi = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'https://localhost:7022/api',
    headers: { 'Content-Type': 'application/json' },
});

export interface PagedResult<T> {
    items: T[];
    totalCount: number;
    pageNumber: number;
    pageSize: number;
    totalPages: number;
}

export const appointmentService = {
    // Get appointments for a specific shop (Salon Owner)
    // Get appointments for a specific shop (Salon Owner)
    getShopAppointments: async (shopId: string, page: number = 1, pageSize: number = 10, status?: AppointmentStatus, searchTerm?: string, date?: string, employeeId?: string, serviceId?: string): Promise<PagedResult<Appointment>> => {
        const response = await api.get<PagedResult<Appointment>>(`/Appointment/shop/${shopId}`, {
            params: {
                page,
                pageSize,
                status,
                searchTerm,
                date,
                employeeId,
                serviceId
            }
        });
        return response.data;
    },

    // Get my appointments (Customer) — paginated
    getMyAppointments: async (page: number = 1, pageSize: number = 20): Promise<PagedResult<Appointment>> => {
        const response = await api.get<PagedResult<Appointment>>('/Appointment/my-appointments', {
            params: { page, pageSize }
        });
        return response.data;
    },

    // Create appointment (Customer)
    createAppointment: async (data: CreateAppointmentDto): Promise<void> => {
        await api.post('/Appointment', data);
    },

    // Create manual appointment (SalonOwner or Employee)
    createManualAppointment: async (data: CreateManualAppointmentDto): Promise<void> => {
        await api.post('/Appointment/manual', data);
    },

    // Update status (Salon Owner)
    updateStatus: async (id: string, status: AppointmentStatus, reason?: string): Promise<NoShowResultDto | null> => {
        const payload: UpdateAppointmentStatusDto = { status, reason };
        const response = await api.put<{ noShowResult?: NoShowResultDto }>(`/Appointment/${id}/status`, payload);
        return response.data.noShowResult ?? null;
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
    },

    // Employee - Assigned Appointments (all, for weekly calendar)
    getAssignedAppointments: async (): Promise<Appointment[]> => {
        const response = await api.get<Appointment[]>('/Appointment/employee/my-appointments');
        return response.data;
    },

    // Employee - Assigned Appointments (paginated, for management table)
    getAssignedAppointmentsPaged: async (
        page: number = 1,
        pageSize: number = 10,
        status?: AppointmentStatus,
        searchTerm?: string,
        date?: string,
        serviceId?: string
    ): Promise<PagedResult<Appointment>> => {
        const response = await api.get<PagedResult<Appointment>>('/Appointment/employee/my-appointments/paged', {
            params: { page, pageSize, status, searchTerm, date, serviceId }
        });
        return response.data;
    },

    updateStatusByEmployee: async (id: string, status: AppointmentStatus): Promise<NoShowResultDto | null> => {
        const payload: UpdateAppointmentStatusDto = { status };
        const response = await api.put<{ noShowResult?: NoShowResultDto }>(`/Appointment/employee/${id}/status`, payload);
        return response.data.noShowResult ?? null;
    },

    cancelAppointment: async (id: string, reason?: string): Promise<void> => {
        let url = `/Appointment/${id}`;
        if (reason) url += `?reason=${encodeURIComponent(reason)}`;
        await api.delete(url);
    },

    cancelGroup: async (groupId: string, reason?: string): Promise<void> => {
        let url = `/Appointment/group/${groupId}`;
        if (reason) url += `?reason=${encodeURIComponent(reason)}`;
        await api.delete(url);
    },

    sendGuestOtp: async (phone: string): Promise<GuestOtpStatus> => {
        const response = await publicApi.post<{ status: GuestOtpStatus }>('/Appointment/guest/send-otp', { phone });
        return response.data.status;
    },

    createGuestAppointment: async (data: CreateGuestAppointmentRequest): Promise<void> => {
        await publicApi.post('/Appointment/guest', data);
    },

    updateGroupStatus: async (groupId: string, status: AppointmentStatus, reason?: string): Promise<NoShowResultDto | null> => {
        const payload: UpdateAppointmentStatusDto = { status, reason };
        const response = await api.put<{ noShowResult?: NoShowResultDto }>(`/Appointment/group/${groupId}/status`, payload);
        return response.data.noShowResult ?? null;
    },
};
