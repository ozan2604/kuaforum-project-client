import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Store, Users, LogOut, Scissors, Menu, X, MessageSquare, Home, AlertTriangle } from 'lucide-react';

const LogoutConfirmModal: React.FC<{ onConfirm: () => void; onCancel: () => void }> = ({ onConfirm, onCancel }) =>
    createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 text-center mb-2">Çıkış Yap</h3>
                <p className="text-gray-500 text-sm text-center mb-6">
                    Admin panelinden çıkış yapmak istediğinize emin misiniz?
                </p>
                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                        İptal
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                    >
                        Çıkış Yap
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );

export const AdminLayout: React.FC = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [showHomeModal, setShowHomeModal] = useState(false);

    const handleLogoutConfirm = () => {
        logout();
        navigate('/login');
    };

    const navItems = [
        { path: '/admin',              label: 'Panel',        icon: LayoutDashboard },
        { path: '/admin/applications', label: 'Başvurular',   icon: Users },
        { path: '/admin/shops',        label: 'Salonlar',     icon: Store },
        { path: '/admin/users',        label: 'Kullanıcılar', icon: Users },
        { path: '/admin/sms-test',     label: 'SMS Test',     icon: MessageSquare },
    ];

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Sidebar */}
            <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:inset-auto flex flex-col ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                {/* Logo */}
                <div className="h-16 flex items-center justify-between px-6 border-b border-gray-100 shrink-0">
                    <div className="flex items-center">
                        <div className="bg-primary-600 p-1.5 rounded-lg mr-3">
                            <Scissors className="h-5 w-5 text-white" />
                        </div>
                        <span className="font-bold text-lg text-gray-800">Yönetim Paneli</span>
                    </div>
                    <button onClick={() => setSidebarOpen(false)} className="md:hidden text-gray-500 hover:text-gray-700">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Nav */}
                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path ||
                            (item.path !== '/admin' && location.pathname.startsWith(item.path));
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={() => setSidebarOpen(false)}
                                className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${isActive
                                    ? 'bg-primary-50 text-primary-600'
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                }`}
                            >
                                <Icon className={`h-5 w-5 mr-3 ${isActive ? 'text-primary-600' : 'text-gray-400'}`} />
                                {item.label}
                            </Link>
                        );
                    })}
                    {/* Anasayfa — nav'ın en altında */}
                    <div className="pt-2 mt-2 border-t border-gray-100">
                        <button
                            onClick={() => { setSidebarOpen(false); setShowHomeModal(true); }}
                            className="w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                        >
                            <Home className="h-5 w-5 mr-3 text-gray-400" />
                            Anasayfa
                        </button>
                    </div>
                </nav>

                {/* Bottom: Sadece Çıkış */}
                <div className="p-4 border-t border-gray-100 space-y-1 shrink-0">
                    <button
                        onClick={() => setShowLogoutConfirm(true)}
                        className="flex items-center w-full px-4 py-3 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                    >
                        <LogOut className="h-5 w-5 mr-3" />
                        Çıkış Yap
                    </button>
                </div>
            </div>

            {/* Overlay */}
            {sidebarOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
            )}

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="bg-white shadow-sm z-0 md:hidden">
                    <div className="flex items-center justify-between h-16 px-4">
                        <div className="flex items-center">
                            <button onClick={() => setSidebarOpen(true)} className="text-gray-500 hover:text-gray-700 mr-3">
                                <Menu className="h-6 w-6" />
                            </button>
                            <span className="font-bold text-lg text-gray-800">Yönetim Paneli</span>
                        </div>
                        <button onClick={() => setShowLogoutConfirm(true)} className="text-gray-500 hover:text-red-600 transition-colors">
                            <LogOut className="h-5 w-5" />
                        </button>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-4 md:p-8">
                    <Outlet />
                </main>
            </div>

            {showLogoutConfirm && (
                <LogoutConfirmModal
                    onConfirm={handleLogoutConfirm}
                    onCancel={() => setShowLogoutConfirm(false)}
                />
            )}

            {/* Home confirmation modal */}
            {showHomeModal && createPortal(
                <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/50">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Anasayfaya Git</h3>
                        <p className="text-gray-600 text-sm mb-5">
                            Yönetim panelinden çıkıp ana sayfaya dönmek istediğinize emin misiniz?
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setShowHomeModal(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                            >
                                Vazgeç
                            </button>
                            <button
                                onClick={() => {
                                    setShowHomeModal(false);
                                    navigate('/');
                                }}
                                className="px-4 py-2 text-sm font-semibold rounded-xl text-white bg-primary-600 hover:bg-primary-700 transition-colors"
                            >
                                Anasayfaya Git
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};
