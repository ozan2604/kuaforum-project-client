import api from './axios';
import type { AuthResponse, RegisterRequest, UpdateProfileRequest, ChangePasswordRequest } from '../types/auth';


export const authService = {
    login: async (data: { identifier: string; password: string }): Promise<AuthResponse> => {
        const response = await api.post<AuthResponse>('/auth/login', data);
        return response.data;
    },

    register: async (data: RegisterRequest): Promise<AuthResponse> => {
        const response = await api.post<AuthResponse>('/auth/register', data);
        return response.data;
    },

    updateProfile: async (data: UpdateProfileRequest): Promise<AuthResponse> => {
        const response = await api.put<AuthResponse>('/auth/profile', data);
        return response.data;
    },

    changePassword: async (data: ChangePasswordRequest): Promise<void> => {
        await api.put('/auth/change-password', data);
    },

    deleteAccount: async (): Promise<void> => {
        await api.delete('/auth/account');
    },

    updateProfileImage: async (image: File): Promise<{ imageUrl: string }> => {
        const formData = new FormData();
        formData.append('image', image);
        const response = await api.put<{ imageUrl: string }>('/auth/profile-image', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    deleteProfileImage: async (): Promise<void> => {
        await api.delete('/auth/profile-image');
    }
};
