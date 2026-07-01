import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, LayoutGrid, MapPinned, Heart, User } from 'lucide-react';

const tabs = [
    { id: 'home',      label: 'Ana Sayfa', icon: Home,        path: '/' },
    { id: 'kolaj',     label: 'Kolaj',     icon: LayoutGrid, path: '/kolaj' },
    { id: 'harita',    label: 'Harita',    icon: MapPinned,    path: null },
    { id: 'favoriler', label: 'Favoriler', icon: Heart,        path: '/favorites' },
    { id: 'profil',    label: 'Profil',    icon: User,         path: '/profile' },
];

export const MobileBottomNav: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const isActive = (id: string, path: string | null) => {
        if (!path) return false;
        if (id === 'home') return location.pathname === '/';
        if (id === 'kolaj') return location.pathname === '/kolaj';
        if (id === 'favoriler') return location.pathname === '/favorites';
        if (id === 'profil') return location.pathname === '/profile' || location.pathname === '/account';
        return false;
    };

    const handleClick = (id: string, path: string | null) => {
        if (id === 'harita') {
            navigate('/?openMap=1');
        } else if (path) {
            navigate(path);
        }
    };

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] flex sm:hidden">
            {tabs.map(({ id, icon: Icon, path }) => {
                const active = isActive(id, path);
                return (
                    <button
                        key={id}
                        onClick={() => handleClick(id, path)}
                        className={`flex-1 flex flex-col items-center justify-center py-3 transition-colors active:scale-95 ${
                            active ? 'text-primary-600' : 'text-gray-600 hover:text-gray-800'
                        }`}
                    >
                        <div className={`flex items-center justify-center w-[60px] h-9 rounded-full transition-all duration-300 ${active ? 'bg-primary-50' : 'bg-transparent'}`}>
                            <Icon className={`w-6 h-6 ${active ? 'stroke-[2.5]' : 'stroke-2'}`} />
                        </div>
                    </button>
                );
            })}
        </nav>
    );
};
