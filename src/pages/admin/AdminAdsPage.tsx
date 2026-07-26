import React, { useEffect, useState } from 'react';
import { adsService } from '../../services/ads.service';
import type { AdApplication } from '../../services/ads.service';
import toast from 'react-hot-toast';
import { ExternalLink, Check, X } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

export const AdminAdsPage: React.FC = () => {
    const [ads, setAds] = useState<AdApplication[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchAds = async () => {
        try {
            const data = await adsService.getAllAdsAdmin();
            setAds(data);
        } catch (error) {
            toast.error('Reklam başvuruları yüklenirken hata oluştu.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAds();
    }, []);

    const handleUpdateStatus = async (id: string, status: 'Approved' | 'Rejected') => {
        if (!window.confirm(`Reklamı ${status === 'Approved' ? 'onaylamak' : 'reddetmek'} istediğinize emin misiniz?`)) return;
        
        try {
            await adsService.updateAdStatus(id, status);
            toast.success(`Reklam başarıyla ${status === 'Approved' ? 'onaylandı' : 'reddedildi'}.`);
            fetchAds();
        } catch (error) {
            toast.error('Durum güncellenirken bir hata oluştu.');
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'Pending':
                return <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">Bekliyor</span>;
            case 'Approved':
                return <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Onaylandı</span>;
            case 'Rejected':
                return <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">Reddedildi</span>;
            default:
                return null;
        }
    };

    if (loading) return <div className="p-8 text-center">Yükleniyor...</div>;

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Reklam Başvuruları Yönetimi</h1>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200 text-sm">
                                <th className="p-4 font-semibold text-gray-600">Medya</th>
                                <th className="p-4 font-semibold text-gray-600">Açıklama / İletişim</th>
                                <th className="p-4 font-semibold text-gray-600">Fiyat / Link</th>
                                <th className="p-4 font-semibold text-gray-600">Tarih</th>
                                <th className="p-4 font-semibold text-gray-600">Durum</th>
                                <th className="p-4 font-semibold text-gray-600">İşlem</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {ads.map((ad: AdApplication) => (
                                <tr key={ad.id} className="hover:bg-gray-50/50">
                                    <td className="p-4 align-top">
                                        <div className="w-24 h-24 bg-gray-100 rounded overflow-hidden">
                                            {ad.mediaType === 'video' ? (
                                                <video src={ad.mediaUrl} className="w-full h-full object-cover" controls />
                                            ) : (
                                                <img src={ad.mediaUrl} alt="Ad" className="w-full h-full object-cover" />
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4 align-top">
                                        <p className="text-sm text-gray-900 mb-2 line-clamp-3">{ad.description}</p>
                                        <p className="text-xs text-gray-500 font-medium">{ad.phoneNumber}</p>
                                    </td>
                                    <td className="p-4 align-top">
                                        {ad.price && <p className="text-sm font-semibold text-primary-600 mb-1">{ad.price} TL</p>}
                                        {ad.externalLink && (
                                            <a href={ad.externalLink} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                                                Linke Git <ExternalLink className="w-3 h-3" />
                                            </a>
                                        )}
                                    </td>
                                    <td className="p-4 align-top text-xs text-gray-500">
                                        {format(new Date(ad.createdAt), 'dd MMM yyyy HH:mm', { locale: tr })}
                                        {ad.expiresAt && (
                                            <div className="mt-2 text-red-500">
                                                Bitiş: {format(new Date(ad.expiresAt), 'dd MMM yyyy', { locale: tr })}
                                            </div>
                                        )}
                                    </td>
                                    <td className="p-4 align-top">
                                        {getStatusBadge(ad.status)}
                                    </td>
                                    <td className="p-4 align-top">
                                        {ad.status === 'Pending' && (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleUpdateStatus(ad.id, 'Approved')}
                                                    className="p-1.5 bg-green-50 text-green-600 hover:bg-green-100 rounded transition-colors"
                                                    title="Onayla"
                                                >
                                                    <Check className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleUpdateStatus(ad.id, 'Rejected')}
                                                    className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded transition-colors"
                                                    title="Reddet"
                                                >
                                                    <X className="w-5 h-5" />
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {ads.length === 0 && (
                        <div className="p-8 text-center text-gray-500">
                            Hiç reklam başvurusu bulunamadı.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
