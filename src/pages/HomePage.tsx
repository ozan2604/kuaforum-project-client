import React, { useEffect, useRef, useState } from 'react';
import { shopService } from '../api/shop.service';
import { favoriteService } from '../services/favorite.service';
import { type Shop, TargetGender, ShopCategory, ShopCategoryLabels } from '../types/shop';
import { useSearchParams } from 'react-router-dom';
import { ShopCard } from '../components/ShopCard';
import { useAuth } from '../context/AuthContext';
import { MapPin, ChevronDown, ChevronLeft, ChevronRight, Map, XCircle, Navigation } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { DEFAULT_SALON_COVER } from '../constants/images';
import api from '../api/axios';

// ─── Session-storage helpers ──────────────────────────────────────────────────
const SS_KEY = 'homepage_filters';
function loadFilters() {
    try { return JSON.parse(sessionStorage.getItem(SS_KEY) || 'null'); } catch { return null; }
}
function saveFilters(data: object) {
    try { sessionStorage.setItem(SS_KEY, JSON.stringify(data)); } catch {}
}

// Fix Leaflet's default icon path issues in React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});




const MapFocuser: React.FC<{ center: [number, number] | null; shopId: string | null }> = ({ center, shopId }) => {
    const map = useMap();
    useEffect(() => {
        if (!center) return;
        map.flyTo(center, 16, { duration: 1.2 });
        if (!shopId) return;
        const timer = setTimeout(() => {
            map.eachLayer((layer) => {
                if (layer instanceof L.Marker) {
                    const pos = layer.getLatLng();
                    if (Math.abs(pos.lat - center[0]) < 0.0001 && Math.abs(pos.lng - center[1]) < 0.0001) {
                        layer.openPopup();
                    }
                }
            });
        }, 1400);
        return () => clearTimeout(timer);
    }, [center, shopId, map]);
    return null;
};

// Harita açıldıktan sonra konum gelirse otomatik odakla
const UserLocator: React.FC<{ userLocation: { lat: number; lng: number } | null }> = ({ userLocation }) => {
    const map = useMap();
    const initialLocation = useRef(userLocation);
    useEffect(() => {
        // Sadece harita açıldığında konum bilinmiyorsa ve sonradan gelince uç
        if (!userLocation || initialLocation.current !== null) return;
        map.flyTo([userLocation.lat, userLocation.lng], 14, { duration: 1.2 });
    }, [userLocation, map]);
    return null;
};

const escapeHtml = (s: string) => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

const createShopMarkerIcon = (shop: { name: string; coverImagePath?: string }): L.DivIcon => {
    const label = escapeHtml(shop.name.length > 18 ? shop.name.slice(0, 16) + '…' : shop.name);
    return L.divIcon({
        className: '',
        html: `<div style="display:flex;flex-direction:column;align-items:center;filter:drop-shadow(0 3px 10px rgba(0,0,0,0.22));">
            <div style="display:flex;align-items:center;gap:5px;background:#fff;border-radius:20px;padding:4px 10px 4px 5px;border:1.5px solid #fecaca;">
                <div style="width:8px;height:8px;background:linear-gradient(135deg,#ef4444,#dc2626);border-radius:50%;flex-shrink:0;box-shadow:0 1px 3px rgba(239,68,68,0.5);"></div>
                <span style="font-size:11px;font-weight:700;color:#111827;white-space:nowrap;max-width:110px;overflow:hidden;text-overflow:ellipsis;">${label}</span>
            </div>
            <div style="width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:6px solid #fecaca;"></div>
        </div>`,
        iconSize: [140, 34],
        iconAnchor: [70, 34],
        popupAnchor: [0, -36],
    });
};

const createUserMarkerIcon = (profileImageUrl?: string | null): L.DivIcon => {
    if (profileImageUrl) {
        const src = escapeHtml(profileImageUrl);
        return L.divIcon({
            className: '',
            html: `<div style="display:flex;flex-direction:column;align-items:center;filter:drop-shadow(0 3px 12px rgba(0,0,0,0.28));">
                <div style="padding:2.5px;border-radius:50%;background:linear-gradient(135deg,#6366f1,#8b5cf6);">
                    <img src="${src}" style="width:38px;height:38px;border-radius:50%;border:2px solid #fff;object-fit:cover;display:block;" />
                </div>
                <div style="width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:8px solid #8b5cf6;margin-top:-1px;"></div>
            </div>`,
            iconSize: [44, 54],
            iconAnchor: [22, 54],
            popupAnchor: [0, -56],
        });
    }
    return L.divIcon({
        className: '',
        html: `<div style="position:relative;display:flex;align-items:center;justify-content:center;width:32px;height:32px;">
            <span class="animate-ping" style="position:absolute;display:inline-flex;height:100%;width:100%;border-radius:50%;background:#60a5fa;opacity:0.35;"></span>
            <div style="position:relative;width:16px;height:16px;background:#2563eb;border-radius:50%;border:2.5px solid #fff;box-shadow:0 2px 8px rgba(37,99,235,0.5);"></div>
        </div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -18],
    });
};

interface Province { id: number; name: string; districts: { id: number; name: string }[] }
interface Neighborhood { id: number; name: string }

interface HomePageProps {
    showFavoritesOnly?: boolean;
}

export const HomePage: React.FC<HomePageProps> = ({ showFavoritesOnly = false }) => {
    const [shops, setShops] = useState<Shop[]>([]);
    const [filteredShops, setFilteredShops] = useState<Shop[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchParams, setSearchParams] = useSearchParams();
    const searchTerm = searchParams.get('search') || '';

    useEffect(() => {
        const lat = searchParams.get('mapLat');
        const lng = searchParams.get('mapLng');
        const shopId = searchParams.get('mapShopId');
        if (lat && lng) {
            setIsMapModalOpen(true);
            setMapFocusCenter([parseFloat(lat), parseFloat(lng)]);
            setMapFocusShopId(shopId);
            setTimeout(() => mapSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 200);
        }
    }, [searchParams]);
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
    const { isAuthenticated, user } = useAuth();
    const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

    // Location API state
    const [provinces, setProvinces] = useState<Province[]>([]);
    const [filteredProvinces, setFilteredProvinces] = useState<Province[]>([]);
    const [districts, setDistricts] = useState<{ id: number; name: string }[]>([]);
    const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
    const [loadingLocation, setLoadingLocation] = useState(false);
    const [provincesLoading, setProvincesLoading] = useState(true);

    // ── Restore filter state from sessionStorage ─────────────────────────────
    const _saved = loadFilters() || {};
    const [selectedProvince, setSelectedProvince] = useState<string | null>(_saved.selectedProvince ?? null);
    const [selectedDistrict, setSelectedDistrict] = useState<string | null>(_saved.selectedDistrict ?? null);
    const [selectedNeighborhood, setSelectedNeighborhood] = useState<string | null>(_saved.selectedNeighborhood ?? null);
    const [activeTags, setActiveTags] = useState<string[]>(_saved.activeTags ?? []);
    const [activeSortTag, setActiveSortTag] = useState<string | null>(_saved.activeSortTag ?? null);
    const [selectedCategory, setSelectedCategory] = useState<ShopCategory | null>(_saved.selectedCategory ?? null);
    const [minRating, setMinRating] = useState<number | null>(_saved.minRating ?? null);

    const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);
    const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
    const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
    const [isMapModalOpen, setIsMapModalOpen] = useState(false);
    const [mapFocusCenter, setMapFocusCenter] = useState<[number, number] | null>(null);
    const [mapFocusShopId, setMapFocusShopId] = useState<string | null>(null);
    const mapSectionRef = useRef<HTMLDivElement>(null);
    const [catScroll, setCatScroll] = useState({ left: false, right: true });

    useEffect(() => {
        const loadProvinces = async () => {
            try {
                const res = await api.get('/location/provinces');
                const sorted = (res.data?.data || []).sort((a: Province, b: Province) => a.name.localeCompare(b.name, 'tr'));
                setProvinces(sorted);

                // ── Restore districts/neighborhoods from session ─────────────
                const saved = loadFilters();
                if (saved?.selectedProvince) {
                    const savedProv = sorted.find((p: Province) => p.name === saved.selectedProvince);
                    if (savedProv) {
                        const sortedDistricts = [...savedProv.districts].sort((a: any, b: any) => a.name.localeCompare(b.name, 'tr'));
                        setDistricts(sortedDistricts);
                        if (saved.selectedDistrict) {
                            const savedDist = sortedDistricts.find((d: any) => d.name === saved.selectedDistrict);
                            if (savedDist) {
                                try {
                                    const nRes = await api.get(`/location/neighborhoods?districtId=${savedDist.id}`);
                                    const sortedN = (nRes.data?.data || []).sort((a: Neighborhood, b: Neighborhood) => a.name.localeCompare(b.name, 'tr'));
                                    setNeighborhoods(sortedN);
                                } catch {}
                            }
                        }
                    }
                }
            } catch (error) {
                console.error('Failed to load provinces', error);
            } finally {
                setProvincesLoading(false);
            }
        };
        loadProvinces();
    }, []);

    // ── Persist all filter state whenever it changes ────────────────────────
    useEffect(() => {
        saveFilters({ selectedProvince, selectedDistrict, selectedNeighborhood, activeTags, activeSortTag, selectedCategory, minRating });
    }, [selectedProvince, selectedDistrict, selectedNeighborhood, activeTags, selectedCategory, minRating]);

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
                const res = await api.get(`/location/neighborhoods?districtId=${dist.id}`);
                const sorted = (res.data?.data || []).sort((a: Neighborhood, b: Neighborhood) => a.name.localeCompare(b.name, 'tr'));
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
            setCurrentPage(1);
            try {
                let data: Shop[] = [];
                if (showFavoritesOnly) {
                    if (isAuthenticated) data = await favoriteService.getUserFavorites();
                    setShops(data);
                    setFilteredShops(data);
                    setTotalPages(1);
                } else {
                    const result = await shopService.getPublicShops(
                        selectedProvince || undefined,
                        selectedDistrict || undefined,
                        selectedNeighborhood || undefined,
                        1, 20
                    );
                    setShops(result.items);
                    setFilteredShops(result.items);
                    setTotalPages(result.totalPages);
                }
            } catch (error) {
                console.error('Failed to load shops', error);
            } finally {
                setLoading(false);
            }
        };
        loadShops();
    }, [showFavoritesOnly, isAuthenticated, selectedProvince, selectedDistrict, selectedNeighborhood]);

    const handleLoadMoreShops = async () => {
        const nextPage = currentPage + 1;
        setLoadingMore(true);
        try {
            const result = await shopService.getPublicShops(
                selectedProvince || undefined,
                selectedDistrict || undefined,
                selectedNeighborhood || undefined,
                nextPage, 20
            );
            setShops(prev => [...prev, ...result.items]);
            setCurrentPage(nextPage);
        } catch (error) {
            console.error('Failed to load more shops', error);
        } finally {
            setLoadingMore(false);
        }
    };

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
        setActiveTags(prev => {
            if (prev.includes(tag)) return prev.filter(t => t !== tag);
            if (tag === 'pet') return [...prev.filter(t => t !== 'kadin' && t !== 'erkek'), tag];
            if (tag === 'kadin' || tag === 'erkek') return [...prev.filter(t => t !== 'pet'), tag];
            return [...prev, tag];
        });
    };

    const toggleSortTag = (tag: string) => {
        setActiveSortTag(prev => prev === tag ? null : tag);
    };

    useEffect(() => {
        if (selectedCategory === ShopCategory.PetKuafor) {
            setActiveTags(prev => ['pet', ...prev.filter(t => t !== 'kadin' && t !== 'erkek')]);
        } else {
            setActiveTags(prev => prev.filter(t => t !== 'pet'));
        }
    }, [selectedCategory]);

    useEffect(() => {
        if (!shops) return;

        const term = searchTerm.trim().toLowerCase();
        let results = [...shops];

        if (term) {
            results = results.filter(shop => {
                const nameMatch = shop.name?.toLowerCase().includes(term) ?? false;
                const cityMatch = shop.city?.toLowerCase().includes(term) ?? false;
                const districtMatch = shop.district?.toLowerCase().includes(term) ?? false;
                const neighborhoodMatch = shop.neighborhood?.toLowerCase().includes(term) ?? false;
                return nameMatch || cityMatch || districtMatch || neighborhoodMatch;
            });
        }

        if (selectedCategory) {
            results = results.filter(shop => {
                if (!shop.categories || !Array.isArray(shop.categories)) return false;
                return shop.categories.some(c => Number(c) === Number(selectedCategory));
            });
        }

        const hasKadin = activeTags.includes('kadin');
        const hasErkek = activeTags.includes('erkek');
        const hasPet = activeTags.includes('pet');
        if (hasPet) {
            results = results.filter(shop => shop.genderPreference === TargetGender.Pet);
        } else if (hasKadin && !hasErkek) {
            results = results.filter(shop => shop.genderPreference === TargetGender.Kadin || shop.genderPreference === TargetGender.Unisex);
        } else if (hasErkek && !hasKadin) {
            results = results.filter(shop => shop.genderPreference === TargetGender.Erkek || shop.genderPreference === TargetGender.Unisex);
        }

        if (minRating !== null) {
            results = results.filter(shop => (shop.averageRating || 0) >= minRating);
        }

        if (activeSortTag === 'rating') {
            results.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
        } else if (activeSortTag === 'low-price') {
            results.sort((a, b) => (a.minServicePrice ?? Infinity) - (b.minServicePrice ?? Infinity));
        } else if (activeSortTag === 'high-price') {
            results.sort((a, b) => (b.minServicePrice ?? -Infinity) - (a.minServicePrice ?? -Infinity));
        } else if (activeSortTag === 'reviews') {
            results.sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0));
        } else if (activeSortTag === 'newest') {
            results.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        }

        setFilteredShops(results);
    }, [searchTerm, shops, activeTags, activeSortTag, selectedCategory, minRating]);

    useEffect(() => {
        if (navigator.geolocation) {
            // First attempt with high accuracy
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setUserLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    });
                },
                (error) => {
                    console.warn('High accuracy location failed, falling back to low accuracy:', error);
                    // Fallback to low accuracy
                    navigator.geolocation.getCurrentPosition(
                        (pos) => {
                            setUserLocation({
                                lat: pos.coords.latitude,
                                lng: pos.coords.longitude
                            });
                        },
                        (err) => console.error('Low accuracy location also failed:', err),
                        { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
                    );
                },
                { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
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
        <div className="min-h-screen bg-gray-50 flex flex-col pt-0">
            {/* Sub-Navbar for Quick Filters */}
            <div className="bg-white border-b border-gray-100 sticky top-24 z-40">
                <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between sm:justify-start h-12 text-sm font-medium select-none w-full">

                        {/* ── Location Button — pinned left, outside scroll container ── */}
                        <div className="relative h-full flex items-center justify-center flex-1 sm:flex-none sm:pr-5 sm:mr-5 sm:border-r sm:border-gray-100 pr-2">
                            <button
                                onClick={() => setIsLocationDropdownOpen(!isLocationDropdownOpen)}
                                className={`flex items-center gap-1 sm:gap-2 hover:text-primary-700 transition-colors py-3 border-b-2 whitespace-nowrap ${isLocationDropdownOpen || selectedProvince ? 'text-primary-700 border-primary-600' : 'text-gray-600 border-transparent'}`}
                            >
                                <MapPin className="h-4 w-4 shrink-0" />
                                <span className="max-w-[75px] sm:max-w-none truncate">
                                    {selectedNeighborhood || selectedDistrict || selectedProvince || 'Konum'}
                                </span>
                                <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${isLocationDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {isLocationDropdownOpen && (
                                <>
                                    {/* Transparent backdrop */}
                                    <div className="fixed inset-0 z-[90]" onClick={() => setIsLocationDropdownOpen(false)} />

                                    {/* Dropdown */}
                                    <div className="fixed inset-x-4 top-[15%] sm:absolute sm:inset-x-auto sm:top-full sm:left-0 sm:mt-3 w-auto sm:w-80 bg-white shadow-[0_20px_50px_rgba(0,0,0,0.2)] rounded-2xl overflow-hidden border border-gray-100 z-[100] animate-in fade-in slide-in-from-top-4 duration-200">
                                        {/* Header */}
                                        <div className="flex justify-between items-center px-5 py-4 border-b border-gray-50">
                                            <h4 className="font-bold text-gray-900 text-base">Konum Seç</h4>
                                            <div className="flex items-center gap-3">
                                                {(selectedProvince || selectedDistrict || selectedNeighborhood) && (
                                                    <button onClick={(e) => { e.stopPropagation(); setSelectedProvince(null); setSelectedDistrict(null); setSelectedNeighborhood(null); setDistricts([]); setNeighborhoods([]); setFilteredProvinces([]); }} className="text-xs font-semibold text-red-500 hover:text-red-700">Temizle</button>
                                                )}
                                                <button onClick={() => setIsLocationDropdownOpen(false)} className="text-gray-400 hover:text-gray-600 p-1"><XCircle className="w-5 h-5" /></button>
                                            </div>
                                        </div>

                                        <div className="max-h-[65vh] overflow-y-auto custom-scrollbar">
                                            <div className="p-4 space-y-4">

                                                {/* ── İL ── */}
                                                <div className="space-y-2">
                                                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">İl</label>
                                                    {selectedProvince ? (
                                                        /* Seçili il chip'i */
                                                        <div className="flex items-center justify-between bg-primary-50 border border-primary-200 rounded-xl px-4 py-2.5">
                                                            <div className="flex items-center gap-2">
                                                                <MapPin className="w-4 h-4 text-primary-600 shrink-0" />
                                                                <span className="text-sm font-semibold text-primary-700">{selectedProvince}</span>
                                                            </div>
                                                            <button
                                                                onClick={() => { setSelectedProvince(null); setSelectedDistrict(null); setSelectedNeighborhood(null); setDistricts([]); setNeighborhoods([]); setFilteredProvinces([]); }}
                                                                className="text-primary-400 hover:text-red-500 transition-colors p-0.5"
                                                            >
                                                                <XCircle className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        /* İl arama + liste */
                                                        <>
                                                            <input
                                                                type="text"
                                                                placeholder="İl ara..."
                                                                onChange={(e) => { const t = e.target.value.toLocaleLowerCase('tr'); setFilteredProvinces(provinces.filter(p => p.name.toLocaleLowerCase('tr').includes(t))); }}
                                                                className="w-full bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-primary-500 transition-all"
                                                                style={{ fontSize: '16px' }}
                                                            />
                                                            <div className="grid grid-cols-1 gap-1.5 max-h-44 overflow-y-auto p-1 pr-2 custom-scrollbar border border-gray-100 rounded-xl bg-gray-50/30 mt-1.5">
                                                                {provincesLoading
                                                                    ? <div className="flex justify-center py-4"><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600" /></div>
                                                                    : (filteredProvinces.length > 0 ? filteredProvinces : provinces).map(p => (
                                                                        <button key={p.id} onClick={() => handleProvinceChange(p.name)}
                                                                            className="text-left px-4 py-2 rounded-lg text-sm font-medium bg-white text-gray-700 hover:bg-primary-50 hover:text-primary-700 border border-gray-100 transition-all">
                                                                            {p.name}
                                                                        </button>
                                                                    ))
                                                                }
                                                            </div>
                                                        </>
                                                    )}
                                                </div>

                                                {/* ── İLÇE — sadece il seçildiyse göster ── */}
                                                {selectedProvince && (
                                                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">İlçe</label>
                                                        {selectedDistrict ? (
                                                            /* Seçili ilçe chip'i */
                                                            <div className="flex items-center justify-between bg-primary-50 border border-primary-200 rounded-xl px-4 py-2.5">
                                                                <div className="flex items-center gap-2">
                                                                    <MapPin className="w-4 h-4 text-primary-600 shrink-0" />
                                                                    <span className="text-sm font-semibold text-primary-700">{selectedDistrict}</span>
                                                                </div>
                                                                <button
                                                                    onClick={() => { setSelectedDistrict(null); setSelectedNeighborhood(null); setNeighborhoods([]); }}
                                                                    className="text-primary-400 hover:text-red-500 transition-colors p-0.5"
                                                                >
                                                                    <XCircle className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            /* İlçe listesi */
                                                            <div className="grid grid-cols-1 gap-1.5 max-h-44 overflow-y-auto p-1 pr-2 custom-scrollbar border border-gray-100 rounded-xl bg-gray-50/30">
                                                                {districts.map(d => (
                                                                    <button key={d.id} onClick={() => handleDistrictChange(d.name)}
                                                                        className="text-left px-4 py-2 rounded-lg text-sm font-medium bg-white text-gray-700 hover:bg-primary-50 hover:text-primary-700 border border-gray-100 transition-all">
                                                                        {d.name}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {/* ── MAHALLE — sadece ilçe seçildiyse göster ── */}
                                                {selectedDistrict && (
                                                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Mahalle</label>
                                                        {selectedNeighborhood ? (
                                                            /* Seçili mahalle chip'i */
                                                            <div className="flex items-center justify-between bg-primary-50 border border-primary-200 rounded-xl px-4 py-2.5">
                                                                <div className="flex items-center gap-2">
                                                                    <MapPin className="w-4 h-4 text-primary-600 shrink-0" />
                                                                    <span className="text-sm font-semibold text-primary-700">{selectedNeighborhood}</span>
                                                                </div>
                                                                <button
                                                                    onClick={() => setSelectedNeighborhood(null)}
                                                                    className="text-primary-400 hover:text-red-500 transition-colors p-0.5"
                                                                >
                                                                    <XCircle className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            /* Mahalle listesi */
                                                            <div className="grid grid-cols-1 gap-1.5 max-h-44 overflow-y-auto p-1 pr-2 custom-scrollbar border border-gray-100 rounded-xl bg-gray-50/30">
                                                                {loadingLocation
                                                                    ? <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" /></div>
                                                                    : neighborhoods.map(n => (
                                                                        <button key={n.id} onClick={() => { setSelectedNeighborhood(n.name); setIsLocationDropdownOpen(false); }}
                                                                            className="text-left px-4 py-2 rounded-lg text-sm font-medium bg-white text-gray-700 hover:bg-primary-50 hover:text-primary-700 border border-gray-100 transition-all">
                                                                            {n.name}
                                                                        </button>
                                                                    ))
                                                                }
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                            </div>
                                        </div>

                                        <div className="p-5 bg-gray-50/50 border-t border-gray-50">
                                            <button onClick={() => setIsLocationDropdownOpen(false)} className="w-full bg-primary-600 text-white rounded-xl py-3 text-sm font-bold hover:bg-primary-700 transition-all shadow-lg shadow-primary-100 active:scale-[0.98]">Sonuçları Göster</button>
                                        </div>
                                    </div>

                                    <style dangerouslySetInnerHTML={{ __html: `.custom-scrollbar::-webkit-scrollbar{width:4px}.custom-scrollbar::-webkit-scrollbar-track{background:transparent}.custom-scrollbar::-webkit-scrollbar-thumb{background:#e5e7eb;border-radius:10px}.custom-scrollbar::-webkit-scrollbar-thumb:hover{background:#d1d5db}` }} />
                                </>
                            )}
                        </div>

                        {/* ── Desktop Filter Tabs ── */}
                        <div className="hidden sm:flex flex-1 items-center overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] min-w-0 justify-evenly">
                            {[
                                { label: 'Kadın', active: activeTags.includes('kadin'), onClick: () => toggleTag('kadin') },
                                { label: 'Erkek', active: activeTags.includes('erkek'), onClick: () => toggleTag('erkek') },
                                { label: 'Pet', active: activeTags.includes('pet'), onClick: () => toggleTag('pet') },
                                { label: 'Düşük Fiyatlar', active: activeSortTag === 'low-price', onClick: () => toggleSortTag('low-price') },
                                { label: 'Yüksek Fiyatlar', active: activeSortTag === 'high-price', onClick: () => toggleSortTag('high-price') },
                                { label: 'En Yüksek Puanlılar', active: activeSortTag === 'rating', onClick: () => toggleSortTag('rating') },
                                { label: '4★ ve Üzeri', active: minRating === 4, onClick: () => setMinRating(prev => prev === 4 ? null : 4) },
                                { label: 'En Çok Yorum Alanlar', active: activeSortTag === 'reviews', onClick: () => toggleSortTag('reviews') },
                                { label: 'En Yeniler', active: activeSortTag === 'newest', onClick: () => toggleSortTag('newest') },
                            ].map((tab) => (
                                <button key={tab.label} onClick={tab.onClick}
                                    className={`transition-colors py-3 border-b-2 shrink-0 whitespace-nowrap text-[13px] sm:text-sm px-2 sm:px-3 ${tab.active ? 'text-primary-700 border-primary-600 font-bold' : 'text-gray-600 hover:text-primary-700 border-transparent'}`}>
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* ── Mobile Search Button ── */}
                        <div className="flex-1 flex items-center justify-center sm:hidden h-full">
                            <button
                                onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
                                className={`flex items-center justify-center gap-1.5 transition-colors py-3 font-bold w-full h-full ${isMobileSearchOpen || searchTerm ? 'text-primary-700' : 'text-gray-700 hover:text-primary-700'}`}
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                Arama
                            </button>
                        </div>

                        {/* ── Mobile Filter Button ── */}
                        <div className="flex-1 flex items-center justify-center sm:hidden h-full">
                            <button
                                onClick={() => setIsMobileFiltersOpen(true)}
                                className="flex items-center justify-center gap-1.5 hover:text-primary-700 transition-colors py-3 text-gray-700 font-bold w-full h-full"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
                                Filtreler
                                {(activeTags.length > 0 || activeSortTag || minRating) && (
                                    <span className="w-2 h-2 bg-red-500 rounded-full ml-0.5"></span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Filters Modal */}
            {isMobileFiltersOpen && (
                <div className="fixed inset-0 z-[100] sm:hidden flex flex-col justify-end">
                    <div className="absolute inset-0 bg-black/50 transition-opacity" onClick={() => setIsMobileFiltersOpen(false)} />
                    <div className="relative bg-white w-full rounded-t-3xl shadow-xl flex flex-col max-h-[85vh] animate-in slide-in-from-bottom-full">
                        <div className="flex justify-between items-center p-5 border-b border-gray-100">
                            <h3 className="font-bold text-lg text-gray-900">Filtrele</h3>
                            <button onClick={() => setIsMobileFiltersOpen(false)} className="text-gray-400 hover:text-gray-600 p-1"><XCircle className="w-6 h-6" /></button>
                        </div>
                        <div className="p-5 overflow-y-auto space-y-6">
                            <div>
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Cinsiyet</h4>
                                <div className="flex gap-3">
                                    <button onClick={() => toggleTag('kadin')} className={`flex-1 py-2.5 rounded-xl border font-bold text-sm transition-all ${activeTags.includes('kadin') ? 'bg-primary-50 border-primary-600 text-primary-700' : 'bg-white border-gray-200 text-gray-700'}`}>Kadın</button>
                                    <button onClick={() => toggleTag('erkek')} className={`flex-1 py-2.5 rounded-xl border font-bold text-sm transition-all ${activeTags.includes('erkek') ? 'bg-primary-50 border-primary-600 text-primary-700' : 'bg-white border-gray-200 text-gray-700'}`}>Erkek</button>
                                    <button onClick={() => toggleTag('pet')} className={`flex-1 py-2.5 rounded-xl border font-bold text-sm transition-all ${activeTags.includes('pet') ? 'bg-primary-50 border-primary-600 text-primary-700' : 'bg-white border-gray-200 text-gray-700'}`}>Pet</button>
                                </div>
                            </div>
                            <div>
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Sıralama & Fiyat</h4>
                                <div className="flex flex-wrap gap-2">
                                    {[
                                        { id: 'low-price', label: 'Düşük Fiyatlar' },
                                        { id: 'high-price', label: 'Yüksek Fiyatlar' },
                                        { id: 'rating', label: 'En Yüksek Puanlılar' },
                                        { id: 'reviews', label: 'En Çok Yorum Alanlar' },
                                        { id: 'newest', label: 'En Yeniler' }
                                    ].map(sortOption => (
                                        <button key={sortOption.id} onClick={() => toggleSortTag(sortOption.id)} className={`px-4 py-2 rounded-xl border font-semibold text-sm transition-all ${activeSortTag === sortOption.id ? 'bg-primary-50 border-primary-600 text-primary-700' : 'bg-white border-gray-200 text-gray-700'}`}>
                                            {sortOption.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Değerlendirme Puanı</h4>
                                <button onClick={() => setMinRating(prev => prev === 4 ? null : 4)} className={`px-4 py-2 rounded-xl border font-semibold text-sm transition-all inline-flex items-center gap-2 ${minRating === 4 ? 'bg-primary-50 border-primary-600 text-primary-700' : 'bg-white border-gray-200 text-gray-700'}`}>
                                    <span className="text-yellow-400">★</span> 4.0 ve Üzeri
                                </button>
                            </div>
                        </div>
                        <div className="p-5 border-t border-gray-100 bg-gray-50 flex gap-3">
                            <button onClick={() => { setActiveTags([]); setActiveSortTag(null); setMinRating(null); }} className="px-6 py-3 bg-red-100 text-red-600 rounded-xl font-bold text-sm">Temizle</button>
                            <button onClick={() => setIsMobileFiltersOpen(false)} className="flex-1 bg-primary-600 text-white rounded-xl font-bold text-sm shadow-md">Sonuçları Gör</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Arama Çubuğu (Mobil İçin - Toggled) */}
            {isMobileSearchOpen && (
                <div className="bg-white border-b border-gray-100 sm:hidden animate-in fade-in slide-in-from-top-2">
                    <div className="px-4 py-3">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            </div>
                            <input
                                type="text"
                                placeholder="Salon veya hizmet ara..."
                                defaultValue={searchTerm}
                                autoFocus
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        const newParams = new URLSearchParams(searchParams);
                                        if (e.currentTarget.value) newParams.set('search', e.currentTarget.value);
                                        else newParams.delete('search');
                                        setSearchParams(newParams);
                                        setIsMobileSearchOpen(false);
                                    }
                                }}
                                className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-2xl leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-primary-500 focus:border-primary-500 text-[15px] transition-colors shadow-sm"
                            />
                        </div>
                    </div>
                </div>
            )}





            {/* Kategori Yuvarlakları */}
            <div className="bg-white border-b border-gray-100">
                <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-3">
                    <div className="relative group/scroll">
                        {/* Sol Ok Butonu */}
                        <button
                            onClick={() => {
                                const el = document.getElementById('category-scroll');
                                if (el) el.scrollBy({ left: -300, behavior: 'smooth' });
                            }}
                            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm border border-gray-200 shadow-lg hidden sm:flex items-center justify-center hover:bg-white hover:shadow-xl transition-all opacity-0 group-hover/scroll:opacity-100 -translate-x-1"
                        >
                            <ChevronLeft className="w-5 h-5 text-gray-600" />
                        </button>

                        {/* Sağ Ok Butonu */}
                        <button
                            onClick={() => {
                                const el = document.getElementById('category-scroll');
                                if (el) el.scrollBy({ left: 300, behavior: 'smooth' });
                            }}
                            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm border border-gray-200 shadow-lg hidden sm:flex items-center justify-center hover:bg-white hover:shadow-xl transition-all opacity-0 group-hover/scroll:opacity-100 translate-x-1"
                        >
                            <ChevronRight className="w-5 h-5 text-gray-600" />
                        </button>

                        {/* Mobil / Tablet Sol Şeffaf Gradient + Ok (Scroll varsa görünür) */}
                        <div 
                            className={`sm:hidden absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-white via-white/80 to-transparent z-10 pointer-events-none flex items-center transition-opacity duration-300 ${catScroll.left ? 'opacity-100' : 'opacity-0'}`}
                        >
                            <div 
                                onClick={() => {
                                    const el = document.getElementById('category-scroll');
                                    if (el) el.scrollBy({ left: -200, behavior: 'smooth' });
                                }}
                                className="pointer-events-auto cursor-pointer p-1"
                            >
                                <ChevronLeft className="w-5 h-5 text-gray-400" />
                            </div>
                        </div>

                        {/* Mobil / Tablet Sağ Şeffaf Gradient + Ok (Scroll bitmediyse görünür) */}
                        <div 
                            className={`sm:hidden absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-white via-white/80 to-transparent z-10 pointer-events-none flex items-center justify-end transition-opacity duration-300 ${catScroll.right ? 'opacity-100' : 'opacity-0'}`}
                        >
                            <div 
                                onClick={() => {
                                    const el = document.getElementById('category-scroll');
                                    if (el) el.scrollBy({ left: 200, behavior: 'smooth' });
                                }}
                                className="pointer-events-auto cursor-pointer p-1"
                            >
                                <ChevronRight className="w-5 h-5 text-gray-400 animate-pulse" />
                            </div>
                        </div>

                        <div
                            id="category-scroll"
                            onScroll={(e) => {
                                const el = e.currentTarget;
                                setCatScroll({
                                    left: el.scrollLeft > 5,
                                    right: el.scrollLeft < el.scrollWidth - el.clientWidth - 5
                                });
                            }}
                            className="flex items-center gap-4 sm:gap-7 md:gap-9 lg:gap-11 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] py-2 px-2 relative"
                        >
                            {[
                                { id: ShopCategory.ErkekKuafor,              label: ShopCategoryLabels[ShopCategory.ErkekKuafor],              image: '/images/categories/berber.png' },
                                { id: ShopCategory.Kuafor,                   label: ShopCategoryLabels[ShopCategory.Kuafor],                   image: '/images/categories/kuafor.png' },
                                { id: ShopCategory.PetKuafor,               label: ShopCategoryLabels[ShopCategory.PetKuafor],               image: '/images/categories/petkuafor.png' },
                                { id: ShopCategory.GuzellikMerkezi,          label: ShopCategoryLabels[ShopCategory.GuzellikMerkezi],          image: '/images/categories/guzellik.png' },
                                { id: ShopCategory.DovmePiercingStudyosu,   label: ShopCategoryLabels[ShopCategory.DovmePiercingStudyosu],   image: '/images/categories/dovme.png' },
                                { id: ShopCategory.MakyajKasKirpikStudyosu, label: ShopCategoryLabels[ShopCategory.MakyajKasKirpikStudyosu], image: '/images/categories/makyaj.png' },
                                { id: ShopCategory.SacKaynakProtez,         label: ShopCategoryLabels[ShopCategory.SacKaynakProtez],         image: '/images/categories/sackaynak.png' },
                                { id: ShopCategory.CiltBakimMerkezi,        label: ShopCategoryLabels[ShopCategory.CiltBakimMerkezi],        image: '/images/categories/ciltbakim.png' },
                                { id: ShopCategory.TirnakSalonu,            label: ShopCategoryLabels[ShopCategory.TirnakSalonu],            image: '/images/categories/nailart.png' },
                                { id: ShopCategory.LazerEpilasyon,          label: ShopCategoryLabels[ShopCategory.LazerEpilasyon],          image: '/images/categories/lazer.png' },
                                { id: ShopCategory.SpaMerkezi,              label: ShopCategoryLabels[ShopCategory.SpaMerkezi],              image: '/images/categories/spa.png' },
                            ].map((cat) => (
                                <button
                                    key={cat.id}
                                    onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
                                    className="flex flex-col items-center gap-1.5 group shrink-0 transition-all"
                                >
                                    <div className={`w-16 h-16 sm:w-[88px] sm:h-[88px] rounded-full overflow-hidden border-[3px] transition-all duration-300 shadow-md ${selectedCategory === cat.id
                                        ? 'border-primary-500 shadow-primary-200/50 shadow-lg ring-4 ring-primary-100'
                                        : 'border-gray-200 group-hover:border-primary-300 group-hover:shadow-lg'
                                        }`}>
                                        <img
                                            src={cat.image}
                                            alt={cat.label}
                                            className={`w-full h-full object-cover transition-transform duration-300 ${
                                                cat.id === ShopCategory.ErkekKuafor
                                                    ? 'scale-[1.4]'
                                                    : cat.id === ShopCategory.GuzellikMerkezi
                                                    ? 'scale-[1.35]'
                                                    : 'scale-[1.15]'
                                            }`}
                                        />
                                    </div>
                                    <span className={`text-[11px] sm:text-sm font-semibold text-center leading-[1.15] sm:leading-tight transition-colors whitespace-pre-line sm:whitespace-normal ${selectedCategory === cat.id ? 'text-primary-700' : 'text-gray-700 group-hover:text-primary-600'
                                        }`}>
                                        {cat.label.replace(' ', '\n')}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Aktif Filtreler Özeti */}
            {(selectedProvince || selectedDistrict || selectedNeighborhood || selectedCategory || activeTags.length > 0 || activeSortTag || minRating || searchTerm) && (
                <div className="bg-white border-b border-gray-100">
                    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-3">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-semibold text-gray-500 flex items-center gap-1 mr-1">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                                </svg>
                                Filtreler:
                            </span>

                            {/* Location Filters */}
                            {selectedProvince && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200 shadow-sm">
                                    {selectedProvince}
                                    <button onClick={() => { setSelectedProvince(null); setSelectedDistrict(null); setSelectedNeighborhood(null); setDistricts([]); setNeighborhoods([]); setFilteredProvinces([]); }} className="text-red-500 hover:text-red-600 transition-colors"><XCircle className="w-3.5 h-3.5" /></button>
                                </span>
                            )}
                            {selectedDistrict && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200 shadow-sm">
                                    {selectedDistrict}
                                    <button onClick={() => { setSelectedDistrict(null); setSelectedNeighborhood(null); setNeighborhoods([]); }} className="text-red-500 hover:text-red-600 transition-colors"><XCircle className="w-3.5 h-3.5" /></button>
                                </span>
                            )}
                            {selectedNeighborhood && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200 shadow-sm">
                                    {selectedNeighborhood}
                                    <button onClick={() => setSelectedNeighborhood(null)} className="text-red-500 hover:text-red-600 transition-colors"><XCircle className="w-3.5 h-3.5" /></button>
                                </span>
                            )}
                            
                            {searchTerm && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-gray-100 text-gray-700 shadow-sm border border-gray-200">
                                    "{searchTerm}"
                                    <button onClick={() => { const p = new URLSearchParams(searchParams); p.delete('search'); setSearchParams(p); }} className="text-red-500 hover:text-red-600 transition-colors"><XCircle className="w-3.5 h-3.5" /></button>
                                </span>
                            )}
                            {selectedCategory && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-primary-50 text-primary-700 border border-primary-200 shadow-sm">
                                    {ShopCategoryLabels[selectedCategory]}
                                    <button onClick={() => setSelectedCategory(null)} className="text-red-500 hover:text-red-600 transition-colors"><XCircle className="w-3.5 h-3.5" /></button>
                                </span>
                            )}
                            {activeTags.map(tag => (
                                <span key={tag} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-primary-50 text-primary-700 border border-primary-200 shadow-sm">
                                    {tag === 'kadin' ? 'Kadın' : tag === 'erkek' ? 'Erkek' : 'Pet'}
                                    <button onClick={() => toggleTag(tag)} className="text-red-500 hover:text-red-600 transition-colors"><XCircle className="w-3.5 h-3.5" /></button>
                                </span>
                            ))}
                            {activeSortTag && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-primary-50 text-primary-700 border border-primary-200 shadow-sm">
                                    {activeSortTag === 'low-price' ? 'Düşük Fiyatlar' : 
                                     activeSortTag === 'high-price' ? 'Yüksek Fiyatlar' : 
                                     activeSortTag === 'rating' ? 'En Yüksek Puanlılar' : 
                                     activeSortTag === 'reviews' ? 'En Çok Yorum Alanlar' : 'En Yeniler'}
                                    <button onClick={() => toggleSortTag(activeSortTag)} className="text-red-500 hover:text-red-600 transition-colors"><XCircle className="w-3.5 h-3.5" /></button>
                                </span>
                            )}
                            {minRating === 4 && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-primary-50 text-primary-700 border border-primary-200 shadow-sm">
                                    4★ ve Üzeri
                                    <button onClick={() => setMinRating(null)} className="text-red-500 hover:text-red-600 transition-colors"><XCircle className="w-3.5 h-3.5" /></button>
                                </span>
                            )}
                            <button 
                                onClick={() => {
                                    setSelectedCategory(null); setActiveTags([]); setActiveSortTag(null); setMinRating(null);
                                    setSelectedProvince(null); setSelectedDistrict(null); setSelectedNeighborhood(null);
                                    setDistricts([]); setNeighborhoods([]); setFilteredProvinces([]);
                                    const p = new URLSearchParams(searchParams); p.delete('search'); setSearchParams(p);
                                }}
                                className="px-3 py-1 bg-red-100 text-red-600 hover:bg-red-200 rounded-full text-xs font-bold transition-colors ml-1"
                            >
                                Temizle
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Ana İçerik Alanı */}
            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
                {/* Ana İçerik Listesi */}
                <main className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-6">
                        {selectedProvince === null && (
                            <button
                                onClick={() => setIsLocationDropdownOpen(true)}
                                className="flex-1 sm:flex-none sm:w-auto flex items-center justify-center gap-2 p-3 sm:px-6 sm:py-3 rounded-2xl bg-gradient-to-r from-gray-900 to-gray-800 text-white border border-gray-800 shadow-lg active:scale-[0.98] transition-transform"
                            >
                                <MapPin className="w-5 h-5 text-gray-300" />
                                <span className="text-sm font-bold">Konum Seç</span>
                            </button>
                        )}
                        <button
                            onClick={() => setIsMapModalOpen(!isMapModalOpen)}
                            className={`flex-1 sm:flex-none sm:w-auto flex items-center justify-center gap-2 p-3 sm:px-6 sm:py-3 rounded-2xl font-bold transition-all shadow-sm border active:scale-[0.98] ${
                                isMapModalOpen
                                    ? 'bg-primary-50 text-primary-700 border-primary-200'
                                    : 'bg-white text-gray-800 border-gray-200'
                            }`}
                        >
                            <Map className={`w-5 h-5 ${isMapModalOpen ? 'text-primary-600' : 'text-gray-500'}`} />
                            <span className="text-sm font-bold">{isMapModalOpen ? 'Haritayı Gizle' : 'Haritada Gör'}</span>
                        </button>
                    </div>

                    {/* Inline Harita Alanı */}
                    {isMapModalOpen && (
                        <div ref={mapSectionRef} className="w-full h-[400px] sm:h-[450px] mb-8 rounded-[2rem] overflow-hidden shadow-sm border border-gray-200 relative shrink-0 z-0 fade-in-0 animate-in zoom-in-95 duration-300">
                            <MapContainer
                                center={userLocation ? [userLocation.lat, userLocation.lng] : [39.9, 32.8]}
                                zoom={userLocation ? 14 : 6}
                                style={{ height: '100%', width: '100%', zIndex: 0 }}
                                zoomControl={true}
                            >
                                <TileLayer
                                    attribution='&copy; OpenStreetMap'
                                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                                />
                                <MapFocuser center={mapFocusCenter} shopId={mapFocusShopId} />
                                <UserLocator userLocation={userLocation} />

                                {/* User Location Marker */}
                                {userLocation && (
                                    <Marker
                                        position={[userLocation.lat, userLocation.lng]}
                                        icon={createUserMarkerIcon(user?.profileImageUrl)}
                                    >
                                        <Popup closeButton={false}>
                                            <div className="font-bold text-primary-600 py-0.5 px-1">📍 Sizin Konumunuz</div>
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
                                            icon={createShopMarkerIcon(shop)}
                                        >
                                            <Popup className="shop-popup rounded-2xl border-0 overflow-visible" closeButton={false}>
                                                <div className="-mx-[20px] -my-[14px] min-w-[220px] font-sans flex flex-col overflow-hidden rounded-xl">
                                                    <div className="w-full h-28 bg-gray-100 relative shrink-0">
                                                        <img
                                                            src={shop.coverImagePath ? shop.coverImagePath : DEFAULT_SALON_COVER}
                                                            alt={shop.name}
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_SALON_COVER; }}
                                                        />
                                                        <div className="absolute top-2 right-2 bg-white/95 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-bold text-gray-900 shadow-sm flex items-center gap-1">
                                                            ★ {shop.averageRating?.toFixed(1) || 'Yeni'}
                                                        </div>
                                                    </div>
                                                    <div className="p-3 bg-white">
                                                        <div className="text-[10px] font-bold text-primary-600 mb-1 uppercase tracking-wider">{shop.categories?.length > 0 ? ShopCategoryLabels[shop.categories[0] as ShopCategory] : ''}</div>
                                                        <h3 className="font-bold text-gray-900 text-[15px] leading-tight mb-1 line-clamp-1">{shop.name}</h3>
                                                        <div className="flex items-center gap-1 text-gray-500 text-xs mb-3">
                                                            <MapPin className="w-3.5 h-3.5 shrink-0" />
                                                            <span className="truncate">{shop.district}, {shop.city}</span>
                                                        </div>
                                                        <a href={`/shop/${shop.id}`} className="block w-full py-2.5 bg-gray-900 text-white text-center rounded-xl font-bold text-[13px] hover:bg-black transition-colors mb-2">
                                                            Detayları Gör
                                                        </a>
                                                        <a
                                                            href={`https://www.google.com/maps?q=${shop.latitude},${shop.longitude}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-center justify-center gap-1.5 w-full py-2 text-blue-600 text-[12px] font-semibold hover:text-blue-700 transition-colors"
                                                        >
                                                            <Navigation className="w-3.5 h-3.5" />
                                                            Yol Tarifi Al
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

                    {!loading && !showFavoritesOnly && currentPage < totalPages && (
                        <div className="flex justify-center mt-6">
                            <button
                                onClick={handleLoadMoreShops}
                                disabled={loadingMore}
                                className="px-8 py-3 bg-white border-2 border-primary-500 text-primary-600 font-semibold rounded-xl hover:bg-primary-50 disabled:opacity-60 transition-all flex items-center gap-2"
                            >
                                {loadingMore ? (
                                    <>
                                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                        Yükleniyor…
                                    </>
                                ) : 'Daha Fazla Göster'}
                            </button>
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
