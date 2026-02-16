import React, { useEffect, useState } from 'react';
import { shopService } from '../api/shop.service';
import { favoriteService } from '../services/favorite.service';
import type { Shop } from '../types/shop';
import { useSearchParams } from 'react-router-dom';
import { MapComponent } from '../components/MapComponent';
import { ShopCard } from '../components/ShopCard';
import { useAuth } from '../context/AuthContext';
import { Heart, MapPin } from 'lucide-react';

interface HomePageProps {
    showFavoritesOnly?: boolean;
}

export const HomePage: React.FC<HomePageProps> = ({ showFavoritesOnly = false }) => {
    const [shops, setShops] = useState<Shop[]>([]);
    const [filteredShops, setFilteredShops] = useState<Shop[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchParams] = useSearchParams();
    const searchTerm = searchParams.get('search') || '';
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
    const { isAuthenticated } = useAuth();
    const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        const loadShops = async () => {
            setLoading(true);
            try {
                let data: Shop[] = [];
                if (showFavoritesOnly) {
                    if (isAuthenticated) {
                        data = await favoriteService.getUserFavorites();
                    }
                } else {
                    data = await shopService.getPublicShops();
                }
                setShops(data);
                setFilteredShops(data);
            } catch (error) {
                console.error('Failed to load shops', error);
            } finally {
                setLoading(false);
            }
        };
        loadShops();
    }, [showFavoritesOnly, isAuthenticated]); // Reload when mode or auth changes

    useEffect(() => {
        const loadFavorites = async () => {
            if (isAuthenticated) {
                try {
                    // If we already loaded favorites as main data, we can just use that
                    if (showFavoritesOnly && shops.length > 0) {
                        setFavoriteIds(new Set(shops.map(s => s.id)));
                        return;
                    }

                    const favorites = await favoriteService.getUserFavorites();
                    setFavoriteIds(new Set(favorites.map((s: Shop) => s.id)));
                } catch (error) {
                    console.error('Failed to load favorites', error);
                }
            }
        };
        loadFavorites();
    }, [isAuthenticated, showFavoritesOnly, shops.length]); // Add deps

    const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

    useEffect(() => {
        if (!shops.length) return;

        const term = searchTerm.toLowerCase();
        let results = shops.filter(shop =>
            shop.name.toLowerCase().includes(term) ||
            shop.city.toLowerCase().includes(term) ||
            shop.district.toLowerCase().includes(term)
        );

        if (selectedCategory) {
            results = results.filter(shop => shop.category === selectedCategory);
        }

        setFilteredShops(results);
    }, [searchTerm, shops, selectedCategory]);

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setUserLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    });
                },
                (error) => {
                    console.error('Error getting user location:', error);
                }
            );
        }
    }, []);

    const handleToggleFavorite = (shopId: string, isFavorite: boolean) => {
        const newFavorites = new Set(favoriteIds);
        if (isFavorite) {
            newFavorites.add(shopId);
        } else {
            newFavorites.delete(shopId);
        }
        setFavoriteIds(newFavorites);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Hero & Map Section */}
            <div className="relative overflow-hidden pb-16">
                {/* Background Decor - Light Gradient Theme */}
                <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-secondary-50">
                    <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[600px] h-[600px] bg-secondary-100/40 rounded-full blur-3xl opacity-60"></div>
                    <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-[400px] h-[400px] bg-primary-100/40 rounded-full blur-3xl opacity-60"></div>
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03]"></div>
                </div>

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">
                    <div className="text-center mb-10 max-w-3xl mx-auto space-y-4">
                        <span className="inline-block py-1 px-3 rounded-full bg-white border border-gray-200 text-primary-600 text-xs font-bold tracking-wider uppercase mb-2 shadow-sm">
                            {showFavoritesOnly ? 'Favorilerim' : 'Kuaforum Keşfet'}
                        </span>
                        <h1 className="text-4xl md:text-6xl font-extrabold text-primary-900 tracking-tight leading-tight">
                            {showFavoritesOnly ? (
                                <>Favori <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary-500 to-secondary-600">Salonlarınız</span></>
                            ) : (
                                <>Size En Yakın <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary-500 to-secondary-600">Güzellik Durakları</span></>
                            )}
                        </h1>
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
                            {showFavoritesOnly
                                ? 'Sizin için seçtiğimiz en özel mekanlara hızlıca ulaşın.'
                                : 'İhtiyacınıza en uygun kuaför ve güzellik salonlarını harita üzerinden kolayca bulun.'}
                        </p>
                    </div>

                    {/* Map Container */}
                    <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-gray-200/50 border-4 border-white ring-1 ring-black/5 transform hover:scale-[1.005] transition-transform duration-500 mb-20">
                        <MapComponent shops={shops} userLocation={userLocation} height="450px" />
                    </div>
                </div>
            </div>

            {/* Category Filter Section */}
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24 mb-12 z-20">
                <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-xl p-4 border border-white/40">
                    <div className="flex flex-wrap justify-center gap-3">
                        {[
                            { id: null, label: 'Tümü', icon: '✨' },
                            { id: 1, label: 'Berber', icon: '✂️' },
                            { id: 2, label: 'Kuaför', icon: '💇‍♀️' },
                            { id: 3, label: 'Güzellik', icon: '💅' },
                            { id: 4, label: 'Spa', icon: '🧖‍♀️' },
                            { id: 5, label: 'Dövme', icon: '🎨' },
                            { id: 99, label: 'Diğer', icon: '💎' },
                        ].map((cat) => (
                            <button
                                key={cat.id || 'all'}
                                onClick={() => setSelectedCategory(cat.id)}
                                className={`
                                    flex items-center gap-2 px-6 py-3 rounded-2xl transition-all duration-300 font-medium text-sm
                                    ${selectedCategory === cat.id
                                        ? 'bg-primary-900 text-white shadow-lg shadow-primary-900/20 scale-105'
                                        : 'bg-white text-gray-600 hover:bg-gray-50 hover:text-primary-900 hover:shadow-md border border-gray-100'
                                    }
                                `}
                            >
                                <span className="text-lg">{cat.icon}</span>
                                {cat.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Shop List Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
                <div className="flex items-center justify-between mb-10">
                    <h2 className="text-3xl font-bold text-primary-900 flex items-center">
                        {showFavoritesOnly ? (
                            <>
                                <Heart className="mr-3 h-8 w-8 text-secondary-500 fill-current" />
                                Favori Salonlarım
                            </>
                        ) : (
                            <>
                                <span className="bg-primary-100 text-primary-700 p-2 rounded-xl mr-3">
                                    <MapPin className="h-6 w-6" />
                                </span>
                                Popüler Salonlar
                            </>
                        )}
                    </h2>
                    {filteredShops.length > 0 && (
                        <span className="text-sm font-medium text-gray-500 bg-white px-3 py-1 rounded-full shadow-sm border border-gray-100">
                            {filteredShops.length} salon listeleniyor
                        </span>
                    )}
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="bg-white rounded-3xl h-96 animate-pulse shadow-sm p-4">
                                <div className="bg-gray-200 h-48 rounded-2xl mb-4"></div>
                                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 xl:gap-10">
                        {filteredShops.map((shop) => (
                            <ShopCard
                                key={shop.id}
                                shop={shop}
                                initialIsFavorite={favoriteIds.has(shop.id)}
                                onToggleFavorite={(status) => handleToggleFavorite(shop.id, status)}
                            />
                        ))}
                    </div>
                )}

                {!loading && filteredShops.length === 0 && (
                    <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-300 shadow-sm">
                        <div className="inline-flex p-4 rounded-full bg-gray-50 mb-4 text-gray-400">
                            <MapPin className="h-8 w-8" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Sonuç Bulunamadı</h3>
                        <p className="text-gray-500 max-w-sm mx-auto">
                            Aradığınız kriterlere uygun salon bulamadık. Lütfen arama terimlerinizi değiştirin veya harita üzerinden keşfedin.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};
