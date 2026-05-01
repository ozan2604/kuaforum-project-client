
import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from './Button';
import { Scissors, Search, Heart, User } from 'lucide-react';

export const Navbar: React.FC = () => {
    const { user, isAuthenticated } = useAuth();
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
                <div className="flex justify-between items-center h-20 gap-2 sm:gap-4">

                    {/* Left: Logo */}
                    <div className="flex items-center shrink-0 gap-2 sm:gap-4">
                        <Link to="/" className="flex-shrink-0 flex items-center gap-3 group">
                            <div className="relative">
                                <img 
                                    src="/logo.png" 
                                    alt="Kuğulum Logo" 
                                    className="h-12 w-12 rounded-full object-cover border-2 border-gray-100 shadow-sm group-hover:border-primary-400 transition-all duration-300 aspect-square" 
                                />
                                <div className="absolute inset-0 rounded-full bg-primary-500/5 group-hover:bg-transparent transition-colors" />
                            </div>
                            <span className="font-black text-2xl tracking-tighter bg-gradient-to-br from-gray-900 via-gray-800 to-gray-500 bg-clip-text text-transparent hidden sm:block italic">
                                Kuğulum
                            </span>
                        </Link>
                    </div>

                    {/* Center: Search Bar */}
                    <div className="flex-1 min-w-0 max-w-2xl px-2">
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
                    <div className="flex items-center shrink-0 gap-2 sm:gap-4">


                        {isAuthenticated ? (
                            <>
                                <Link to="/favorites" className={`px-4 py-2 rounded-full flex items-center gap-2 transition-colors border ${location.pathname === '/favorites' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-200'}`} title="Favorilerim">
                                    <Heart className={`h-5 w-5 text-red-500 ${location.pathname === '/favorites' ? 'fill-current' : ''}`} />
                                    <span className="text-sm font-medium hidden md:block">Favorilerim</span>
                                </Link>

                                <div className="relative group">
                                    <Link to="/profile" className="px-4 py-2 bg-gray-100 rounded-full flex items-center gap-2 text-gray-700 hover:bg-gray-200 transition-colors border border-gray-200">
                                        <User className="h-5 w-5" />
                                        <span className="text-sm font-medium hidden md:block">{[user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Profil'}</span>
                                    </Link>

                                    {/* Dropdown can go here later */}
                                </div>


                            </>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Link to="/login">
                                    <Button variant="ghost" size="sm">Giriş</Button>
                                </Link>
                                <Link to="/register" className="hidden sm:block">
                                    <Button variant="primary" size="sm">Kayıt Ol</Button>
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};
