import React, { useEffect, useState } from 'react';
import { shopService } from '../api/shop.service';
import type { Shop } from '../types/shop';
import { Button } from '../components/Button';
import { MapPin, Phone, Star, Store, Edit } from 'lucide-react';
import { Link } from 'react-router-dom';

export const MyShopPage: React.FC = () => {
    const [shop, setShop] = useState<Shop | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        loadShop();
    }, []);

    const loadShop = async () => {
        try {
            const data = await shopService.getMyShop();
            setShop(data);
        } catch (err: any) {
            if (err.response && err.response.status === 404) {
                // Shop not found
            } else {
                setError('Dükkan bilgileri yüklenirken bir hata oluştu.');
            }
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (!shop) {
        return (
            <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="mx-auto h-24 w-24 bg-primary-50 rounded-full flex items-center justify-center mb-6">
                    <Store className="h-12 w-12 text-primary-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Henüz bir salonunuz yok</h2>
                <p className="text-gray-500 mb-8 max-w-md mx-auto">
                    Müşterilerinize ulaşmak ve randevularınızı yönetmek için salonunuzu oluşturun.
                </p>
                <Link to="/create-shop">
                    <Button size="lg">Salon Oluştur</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="h-32 bg-gradient-to-r from-primary-600 to-primary-800"></div>
                <div className="px-8 pb-8">
                    <div className="relative flex justify-between items-end -mt-12 mb-6">
                        <div className="bg-white p-1 rounded-2xl shadow-md">
                            <div className="h-24 w-24 bg-primary-100 rounded-xl flex items-center justify-center">
                                <Store className="h-12 w-12 text-primary-600" />
                            </div>
                        </div>
                        <Button variant="outline" className="gap-2">
                            <Edit className="h-4 w-4" />
                            Düzenle
                        </Button>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
                            {error}
                        </div>
                    )}

                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">{shop.name}</h1>
                        <p className="mt-2 text-gray-600 max-w-3xl">{shop.description}</p>
                    </div>

                    <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t border-gray-100">
                        <div className="flex items-center gap-3 text-gray-600">
                            <MapPin className="h-5 w-5 text-gray-400" />
                            <span>{shop.address}, {shop.district} / {shop.city}</span>
                        </div>
                        <div className="flex items-center gap-3 text-gray-600">
                            <Phone className="h-5 w-5 text-gray-400" />
                            <span>{shop.phoneNumber}</span>
                        </div>
                        <div className="flex items-center gap-3 text-gray-600">
                            <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                            <span className="font-medium text-gray-900">{shop.rating} / 5.0</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
