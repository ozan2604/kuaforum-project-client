import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Play, Store } from 'lucide-react';
import { mediaLikeService } from '../api/mediaLike.service';
import { favoriteService } from '../services/favorite.service';
import { ShopCard } from '../components/ShopCard';
import { useAuth } from '../context/AuthContext';
import type { Shop, MediaHighlight } from '../types/shop';

type Tab = 'media' | 'salons';

export const FavoritesPage: React.FC = () => {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const [activeTab, setActiveTab] = useState<Tab>('media');
    const [likedMedia, setLikedMedia] = useState<MediaHighlight[]>([]);
    const [favShops, setFavShops]     = useState<Shop[]>([]);
    const [loadingMedia, setLoadingMedia] = useState(false);
    const [loadingShops, setLoadingShops] = useState(false);

    /* Beğenilen medyaları API'den çek */
    useEffect(() => {
        if (activeTab !== 'media' || !isAuthenticated) return;
        setLoadingMedia(true);
        mediaLikeService.getMyLikes()
            .then(setLikedMedia)
            .catch(() => {})
            .finally(() => setLoadingMedia(false));
    }, [activeTab, isAuthenticated]);

    /* Favori salonları API'den çek */
    useEffect(() => {
        if (activeTab !== 'salons' || !isAuthenticated) return;
        setLoadingShops(true);
        favoriteService.getUserFavorites()
            .then(setFavShops)
            .catch(() => {})
            .finally(() => setLoadingShops(false));
    }, [activeTab, isAuthenticated]);

    const unlikeMedia = async (item: MediaHighlight) => {
        setLikedMedia(prev => prev.filter(i => i.id !== item.id));
        try {
            await mediaLikeService.toggle(item.id, item.type);
        } catch {
            setLikedMedia(prev => [...prev, item]);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Sekme başlıkları */}
            <div className="bg-white border-b border-gray-100 sticky top-14 sm:top-24 z-30">
                <div className="max-w-[1600px] mx-auto flex">
                    {([
                        { id: 'media',  label: 'Beğenilen Medya', icon: Heart  },
                        { id: 'salons', label: 'Favori Salonlar',  icon: Store  },
                    ] as { id: Tab; label: string; icon: React.ElementType }[]).map(({ id, label, icon: Icon }) => (
                        <button
                            key={id}
                            onClick={() => setActiveTab(id)}
                            className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-bold border-b-2 transition-colors ${
                                activeTab === id
                                    ? 'text-primary-600 border-primary-600'
                                    : 'text-gray-500 border-transparent hover:text-gray-700'
                            }`}
                        >
                            <Icon className="w-4 h-4" />
                            {label}
                            {id === 'media' && likedMedia.length > 0 && (
                                <span className="bg-primary-100 text-primary-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                    {likedMedia.length}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Beğenilen Medya ── */}
            {activeTab === 'media' && (
                <div className="max-w-[1600px] mx-auto px-3 py-4">
                    {!isAuthenticated ? (
                        <div className="flex flex-col items-center justify-center py-32 text-gray-400 gap-4">
                            <Heart className="w-14 h-14 stroke-[1.5]" />
                            <p className="font-semibold text-base">Giriş yapman gerekiyor</p>
                            <button
                                onClick={() => navigate('/login')}
                                className="px-5 py-2.5 bg-primary-600 text-white text-sm font-bold rounded-2xl shadow-md hover:bg-primary-700 transition-colors"
                            >
                                Giriş Yap
                            </button>
                        </div>
                    ) : loadingMedia ? (
                        <div className="flex justify-center py-32">
                            <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : likedMedia.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-32 text-gray-400 gap-4">
                            <Heart className="w-14 h-14 stroke-[1.5]" />
                            <p className="font-semibold text-base">Henüz beğenilen içerik yok</p>
                            <p className="text-sm text-center max-w-xs">
                                Kolaj veya anasayfada fotoğraf/videolara çift dokun ya da kalp ikonuna bas
                            </p>
                            <button
                                onClick={() => navigate('/kolaj')}
                                className="mt-2 px-5 py-2.5 bg-primary-600 text-white text-sm font-bold rounded-2xl shadow-md hover:bg-primary-700 transition-colors"
                            >
                                Kolaja Git
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1.5">
                            {likedMedia.map(item => (
                                <div
                                    key={item.id}
                                    className="relative aspect-square rounded-xl overflow-hidden cursor-pointer group"
                                    onClick={() => navigate(`/shop/${item.shopId}`)}
                                >
                                    {item.type === 'image' ? (
                                        <img
                                            src={item.url}
                                            alt={item.shopName}
                                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                        />
                                    ) : (
                                        <video
                                            src={item.url}
                                            className="w-full h-full object-cover"
                                            muted
                                            playsInline
                                            preload="metadata"
                                            onLoadedMetadata={e => { e.currentTarget.currentTime = 0.1; }}
                                        />
                                    )}

                                    {item.type === 'video' && (
                                        <div className="absolute top-2 right-2">
                                            <div className="w-6 h-6 rounded-full bg-black/50 flex items-center justify-center">
                                                <Play className="w-3 h-3 text-white fill-white ml-0.5" />
                                            </div>
                                        </div>
                                    )}

                                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent pt-6 pb-2 px-2">
                                        <p className="text-white text-[11px] font-bold leading-tight line-clamp-1">{item.shopName}</p>
                                    </div>

                                    <button
                                        onClick={e => { e.stopPropagation(); unlikeMedia(item); }}
                                        className="absolute top-2 left-2 w-6 h-6 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ── Favori Salonlar ── */}
            {activeTab === 'salons' && (
                <div className="max-w-[1600px] mx-auto px-4 py-4">
                    {!isAuthenticated ? (
                        <div className="flex flex-col items-center justify-center py-32 text-gray-400 gap-4">
                            <Store className="w-14 h-14 stroke-[1.5]" />
                            <p className="font-semibold text-base">Giriş yapman gerekiyor</p>
                            <button
                                onClick={() => navigate('/login')}
                                className="px-5 py-2.5 bg-primary-600 text-white text-sm font-bold rounded-2xl shadow-md hover:bg-primary-700 transition-colors"
                            >
                                Giriş Yap
                            </button>
                        </div>
                    ) : loadingShops ? (
                        <div className="flex justify-center py-32">
                            <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : favShops.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-32 text-gray-400 gap-4">
                            <Store className="w-14 h-14 stroke-[1.5]" />
                            <p className="font-semibold text-base">Henüz favori salon yok</p>
                            <button
                                onClick={() => navigate('/')}
                                className="px-5 py-2.5 bg-primary-600 text-white text-sm font-bold rounded-2xl shadow-md hover:bg-primary-700 transition-colors"
                            >
                                Salonları Keşfet
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                            {favShops.map(shop => (
                                <ShopCard
                                    key={shop.id}
                                    shop={shop}
                                    initialIsFavorite={true}
                                    onToggleFavorite={(isFav) => {
                                        if (!isFav) setFavShops(prev => prev.filter(s => s.id !== shop.id));
                                    }}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
