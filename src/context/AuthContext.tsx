import React, { createContext, useContext, useState, useEffect } from 'react';
import type { LoginRequest, RegisterRequest, User } from '../types/auth';
import { authService } from '../api/auth.service';
import { getToken, getUser, setToken, setUser, clearAuth } from '../utils/storage';
import { jwtDecode } from 'jwt-decode';

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (data: LoginRequest) => Promise<void>;
    register: (data: RegisterRequest) => Promise<void>;
    logout: () => void;
    updateAuthorization: (response: any) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUserState] = useState<User | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        const token = getToken();
        const storedUser = getUser();

        if (token && storedUser) {
            setUserState(storedUser);
            setIsAuthenticated(true);
        }
        setIsLoading(false);
    }, []);

    const login = async (data: LoginRequest) => {
        setIsLoading(true);
        try {
            const response = await authService.login(data);
            // Handle case sensitivity (token vs Token)
            const token = (response as any).token || (response as any).Token;
            if (!token) {
                console.error('Login failed: Token not found in response', response);
                throw new Error('Token missing in response');
            }
            setToken(token);

            // Decode token to get roles
            const decoded: any = jwtDecode(token);
            const role = decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || decoded['role'];

            const userData: User = {
                id: response.id,
                userName: response.userName,
                email: response.email,
                firstName: response.firstName,
                lastName: response.lastName,
                role: role
            };
            setUser(userData);
            setUserState(userData);
            setIsAuthenticated(true);
        } finally {
            setIsLoading(false);
        }
    };

    const register = async (data: RegisterRequest) => {
        setIsLoading(true);
        try {
            const response = await authService.register(data);
            // Handle case sensitivity (token vs Token)
            const token = (response as any).token || (response as any).Token;
            if (!token) {
                console.error('Registration failed: Token not found in response', response);
                throw new Error('Token missing in response');
            }
            setToken(token);

            // Decode token to get roles
            const decoded: any = jwtDecode(token);
            const role = decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || decoded['role'];

            const userData: User = {
                id: response.id,
                userName: response.userName,
                email: response.email,
                firstName: response.firstName,
                lastName: response.lastName,
                role: role
            };
            setUser(userData);
            setUserState(userData);
            setIsAuthenticated(true);
        } finally {
            setIsLoading(false);
        }
    };

    const logout = () => {
        clearAuth();
        setUserState(null);
        setIsAuthenticated(false);
    };

    const updateAuthorization = (response: any) => {
        const token = response.token || response.Token;
        if (token) {
            setToken(token);

            const decoded: any = jwtDecode(token);
            const role = decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || decoded['role'];

            const userData: User = {
                id: response.id,
                userName: response.userName,
                email: response.email,
                firstName: response.firstName,
                lastName: response.lastName,
                role: role,
                phoneNumber: response.phoneNumber // Ensure we capture phone number if backend sends it, though DTO check needed
            };

            // Backend AuthService.cs doesn't explicitly return PhoneNumber in AuthResponse yet.
            // But we can check if we should add it to AuthResponse DTO in backend or just trust local state?
            // Better to rely on token or response.
            // Let's assume for now we might need to update backend AuthResponse to include PhoneNumber if we want it in User state.
            // Looking at User type in frontend, it has phoneNumber?: string.
            // Looking at AuthService.cs, it does NOT return PhoneNumber in AuthResponse.
            // We should fix backend too to return PhoneNumber.

            setUser(userData);
            setUserState(userData);
        }
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated, isLoading, login, register, logout, updateAuthorization }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
