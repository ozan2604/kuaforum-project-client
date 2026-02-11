import React, { useEffect, useState } from 'react';
import { shopService } from '../api/shop.service';
import type { Shop } from '../types/shop';
import { MapPin, Star, Calendar } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button } from '../components/Button';
import { MapComponent } from '../components/MapComponent';

export const HomePage: React.FC = () => {
    const [shops, setShops] = useState<Shop[]>([]);
    const [filteredShops, setFilteredShops] = useState<Shop[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchParams] = useSearchParams();
    const searchTerm = searchParams.get('search') || '';
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

    useEffect(() => {
        const loadShops = async () => {
            try {
                const data = await shopService.getPublicShops();
                setShops(data);
                setFilteredShops(data);
            } catch (error) {
                console.error('Failed to load shops', error);
            } finally {
                setLoading(false);
            }
        };
        loadShops();
    }, []);

    useEffect(() => {
        if (!shops.length) return;

        const term = searchTerm.toLowerCase();
        const results = shops.filter(shop =>
            shop.name.toLowerCase().includes(term) ||
            shop.city.toLowerCase().includes(term) ||
            shop.district.toLowerCase().includes(term)
        );
        setFilteredShops(results);
    }, [searchTerm, shops]);

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

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Map Section */}
            <div className="bg-white border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                    <div className="text-center mb-8 max-w-3xl mx-auto">
                        <span className="text-primary-600 font-semibold tracking-wide uppercase text-sm mb-2 block">Size En Yakın Salonları Keşfedin</span>
                        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
                            Güzelliğinizi <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-purple-600">Keşfedin</span>
                        </h1>
                    </div>
                    <div className="relative rounded-2xl overflow-hidden shadow-2xl ring-1 ring-black/5">
                        <MapComponent shops={shops} userLocation={userLocation} height="450px" />
                    </div>
                </div>
            </div>

            {/* Shop List Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-8">Popüler Salonlar</h2>

                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredShops.map((shop) => (
                            <div key={shop.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                                <div className="h-48 bg-gray-200 relative">
                                    <img
                                        src={shop.coverImagePath ? `http://localhost:5000${shop.coverImagePath}` : `https://source.unsplash.com/random/800x600/?salon,${shop.id}`}
                                        alt={shop.name}
                                        className="w-full h-full object-cover"
                                        onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1560066984-12186d30b435?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'; }}
                                    />
                                    <div className="absolute top-4 right-4 bg-white px-2 py-1 rounded-md shadow-sm flex items-center">
                                        <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                                        <span className="text-xs font-bold text-gray-700">4.8</span>
                                    </div>
                                </div>
                                <div className="p-6">
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">{shop.name}</h3>
                                    <div className="flex items-center text-gray-500 text-sm mb-4">
                                        <MapPin className="h-4 w-4 mr-1" />
                                        {shop.district}, {shop.city}
                                    </div>
                                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                                        {shop.description || 'Profesyonel güzellik ve bakım hizmetleri.'}
                                    </p>
                                    <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                                        <span className="text-xs font-medium px-2 py-1 bg-green-100 text-green-800 rounded-full">
                                            Açık
                                        </span>
                                        <Link to={`/shop/${shop.id}`}>
                                            <Button size="sm" className="flex items-center">
                                                <Calendar className="h-4 w-4 mr-2" />
                                                Randevu Al
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {!loading && filteredShops.length === 0 && (
                    <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                        <p className="text-gray-500">Aradığınız kriterlere uygun salon bulunamadı.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
