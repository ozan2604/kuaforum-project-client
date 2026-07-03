import api from './axios';
import type { TargetGender } from '../types/shop';

export interface AdminCreateSalonDto {
    phoneNumber: string;
    shopName: string;
    categoryIds: number[];
    genderPreference: TargetGender;
    city?: string;
    district?: string;
    neighborhood?: string;
    street?: string;
    buildingNumber?: string;
    address?: string;
    latitude?: number | null;
    longitude?: number | null;
    firstName?: string;
    lastName?: string;
}

export interface AdminAppointmentStatsDto {
    shopId: string;
    shopName: string;
    todayManualCount: number;
    todayNormalCount: number;
    weekManualCount: number;
    weekNormalCount: number;
    monthManualCount: number;
    monthNormalCount: number;
    yearManualCount: number;
    yearNormalCount: number;
}

export const adminService = {
    createSalon: async (data: AdminCreateSalonDto): Promise<void> => {
        await api.post('/adminsalon/create', data);
    },
    getAppointmentStats: async (): Promise<AdminAppointmentStatsDto[]> => {
        const response = await api.get<AdminAppointmentStatsDto[]>('/appointment/admin/stats');
        return response.data;
    },
};
