import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { shopService } from '../../api/shop.service';
import type { Shop } from '../../types/shop';
import { ShopCategoryLabels, TargetGenderLabels } from '../../types/shop';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { MapPin, Phone, Mail, User, Trash2, Search, Store, ChevronLeft, ChevronRight, Tags, Users, FileX, Calendar } from 'lucide-react';

export const ShopListPage: React.FC = () => {
    const [shops, setShops] = useState<Shop[]>([]);
    const [loading, setLoading] = useState(true);
    const [shopToDelete, setShopToDelete] = useState<{ id: string, name: string } | null>(null);
    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const pageSize = 12;

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 400); // 400ms debounce
        return () => clearTimeout(handler);
    }, [searchTerm]);

    useEffect(() => {
        setPage(1);
    }, [debouncedSearchTerm]);

    const fetchShops = async () => {
        setLoading(true);
        try {
            const data = await shopService.getAllShops(page, pageSize, debouncedSearchTerm);
            setShops(data.shops);
            setTotalCount(data.totalCount);
        } catch (error: any) {
            console.error('Error fetching shops:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Failed to load shops';
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchShops();
    }, [page, debouncedSearchTerm]);

    const executeDelete = async (id: string) => {
        try {
            await shopService.deleteShopByAdmin(id);
            setShops(prevShops => prevShops.filter(shop => shop.id !== id));
            setTotalCount(prev => prev - 1);
            toast.success('Shop deleted successfully');
            if (shops.length === 1 && page > 1) {
                setPage(page - 1);
            } else {
                fetchShops();
            }
        } catch (error: any) {
            console.error('Error deleting shop:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Failed to delete shop';
            toast.error(errorMessage);
        }
    };

    const totalPages = Math.ceil(totalCount / pageSize);

    if (loading && shops.length === 0) {
        return <div className="p-4 text-center">Loading...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Registered Shops</h2>
                    <div className="text-sm text-gray-500">
                        Total: <span className="font-semibold text-gray-900">{totalCount}</span>
                    </div>
                </div>
                
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                    <div className="relative w-full sm:w-80">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition duration-150 ease-in-out"
                            placeholder="Dükkan, şehir veya sahip ara..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Link
                        to="/admin/applications?tab=rejected"
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap"
                    >
                        <FileX className="w-4 h-4" />
                        Reddedilen Başvurular
                    </Link>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Shop
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Location & Contact
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Owner
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status & Date
                                </th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {shops.map((shop) => (
                                <tr key={shop.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-bold text-gray-900">
                                            {shop.name}
                                        </div>
                                        <div className="text-xs text-gray-500 flex items-center gap-2 mt-1">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                                                <Tags className="w-3 h-3 mr-1" />
                                                {ShopCategoryLabels[shop.category as keyof typeof ShopCategoryLabels] || 'Diğer'}
                                            </span>
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                                <Users className="w-3 h-3 mr-1" />
                                                {TargetGenderLabels[shop.genderPreference as keyof typeof TargetGenderLabels] || 'Unisex'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1">
                                            <div className="text-sm text-gray-900 flex items-center">
                                                <MapPin className="w-4 h-4 mr-1 text-gray-400" />
                                                {shop.district ? `${shop.district}, ` : ''}{shop.city || 'Belirtilmedi'}
                                            </div>
                                            <div className="text-sm text-gray-500 flex items-center">
                                                <Phone className="w-4 h-4 mr-1 text-gray-400" />
                                                {shop.phoneNumber || 'Belirtilmedi'}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900 flex items-center">
                                            <User className="w-4 h-4 mr-1 text-gray-400" />
                                            {shop.ownerName || 'Bilinmiyor'}
                                        </div>
                                        <div className="text-sm text-gray-500 flex items-center mt-1">
                                            <Mail className="w-4 h-4 mr-1 text-gray-400" />
                                            {shop.ownerEmail || 'Bilinmiyor'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex flex-col gap-2 items-start">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${shop.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                {shop.isActive ? 'Active' : 'Closed'}
                                            </span>
                                            {shop.createdAt && (
                                                <div className="flex items-center text-xs text-gray-500">
                                                    <Calendar className="w-3.5 h-3.5 mr-1" />
                                                    {new Date(shop.createdAt).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            onClick={() => setShopToDelete({ id: shop.id, name: shop.name })}
                                            className="text-red-600 hover:text-red-900 p-2 rounded-full hover:bg-red-50 transition-colors focus:outline-none"
                                            title="Delete Shop"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {shops.length === 0 && !loading && (
                    <div className="flex flex-col items-center justify-center p-12 bg-white border-t border-gray-200">
                        <Store className="h-12 w-12 text-gray-400 mb-4" />
                        <p className="text-lg text-gray-500">No shops found.</p>
                    </div>
                )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center space-x-2 mt-8">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="p-2 rounded-md border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="text-sm text-gray-700 font-medium px-4">
                        Page {page} of {totalPages}
                    </span>
                    <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="p-2 rounded-md border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {shopToDelete && typeof document !== 'undefined' && createPortal(
                <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/50 transition-opacity">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 transform transition-all scale-100 opacity-100">
                        <h3 className="text-xl font-bold text-gray-900 mb-3">
                            Dükkanı Sil
                        </h3>
                        <p className="text-gray-600 mb-6">
                            <strong>"{shopToDelete.name}"</strong> isimli dükkanı silmek istediğinize emin misiniz? Bu işlem geri alınamaz ve dükkanla ilişkili tüm veriler (hizmetler, çalışanlar, randevular) kalıcı olarak silinecektir.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShopToDelete(null)}
                                className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                            >
                                İptal
                            </button>
                            <button
                                onClick={() => {
                                    executeDelete(shopToDelete.id);
                                    setShopToDelete(null);
                                }}
                                className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                            >
                                Evet, Sil
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};
