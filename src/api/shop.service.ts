import api from './axios';
import type { Shop, CreateShopDto } from '../types/shop';

export const shopService = {
    create: async (data: CreateShopDto): Promise<void> => {
        await api.post('/shop', data);
    },

    getMyShop: async (): Promise<Shop> => {
        const response = await api.get<Shop>('/shop/my-shop');
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

    getPublicShops: async (city?: string, district?: string, neighborhood?: string): Promise<Shop[]> => {
        let url = '/shop/public/all';
        const params = new URLSearchParams();
        if (city) params.append('city', city);
        if (district) params.append('district', district);
        if (neighborhood) params.append('neighborhood', neighborhood);
        if (params.toString()) url += `?${params.toString()}`;
        
        const response = await api.get<Shop[]>(url);
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
    }
};
