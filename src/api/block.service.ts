import api from './axios';

export interface BlockedCustomer {
    id: string;
    customerId: string;
    customerName: string;
    customerPhone?: string;
    reason?: string;
    blockedAt: string;
}

export interface CustomerReviewSummary {
    rating: number;
    comment?: string;
    createdAt: string;
    employeeName?: string;
    serviceName?: string;
}

export interface CustomerAppointmentSummary {
    serviceName: string;
    price: number;
    startTime: string;
    status: number;
    employeeName?: string;
}

export interface CustomerShopInfo {
    customerId: string;
    customerName: string;
    customerPhone?: string;
    customerEmail?: string;
    totalAppointments: number;
    completedCount: number;
    cancelledCount: number;
    rejectedCount: number;
    noShowCount: number;
    pendingCount: number;
    confirmedCount: number;
    totalSpent: number;
    isBlocked: boolean;
    reviews: CustomerReviewSummary[];
    recentAppointments: CustomerAppointmentSummary[];
}

export const blockService = {
    blockCustomer: async (shopId: string, customerId: string, reason?: string): Promise<void> => {
        await api.post(`/shop-block/${shopId}/block`, { customerId, reason });
    },

    unblockCustomer: async (shopId: string, customerId: string): Promise<void> => {
        await api.delete(`/shop-block/${shopId}/block/${customerId}`);
    },

    getBlockedCustomers: async (shopId: string): Promise<BlockedCustomer[]> => {
        const response = await api.get<BlockedCustomer[]>(`/shop-block/${shopId}/blocked-customers`);
        return response.data;
    },

    getCustomerByPhone: async (shopId: string, phone: string): Promise<CustomerShopInfo> => {
        const response = await api.get<CustomerShopInfo>(`/shop-block/${shopId}/customer-by-phone`, {
            params: { phone },
        });
        return response.data;
    },
};
