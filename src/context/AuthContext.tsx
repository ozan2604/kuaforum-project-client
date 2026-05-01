import React, { createContext, useContext, useState, useEffect } from 'react';
import type { LoginRequest, RegisterRequest, User } from '../types/auth';
import { authService } from '../api/auth.service';
import { getToken, getUser, setToken, setUser, setRefreshToken, clearAuth } from '../utils/storage';
import { jwtDecode } from 'jwt-decode';

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (data: LoginRequest) => Promise<string>;
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
            try {
                const decoded: any = jwtDecode(token);
                const isExpired = decoded.exp && decoded.exp * 1000 < Date.now();
                if (isExpired) {
                    clearAuth();
                } else {
                    setUserState(storedUser);
                    setIsAuthenticated(true);
                }
            } catch {
                clearAuth();
            }
        }
        setIsLoading(false);
    }, []);

    const login = async (data: LoginRequest): Promise<string> => {
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
            if (response.refreshToken) setRefreshToken(response.refreshToken);

            // Decode token to get roles
            const decoded: any = jwtDecode(token);
            const role = decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || decoded['role'];

            const userData: User = {
                id: response.id,
                userName: response.userName,
                email: response.email,
                firstName: response.firstName,
                lastName: response.lastName,
                role: role,
                phoneNumber: response.phoneNumber,
                profileImageUrl: response.profileImageUrl
            };
            setUser(userData);
            setUserState(userData);
            setIsAuthenticated(true);
            return role;
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
            if (response.refreshToken) setRefreshToken(response.refreshToken);

            // Decode token to get roles
            const decoded: any = jwtDecode(token);
            const role = decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || decoded['role'];

            const userData: User = {
                id: response.id,
                userName: response.userName,
                email: response.email,
                firstName: response.firstName,
                lastName: response.lastName,
                role: role,
                phoneNumber: response.phoneNumber,
                profileImageUrl: response.profileImageUrl
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
                phoneNumber: response.phoneNumber,
                profileImageUrl: response.profileImageUrl
            };

            setUser(userData);
            setUserState(userData);
        } else if (user) {
            // Partial update (e.g. just profile image)
            const updatedUser = { ...user, ...response };
            // Ensure we don't accidentally put 'token' inside the user object if it's there
            if ((updatedUser as any).token) delete (updatedUser as any).token;
            
            setUser(updatedUser);
            setUserState(updatedUser);
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
