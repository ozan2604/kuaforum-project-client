import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { salonApplicationService } from '../../api/salon-application.service';
import { shopService } from '../../api/shop.service';
import { userService } from '../../api/user.service';
import { toast } from 'react-hot-toast';
import { Building2, Store, Users, Clock, Loader2, ArrowRight } from 'lucide-react';

interface DashboardStats {
    pendingApplications: number;
    totalShops: number;
    totalUsers: number;
}

export const AdminDashboard: React.FC = () => {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [apps, shops, users] = await Promise.all([
                    salonApplicationService.getPendingApplications().catch(() => [] as any[]),
                    shopService.getAllShops(1, 1, '').catch(() => ({ totalCount: 0 })),
                    userService.getAllUsers(1, 1, '').catch(() => ({ totalCount: 0 })),
                ]);
                setStats({
                    pendingApplications: Array.isArray(apps) ? apps.length : 0,
                    totalShops: shops?.totalCount ?? 0,
                    totalUsers: users?.totalCount ?? 0,
                });
            } catch {
                toast.error('İstatistikler yüklenemedi.');
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const cards = [
        {
            title: 'Bekleyen Başvurular',
            value: stats?.pendingApplications,
            icon: Clock,
            color: 'bg-amber-50 text-amber-600 border-amber-100',
            iconBg: 'bg-amber-100',
            link: '/admin/applications',
            linkLabel: 'Başvuruları İncele',
        },
        {
            title: 'Kayıtlı Salonlar',
            value: stats?.totalShops,
            icon: Store,
            color: 'bg-blue-50 text-blue-600 border-blue-100',
            iconBg: 'bg-blue-100',
            link: '/admin/shops',
            linkLabel: 'Salonları Görüntüle',
        },
        {
            title: 'Kayıtlı Kullanıcılar',
            value: stats?.totalUsers,
            icon: Users,
            color: 'bg-green-50 text-green-600 border-green-100',
            iconBg: 'bg-green-100',
            link: '/admin/users',
            linkLabel: 'Kullanıcıları Görüntüle',
        },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Yönetim Paneli</h1>
                <p className="text-gray-500 text-sm mt-1">Sisteme genel bakış ve hızlı erişim bağlantıları.</p>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {cards.map(({ title, value, icon: Icon, color, iconBg, link, linkLabel }) => (
                        <div key={title} className={`bg-white rounded-xl border p-6 flex flex-col gap-4 shadow-sm ${color}`}>
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-semibold">{title}</p>
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconBg}`}>
                                    <Icon className="w-5 h-5" />
                                </div>
                            </div>
                            <p className="text-4xl font-black text-gray-900">
                                {value ?? '—'}
                            </p>
                            <Link to={link} className="flex items-center gap-1 text-xs font-semibold hover:underline mt-auto">
                                {linkLabel} <ArrowRight className="w-3 h-3" />
                            </Link>
                        </div>
                    ))}
                </div>
            )}

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-4">
                    <Building2 className="w-5 h-5 text-primary-600" />
                    <h2 className="font-bold text-gray-800">Hızlı Erişim</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Link to="/admin/applications" className="flex items-center justify-between p-4 rounded-lg border border-gray-100 hover:border-primary-300 hover:bg-primary-50 transition-colors group">
                        <span className="text-sm font-medium text-gray-700 group-hover:text-primary-700">Salon Başvurularını Yönet</span>
                        <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-primary-600" />
                    </Link>
                    <Link to="/admin/shops" className="flex items-center justify-between p-4 rounded-lg border border-gray-100 hover:border-primary-300 hover:bg-primary-50 transition-colors group">
                        <span className="text-sm font-medium text-gray-700 group-hover:text-primary-700">Tüm Salonları Görüntüle</span>
                        <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-primary-600" />
                    </Link>
                    <Link to="/admin/users" className="flex items-center justify-between p-4 rounded-lg border border-gray-100 hover:border-primary-300 hover:bg-primary-50 transition-colors group">
                        <span className="text-sm font-medium text-gray-700 group-hover:text-primary-700">Kullanıcıları Yönet</span>
                        <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-primary-600" />
                    </Link>
                    <Link to="/admin/sms-test" className="flex items-center justify-between p-4 rounded-lg border border-gray-100 hover:border-primary-300 hover:bg-primary-50 transition-colors group">
                        <span className="text-sm font-medium text-gray-700 group-hover:text-primary-700">SMS Şablonlarını Test Et</span>
                        <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-primary-600" />
                    </Link>
                </div>
            </div>
        </div>
    );
};
