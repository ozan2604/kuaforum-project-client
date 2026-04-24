import React from 'react';
import { Outlet, Navigate, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard,
    Store,
    Scissors,
    Users,
    Calendar,
    Settings,
    LogOut,
    Menu,
    X,
    Bell
} from 'lucide-react';

export const SalonOwnerLayout: React.FC = () => {
    const { user, logout, isLoading } = useAuth();
    const navigate = useNavigate();
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    const userRoles = user ? (Array.isArray(user.role) ? user.role : [user.role]) : [];
    if (!user || !userRoles.includes('SalonOwner')) {
        return <Navigate to="/" replace />;
    }

    const navigation = [
        { name: 'Anasayfa', href: '/', icon: Store },
        { name: 'Dashboard', href: '/salon-panel', icon: LayoutDashboard },
        { name: 'Randevular', href: '/salon-panel/appointments', icon: Calendar },
        { name: 'Salonum', href: '/salon-panel/shop', icon: Store },
        { name: 'Hizmetler', href: '/salon-panel/services', icon: Scissors },
        { name: 'Çalışanlar', href: '/salon-panel/employees', icon: Users },
        // { name: 'Finans', href: '/salon-panel/finance', icon: PieChart },
        // { name: 'Müşteriler', href: '/salon-panel/customers', icon: UserCheck },
        { name: 'Ayarlar', href: '/salon-panel/settings', icon: Settings },
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-gray-900/50 z-40 lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>
                <div className="h-full flex flex-col">
                    {/* Header */}
                    <div className="h-16 flex items-center px-6 border-b border-gray-200">
                        <Store className="h-8 w-8 text-primary-600 mr-3" />
                        <span className="text-xl font-bold text-gray-900">Salon Paneli</span>
                        <button
                            className="ml-auto lg:hidden"
                            onClick={() => setIsSidebarOpen(false)}
                        >
                            <X className="h-6 w-6 text-gray-500" />
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
                        {navigation.map((item) => (
                            <NavLink
                                key={item.name}
                                to={item.href}
                                end={item.href === '/salon-panel'}
                                onClick={() => setIsSidebarOpen(false)}
                                className={({ isActive }) => `
                                    flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors
                                    ${isActive
                                        ? 'bg-primary-50 text-primary-700'
                                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'}
                                `}
                            >
                                <item.icon className="h-5 w-5" />
                                {item.name}
                            </NavLink>
                        ))}
                    </nav>

                    {/* Footer */}
                    <div className="p-4 border-t border-gray-200">
                        <div className="flex items-center gap-3 px-4 py-3 mb-2">
                            <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold">
                                {user.firstName.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                    {user.firstName} {user.lastName}
                                </p>
                                <p className="text-xs text-gray-500 truncate">
                                    {user.email}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                logout();
                                navigate('/login');
                            }}
                            className="w-full flex items-center gap-3 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                            <LogOut className="h-5 w-5" />
                            Çıkış Yap
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Mobile Header */}
                <header className="h-16 lg:hidden bg-white border-b border-gray-200 flex items-center px-4 justify-between">
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                    >
                        <Menu className="h-6 w-6" />
                    </button>
                    <span className="font-bold text-gray-900">Salon Yönetimi</span>
                    <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-full relative">
                        <Bell className="h-5 w-5" />
                        <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full"></span>
                    </button>
                </header>

                <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};
