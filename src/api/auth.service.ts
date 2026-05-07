import api from './axios';
import type { AuthResponse, RegisterRequest, UpdateProfileRequest, ChangePasswordRequest } from '../types/auth';

export interface SendOtpResponse {
    message: string;
    expiresInSeconds: number;
}

export interface SendLoginOtpRequest {
    phoneNumber: string;
    password: string;
}

export interface VerifyLoginOtpRequest {
    phoneNumber: string;
    password: string;
    otpCode: string;
}

export interface SendRegisterOtpRequest {
    firstName: string;
    lastName: string;
    phoneNumber: string;
    password: string;
    email?: string;
    role?: string;
}

export interface VerifyRegisterOtpRequest {
    firstName: string;
    lastName: string;
    phoneNumber: string;
    password: string;
    email?: string;
    role?: string;
    otpCode: string;
}

export const authService = {
    // Mevcut (direkt) login/register — admin gibi özel durumlar için saklandı
    login: async (data: { identifier: string; password: string }): Promise<AuthResponse> => {
        const response = await api.post<AuthResponse>('/auth/login', data);
        return response.data;
    },

    register: async (data: RegisterRequest): Promise<AuthResponse> => {
        const response = await api.post<AuthResponse>('/auth/register', data);
        return response.data;
    },

    // OTP: Login
    sendLoginOtp: async (data: SendLoginOtpRequest): Promise<SendOtpResponse> => {
        const response = await api.post<SendOtpResponse>('/auth/login/send-otp', data);
        return response.data;
    },

    verifyLoginOtp: async (data: VerifyLoginOtpRequest): Promise<AuthResponse> => {
        const response = await api.post<AuthResponse>('/auth/login/verify-otp', data);
        return response.data;
    },

    // OTP: Register
    sendRegisterOtp: async (data: SendRegisterOtpRequest): Promise<SendOtpResponse> => {
        const response = await api.post<SendOtpResponse>('/auth/register/send-otp', data);
        return response.data;
    },

    verifyRegisterOtp: async (data: VerifyRegisterOtpRequest): Promise<AuthResponse> => {
        const response = await api.post<AuthResponse>('/auth/register/verify-otp', data);
        return response.data;
    },

    // Şifre Sıfırlama
    sendForgotPasswordOtp: async (data: { phoneNumber: string }): Promise<SendOtpResponse> => {
        const response = await api.post<SendOtpResponse>('/auth/forgot-password/send-otp', data);
        return response.data;
    },

    resetPasswordWithOtp: async (data: { phoneNumber: string; otpCode: string; newPassword: string }): Promise<void> => {
        await api.post('/auth/forgot-password/reset', data);
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
