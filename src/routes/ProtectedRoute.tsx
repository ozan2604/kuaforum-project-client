import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
    roles?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ roles }) => {
    const { user, isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (roles) {
        if (!user?.role) {
            // Roles are required but user has no role defined
            return <Navigate to="/" replace />;
        }

        const userRoles = Array.isArray(user.role) ? user.role : [user.role];
        const hasRole = roles.some(role => userRoles.includes(role));

        if (!hasRole) {
            return <Navigate to="/" replace />;
        }
    }

    return <Outlet />;
};
