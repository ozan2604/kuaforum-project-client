import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Star, Calendar, Heart } from 'lucide-react';
import { Button } from './Button';
import { ShopCategoryLabels, type Shop } from '../types/shop';
import { useAuth } from '../context/AuthContext';
import { favoriteService } from '../services/favorite.service';
import { toast } from 'react-hot-toast';

interface ShopCardProps {
    shop: Shop;
    initialIsFavorite?: boolean;
    onToggleFavorite?: (newStatus: boolean) => void;
}

export const ShopCard: React.FC<ShopCardProps> = ({ shop, initialIsFavorite = false, onToggleFavorite }) => {
    const { isAuthenticated } = useAuth();
    const [isFavorite, setIsFavorite] = useState(initialIsFavorite);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        setIsFavorite(initialIsFavorite);
    }, [initialIsFavorite]);

    const handleFavoriteClick = async (e: React.MouseEvent) => {
        e.preventDefault(); // Prevent Link navigation
        e.stopPropagation();

        if (!isAuthenticated) {
            toast.error('Favorilere eklemek için giriş yapmalısınız.');
            return;
        }

        if (isLoading) return;

        // Optimistic update
        const newStatus = !isFavorite;
        setIsFavorite(newStatus);
        setIsLoading(true);

        try {
            await favoriteService.toggleFavorite(shop.id);
            if (onToggleFavorite) onToggleFavorite(newStatus);
            toast.success(newStatus ? 'Favorilere eklendi' : 'Favorilerden çıkarıldı');
        } catch (error) {
            // Revert on error
            setIsFavorite(!newStatus);
            console.error('Favorite toggle failed', error);
            toast.error('İşlem başarısız oldu');
        } finally {
            setIsLoading(false);
        }
    };

    const getImageUrl = (path: string | undefined) => {
        if (!path) return 'https://images.unsplash.com/photo-1560066984-12186d30b435?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80';
        if (path.startsWith('http')) return path;
        return `http://localhost:5000${path}`;
    };

    return (
        <div className="group bg-white rounded-xl sm:rounded-2xl overflow-hidden hover:shadow-xl hover:shadow-primary-900/8 hover:-translate-y-1 transition-all duration-400 border border-gray-100 flex flex-col h-full relative">
            {/* Görsel Bölümü */}
            <Link to={`/shop/${shop.id}`} className="block relative w-full h-[140px] sm:h-[200px] overflow-hidden shrink-0">
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent z-10" />
                <img
                    src={getImageUrl(shop.coverImagePath)}
                    alt={shop.name}
                    className="w-full h-full object-cover absolute inset-0 group-hover:scale-105 transition-transform duration-500 ease-out"
                    onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1560066984-12186d30b435?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'; }}
                />

                {/* Favori Butonu */}
                <button
                    onClick={handleFavoriteClick}
                    disabled={isLoading}
                    className={`absolute top-2 sm:top-3 right-2 sm:right-3 z-20 p-1.5 sm:p-2 rounded-full shadow-md backdrop-blur-sm transition-all duration-300 hover:scale-110 active:scale-95 ${isFavorite
                        ? 'bg-secondary-500 text-white border border-secondary-400'
                        : 'bg-white/85 text-gray-400 hover:text-secondary-500 border border-white/40'
                        }`}
                >
                    <Heart className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${isFavorite ? 'fill-current' : ''}`} />
                </button>

                {/* Kategori Etiketi */}
                <div className="absolute top-2 sm:top-3 left-2 sm:left-3 z-20">
                    <span className="inline-flex items-center px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-md sm:rounded-lg text-[8px] sm:text-[10px] font-bold uppercase tracking-wider bg-white/90 text-gray-800 backdrop-blur-sm shadow-sm">
                        {shop.categories?.length > 0 ? ShopCategoryLabels[shop.categories[0] as ShopCategory] : 'Güzellik Salonu'}{shop.categories?.length > 1 ? ` +${shop.categories.length - 1}` : ''}
                    </span>
                </div>

                {/* Puan */}
                {shop.averageRating > 0 && (
                    <div className="absolute bottom-2 sm:bottom-3 right-2 sm:right-3 z-20 bg-white/90 backdrop-blur-sm px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md sm:rounded-lg shadow-sm flex items-center gap-0.5 sm:gap-1">
                        <Star className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-amber-400 fill-current" />
                        <span className="text-[10px] sm:text-xs font-bold text-gray-900">{shop.averageRating.toFixed(1)}</span>
                    </div>
                )}
            </Link>

            {/* İçerik Bölümü */}
            <div className="p-2.5 sm:p-4 flex-1 flex flex-col w-full">
                <Link to={`/shop/${shop.id}`} className="mb-0.5 sm:mb-1">
                    <h3 className="text-sm sm:text-base font-bold text-gray-900 group-hover:text-primary-600 transition-colors line-clamp-1">
                        {shop.name}
                    </h3>
                </Link>

                <div className="flex items-center text-gray-500 text-[11px] sm:text-xs mb-1.5 sm:mb-2">
                    <MapPin className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-0.5 sm:mr-1 text-secondary-400 shrink-0" />
                    <span className="line-clamp-1">{shop.district}, {shop.city}</span>
                </div>

                <p className="text-gray-500 text-[11px] sm:text-xs mb-2 sm:mb-3 line-clamp-1 leading-relaxed hidden sm:block">
                    {shop.description || 'Profesyonel güzellik ve bakım hizmetleri.'}
                </p>

                <div className="flex items-center justify-between pt-2 sm:pt-3 border-t border-gray-100 mt-auto">
                    <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold px-1.5 sm:px-2 py-0.5 sm:py-1 bg-green-50 text-green-700 rounded-md">
                        <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                        Açık
                    </span>
                    <Button
                        size="sm"
                        variant="secondary"
                        className="rounded-lg sm:rounded-xl shadow-md shadow-secondary-500/15 hover:shadow-secondary-500/30 transition-all font-semibold px-2.5 sm:px-4 py-1 sm:py-1.5 text-[10px] sm:text-xs"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            window.location.href = `/shop/${shop.id}`;
                        }}
                    >
                        <Calendar className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1" />
                        Randevu Al
                    </Button>
                </div>
            </div>
        </div>
    );
};
