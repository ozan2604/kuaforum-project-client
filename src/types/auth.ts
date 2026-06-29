export interface AuthResponse {
    id: string;
    userName: string;
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    profileImageUrl?: string;
    token: string;
    refreshToken: string;
}

export interface UpdateProfileRequest {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
}

export interface User {
    id: string;
    userName: string;
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    profileImageUrl?: string;
    role: string | string[]; // 'Admin' | 'SalonOwner' | 'Employee' | 'Customer' — array when multiple roles
}
