import api from './axios';

export interface AdminPasswordStatus {
    key: string;
    isSet: boolean;
    updatedAt: string | null;
}

export interface SetAdminPasswordRequest {
    key: string;
    password: string;
}

export const adminPasswordService = {
    getAllStatuses: async (): Promise<AdminPasswordStatus[]> => {
        const response = await api.get('/AdminPasswords');
        return response.data;
    },

    setPassword: async (data: SetAdminPasswordRequest): Promise<any> => {
        const response = await api.post('/AdminPasswords/set', data);
        return response.data;
    },

    deletePassword: async (key: string): Promise<any> => {
        const response = await api.delete(`/AdminPasswords/${key}`);
        return response.data;
    }
};
