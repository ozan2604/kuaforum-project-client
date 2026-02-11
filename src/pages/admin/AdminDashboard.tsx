import React from 'react';

export const AdminDashboard: React.FC = () => {
    return (
        <div className="bg-white shadow rounded-lg p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Admin Dashboard</h1>
            <p className="text-gray-600">
                Welcome to the Admin Panel. Use the sidebar to manage salon applications and view registered shops.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                <div className="border border-gray-200 rounded-lg p-6 bg-blue-50">
                    <h2 className="text-lg font-semibold text-blue-800 mb-2">Pending Applications</h2>
                    <p className="text-blue-600">Review and approve new salon owner applications.</p>
                </div>
                <div className="border border-gray-200 rounded-lg p-6 bg-green-50">
                    <h2 className="text-lg font-semibold text-green-800 mb-2">Registered Shops</h2>
                    <p className="text-green-600">View details of all registered salons and their owners.</p>
                </div>
            </div>
        </div>
    );
};
