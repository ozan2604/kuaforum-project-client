import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, Star, Heart, Car } from 'lucide-react';
import { ShopCategoryLabels, ShopType, type Shop, type ShopCategory } from '../types/shop';
import { useAuth } from '../context/AuthContext';
import { favoriteService } from '../services/favorite.service';
import { toast } from 'react-hot-toast';
import { DEFAULT_SALON_COVER } from '../constants/images';

interface ShopCardProps {
    shop: Shop;
    initialIsFavorite?: boolean;
    onToggleFavorite?: (newStatus: boolean) => void;
}

export const ShopCard: React.FC<ShopCardProps> = ({ shop, initialIsFavorite = false, onToggleFavorite }) => {
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [isFavorite, setIsFavorite] = useState(initialIsFavorite);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        setIsFavorite(initialIsFavorite);
    }, [initialIsFavorite]);

    const handleFavoriteClick = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!isAuthenticated) {
            toast.error('Favorilere eklemek için giriş yapmalısınız.');
            return;
        }

        if (isLoading) return;

        const newStatus = !isFavorite;
        setIsFavorite(newStatus);
        setIsLoading(true);

        try {
            await favoriteService.toggleFavorite(shop.id);
            if (onToggleFavorite) onToggleFavorite(newStatus);
            toast.success(newStatus ? 'Favorilere eklendi' : 'Favorilerden çıkarıldı');
        } catch (error) {
            setIsFavorite(!newStatus);
            console.error('Favorite toggle failed', error);
            toast.error('İşlem başarısız oldu');
        } finally {
            setIsLoading(false);
        }
    };



    const getImageUrl = (path: string | undefined) => {
        if (!path) return DEFAULT_SALON_COVER;
        if (path.startsWith('http')) return path;
        return `http://localhost:5000${path}`;
    };

    return (
        <div className="group bg-white rounded-xl sm:rounded-2xl overflow-hidden hover:shadow-xl hover:shadow-primary-900/8 hover:-translate-y-1 transition-all duration-400 border border-gray-100 flex flex-col h-full relative">

            {/* ── Görsel Bölümü ── */}
            <Link to={`/shop/${shop.id}`} className="block relative w-full aspect-[9/16] overflow-hidden shrink-0">
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent z-10" />
                <img
                    src={getImageUrl(shop.coverImagePath)}
                    alt={shop.name}
                    className="w-full h-full object-cover absolute inset-0 group-hover:scale-105 transition-transform duration-500 ease-out"
                    onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_SALON_COVER; }}
                />

                {/* Favori Butonu — sağ üst */}
                <button
                    onClick={handleFavoriteClick}
                    disabled={isLoading}
                    title={isFavorite ? 'Favorilerden çıkar' : 'Favorilere ekle'}
                    className={`absolute top-2 sm:top-3 right-2 sm:right-3 z-20 flex items-center gap-1.5 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-full border shadow-md backdrop-blur-sm transition-all duration-200 hover:scale-105 active:scale-95 ${
                        isFavorite
                            ? 'bg-red-50 text-red-600 border-red-200'
                            : 'bg-white/90 text-gray-700 border-white/60 hover:bg-white'
                    }`}
                >
                    <Heart className={`h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-500 ${isFavorite ? 'fill-current' : ''}`} />
                </button>

                {/* Kategori Etiketi — sol üst */}
                <div className="absolute top-2 sm:top-3 left-2 sm:left-3 z-20">
                    <span className="inline-flex items-center px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-md sm:rounded-lg text-[8px] sm:text-[10px] font-bold uppercase tracking-wider bg-white/90 text-gray-800 backdrop-blur-sm shadow-sm">
                        {shop.categories?.length > 0
                            ? ShopCategoryLabels[shop.categories[0] as ShopCategory]
                            : 'Güzellik Salonu'}
                        {shop.categories?.length > 1 ? ` +${shop.categories.length - 1}` : ''}
                    </span>
                </div>


                {/* Seyyar Berber badge — sol alt */}
                {shop.shopType === ShopType.Mobile && (
                    <div className="absolute bottom-2 sm:bottom-3 left-2 sm:left-3 z-20 bg-purple-600/90 backdrop-blur-sm px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md sm:rounded-lg shadow-sm flex items-center gap-0.5 sm:gap-1">
                        <Car className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-white" />
                        <span className="text-[9px] sm:text-[10px] font-semibold text-white">Seyyar Berber</span>
                    </div>
                )}

                {/* Puan — sağ alt */}
                {shop.averageRating > 0 && (
                    <div className="absolute bottom-2 sm:bottom-3 right-2 sm:right-3 z-20 bg-white/90 backdrop-blur-sm px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md sm:rounded-lg shadow-sm flex items-center gap-0.5 sm:gap-1">
                        <Star className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-amber-400 fill-current" />
                        <span className="text-[10px] sm:text-xs font-bold text-gray-900">{shop.averageRating.toFixed(1)}</span>
                    </div>
                )}
            </Link>

            {/* ── İçerik Bölümü ── */}
            <div className="p-2.5 sm:p-4 flex-1 flex flex-col w-full">
                <Link to={`/shop/${shop.id}`} className="mb-0.5 sm:mb-1">
                    <h3 className="text-sm sm:text-base font-bold text-gray-900 group-hover:text-primary-600 transition-colors line-clamp-1">
                        {shop.name}
                    </h3>
                </Link>

                {/* Adres / Hizmet Bölgesi */}
                {shop.shopType === ShopType.Mobile ? (
                    <div className="flex items-start text-purple-600 text-[11px] sm:text-xs mb-1.5 sm:mb-2 min-w-0 gap-0.5 sm:gap-1">
                        <Car className="h-3 w-3 sm:h-3.5 sm:w-3.5 mt-0.5 shrink-0" />
                        <span className="truncate font-medium">
                            Eve/İşyerine Gelir
                            {shop.serviceAreas && shop.serviceAreas.length > 0
                                ? ` · ${shop.serviceAreas.slice(0, 2).map(a => a.district).join(', ')}${shop.serviceAreas.length > 2 ? ` +${shop.serviceAreas.length - 2}` : ''}`
                                : ''}
                        </span>
                    </div>
                ) : (
                    <div className="flex items-center text-gray-500 text-[11px] sm:text-xs mb-1.5 sm:mb-2 min-w-0">
                        <MapPin className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-0.5 sm:mr-1 text-secondary-400 shrink-0" />
                        <span className="truncate">{shop.district}, {shop.city}</span>
                    </div>
                )}

            </div>
        </div>
    );
};
