import React from 'react';
import { createPortal } from 'react-dom';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UnsavedChangesProvider, useUnsavedChanges } from '../context/UnsavedChangesContext';
import {
    LayoutDashboard,
    Calendar,
    Clock,
    User,
    CalendarOff,
    LogOut,
    Menu,
    X,
    Scissors,
} from 'lucide-react';

const navItems = [
    { name: 'Dashboard',        href: '/employee-panel',              icon: LayoutDashboard, end: true },
    { name: 'Randevularım',     href: '/employee-panel/appointments', icon: Calendar },
    { name: 'Çalışma Saatleri', href: '/employee-panel/schedule',     icon: Clock },
    { name: 'İzin Günlerim',    href: '/employee-panel/leave',        icon: CalendarOff },
    { name: 'Profilim',         href: '/employee-panel/profile',      icon: User },
];

const EmployeeLayoutInner: React.FC = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const { isDirty, setIsDirty, pendingAction, setPendingAction } = useUnsavedChanges();
    const [sidebarOpen, setSidebarOpen] = React.useState(false);
    const [showLogoutModal, setShowLogoutModal] = React.useState(false);

    const guardedNavigate = (action: () => void) => {
        if (isDirty) {
            setPendingAction(() => action);
        } else {
            action();
        }
    };

    const handleConfirm = () => {
        setIsDirty(false);
        setPendingAction(null);
        pendingAction?.();
    };

    const handleCancel = () => {
        setPendingAction(null);
    };

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-gray-900/50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <aside className={`
                fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200
                transform transition-transform duration-200 ease-in-out
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>
                <div className="h-full flex flex-col">
                    <div className="h-16 flex items-center px-6 border-b border-gray-200">
                        <div className="bg-indigo-600 p-1.5 rounded-lg mr-3">
                            <Scissors className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-lg font-bold text-gray-900">Personel Paneli</span>
                        <button className="ml-auto lg:hidden" onClick={() => setSidebarOpen(false)}>
                            <X className="h-6 w-6 text-gray-500" />
                        </button>
                    </div>

                    <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
                        {navItems.map(item => (
                            <NavLink
                                key={item.href}
                                to={item.href}
                                end={item.end}
                                onClick={(e) => {
                                    setSidebarOpen(false);
                                    if (isDirty) {
                                        e.preventDefault();
                                        guardedNavigate(() => navigate(item.href));
                                    }
                                }}
                                className={({ isActive }) => `
                                    flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors
                                    ${isActive
                                        ? 'bg-indigo-50 text-indigo-700'
                                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'}
                                `}
                            >
                                <item.icon className="h-5 w-5" />
                                {item.name}
                            </NavLink>
                        ))}
                    </nav>

                    <div className="p-4 border-t border-gray-200">
                        {user && (
                            <div className="flex items-center gap-3 px-4 py-3 mb-2">
                                <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">
                                    {user.firstName.charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">
                                        {user.firstName} {user.lastName}
                                    </p>
                                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                                </div>
                            </div>
                        )}
                        <button
                            onClick={() => guardedNavigate(() => setShowLogoutModal(true))}
                            className="w-full flex items-center gap-3 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                            <LogOut className="h-5 w-5" />
                            Çıkış Yap
                        </button>
                    </div>
                </div>
            </aside>

            <div className="flex-1 flex flex-col min-w-0">
                <header className="h-16 bg-white border-b border-gray-200 flex items-center px-4 justify-between sticky top-0 z-30">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg lg:hidden"
                    >
                        <Menu className="h-6 w-6" />
                    </button>
                    <span className="font-bold text-gray-900 lg:hidden">Personel Paneli</span>
                    <div className="hidden lg:block" />
                </header>

                <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                    <Outlet />
                </main>
            </div>

            {/* Kaydedilmemiş değişiklikler modalı */}
            {pendingAction && createPortal(
                <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/50">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Kaydedilmemiş Değişiklikler</h3>
                        <p className="text-gray-600 text-sm mb-5">
                            Kaydedilmemiş değişiklikleriniz var. Sayfadan çıkarsanız bu değişiklikler kaybolacak.
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={handleCancel}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                            >
                                Sayfada Kal
                            </button>
                            <button
                                onClick={handleConfirm}
                                className="px-4 py-2 text-sm font-semibold rounded-xl text-white bg-red-600 hover:bg-red-700 transition-colors"
                            >
                                Çıkış Yap
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Logout confirmation modal */}
            {showLogoutModal && createPortal(
                <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/50">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Çıkış Yap</h3>
                        <p className="text-gray-600 text-sm mb-5">
                            Hesabınızdan çıkış yapmak istediğinize emin misiniz?
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setShowLogoutModal(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                            >
                                Vazgeç
                            </button>
                            <button
                                onClick={() => {
                                    setShowLogoutModal(false);
                                    logout();
                                    navigate('/login');
                                }}
                                className="px-4 py-2 text-sm font-semibold rounded-xl text-white bg-red-600 hover:bg-red-700 transition-colors"
                            >
                                Çıkış Yap
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export const EmployeeLayout: React.FC = () => (
    <UnsavedChangesProvider>
        <EmployeeLayoutInner />
    </UnsavedChangesProvider>
);
