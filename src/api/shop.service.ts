import api from './axios';
import type { Shop, CreateShopDto, ShopClosureDateDto } from '../types/shop';

export const shopService = {
    create: async (data: CreateShopDto): Promise<void> => {
        await api.post('/shop', data);
    },

    getMyShop: async (): Promise<Shop> => {
        const response = await api.get<Shop>('/shop/my-shop');
        return response.data;
    },

    getDashboardStats: async (): Promise<any> => {
        const response = await api.get<any>('/shop/my-shop/dashboard-stats');
        return response.data;
    },

    update: async (data: CreateShopDto): Promise<void> => {
        await api.put('/shop', data);
    },

    getAllShops: async (page: number = 1, pageSize: number = 10, search: string = ''): Promise<{ totalCount: number, shops: Shop[] }> => {
        const response = await api.get<{ totalCount: number, shops: Shop[] }>(`/shop/admin/all?page=${page}&pageSize=${pageSize}&search=${encodeURIComponent(search)}`);
        return response.data;
    },

    deleteShopByAdmin: async (id: string): Promise<void> => {
        await api.delete(`/shop/admin/${id}`);
    },

    getPublicShops: async (city?: string, district?: string, neighborhood?: string, pageNumber = 1, pageSize = 20): Promise<{ items: Shop[]; totalCount: number; totalPages: number; pageNumber: number }> => {
        const params = new URLSearchParams();
        if (city) params.append('city', city);
        if (district) params.append('district', district);
        if (neighborhood) params.append('neighborhood', neighborhood);
        params.append('pageNumber', String(pageNumber));
        params.append('pageSize', String(pageSize));
        const response = await api.get<{ items: Shop[]; totalCount: number; totalPages: number; pageNumber: number }>(`/shop/public/all?${params.toString()}`);
        return response.data;
    },

    getPublicShopById: async (id: string): Promise<Shop> => {
        const response = await api.get<Shop>(`/shop/public/${id}`);
        return response.data;
    },

    uploadCoverImage: async (id: string, file: File): Promise<{ path: string }> => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post<{ path: string }>(`/shop/${id}/cover-image`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    uploadGalleryImages: async (id: string, files: File[]): Promise<string[]> => {
        const formData = new FormData();
        files.forEach(file => formData.append('files', file));
        const response = await api.post<string[]>(`/shop/${id}/gallery-images`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    deleteGalleryImage: async (imageId: string): Promise<void> => {
        await api.delete(`/shop/gallery-images/${imageId}`);
    },

    updateAutoProcess: async (id: string, isEnabled: boolean): Promise<void> => {
        await api.patch(`/shop/${id}/auto-process`, isEnabled, {
            headers: { 'Content-Type': 'application/json' }
        });
    },

    getClosureDates: async (shopId: string): Promise<ShopClosureDateDto[]> => {
        const response = await api.get<ShopClosureDateDto[]>(`/shop/${shopId}/closure-dates`);
        return response.data;
    },

    addClosureDate: async (shopId: string, date: string, reason?: string): Promise<void> => {
        await api.post(`/shop/${shopId}/closure-dates`, { date, reason });
    },

    removeClosureDate: async (id: string): Promise<void> => {
        await api.delete(`/shop/closure-dates/${id}`);
    }
};
