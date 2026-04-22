import React, { useEffect, useState } from 'react';
import { shopService } from '../api/shop.service';
import { favoriteService } from '../services/favorite.service';
import { type Shop, TargetGender, ShopCategory, ShopCategoryLabels } from '../types/shop';
import { useSearchParams } from 'react-router-dom';
import { ShopCard } from '../components/ShopCard';
import { useAuth } from '../context/AuthContext';
import { MapPin, ChevronDown, ChevronLeft, ChevronRight, Check, Map, XCircle } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet's default icon path issues in React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});



const TURKIYE_API = 'https://turkiyeapi.dev/api/v1';

interface Province { id: number; name: string; districts: { id: number; name: string }[] }
interface Neighborhood { id: number; name: string }

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

    // Location API state
    const [provinces, setProvinces] = useState<Province[]>([]);
    const [filteredProvinces, setFilteredProvinces] = useState<Province[]>([]);
    const [districts, setDistricts] = useState<{ id: number; name: string }[]>([]);
    const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
    const [loadingLocation, setLoadingLocation] = useState(false);

    const [selectedProvince, setSelectedProvince] = useState<string | null>(null);
    const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
    const [selectedNeighborhood, setSelectedNeighborhood] = useState<string | null>(null);

    const [activeTags, setActiveTags] = useState<string[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<ShopCategory | null>(null);
    const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);
    const [isMapModalOpen, setIsMapModalOpen] = useState(false);

    useEffect(() => {
        const loadProvinces = async () => {
            try {
                const res = await fetch(`${TURKIYE_API}/provinces`);
                const json = await res.json();
                const sorted = (json.data || []).sort((a: Province, b: Province) => a.name.localeCompare(b.name, 'tr'));
                setProvinces(sorted);
            } catch (error) {
                console.error('Failed to load provinces', error);
            }
        };
        loadProvinces();
    }, []);

    const handleProvinceChange = (provinceName: string) => {
        const prov = provinces.find(p => p.name === provinceName);
        setSelectedProvince(provinceName);
        setSelectedDistrict(null);
        setSelectedNeighborhood(null);
        const sortedDistricts = (prov?.districts || []).sort((a: any, b: any) => a.name.localeCompare(b.name, 'tr'));
        setDistricts(sortedDistricts);
        setNeighborhoods([]);
    };

    const handleDistrictChange = async (districtName: string) => {
        const dist = districts.find(d => d.name === districtName);
        setSelectedDistrict(districtName);
        setSelectedNeighborhood(null);
        setNeighborhoods([]);
        if (dist) {
            setLoadingLocation(true);
            try {
                const res = await fetch(`${TURKIYE_API}/neighborhoods?districtId=${dist.id}`);
                const json = await res.json();
                const sorted = (json.data || []).sort((a: Neighborhood, b: Neighborhood) => a.name.localeCompare(b.name, 'tr'));
                setNeighborhoods(sorted);
            } catch (error) {
                console.error('Failed to load neighborhoods', error);
            } finally {
                setLoadingLocation(false);
            }
        }
    };

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
                    data = await shopService.getPublicShops(
                        selectedProvince || undefined,
                        selectedDistrict || undefined,
                        selectedNeighborhood || undefined
                    );
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
    }, [showFavoritesOnly, isAuthenticated, selectedProvince, selectedDistrict, selectedNeighborhood]);

    useEffect(() => {
        const loadFavorites = async () => {
            if (isAuthenticated) {
                try {
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
    }, [isAuthenticated, showFavoritesOnly, shops.length]);

    const toggleTag = (tag: string) => {
        setActiveTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
    };

    useEffect(() => {
        if (!shops) return;

        const term = searchTerm.toLowerCase();
        let results = [...shops].filter(shop => {
            const nameMatch = shop.name?.toLowerCase().includes(term) ?? false;
            const cityMatch = shop.city?.toLowerCase().includes(term) ?? false;
            const districtMatch = shop.district?.toLowerCase().includes(term) ?? false;
            const neighborhoodMatch = shop.neighborhood?.toLowerCase().includes(term) ?? false;
            return nameMatch || cityMatch || districtMatch || neighborhoodMatch;
        });

        if (selectedCategory) {
            results = results.filter(shop => shop.category === selectedCategory);
        }

        if (activeTags.includes('kadin')) {
            results = results.filter(shop => shop.genderPreference === TargetGender.Kadin || shop.genderPreference === TargetGender.Unisex);
        }
        if (activeTags.includes('erkek')) {
            results = results.filter(shop => shop.genderPreference === TargetGender.Erkek || shop.genderPreference === TargetGender.Unisex);
        }

        if (activeTags.includes('rating')) {
            results.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
        }
        if (activeTags.includes('reviews')) {
            results.sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0));
        }
        if (activeTags.includes('newest')) {
            results.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        }

        setFilteredShops(results);
    }, [searchTerm, shops, activeTags, selectedCategory]);

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

    // Addresses moved to mockUserAddresses at root for visibility 

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
                                    className={`flex items-center gap-1 sm:gap-2 hover:text-primary-700 transition-colors py-3 border-b-2 ${isLocationDropdownOpen || selectedProvince ? 'text-primary-700 border-primary-600' : 'text-gray-600 border-transparent'}`}
                                >
                                     <MapPin className="h-4 w-4 shrink-0" />
                                     <span className="truncate">
                                         {selectedNeighborhood ? `${selectedNeighborhood}` : 
                                          selectedDistrict ? `${selectedDistrict}` : 
                                          selectedProvince ? `${selectedProvince}` : 'Konuma Göre'}
                                     </span>
                                     <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${isLocationDropdownOpen ? 'rotate-180' : ''}`} />
                                 </button>

                                 {/* Location Dropdown Menu */}
                                 {isLocationDropdownOpen && (
                                     <>
                                         {/* Mobile Backdrop */}
                                         <div 
                                             className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-[90] sm:hidden" 
                                             onClick={() => setIsLocationDropdownOpen(false)}
                                         />
                                         
                                         <div className="fixed inset-x-4 top-[15%] sm:absolute sm:top-full sm:left-0 sm:mt-3 w-auto sm:w-80 bg-white shadow-[0_20px_50px_rgba(0,0,0,0.2)] rounded-2xl overflow-hidden border border-gray-100 z-[100] animate-in fade-in slide-in-from-top-4 duration-200">
                                             {/* Header */}
                                             <div className="flex justify-between items-center px-5 py-4 border-b border-gray-50">
                                                 <h4 className="font-bold text-gray-900 text-base tracking-tight">Konum Seç</h4>
                                                 <div className="flex items-center gap-3">
                                                     {(selectedProvince || selectedDistrict || selectedNeighborhood) && (
                                                         <button
                                                             onClick={(e) => { 
                                                                 e.stopPropagation(); 
                                                                 setSelectedProvince(null); 
                                                                 setSelectedDistrict(null); 
                                                                 setSelectedNeighborhood(null);
                                                                 setDistricts([]);
                                                                 setNeighborhoods([]);
                                                             }}
                                                             className="text-xs font-semibold text-red-500 hover:text-red-700 transition-colors"
                                                         >
                                                             Temizle
                                                         </button>
                                                     )}
                                                     <button 
                                                         onClick={() => setIsLocationDropdownOpen(false)}
                                                         className="text-gray-400 hover:text-gray-600 p-1"
                                                     >
                                                         <XCircle className="w-5 h-5" />
                                                     </button>
                                                 </div>
                                             </div>
 
                                             <div className="p-0 max-h-[65vh] overflow-y-auto custom-scrollbar">
                                                 <div className="p-4 space-y-5">
                                                     {/* Province Selection */}
                                                     <div className="space-y-2">
                                                         <div className="flex justify-between items-end mb-1">
                                                             <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">İl Seçimi</label>
                                                             {selectedProvince && <span className="text-[10px] font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded-md">Seçili: {selectedProvince}</span>}
                                                         </div>
                                                         
                                                         <div className="relative mb-2">
                                                             <input 
                                                                 type="text" 
                                                                 placeholder="İl ara..."
                                                                 onChange={(e) => {
                                                                     const term = e.target.value.toLocaleLowerCase('tr');
                                                                     const filtered = provinces.filter(p => p.name.toLocaleLowerCase('tr').includes(term));
                                                                     setFilteredProvinces(filtered);
                                                                 }}
                                                                 className="w-full bg-gray-50 border border-gray-100 rounded-lg pl-3 pr-3 py-2 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-primary-500 focus:bg-white transition-all"
                                                             />
                                                         </div>

                                                         <div className="grid grid-cols-1 gap-1.5 max-h-44 overflow-y-auto p-1 pr-2 custom-scrollbar border border-gray-100 rounded-xl bg-gray-50/30">
                                                             {(filteredProvinces.length > 0 ? filteredProvinces : provinces).map(p => (
                                                                 <button
                                                                     key={p.id}
                                                                     onClick={() => {
                                                                         handleProvinceChange(p.name);
                                                                     }}
                                                                     className={`text-left px-4 py-2 rounded-lg text-sm font-medium transition-all ${selectedProvince === p.name ? 'bg-primary-600 text-white shadow-md shadow-primary-100' : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-100'}`}
                                                                 >
                                                                     {p.name}
                                                                 </button>
                                                             ))}
                                                         </div>
                                                     </div>

                                                     {/* District Selection */}
                                                     {selectedProvince && (
                                                         <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                                             <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">İlçe Seçimi</label>
                                                             <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto p-1 pr-2 custom-scrollbar border border-gray-100 rounded-xl bg-gray-50/30">
                                                                 {districts.map(d => (
                                                                     <button
                                                                         key={d.id}
                                                                         onClick={() => handleDistrictChange(d.name)}
                                                                         className={`text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${selectedDistrict === d.name ? 'bg-primary-600 text-white shadow-md shadow-primary-100' : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-100'}`}
                                                                     >
                                                                         {d.name}
                                                                     </button>
                                                                 ))}
                                                             </div>
                                                         </div>
                                                     )}

                                                     {/* Neighborhood Selection */}
                                                     {selectedDistrict && (
                                                         <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                                             <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Mahalle Seçimi</label>
                                                             <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto p-1 pr-2 custom-scrollbar border border-gray-100 rounded-xl bg-gray-50/30 relative">
                                                                 {loadingLocation ? (
                                                                     <div className="flex items-center justify-center py-8">
                                                                         <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                                                                     </div>
                                                                 ) : (
                                                                     neighborhoods.map(n => (
                                                                         <button
                                                                             key={n.id}
                                                                             onClick={() => {
                                                                                 setSelectedNeighborhood(n.name);
                                                                                 setIsLocationDropdownOpen(false);
                                                                             }}
                                                                             className={`text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${selectedNeighborhood === n.name ? 'bg-primary-600 text-white shadow-md shadow-primary-100' : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-100'}`}
                                                                         >
                                                                             {n.name}
                                                                         </button>
                                                                     ))
                                                                 )}
                                                             </div>
                                                         </div>
                                                     )}
                                                 </div>
                                             </div>
 
                                             <div className="p-5 bg-gray-50/50 border-t border-gray-50">
                                                 <button 
                                                     onClick={() => setIsLocationDropdownOpen(false)}
                                                     className="w-full bg-primary-600 text-white rounded-xl py-3 text-sm font-bold hover:bg-primary-700 transition-all shadow-lg shadow-primary-100 active:scale-[0.98]"
                                                 >
                                                     Sonuçları Göster
                                                 </button>
                                             </div>
                                         </div>

                                         <style dangerouslySetInnerHTML={{ __html: `
                                             .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                                             .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                                             .custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 10px; }
                                             .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #d1d5db; }
                                         `}} />
                                     </>
                                 )}
                            </div>
                        </div>

                        {/* Scrollable quick tabs container */}
                        <div className="flex items-center gap-3 md:gap-4 lg:gap-5 overflow-x-auto whitespace-nowrap flex-1 min-w-0 h-full select-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                            <button
                                onClick={() => toggleTag('kadin')}
                                className={`font-semibold transition-colors py-3 border-b-2 shrink-0 ${activeTags.includes('kadin') ? 'text-primary-700 border-primary-600' : 'text-gray-800 hover:text-primary-700 border-transparent'}`}
                            >
                                Kadın
                            </button>
                            <div className="w-px h-4 bg-gray-200 shrink-0 mx-0.5 md:mx-1 text-[13px] md:text-sm"></div>
                            <button
                                onClick={() => toggleTag('erkek')}
                                className={`font-semibold transition-colors py-3 border-b-2 shrink-0 text-[13px] md:text-sm ${activeTags.includes('erkek') ? 'text-primary-700 border-primary-600' : 'text-gray-800 hover:text-primary-700 border-transparent'}`}
                            >
                                Erkek
                            </button>
                            <div className="w-px h-4 bg-gray-200 shrink-0 mx-0.5 md:mx-1"></div>

                            {/* Other quick tabs sort elements */}
                            <button
                                onClick={() => toggleTag('low-price')}
                                className={`transition-colors py-3 border-b-2 shrink-0 text-[13px] md:text-sm ${activeTags.includes('low-price') ? 'text-primary-700 border-primary-600 font-bold' : 'text-gray-600 hover:text-primary-700 border-transparent'}`}
                            >
                                Düşük Fiyatlar
                            </button>
                            <div className="w-px h-4 bg-gray-200 shrink-0 mx-0.5 md:mx-1"></div>
                            <button
                                onClick={() => toggleTag('high-price')}
                                className={`transition-colors py-3 border-b-2 shrink-0 text-[13px] md:text-sm ${activeTags.includes('high-price') ? 'text-primary-700 border-primary-600 font-bold' : 'text-gray-600 hover:text-primary-700 border-transparent'}`}
                            >
                                Yüksek Fiyatlar
                            </button>
                            <div className="w-px h-4 bg-gray-200 shrink-0 mx-0.5 md:mx-1"></div>
                            <button
                                onClick={() => toggleTag('rating')}
                                className={`transition-colors py-3 border-b-2 shrink-0 text-[13px] md:text-sm ${activeTags.includes('rating') ? 'text-primary-700 border-primary-600 font-bold' : 'text-gray-600 hover:text-primary-700 border-transparent'}`}
                            >
                                En Yüksek Puanlılar
                            </button>
                            <div className="w-px h-4 bg-gray-200 shrink-0 mx-0.5 md:mx-1"></div>
                            <button
                                onClick={() => toggleTag('campaign')}
                                className={`transition-colors py-3 border-b-2 shrink-0 text-[13px] md:text-sm ${activeTags.includes('campaign') ? 'text-primary-700 border-primary-600 font-bold' : 'text-gray-600 hover:text-primary-700 border-transparent'}`}
                            >
                                Kampanyalılar
                            </button>
                            <div className="w-px h-4 bg-gray-200 shrink-0 mx-0.5 md:mx-1"></div>
                            <button
                                onClick={() => toggleTag('reviews')}
                                className={`transition-colors py-3 border-b-2 shrink-0 text-[13px] md:text-sm ${activeTags.includes('reviews') ? 'text-primary-700 border-primary-600 font-bold' : 'text-gray-600 hover:text-primary-700 border-transparent'}`}
                            >
                                En Çok Yorum Alanlar
                            </button>
                            <div className="w-px h-4 bg-gray-200 shrink-0 mx-0.5 md:mx-1"></div>
                            <button
                                onClick={() => toggleTag('newest')}
                                className={`transition-colors py-3 border-b-2 shrink-0 text-[13px] md:text-sm ${activeTags.includes('newest') ? 'text-primary-700 border-primary-600 font-bold' : 'text-gray-600 hover:text-primary-700 border-transparent'}`}
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
                                    <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-[3px] transition-all duration-300 shadow-md ${selectedCategory === cat.id
                                        ? 'border-primary-500 shadow-primary-200/50 shadow-lg ring-4 ring-primary-100'
                                        : 'border-gray-200 group-hover:border-primary-300 group-hover:shadow-lg'
                                        }`}>
                                        <img
                                            src={cat.image}
                                            alt={cat.label}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <span className={`text-xs sm:text-sm font-semibold text-center leading-tight transition-colors ${selectedCategory === cat.id ? 'text-primary-700' : 'text-gray-700 group-hover:text-primary-600'
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
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                        <h2 className="text-xl font-bold text-gray-900">
                            {filteredShops.length} Salon Bulundu
                        </h2>
                        <button
                            onClick={() => setIsMapModalOpen(!isMapModalOpen)}
                            className={`px-5 py-2.5 rounded-xl font-semibold transition-all shadow-sm flex items-center justify-center gap-2 border w-full sm:w-auto ${isMapModalOpen ? 'bg-primary-50 text-primary-700 border-primary-200 hover:bg-primary-100' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
                        >
                            <Map className="w-4 h-4" />
                            {isMapModalOpen ? 'Haritayı Gizle' : 'Haritada Gör'}
                        </button>
                    </div>

                    {/* Inline Harita Alanı */}
                    {isMapModalOpen && (
                        <div className="w-full h-[400px] sm:h-[450px] mb-8 rounded-[2rem] overflow-hidden shadow-sm border border-gray-200 relative shrink-0 z-0 fade-in-0 animate-in zoom-in-95 duration-300">
                            <MapContainer
                                center={activeReferenceLocation ? [activeReferenceLocation.lat, activeReferenceLocation.lng] : [39.9, 32.8]}
                                zoom={activeReferenceLocation ? 14 : 6}
                                style={{ height: '100%', width: '100%', zIndex: 0 }}
                                zoomControl={true}
                            >
                                <TileLayer
                                    attribution='&copy; OpenStreetMap'
                                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                                />

                                {/* User Location Marker */}
                                {userLocation && (
                                    <Marker position={[userLocation.lat, userLocation.lng]}>
                                        <Popup>
                                            <div className="font-bold text-primary-600 py-0.5">Sizin Konumunuz</div>
                                        </Popup>
                                    </Marker>
                                )}

                                {/* Shops Markers */}
                                {filteredShops.map((shop) => {
                                    if (!shop.latitude || !shop.longitude) return null;
                                    return (
                                        <Marker
                                            key={shop.id}
                                            position={[shop.latitude, shop.longitude]}
                                        >
                                            <Popup className="shop-popup rounded-2xl border-0 overflow-visible" closeButton={false}>
                                                <div className="-mx-[20px] -my-[14px] min-w-[220px] font-sans flex flex-col overflow-hidden rounded-xl">
                                                    <div className="w-full h-28 bg-gray-100 relative shrink-0">
                                                        {shop.coverImagePath ? (
                                                            <img src={shop.coverImagePath} className="w-full h-full object-cover" alt="" />
                                                        ) : (
                                                            <div className="w-full h-full bg-primary-50 flex items-center justify-center">
                                                                <span className="text-4xl">✂️</span>
                                                            </div>
                                                        )}
                                                        <div className="absolute top-2 right-2 bg-white/95 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-bold text-gray-900 shadow-sm flex items-center gap-1">
                                                            ★ {shop.averageRating?.toFixed(1) || 'Yeni'}
                                                        </div>
                                                    </div>
                                                    <div className="p-3 bg-white">
                                                        <div className="text-[10px] font-bold text-primary-600 mb-1 uppercase tracking-wider">{ShopCategoryLabels[shop.category]}</div>
                                                        <h3 className="font-bold text-gray-900 text-[15px] leading-tight mb-1 line-clamp-1">{shop.name}</h3>
                                                        <div className="flex items-center gap-1 text-gray-500 text-xs mb-3">
                                                            <MapPin className="w-3.5 h-3.5 shrink-0" />
                                                            <span className="truncate">{shop.district}, {shop.city}</span>
                                                        </div>
                                                        <a href={`/shop/${shop.id}`} className="block w-full py-2 bg-gray-900 text-white text-center rounded-lg font-bold text-[13px] hover:bg-black transition-colors">
                                                            Detayları Gör
                                                        </a>
                                                    </div>
                                                </div>
                                            </Popup>
                                        </Marker>
                                    )
                                })}
                            </MapContainer>
                        </div>
                    )}

                    {selectedProvince === null && (
                        <div className="bg-gradient-to-r from-primary-50 to-primary-100 border border-primary-200 rounded-2xl p-4 sm:p-5 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shrink-0 shadow-sm">
                                    <MapPin className="w-6 h-6 text-primary-600" />
                                </div>
                                <div>
                                    <h3 className="text-gray-900 font-bold text-lg leading-tight">Size Yakın Kuaförleri Keşfedin!</h3>
                                    <p className="text-gray-600 text-sm mt-1 font-medium">Size en uygun sonuçları görmek ve randevu almak için hemen konumunuzu belirleyin.</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsLocationDropdownOpen(true)}
                                className="flex-shrink-0 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl font-semibold transition-colors shadow-sm w-full sm:w-auto"
                            >
                                Konum Seç
                            </button>
                        </div>
                    )}
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
