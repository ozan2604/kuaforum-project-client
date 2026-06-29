import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../types/auth';
import { authService } from '../api/auth.service';
import { getToken, getUser, setToken, setUser, setRefreshToken, clearAuth } from '../utils/storage';
import { jwtDecode } from 'jwt-decode';

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    logout: () => void;
    updateAuthorization: (response: any) => void;
    /** OTP doğrulaması sonrası token alındığında çağrılır, kullanıcıyı oturuma alır ve rolünü döndürür. */
    completeAuth: (response: any) => string;
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

    const logout = () => {
        authService.logout().catch(() => {});
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
            if ((updatedUser as any).token) delete (updatedUser as any).token;
            setUser(updatedUser);
            setUserState(updatedUser);
        }
    };

    const completeAuth = (response: any): string => {
        const token = response.token || response.Token;
        if (!token) throw new Error('Token missing in response');

        setToken(token);
        if (response.refreshToken) setRefreshToken(response.refreshToken);

        const decoded: any = jwtDecode(token);
        const role = decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || decoded['role'];

        const userData: User = {
            id: response.id,
            userName: response.userName,
            email: response.email,
            firstName: response.firstName,
            lastName: response.lastName,
            role,
            phoneNumber: response.phoneNumber,
            profileImageUrl: response.profileImageUrl
        };
        setUser(userData);
        setUserState(userData);
        setIsAuthenticated(true);
        return role;
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated, isLoading, logout, updateAuthorization, completeAuth }}>
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
