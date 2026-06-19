import React from 'react';
import { Outlet, NavLink, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSalon } from '../context/SalonContext';
import { AdminSalonProvider } from '../context/AdminSalonContext';
import {
    LayoutDashboard,
    Store,
    Calendar,
    LogOut,
    Menu,
    X,
    Users,
    QrCode,
    ArrowLeft,
    ShieldAlert,
} from 'lucide-react';

const AdminSalonLayoutInner: React.FC = () => {
    const { user, logout } = useAuth();
    const { currentShop, isLoading } = useSalon();
    const navigate = useNavigate();
    const { shopId } = useParams<{ shopId: string }>();
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

    const base = `/admin/shops/${shopId}/panel`;

    const navigation = [
        { name: 'Dashboard',  href: base,                           icon: LayoutDashboard, end: true },
        { name: 'Randevular', href: `${base}/appointments`,         icon: Calendar,        end: false },
        { name: 'Salonum',    href: `${base}/shop`,                 icon: Store,           end: false },
        { name: 'Müşteriler', href: `${base}/blocked-customers`,    icon: Users,           end: false },
        { name: 'QR Kod',     href: `${base}/qr-kod`,               icon: QrCode,          end: false },
    ];

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block w-8 h-8 border-4 border-amber-200 border-t-amber-500 rounded-full animate-spin mb-3" />
                    <p className="text-sm text-gray-500">Yükleniyor...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Admin Mode Banner */}
            <div className="bg-amber-400 text-amber-900 px-4 py-2 flex items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-2 text-sm font-semibold">
                    <ShieldAlert className="w-4 h-4" />
                    Admin Modu — {currentShop?.name ?? 'Salon yükleniyor...'}
                </div>
                <button
                    onClick={() => navigate('/admin/shops')}
                    className="flex items-center gap-1.5 text-xs font-medium bg-amber-300 hover:bg-amber-200 px-3 py-1.5 rounded-lg transition-colors"
                >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Admin Paneline Dön
                </button>
            </div>

            <div className="flex flex-1 min-h-0">
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
                        <div className="h-16 flex items-center px-4 border-b border-gray-200 gap-2 min-w-0">
                            <Store className="h-7 w-7 text-amber-500 shrink-0" />
                            <span className="text-sm font-bold text-gray-900 truncate flex-1">
                                {currentShop?.name ?? '—'}
                            </span>
                            <button
                                className="ml-auto lg:hidden shrink-0"
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
                                    end={item.end}
                                    onClick={() => setIsSidebarOpen(false)}
                                    className={({ isActive }) => `
                                        flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors
                                        ${isActive
                                            ? 'bg-amber-50 text-amber-700'
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
                            {user && (
                                <div className="flex items-center gap-3 px-4 py-3 mb-2">
                                    <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold shrink-0">
                                        {user.firstName.charAt(0)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate">
                                            {user.firstName} {user.lastName}
                                        </p>
                                        <p className="text-xs text-amber-600 font-medium truncate">Admin</p>
                                    </div>
                                </div>
                            )}
                            <button
                                onClick={() => { logout(); navigate('/login'); }}
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
                    {/* Top Header */}
                    <header className="h-16 bg-white border-b border-gray-200 flex items-center px-4 justify-between sticky top-0 z-30">
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg lg:hidden"
                        >
                            <Menu className="h-6 w-6" />
                        </button>
                        <span className="font-bold text-gray-900 lg:hidden">{currentShop?.name ?? '—'}</span>
                        <div className="hidden lg:block" />
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg">
                            <ShieldAlert className="w-4 h-4 text-amber-600" />
                            <span className="text-xs font-semibold text-amber-700">Admin Görünümü</span>
                        </div>
                    </header>

                    <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                        <Outlet />
                    </main>
                </div>
            </div>
        </div>
    );
};

export const AdminSalonLayout: React.FC = () => {
    const { shopId } = useParams<{ shopId: string }>();
    if (!shopId) return null;

    return (
        <AdminSalonProvider shopId={shopId}>
            <AdminSalonLayoutInner />
        </AdminSalonProvider>
    );
};
