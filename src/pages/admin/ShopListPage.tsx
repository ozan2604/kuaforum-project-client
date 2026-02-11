import React, { useEffect, useState } from 'react';
import { shopService } from '../../api/shop.service';
import type { Shop } from '../../types/shop';
import { toast } from 'react-hot-toast';
import { MapPin, Phone, Mail, User } from 'lucide-react';

export const ShopListPage: React.FC = () => {
    const [shops, setShops] = useState<Shop[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchShops = async () => {
            try {
                const data = await shopService.getAllShops();
                setShops(data);
            } catch (error: any) {
                console.error('Error fetching shops:', error);
                const errorMessage = error.response?.data?.message || error.message || 'Failed to load shops';
                toast.error(errorMessage);
            } finally {
                setLoading(false);
            }
        };

        fetchShops();
    }, []);

    if (loading) {
        return <div className="p-4 text-center">Loading...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Registered Shops</h2>
                <div className="text-sm text-gray-500">
                    Total: <span className="font-semibold text-gray-900">{shops.length}</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {shops.map((shop) => (
                    <div key={shop.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200 overflow-hidden border border-gray-100">
                        <div className="p-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-2">{shop.name}</h3>
                            <p className="text-sm text-gray-500 mb-4 line-clamp-2">{shop.description}</p>

                            <div className="space-y-2 text-sm text-gray-600">
                                <div className="flex items-center">
                                    <User className="h-4 w-4 mr-2 text-primary-500" />
                                    <span>{shop.ownerName || 'Unknown Owner'}</span>
                                </div>
                                {shop.ownerEmail && (
                                    <div className="flex items-center">
                                        <Mail className="h-4 w-4 mr-2 text-primary-500" />
                                        <span>{shop.ownerEmail}</span>
                                    </div>
                                )}
                                <div className="flex items-center">
                                    <MapPin className="h-4 w-4 mr-2 text-primary-500" />
                                    <span>{shop.city} / {shop.district}</span>
                                </div>
                                <div className="flex items-center">
                                    <Phone className="h-4 w-4 mr-2 text-primary-500" />
                                    <span>{shop.phoneNumber}</span>
                                </div>
                            </div>
                        </div>
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${shop.isOpen ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}>
                                {shop.isOpen ? 'Open' : 'Closed'}
                            </span>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${shop.isActive ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                                }`}>
                                {shop.isActive ? 'Active' : 'Inactive'}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {shops.length === 0 && (
                <div className="flex flex-col items-center justify-center p-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
                    <StoreOff className="h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-lg text-gray-500">No shops found.</p>
                </div>
            )}
        </div>
    );
};

// Internal component for empty state icon
const StoreOff = ({ className }: { className?: string }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="M2 17h20" />
        <path d="M12 21h8a2 2 0 0 0 2-2v-7H2v7a2 2 0 0 0 2 2h4" />
        <path d="m2 10 2-4h16l2 4" />
        <path d="M10 21v-8" />
        <path d="M4 21v-8" />
        <path d="M14 21v-8" />
        <path d="M20 21v-8" />
        <path d="m2 2 20 20" />
    </svg>
);
