import api from './axios';
import type { AuthResponse, LoginRequest, RegisterRequest, UpdateProfileRequest, ChangePasswordRequest } from '../types/auth';
import type { Address, CreateAddressRequest } from '../types/address';

export const authService = {
    login: async (data: LoginRequest): Promise<AuthResponse> => {
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

    getAddresses: async (): Promise<Address[]> => {
        const response = await api.get<Address[]>('/auth/addresses');
        return response.data;
    },

    addAddress: async (data: CreateAddressRequest): Promise<Address> => {
        const response = await api.post<Address>('/auth/addresses', data);
        return response.data;
    },

    deleteAddress: async (id: string): Promise<void> => {
        await api.delete(`/auth/addresses/${id}`);
    }
};
