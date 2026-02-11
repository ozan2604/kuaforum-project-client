import api from './axios';
import type { ServiceCategoryDto, CreateServiceDto, CreateCategoryDto } from '../types/service';

export const serviceManagementService = {
    // Get all services grouped by category
    getShopServices: async (): Promise<ServiceCategoryDto[]> => {
        const response = await api.get<ServiceCategoryDto[]>('/services/my-shop');
        return response.data;
    },

    // Create a new service
    createService: async (data: CreateServiceDto): Promise<void> => {
        await api.post('/services/operations', data);
    },

    // Create a category
    createCategory: async (data: CreateCategoryDto): Promise<void> => {
        await api.post('/services/categories', data);
    },

    getPublicShopServices: async (shopId: string): Promise<ServiceCategoryDto[]> => {
        const response = await api.get<ServiceCategoryDto[]>(`/services/public/${shopId}`);
        return response.data;
    }
};
