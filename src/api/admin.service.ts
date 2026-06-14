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

export const adminService = {
    createSalon: async (data: AdminCreateSalonDto): Promise<void> => {
        await api.post('/adminsalon/create', data);
    },
};
