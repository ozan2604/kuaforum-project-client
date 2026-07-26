import api from '../api/axios';

export interface AdApplication {
    id: string;
    userId: string;
    mediaUrl: string;
    mediaType: string;
    description: string;
    phoneNumber: string;
    externalLink?: string;
    price?: number;
    status: 'Pending' | 'Approved' | 'Rejected';
    createdAt: string;
    approvedAt?: string;
    expiresAt?: string;
}

export const adsService = {
    createAd: async (formData: FormData) => {
        const response = await api.post('/ads', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    },

    getMyAds: async () => {
        const response = await api.get<AdApplication[]>('/ads/my-ads');
        return response.data;
    },

    getAllAdsAdmin: async () => {
        const response = await api.get<AdApplication[]>('/ads/admin');
        return response.data;
    },

    updateAdStatus: async (id: string, status: 'Pending' | 'Approved' | 'Rejected') => {
        const response = await api.put(`/ads/${id}/status`, { status });
        return response.data;
    },

    getActiveAds: async () => {
        const response = await api.get<AdApplication[]>('/ads/active');
        return response.data;
    }
};
