import api from './axios';
import type { ServiceCategoryDto, CreateServiceDto, CreateCategoryDto } from '../types/service';

export const serviceManagementService = {
    // Owner-facing: all require shopId

    getShopServices: async (shopId: string): Promise<ServiceCategoryDto[]> => {
        const response = await api.get<ServiceCategoryDto[]>(`/services/my-shop?shopId=${shopId}`);
        return response.data;
    },

    createService: async (shopId: string, data: CreateServiceDto): Promise<void> => {
        await api.post(`/services/operations?shopId=${shopId}`, data);
    },

    createCategory: async (shopId: string, data: CreateCategoryDto): Promise<void> => {
        await api.post(`/services/categories?shopId=${shopId}`, data);
    },

    updateCategory: async (shopId: string, id: string, data: any): Promise<void> => {
        await api.put(`/services/categories/${id}?shopId=${shopId}`, data);
    },

    deleteCategory: async (shopId: string, id: string): Promise<void> => {
        await api.delete(`/services/categories/${id}?shopId=${shopId}`);
    },

    updateService: async (shopId: string, id: string, data: any): Promise<void> => {
        await api.put(`/services/${id}?shopId=${shopId}`, data);
    },

    deleteService: async (shopId: string, id: string): Promise<void> => {
        await api.delete(`/services/${id}?shopId=${shopId}`);
    },

    // Public endpoint (no shopId ownership check)
    getPublicShopServices: async (shopId: string): Promise<ServiceCategoryDto[]> => {
        const response = await api.get<ServiceCategoryDto[]>(`/services/public/${shopId}`);
        return response.data;
    }
};
