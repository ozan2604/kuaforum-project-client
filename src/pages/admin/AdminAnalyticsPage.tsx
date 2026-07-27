import React, { useEffect, useState } from 'react';
import { analyticsService, SiteStatsDto } from '../../api/analytics.service';
import { Loader2, Globe, Monitor, Smartphone, Tablet, Apple, LayoutDashboard, Compass } from 'lucide-react';
import { toast } from 'react-hot-toast';

export const AdminAnalyticsPage: React.FC = () => {
    const [stats, setStats] = useState<SiteStatsDto | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await analyticsService.getStats();
                setStats(data);
            } catch (err) {
                toast.error('İstatistikler yüklenemedi.');
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
        );
    }

    if (!stats) return null;

    const getIconForDevice = (device: string) => {
        if (device === 'Mobile') return <Smartphone className="w-4 h-4 text-gray-500" />;
        if (device === 'Tablet') return <Tablet className="w-4 h-4 text-gray-500" />;
        return <Monitor className="w-4 h-4 text-gray-500" />;
    };

    const getIconForBrowser = (browser: string) => {
        if (browser === 'Safari') return <Apple className="w-4 h-4 text-gray-500" />;
        if (browser === 'Chrome' || browser === 'Firefox' || browser === 'Edge') return <Globe className="w-4 h-4 text-gray-500" />;
        return <Compass className="w-4 h-4 text-gray-500" />;
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Ziyaretçi Analitiği</h1>
                <p className="text-gray-500 text-sm mt-1">Sitenin trafik kaynakları, cihaz kullanımları ve ziyaretçi sayıları.</p>
            </div>

            {/* Toplam Ziyaretler */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl border p-6 flex flex-col gap-2">
                    <p className="text-sm font-semibold text-gray-600">Bugünkü Ziyaretçi</p>
                    <p className="text-4xl font-black text-gray-900">{stats.totalVisitsToday}</p>
                </div>
                <div className="bg-white rounded-xl border p-6 flex flex-col gap-2">
                    <p className="text-sm font-semibold text-gray-600">Bu Haftaki Ziyaretçi</p>
                    <p className="text-4xl font-black text-gray-900">{stats.totalVisitsThisWeek}</p>
                </div>
                <div className="bg-white rounded-xl border p-6 flex flex-col gap-2">
                    <p className="text-sm font-semibold text-gray-600">Bu Ayki Ziyaretçi</p>
                    <p className="text-4xl font-black text-gray-900">{stats.totalVisitsThisMonth}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Trafik Kaynakları */}
                <div className="bg-white rounded-xl border overflow-hidden">
                    <div className="bg-gray-50 px-5 py-4 border-b">
                        <h3 className="font-semibold text-gray-800">Trafik Kaynakları (Referrer)</h3>
                    </div>
                    <div className="p-5 flex flex-col gap-4">
                        {stats.sources.length === 0 && <p className="text-gray-400 text-sm italic">Veri bulunamadı.</p>}
                        {stats.sources.map(s => (
                            <div key={s.source} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Globe className="w-4 h-4 text-blue-500" />
                                    <span className="font-medium text-gray-700">{s.source}</span>
                                </div>
                                <span className="font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded-md text-sm">{s.count}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Cihaz Analizi */}
                <div className="bg-white rounded-xl border overflow-hidden">
                    <div className="bg-gray-50 px-5 py-4 border-b">
                        <h3 className="font-semibold text-gray-800">Cihaz Analizi</h3>
                    </div>
                    <div className="p-5 flex flex-col gap-4">
                        {stats.devices.length === 0 && <p className="text-gray-400 text-sm italic">Veri bulunamadı.</p>}
                        {stats.devices.map(d => (
                            <div key={d.device} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    {getIconForDevice(d.device)}
                                    <span className="font-medium text-gray-700">{d.device}</span>
                                </div>
                                <span className="font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded-md text-sm">{d.count}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Tarayıcı Analizi */}
                <div className="bg-white rounded-xl border overflow-hidden">
                    <div className="bg-gray-50 px-5 py-4 border-b">
                        <h3 className="font-semibold text-gray-800">Tarayıcı Analizi</h3>
                    </div>
                    <div className="p-5 flex flex-col gap-4">
                        {stats.browsers.length === 0 && <p className="text-gray-400 text-sm italic">Veri bulunamadı.</p>}
                        {stats.browsers.map(b => (
                            <div key={b.browser} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    {getIconForBrowser(b.browser)}
                                    <span className="font-medium text-gray-700">{b.browser}</span>
                                </div>
                                <span className="font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded-md text-sm">{b.count}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
