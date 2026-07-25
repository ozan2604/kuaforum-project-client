
import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { Search, MapPin, Filter, Home, LayoutGrid, MapPinned, Heart, User } from 'lucide-react';

export const Navbar: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams, setSearchParams] = useSearchParams();
    const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        // Update URL with search term
        if (searchTerm.trim()) {
            setSearchParams({ search: searchTerm });
            navigate(`/?search=${encodeURIComponent(searchTerm)}`); // Ensure we are on home page
        } else {
            setSearchParams({});
            navigate('/');
        }
    };

    return (
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-14 sm:h-24 gap-2 sm:gap-4">

                    {/* Left: Logo */}
                    <div className="flex items-center shrink-0 overflow-hidden h-14 sm:h-24 w-[165px] sm:w-[280px] relative -ml-2 sm:-ml-4">
                        <Link to="/" className="absolute inset-0 flex items-center justify-center group">
                            <img
                                src="/logo.png"
                                alt="SALONBİR Logo"
                                className="w-[165px] sm:w-[280px] max-w-none transition-transform duration-300 group-hover:scale-105"
                            />
                        </Link>
                    </div>

                    {/* Center: Search Bar */}
                    <div className="hidden sm:block flex-1 min-w-0 max-w-2xl px-2">
                        <form onSubmit={handleSearch} className="relative w-full">
                            <input
                                type="text"
                                className="w-full pl-4 pr-10 py-2 bg-gray-100 border-none rounded-full text-sm sm:text-base text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-colors"
                                placeholder="Salon adı, şehir veya ilçe ara..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <button
                                type="submit"
                                className="absolute right-0 top-0 h-full px-4 text-gray-500 hover:text-primary-600"
                            >
                                <Search className="h-5 w-5" />
                            </button>
                        </form>
                    </div>

                    {/* Right: Actions */}
                    <div id="navbar-right-actions" className="flex items-center shrink-0 gap-2 sm:gap-6">
                        
                        {/* Desktop Navigation Links */}
                        <div className="hidden sm:flex items-center gap-3 mr-2">
                            <button
                                onClick={() => navigate('/')}
                                className={`p-2.5 rounded-full transition-all hover:text-primary-600 hover:bg-gray-100 ${location.pathname === '/' ? 'text-primary-600 bg-primary-50' : 'text-gray-600'}`}
                                title="Ana Sayfa"
                            >
                                <Home className="w-[22px] h-[22px]" />
                            </button>
                            <button
                                onClick={() => navigate('/kolaj')}
                                className={`p-2.5 rounded-full transition-all hover:text-primary-600 hover:bg-gray-100 ${location.pathname === '/kolaj' ? 'text-primary-600 bg-primary-50' : 'text-gray-600'}`}
                                title="Kolaj"
                            >
                                <LayoutGrid className="w-[22px] h-[22px]" />
                            </button>
                            <button
                                onClick={() => navigate('/?openMap=1')}
                                className="p-2.5 rounded-full transition-all hover:text-primary-600 hover:bg-gray-100 text-gray-600"
                                title="Konum"
                            >
                                <MapPinned className="w-[22px] h-[22px]" />
                            </button>
                            <button
                                onClick={() => navigate('/favorites')}
                                className={`p-2.5 rounded-full transition-all hover:text-red-600 hover:bg-red-50 ${location.pathname === '/favorites' ? 'text-red-600 bg-red-50' : 'text-gray-600'}`}
                                title="Favoriler"
                            >
                                <Heart className={`w-[22px] h-[22px] ${location.pathname === '/favorites' ? 'fill-current' : ''}`} />
                            </button>
                            <button
                                onClick={() => navigate('/profile')}
                                className={`p-2.5 rounded-full transition-all hover:text-primary-600 hover:bg-gray-100 ${location.pathname === '/profile' ? 'text-primary-600 bg-primary-50' : 'text-gray-600'}`}
                                title="Profil"
                            >
                                <User className="w-[22px] h-[22px]" />
                            </button>
                        </div>

                        {location.pathname !== '/' && (
                            <div className="flex items-center gap-1 sm:gap-2 ml-auto">
                                <button
                                    onClick={() => navigate('/?openLocation=1')}
                                    className="p-2 rounded-full text-gray-600 hover:bg-gray-100 transition-colors"
                                    title="Konum Seç"
                                >
                                    <MapPin className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => navigate('/?openSearch=1')}
                                    className="p-2 rounded-full text-gray-600 hover:bg-gray-100 transition-colors sm:hidden"
                                    title="Arama"
                                >
                                    <Search className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => navigate('/?openFilters=1')}
                                    className="p-2 rounded-full text-gray-600 hover:bg-gray-100 transition-colors"
                                    title="Filtreler"
                                >
                                    <Filter className="w-5 h-5" />
                                </button>
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </nav>
    );
};
