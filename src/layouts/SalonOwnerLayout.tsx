import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Outlet, Navigate, NavLink, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { SalonProvider, useSalon } from '../context/SalonContext';
import { shopService } from '../api/shop.service';
import {
    LayoutDashboard,
    Store,
    Calendar,
    Settings,
    LogOut,
    Menu,
    X,
    Bell,
    AlertCircle,
    CheckCircle2,
    ChevronRight,
    Users,
    QrCode,
    Home,
    ChevronDown,
} from 'lucide-react';

interface NotificationItem {
    type: 'setup' | 'action' | 'warning' | 'info';
    message: string;
    link?: string;
}

const POLL_INTERVAL_MS = 60_000;

// ─── Inner layout (has access to SalonContext) ────────────────────────────────

const SalonOwnerLayoutInner: React.FC = () => {
    const { user, logout, isLoading: authLoading } = useAuth();
    const { currentShop, allShops, isLoading: shopLoading, switchShop } = useSalon();
    const navigate = useNavigate();
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
    const [showHomeModal, setShowHomeModal] = React.useState(false);
    const [showShopPicker, setShowShopPicker] = React.useState(false);

    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [panelOpen, setPanelOpen] = useState(false);
    const [notifSeen, setNotifSeen] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);

    const userRoles = user ? (Array.isArray(user.role) ? user.role : [user.role]) : [];
    const isSalonOwner = userRoles.includes('SalonOwner');

    const fetchNotifications = async () => {
        if (!isSalonOwner || !currentShop) return;
        try {
            const stats = await shopService.getDashboardStats(currentShop.id);
            const items: NotificationItem[] = stats?.notificationItems ?? [];
            setNotifications(items);
        } catch {
            // sessizce geç
        }
    };

    useEffect(() => {
        if (!isSalonOwner || !currentShop) return;
        fetchNotifications();
        const timer = setInterval(fetchNotifications, POLL_INTERVAL_MS);
        return () => clearInterval(timer);
    }, [isSalonOwner, currentShop?.id]);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
                setPanelOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleBellClick = () => {
        setPanelOpen(prev => !prev);
        setNotifSeen(true);
    };

    const handleNotifClick = (link?: string) => {
        setPanelOpen(false);
        if (link) navigate(link);
    };

    if (authLoading || shopLoading) {
        return <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
                <div className="inline-block w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mb-3" />
                <p className="text-sm text-gray-500">Yükleniyor...</p>
            </div>
        </div>;
    }

    if (!user || !isSalonOwner) {
        return <Navigate to="/" replace />;
    }

    // Multiple shops but none selected — show shop selector
    if (!currentShop && allShops.length > 1) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 max-w-md w-full p-8">
                    <div className="text-center mb-6">
                        <Store className="w-12 h-12 text-primary-600 mx-auto mb-3" />
                        <h1 className="text-xl font-bold text-gray-900">Hangi Salonla Devam?</h1>
                        <p className="text-sm text-gray-500 mt-1">Yönetmek istediğiniz salonu seçin</p>
                    </div>
                    <div className="space-y-3">
                        {allShops.map(shop => (
                            <button
                                key={shop.id}
                                onClick={() => switchShop(shop.id)}
                                className="w-full text-left flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:border-primary-400 hover:bg-primary-50 transition-all group"
                            >
                                <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-lg shrink-0 group-hover:bg-primary-200 transition-colors">
                                    {shop.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-gray-900 truncate">{shop.name}</p>
                                    <p className="text-xs text-gray-500 truncate">{shop.city}{shop.district ? `, ${shop.district}` : ''}</p>
                                </div>
                                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-primary-600 shrink-0" />
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // No shops at all — shouldn't normally happen for a SalonOwner
    if (!currentShop) {
        return <Navigate to="/" replace />;
    }

    const navigation = [
        { name: 'Dashboard',  href: '/salon-panel',                        icon: LayoutDashboard },
        { name: 'Randevular', href: '/salon-panel/appointments',            icon: Calendar },
        { name: 'Salonum',    href: '/salon-panel/shop',                    icon: Store },
        { name: 'QR Kod',     href: '/salon-panel/qr-kod',                  icon: QrCode },
        { name: 'Müşteriler', href: '/salon-panel/blocked-customers',       icon: Users },
        { name: 'Ayarlar',    href: '/salon-panel/settings',                icon: Settings },
    ];

    const actionCount = notifications.filter(n => n.type === 'action').length;

    const typeStyle = (type: NotificationItem['type']) => {
        if (type === 'action') return { dot: 'bg-amber-500', bg: 'hover:bg-amber-50', icon: <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" /> };
        if (type === 'setup')  return { dot: 'bg-blue-500',  bg: 'hover:bg-blue-50',  icon: <AlertCircle className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" /> };
        return { dot: 'bg-gray-400', bg: 'hover:bg-gray-50', icon: <AlertCircle className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" /> };
    };

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
                    {/* Header — shows current shop name */}
                    <div className="h-16 flex items-center px-4 border-b border-gray-200 gap-2 min-w-0">
                        <Store className="h-7 w-7 text-primary-600 shrink-0" />
                        <div className="flex-1 min-w-0">
                            <span className="text-sm font-bold text-gray-900 truncate block">{currentShop.name}</span>
                            {allShops.length > 1 && (
                                <button
                                    onClick={() => setShowShopPicker(true)}
                                    className="text-xs text-primary-600 hover:text-primary-800 transition-colors flex items-center gap-0.5"
                                >
                                    Salon Değiştir <ChevronDown className="w-3 h-3" />
                                </button>
                            )}
                        </div>
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
                            <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold shrink-0">
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
                            onClick={() => setShowHomeModal(true)}
                            className="w-full flex items-center gap-3 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors mb-1"
                        >
                            <Home className="h-5 w-5 text-gray-400" />
                            Anasayfa
                        </button>
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

                    <span className="font-bold text-gray-900 lg:hidden">{currentShop.name}</span>
                    <div className="hidden lg:block" />

                    {/* Bildirim zili */}
                    <div className="relative" ref={panelRef}>
                        <button
                            onClick={handleBellClick}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-full relative transition-colors"
                            title="Bildirimler"
                        >
                            <Bell className="h-5 w-5" />
                            {notifications.length > 0 && !notifSeen && (
                                <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full" />
                            )}
                            {notifications.length > 0 && notifSeen && (
                                <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-primary-600 rounded-full text-white text-[10px] font-bold flex items-center justify-center px-0.5">
                                    {notifications.length}
                                </span>
                            )}
                        </button>

                        {panelOpen && (
                            <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-bold text-gray-900">Bildirimler</p>
                                        {actionCount > 0 && (
                                            <p className="text-xs text-amber-600">{actionCount} işlem bekliyor</p>
                                        )}
                                    </div>
                                    <button onClick={() => setPanelOpen(false)} className="text-gray-400 hover:text-gray-600">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="max-h-96 overflow-y-auto divide-y divide-gray-50">
                                    {notifications.length === 0 ? (
                                        <div className="px-4 py-8 text-center">
                                            <CheckCircle2 className="w-8 h-8 text-green-400 mx-auto mb-2" />
                                            <p className="text-sm text-gray-500">Her şey yolunda görünüyor!</p>
                                        </div>
                                    ) : (
                                        notifications.map((n, i) => {
                                            const s = typeStyle(n.type);
                                            return (
                                                <button
                                                    key={i}
                                                    onClick={() => handleNotifClick(n.link)}
                                                    className={`w-full text-left px-4 py-3 flex items-start gap-3 transition-colors ${s.bg} ${n.link ? 'cursor-pointer' : 'cursor-default'}`}
                                                >
                                                    {s.icon}
                                                    <span className="flex-1 text-xs text-gray-700 leading-relaxed">{n.message}</span>
                                                    {n.link && <ChevronRight className="w-3.5 h-3.5 text-gray-300 shrink-0 mt-0.5" />}
                                                </button>
                                            );
                                        })
                                    )}
                                </div>

                                {notifications.length > 0 && (
                                    <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50">
                                        <Link
                                            to="/salon-panel"
                                            onClick={() => setPanelOpen(false)}
                                            className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                                        >
                                            Dashboard'a git →
                                        </Link>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                    <Outlet />
                </main>
            </div>

            {/* Home confirmation modal */}
            {showHomeModal && createPortal(
                <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/50">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Anasayfaya Git</h3>
                        <p className="text-gray-600 text-sm mb-5">
                            Salon panelinden çıkıp ana sayfaya dönmek istediğinize emin misiniz?
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setShowHomeModal(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                            >
                                Vazgeç
                            </button>
                            <button
                                onClick={() => { setShowHomeModal(false); navigate('/'); }}
                                className="px-4 py-2 text-sm font-semibold rounded-xl text-white bg-primary-600 hover:bg-primary-700 transition-colors"
                            >
                                Anasayfaya Git
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Shop picker modal (for multi-shop users) */}
            {showShopPicker && createPortal(
                <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/50">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-900">Salon Değiştir</h3>
                            <button onClick={() => setShowShopPicker(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="space-y-2">
                            {allShops.map(shop => (
                                <button
                                    key={shop.id}
                                    onClick={() => { switchShop(shop.id); setShowShopPicker(false); }}
                                    className={`w-full text-left flex items-center gap-3 p-3 rounded-xl border transition-all
                                        ${currentShop?.id === shop.id
                                            ? 'border-primary-400 bg-primary-50'
                                            : 'border-gray-200 hover:border-primary-300 hover:bg-primary-50'}`}
                                >
                                    <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center text-primary-700 font-bold shrink-0">
                                        {shop.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-gray-900 text-sm truncate">{shop.name}</p>
                                        <p className="text-xs text-gray-500 truncate">{shop.city}{shop.district ? `, ${shop.district}` : ''}</p>
                                    </div>
                                    {currentShop?.id === shop.id && (
                                        <CheckCircle2 className="w-4 h-4 text-primary-600 shrink-0" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

// ─── Public export wraps inner layout with SalonProvider ─────────────────────

export const SalonOwnerLayout: React.FC = () => (
    <SalonProvider>
        <SalonOwnerLayoutInner />
    </SalonProvider>
);
