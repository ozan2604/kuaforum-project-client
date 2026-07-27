import api from './axios';

export interface SiteStatsDto {
    totalVisitsToday: number;
    totalVisitsThisWeek: number;
    totalVisitsThisMonth: number;
    sources: { source: string; count: number }[];
    devices: { device: string; count: number }[];
    browsers: { browser: string; count: number }[];
}

export const analyticsService = {
    logVisit: async (data: { referrer: string; userAgent: string; shopId?: string }) => {
        const response = await api.post('/Analytics/log-visit', data);
        return response.data;
    },
    
    getStats: async (): Promise<SiteStatsDto> => {
        const response = await api.get('/Analytics/stats');
        return response.data.data;
    },

    getShopStats: async (shopId: string): Promise<SiteStatsDto> => {
        const response = await api.get(`/Analytics/shop-stats/${shopId}`);
        return response.data.data;
    }
};
