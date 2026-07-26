import React, { useEffect, useState } from 'react';
import { adsService } from '../services/ads.service';
import type { AdApplication } from '../services/ads.service';
import toast from 'react-hot-toast';
import { ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

export const MyAdsPage: React.FC = () => {
    const [ads, setAds] = useState<AdApplication[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAds = async () => {
            try {
                const data = await adsService.getMyAds();
                setAds(data);
            } catch (error) {
                toast.error('Reklamlarınız yüklenirken bir hata oluştu.');
            } finally {
                setLoading(false);
            }
        };
        fetchAds();
    }, []);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'Pending':
                return <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">Onay Bekliyor</span>;
            case 'Approved':
                return <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Yayında</span>;
            case 'Rejected':
                return <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">Reddedildi</span>;
            default:
                return null;
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center h-64">Yükleniyor...</div>;
    }

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            <h1 className="text-3xl font-bold mb-6">Reklamlarım</h1>
            {ads.length === 0 ? (
                <div className="bg-white p-8 rounded-2xl text-center border border-gray-100">
                    <p className="text-gray-500 mb-4">Henüz bir reklam başvurunuz bulunmuyor.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {ads.map((ad) => (
                        <div key={ad.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col sm:flex-row gap-4">
                            <div className="w-full sm:w-32 h-32 shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                                {ad.mediaType === 'video' ? (
                                    <video src={ad.mediaUrl} className="w-full h-full object-cover" />
                                ) : (
                                    <img src={ad.mediaUrl} alt="Ad" className="w-full h-full object-cover" />
                                )}
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-start mb-2">
                                    <p className="text-gray-900 font-medium line-clamp-2">{ad.description}</p>
                                    <div className="shrink-0 ml-4">{getStatusBadge(ad.status)}</div>
                                </div>
                                <div className="text-sm text-gray-500 space-y-1">
                                    <p>Telefon: {ad.phoneNumber}</p>
                                    {ad.price && <p>Fiyat: {ad.price} TL</p>}
                                    {ad.externalLink && (
                                        <a href={ad.externalLink} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline inline-flex items-center gap-1">
                                            Bağlantı <ExternalLink className="w-3 h-3" />
                                        </a>
                                    )}
                                </div>
                                <div className="mt-4 text-xs text-gray-400">
                                    Başvuru: {format(new Date(ad.createdAt), 'dd MMM yyyy HH:mm', { locale: tr })}
                                    {ad.expiresAt && ` • Bitiş: ${format(new Date(ad.expiresAt), 'dd MMM yyyy', { locale: tr })}`}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
