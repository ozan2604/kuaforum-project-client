
import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from './Button';
import { Scissors, Menu, Search, Heart, User } from 'lucide-react';

export const Navbar: React.FC = () => {
    const { user, isAuthenticated } = useAuth();
    const navigate = useNavigate();
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
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16 gap-4">

                    {/* Left: Hamburger + Logo */}
                    <div className="flex items-center gap-4">
                        <button className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-md">
                            <Menu className="h-6 w-6" />
                        </button>
                        <Link to="/" className="flex-shrink-0 flex items-center gap-2">
                            <div className="bg-primary-600 p-1.5 rounded-lg">
                                <Scissors className="h-6 w-6 text-white" />
                            </div>
                            <span className="font-bold text-xl text-gray-900 hidden sm:block">Kuaförüm</span>
                        </Link>
                    </div>

                    {/* Center: Search Bar */}
                    <div className="flex-1 max-w-2xl mx-auto">
                        <form onSubmit={handleSearch} className="relative">
                            <input
                                type="text"
                                className="w-full pl-4 pr-10 py-2 bg-gray-100 border-none rounded-full text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-colors"
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
                    <div className="flex items-center gap-2 sm:gap-4">


                        {isAuthenticated ? (
                            <>
                                <Link to="/favorites" className="px-4 py-2 bg-gray-100 rounded-full flex items-center gap-2 text-gray-700 hover:bg-gray-200 transition-colors border border-gray-200" title="Favorilerim">
                                    <Heart className="h-5 w-5 text-red-500" />
                                    <span className="text-sm font-medium hidden md:block">Favorilerim</span>
                                </Link>

                                <div className="relative group">
                                    <Link to="/profile" className="px-4 py-2 bg-gray-100 rounded-full flex items-center gap-2 text-gray-700 hover:bg-gray-200 transition-colors border border-gray-200">
                                        <User className="h-5 w-5" />
                                        <span className="text-sm font-medium hidden md:block">{user?.userName}</span>
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
