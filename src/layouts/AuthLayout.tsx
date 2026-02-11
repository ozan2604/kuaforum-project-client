import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Scissors } from 'lucide-react';

export const AuthLayout: React.FC = () => {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <Link to="/" className="flex justify-center items-center gap-2">
                    <div className="bg-primary-600 p-2 rounded-xl">
                        <Scissors className="h-8 w-8 text-white" />
                    </div>
                    <span className="text-3xl font-extrabold text-gray-900">Kuaförüm</span>
                </Link>
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                    Hesabınıza giriş yapın
                </h2>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    <Outlet />
                </div>
            </div>
        </div>
    );
};
