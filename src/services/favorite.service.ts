import api from '../api/axios';
import type { Shop } from '../types/shop';

export const favoriteService = {
    toggleFavorite: async (shopId: string) => {
        const response = await api.post(`/favorite/${shopId}`);
        return response.data;
    },

    checkFavoriteStatus: async (shopId: string) => {
        const response = await api.get<boolean>(`/favorite/${shopId}/check`);
        return response.data;
    },

    getUserFavorites: async () => {
        const response = await api.get<Shop[]>('/favorite');
        return response.data;
    },
};
