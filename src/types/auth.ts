export interface AuthResponse {
    id: string;
    userName: string;
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber: string; // Added phoneNumber
    token: string;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    firstName: string;
    lastName: string;
    email: string;
    userName: string;
    password: string;
}

export interface UpdateProfileRequest {
    firstName: string;
    lastName: string;
    userName: string;
    email: string;
    phoneNumber: string;
}

export interface ChangePasswordRequest {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}

export interface User {
    id: string;
    userName: string;
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    role: string; // 'Admin' | 'SalonOwner' | 'Customer'
}
