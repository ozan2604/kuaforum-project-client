import React, { useEffect, useState } from 'react';
import { shopService } from '../api/shop.service';
import { favoriteService } from '../services/favorite.service';
import { type Shop, TargetGender, ShopCategory, ShopCategoryLabels } from '../types/shop';
import { useSearchParams } from 'react-router-dom';
import { ShopCard } from '../components/ShopCard';
import { useAuth } from '../context/AuthContext';
import { MapPin, ChevronDown, ChevronLeft, ChevronRight, Check } from 'lucide-react';

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

    const [activeGender, setActiveGender] = useState<TargetGender | null>(null);
    const [activeSort, setActiveSort] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<ShopCategory | null>(null);
    const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);
    const [selectedUserLocation, setSelectedUserLocation] = useState<string | null>(null);

    useEffect(() => {
        if (!shops) return;

        const term = searchTerm.toLowerCase();
        let results = [...shops].filter(shop => {
            const nameMatch = shop.name?.toLowerCase().includes(term) ?? false;
            const cityMatch = shop.city?.toLowerCase().includes(term) ?? false;
            const districtMatch = shop.district?.toLowerCase().includes(term) ?? false;
            return nameMatch || cityMatch || districtMatch;
        });

        // Kategoriye göre filtrele
        if (selectedCategory) {
            results = results.filter(shop => shop.category === selectedCategory);
        }

        // Cinsiyete göre filtrele
        if (activeGender) {
            results = results.filter(shop => shop.genderPreference === activeGender || shop.genderPreference === TargetGender.Unisex);
        }

        // Sıralama
        if (activeSort) {
            switch (activeSort) {
                case 'rating':
                    results.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
                    break;
                case 'reviews':
                    results.sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0));
                    break;
                case 'newest':
                    results.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
                    break;
            }
        }

        setFilteredShops(results);
    }, [searchTerm, shops, activeGender, activeSort, selectedCategory]);

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

    const userAddresses = [
        { id: '1', title: 'Ev', address: 'Sütlüpınar mahallesi 1452 sok no 53, Patnos / Ağrı' },
        { id: '2', title: 'İş adresi', address: 'Hoca Hamza Mahallesi Tuğsavul Cd. No:78, Gelibolu / Çanakkale' }
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col pt-0">
            {/* Sub-Navbar for Quick Filters (like Location) */}
            <div className="bg-white border-b border-gray-100 sticky top-20 z-40">
                <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center h-12 text-sm font-medium">
                        {/* Fixed items container (dropdowns won't be clipped) */}
                        <div className="flex items-center shrink-0 pr-3 mr-3 md:pr-6 md:mr-6 border-r border-gray-100 h-full max-w-[120px] sm:max-w-none">
                            {/* Location Dropdown Toggle */}
                            <div className="relative h-full flex items-center">
                                <button
                                    onClick={() => setIsLocationDropdownOpen(!isLocationDropdownOpen)}
                                    className={`flex items-center gap-1 sm:gap-2 hover:text-primary-700 transition-colors py-3 border-b-2 ${isLocationDropdownOpen || selectedUserLocation ? 'text-primary-700 border-primary-600' : 'text-gray-600 border-transparent'}`}
                                >
                                    <MapPin className="h-4 w-4 shrink-0" />
                                    <span className="truncate">{selectedUserLocation ? userAddresses.find(a => a.id === selectedUserLocation)?.title || 'Konuma Göre' : 'Konuma Göre'}</span>
                                    <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${isLocationDropdownOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {/* Location Dropdown Menu */}
                                {isLocationDropdownOpen && (
                                    <div className="absolute top-full left-0 mt-3 w-80 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-2xl overflow-hidden py-3 border border-gray-100/80" style={{ zIndex: 100 }}>

                                        <div className="px-5 py-2 mb-1 flex justify-between items-center bg-white">
                                            <h4 className="font-bold text-gray-900 text-base tracking-tight">Kayıtlı Adreslerim</h4>
                                            {selectedUserLocation && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setSelectedUserLocation(null); setIsLocationDropdownOpen(false); }}
                                                    className="text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors"
                                                >
                                                    Temizle
                                                </button>
                                            )}
                                        </div>

                                        <div className="max-h-60 overflow-y-auto px-2 space-y-1">
                                            {/* Live Location Option */}
                                            <button
                                                onClick={() => {
                                                    setSelectedUserLocation('live');
                                                    setIsLocationDropdownOpen(false);
                                                }}
                                                className="w-full text-left px-3 py-2.5 hover:bg-gray-50/80 rounded-xl transition-colors flex items-start gap-3 group"
                                            >
                                                <div className="mt-0.5 relative flex items-center justify-center shrink-0">
                                                    <input type="radio" readOnly checked={selectedUserLocation === 'live'} className="w-5 h-5 appearance-none border-2 border-gray-300 rounded-full cursor-pointer checked:border-primary-600 checked:bg-primary-600 transition-all" />
                                                    {selectedUserLocation === 'live' && <Check className="absolute w-3 h-3 text-white pointer-events-none" strokeWidth={3} />}
                                                </div>
                                                <div>
                                                    <div className={`font-semibold text-[15px] transition-colors leading-tight ${selectedUserLocation === 'live' ? 'text-primary-900' : 'text-gray-900 group-hover:text-primary-700'}`}>
                                                        Mevcut Konumum
                                                    </div>
                                                    <div className="text-[13px] text-gray-500 line-clamp-1 mt-0.5 leading-snug">
                                                        {userLocation ? 'Konumunuz algılandı' : 'Konum izni gerekiyor'}
                                                    </div>
                                                </div>
                                            </button>

                                            {/* Saved Addresses */}
                                            {userAddresses.map(addr => (
                                                <button
                                                    key={addr.id}
                                                    onClick={() => {
                                                        setSelectedUserLocation(addr.id);
                                                        setIsLocationDropdownOpen(false);
                                                    }}
                                                    className="w-full text-left px-3 py-2.5 hover:bg-gray-50/80 rounded-xl transition-colors flex items-start gap-3 group"
                                                >
                                                    <div className="mt-0.5 relative flex items-center justify-center shrink-0">
                                                        <input type="radio" readOnly checked={selectedUserLocation === addr.id} className="w-5 h-5 appearance-none border-2 border-gray-300 rounded-full cursor-pointer checked:border-slate-600 checked:bg-slate-600 transition-all" />
                                                        {selectedUserLocation === addr.id && <Check className="absolute w-3 h-3 text-white pointer-events-none" strokeWidth={3} />}
                                                    </div>
                                                    <div>
                                                        <div className={`font-semibold text-[15px] transition-colors leading-tight ${selectedUserLocation === addr.id ? 'text-slate-900' : 'text-gray-900 group-hover:text-slate-700'}`}>{addr.title}</div>
                                                        <div className="text-[13px] text-gray-500 line-clamp-1 mt-0.5 leading-snug">{addr.address}</div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>

                                        <div className="px-5 pt-3 pb-1 mt-2">
                                            <button className="w-full text-sm font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:border-slate-300 rounded-xl py-2.5 transition-all flex items-center justify-center gap-1.5 shadow-sm">
                                                + Yeni Adres Ekle
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Scrollable quick tabs container */}
                        <div className="flex items-center gap-3 md:gap-4 lg:gap-5 overflow-x-auto whitespace-nowrap flex-1 min-w-0 h-full select-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                            <button
                                onClick={() => setActiveGender(activeGender === TargetGender.Kadin ? null : TargetGender.Kadin)}
                                className={`font-semibold transition-colors py-3 border-b-2 shrink-0 ${activeGender === TargetGender.Kadin ? 'text-primary-700 border-primary-600' : 'text-gray-800 hover:text-primary-700 border-transparent'}`}
                            >
                                Kadın
                            </button>
                            <div className="w-px h-4 bg-gray-200 shrink-0 mx-0.5 md:mx-1 text-[13px] md:text-sm"></div>
                            <button
                                onClick={() => setActiveGender(activeGender === TargetGender.Erkek ? null : TargetGender.Erkek)}
                                className={`font-semibold transition-colors py-3 border-b-2 shrink-0 text-[13px] md:text-sm ${activeGender === TargetGender.Erkek ? 'text-primary-700 border-primary-600' : 'text-gray-800 hover:text-primary-700 border-transparent'}`}
                            >
                                Erkek
                            </button>
                            <div className="w-px h-4 bg-gray-200 shrink-0 mx-0.5 md:mx-1"></div>

                            {/* Other quick tabs sort elements */}
                            <button
                                onClick={() => setActiveSort(activeSort === 'low-price' ? null : 'low-price')}
                                className={`transition-colors py-3 border-b-2 shrink-0 text-[13px] md:text-sm ${activeSort === 'low-price' ? 'text-primary-700 border-primary-600 font-bold' : 'text-gray-600 hover:text-primary-700 border-transparent'}`}
                            >
                                Düşük Fiyatlar
                            </button>
                            <div className="w-px h-4 bg-gray-200 shrink-0 mx-0.5 md:mx-1"></div>
                            <button
                                onClick={() => setActiveSort(activeSort === 'high-price' ? null : 'high-price')}
                                className={`transition-colors py-3 border-b-2 shrink-0 text-[13px] md:text-sm ${activeSort === 'high-price' ? 'text-primary-700 border-primary-600 font-bold' : 'text-gray-600 hover:text-primary-700 border-transparent'}`}
                            >
                                Yüksek Fiyatlar
                            </button>
                            <div className="w-px h-4 bg-gray-200 shrink-0 mx-0.5 md:mx-1"></div>
                            <button
                                onClick={() => setActiveSort(activeSort === 'rating' ? null : 'rating')}
                                className={`transition-colors py-3 border-b-2 shrink-0 text-[13px] md:text-sm ${activeSort === 'rating' ? 'text-primary-700 border-primary-600 font-bold' : 'text-gray-600 hover:text-primary-700 border-transparent'}`}
                            >
                                En Yüksek Puanlılar
                            </button>
                            <div className="w-px h-4 bg-gray-200 shrink-0 mx-0.5 md:mx-1"></div>
                            <button
                                onClick={() => setActiveSort(activeSort === 'campaign' ? null : 'campaign')}
                                className={`transition-colors py-3 border-b-2 shrink-0 text-[13px] md:text-sm ${activeSort === 'campaign' ? 'text-primary-700 border-primary-600 font-bold' : 'text-gray-600 hover:text-primary-700 border-transparent'}`}
                            >
                                Kampanyalılar
                            </button>
                            <div className="w-px h-4 bg-gray-200 shrink-0 mx-0.5 md:mx-1"></div>
                            <button
                                onClick={() => setActiveSort(activeSort === 'reviews' ? null : 'reviews')}
                                className={`transition-colors py-3 border-b-2 shrink-0 text-[13px] md:text-sm ${activeSort === 'reviews' ? 'text-primary-700 border-primary-600 font-bold' : 'text-gray-600 hover:text-primary-700 border-transparent'}`}
                            >
                                En Çok Yorum Alanlar
                            </button>
                            <div className="w-px h-4 bg-gray-200 shrink-0 mx-0.5 md:mx-1"></div>
                            <button
                                onClick={() => setActiveSort(activeSort === 'newest' ? null : 'newest')}
                                className={`transition-colors py-3 border-b-2 shrink-0 text-[13px] md:text-sm ${activeSort === 'newest' ? 'text-primary-700 border-primary-600 font-bold' : 'text-gray-600 hover:text-primary-700 border-transparent'}`}
                            >
                                En Yeniler
                            </button>
                        </div>
                    </div>
                </div>
            </div>


            {/* Kategori Yuvarlakları */}
            <div className="bg-white border-b border-gray-100">
                <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="relative group/scroll">
                        {/* Sol Ok Butonu */}
                        <button
                            onClick={() => {
                                const el = document.getElementById('category-scroll');
                                if (el) el.scrollBy({ left: -300, behavior: 'smooth' });
                            }}
                            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm border border-gray-200 shadow-lg flex items-center justify-center hover:bg-white hover:shadow-xl transition-all opacity-0 group-hover/scroll:opacity-100 -translate-x-1"
                        >
                            <ChevronLeft className="w-5 h-5 text-gray-600" />
                        </button>

                        {/* Sağ Ok Butonu */}
                        <button
                            onClick={() => {
                                const el = document.getElementById('category-scroll');
                                if (el) el.scrollBy({ left: 300, behavior: 'smooth' });
                            }}
                            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm border border-gray-200 shadow-lg flex items-center justify-center hover:bg-white hover:shadow-xl transition-all opacity-0 group-hover/scroll:opacity-100 translate-x-1"
                        >
                            <ChevronRight className="w-5 h-5 text-gray-600" />
                        </button>

                        <div
                            id="category-scroll"
                            className="flex items-center gap-6 sm:gap-8 md:gap-10 lg:gap-12 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] py-3 px-2"
                        >
                            {[
                                { id: ShopCategory.Berber, label: ShopCategoryLabels[ShopCategory.Berber], image: '/images/categories/berber.png' },
                                { id: ShopCategory.Kuafor, label: ShopCategoryLabels[ShopCategory.Kuafor], image: '/images/categories/kuafor.png' },
                                { id: ShopCategory.GuzellikMerkezi, label: ShopCategoryLabels[ShopCategory.GuzellikMerkezi], image: '/images/categories/guzellik.png' },
                                { id: ShopCategory.SpaMerkezi, label: ShopCategoryLabels[ShopCategory.SpaMerkezi], image: '/images/categories/spa.png' },
                                { id: ShopCategory.DovmeStudyosu, label: ShopCategoryLabels[ShopCategory.DovmeStudyosu], image: '/images/categories/dovme.png' },
                                { id: ShopCategory.PiercingStudyosu, label: ShopCategoryLabels[ShopCategory.PiercingStudyosu], image: '/images/categories/piercing.png' },
                                { id: ShopCategory.NailArt, label: ShopCategoryLabels[ShopCategory.NailArt], image: '/images/categories/nailart.png' },
                                { id: ShopCategory.CiltBakimMerkezi, label: ShopCategoryLabels[ShopCategory.CiltBakimMerkezi], image: '/images/categories/ciltbakim.png' },
                                { id: ShopCategory.LazerEpilasyon, label: ShopCategoryLabels[ShopCategory.LazerEpilasyon], image: '/images/categories/lazer.png' },
                                { id: ShopCategory.MasajSalonu, label: ShopCategoryLabels[ShopCategory.MasajSalonu], image: '/images/categories/masaj.png' },
                                { id: ShopCategory.Solaryum, label: ShopCategoryLabels[ShopCategory.Solaryum], image: '/images/categories/solaryum.png' },
                                { id: ShopCategory.MakyajStudyosu, label: ShopCategoryLabels[ShopCategory.MakyajStudyosu], image: '/images/categories/makyaj.png' },
                                { id: ShopCategory.KasKirpikStudyosu, label: ShopCategoryLabels[ShopCategory.KasKirpikStudyosu], image: '/images/categories/kaskirpik.png' },
                            ].map((cat) => (
                                <button
                                    key={cat.id}
                                    onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
                                    className="flex flex-col items-center gap-2 group shrink-0 transition-all"
                                >
                                    <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-[3px] transition-all duration-300 shadow-md ${
                                        selectedCategory === cat.id
                                            ? 'border-primary-500 shadow-primary-200/50 shadow-lg ring-4 ring-primary-100'
                                            : 'border-gray-200 group-hover:border-primary-300 group-hover:shadow-lg'
                                    }`}>
                                        <img
                                            src={cat.image}
                                            alt={cat.label}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <span className={`text-xs sm:text-sm font-semibold text-center leading-tight transition-colors ${
                                        selectedCategory === cat.id ? 'text-primary-700' : 'text-gray-700 group-hover:text-primary-600'
                                    }`}>
                                        {cat.label}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Ana İçerik Alanı */}
            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
                {/* Ana İçerik Listesi */}
                <main className="flex-1 min-w-0">
                    {loading ? (
                        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-5 w-full">
                            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                                <div key={i} className="bg-white rounded-xl sm:rounded-2xl h-[260px] sm:h-[320px] animate-pulse shadow-sm border border-gray-100 p-3 sm:p-4">
                                    <div className="bg-gray-200 h-[260px] rounded-3xl mb-6"></div>
                                    <div className="h-5 bg-gray-200 rounded-full w-3/4 mb-3"></div>
                                    <div className="h-4 bg-gray-200 rounded-full w-1/2"></div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-5 w-full">
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

                    {!loading && shops && shops.length === 0 && (
                        <div className="text-center py-24 bg-white rounded-[2rem] border border-dashed border-gray-300 shadow-sm mt-4">
                            <div className="inline-flex p-5 rounded-full bg-gray-50 mb-5 text-gray-400">
                                <span className="text-4xl">🏢</span>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Sistemde henüz kayıtlı dükkan bulunmuyor</h3>
                            <p className="text-gray-500 max-w-md mx-auto mb-8 font-medium">
                                Dükkanlar eklendiğinde burada listelenecektir.
                            </p>
                        </div>
                    )}

                    {!loading && shops && shops.length > 0 && filteredShops.length === 0 && (
                        <div className="text-center py-24 bg-white rounded-[2rem] border border-dashed border-gray-300 shadow-sm mt-4">
                            <div className="inline-flex p-5 rounded-full bg-gray-50 mb-5 text-gray-400">
                                <span className="text-4xl">🔍</span>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Aradığınız kriterlere uygun salon bulunamadı</h3>
                            <p className="text-gray-500 max-w-md mx-auto mb-8 font-medium">
                                Arama terimlerinize uygun sonuç çıkmadı. Farklı bir arama yaparak tekrar deneyin.
                            </p>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};
