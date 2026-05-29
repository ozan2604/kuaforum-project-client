import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSalon } from '../context/SalonContext';
import { LayoutDashboard, Store, Scissors, Calendar, Users, LogOut, Menu, X, ChevronDown, Check, QrCode, ShieldCheck } from 'lucide-react';

export const SalonLayout: React.FC = () => {
    const { logout } = useAuth();
    const { currentShop, allShops, switchShop } = useSalon();
    const navigate = useNavigate();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = React.useState(false);
    const [shopDropdownOpen, setShopDropdownOpen] = React.useState(false);
    const dropdownRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setShopDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

    const navItems = [
        { path: '/salon', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/salon/shop', label: 'Salonum', icon: Store },
        { path: '/salon/services', label: 'Hizmetler', icon: Scissors },
        { path: '/salon/employees', label: 'Personel', icon: Users },
        { path: '/salon/appointments', label: 'Randevular', icon: Calendar },
        { path: '/salon/customers', label: 'Müşteriler', icon: ShieldCheck },
        { path: '/salon/qr', label: 'QR Kod', icon: QrCode },
    ];

    const ShopPicker = () => {
        if (allShops.length <= 1) {
            return (
                <div className="mx-4 mb-3 px-3 py-2 bg-primary-50 rounded-xl">
                    <p className="text-xs text-primary-400 font-medium truncate">Aktif Salon</p>
                    <p className="text-sm font-bold text-primary-800 truncate">{currentShop?.name ?? '—'}</p>
                </div>
            );
        }

        return (
            <div className="mx-4 mb-3 relative" ref={dropdownRef}>
                <button
                    onClick={() => setShopDropdownOpen(v => !v)}
                    className="w-full flex items-center justify-between px-3 py-2 bg-primary-50 hover:bg-primary-100 rounded-xl transition-colors"
                >
                    <div className="min-w-0 text-left">
                        <p className="text-xs text-primary-400 font-medium">Aktif Salon</p>
                        <p className="text-sm font-bold text-primary-800 truncate">{currentShop?.name ?? 'Salon Seçin'}</p>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-primary-500 shrink-0 ml-2 transition-transform ${shopDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {shopDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border border-gray-100 z-50 overflow-hidden">
                        {allShops.map(shop => (
                            <button
                                key={shop.id}
                                onClick={() => { switchShop(shop.id); setShopDropdownOpen(false); setSidebarOpen(false); }}
                                className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-gray-50 transition-colors text-left"
                            >
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-800 truncate">{shop.name}</p>
                                    {shop.district && <p className="text-xs text-gray-400 truncate">{shop.district}</p>}
                                </div>
                                {currentShop?.id === shop.id && (
                                    <Check className="w-4 h-4 text-primary-600 shrink-0" />
                                )}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Sidebar */}
            <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:inset-auto ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                }`}>
                <div className="h-16 flex items-center justify-between px-6 border-b border-gray-100">
                    <div className="flex items-center">
                        <div className="bg-primary-600 p-1.5 rounded-lg mr-3">
                            <Store className="h-5 w-5 text-white" />
                        </div>
                        <span className="font-bold text-lg text-gray-800">Salon Panel</span>
                    </div>
                    <button onClick={toggleSidebar} className="md:hidden text-gray-500 hover:text-gray-700">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <div className="pt-4">
                    <ShopPicker />
                </div>

                <nav className="px-4 space-y-1">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;

                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={() => setSidebarOpen(false)}
                                className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors
                                    ${isActive
                                        ? 'bg-primary-50 text-primary-600'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                    }`}
                            >
                                <Icon className={`h-5 w-5 mr-3 ${isActive ? 'text-primary-600' : 'text-gray-400'}`} />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="absolute bottom-0 w-64 p-4 border-t border-gray-100">
                    <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-3 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                    >
                        <LogOut className="h-5 w-5 mr-3" />
                        Çıkış Yap
                    </button>
                </div>
            </div>

            {/* Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="bg-white shadow-sm z-0 md:hidden">
                    <div className="flex items-center justify-between h-16 px-4">
                        <div className="flex items-center">
                            <button onClick={toggleSidebar} className="text-gray-500 hover:text-gray-700 mr-3">
                                <Menu className="h-6 w-6" />
                            </button>
                            <span className="font-bold text-lg text-gray-800">Salon Panel</span>
                        </div>
                        <button onClick={handleLogout} className="text-gray-500">
                            <LogOut className="h-5 w-5" />
                        </button>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-4 md:p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};
