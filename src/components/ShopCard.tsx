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
        if (!path) return `https://source.unsplash.com/random/800x600/?salon,${shop.id}`;
        if (path.startsWith('http')) return path;
        return `http://localhost:5000${path}`;
    };

    return (
        <div className="group bg-white rounded-3xl overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border border-gray-100 flex flex-col h-full relative">
            <Link to={`/shop/${shop.id}`} className="block relative h-56 overflow-hidden">
                <div className="absolute inset-0 bg-primary-900/10 group-hover:bg-transparent transition-colors z-10" />
                <img
                    src={getImageUrl(shop.coverImagePath)}
                    alt={shop.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out"
                    onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1560066984-12186d30b435?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'; }}
                />

                <div className="absolute top-4 right-4 z-20 flex gap-2">
                    {shop.averageRating > 0 && (
                        <div className="bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full shadow-sm flex items-center border border-white/20">
                            <Star className="h-3.5 w-3.5 text-yellow-400 fill-current mr-1" />
                            <span className="text-xs font-bold text-primary-800">{shop.averageRating.toFixed(1)}</span>
                        </div>
                    )}
                    {/* Category Badge */}
                    <div className="absolute top-4 left-4 z-10">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/90 text-primary-800 backdrop-blur-sm shadow-sm border border-gray-100/50">
                            {ShopCategoryLabels[shop.category] || 'Güzellik Salonu'}
                        </span>
                    </div>

                    <button
                        onClick={handleFavoriteClick}
                        disabled={isLoading}
                        className={`p-2 rounded-full shadow-md transition-all ${isFavorite
                            ? 'bg-secondary-500 text-white hover:bg-secondary-600'
                            : 'bg-white/90 text-gray-400 hover:text-secondary-500 hover:bg-white'
                            }`}
                    >
                        <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
                    </button>
                </div>
            </Link>

            <div className="p-6 flex-1 flex flex-col">
                <div className="mb-4">
                    <Link to={`/shop/${shop.id}`}>
                        <h3 className="text-xl font-bold text-primary-900 mb-1 group-hover:text-primary-700 transition-colors">
                            {shop.name}
                        </h3>
                    </Link>
                    <div className="flex items-center text-gray-500 text-sm">
                        <MapPin className="h-3.5 w-3.5 mr-1 text-secondary-500" />
                        {shop.district}, {shop.city}
                    </div>
                </div>

                <p className="text-gray-600 text-sm mb-6 line-clamp-2 flex-1 leading-relaxed">
                    {shop.description || 'Profesyonel güzellik ve bakım hizmetleri. Uzman kadromuzla hizmetinizdeyiz.'}
                </p>

                <div className="flex items-center justify-between pt-5 border-t border-gray-100 mt-auto">
                    <span className="text-xs font-semibold px-2.5 py-1 bg-green-50 text-green-700 rounded-lg border border-green-100">
                        Açık
                    </span>
                    <Button
                        size="md"
                        variant="secondary"
                        className="rounded-xl shadow-md shadow-secondary-200"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            // Logic to open booking modal directly or just navigate
                            // For now, let's navigate to shop details as that's where the booking modal is contextually best
                            window.location.href = `/shop/${shop.id}`;
                        }}
                    >
                        <Calendar className="h-4 w-4 mr-2" />
                        Randevu Al
                    </Button>
                </div>
            </div>
        </div>
    );
};
