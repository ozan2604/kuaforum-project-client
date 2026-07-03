import React, { useEffect, useState } from 'react';
import { adminService, AdminAppointmentStatsDto } from '../../api/admin.service';
import { toast } from 'react-hot-toast';
import { Loader2, Calendar, Store, ArrowRight, UserCog, User } from 'lucide-react';
import { Link } from 'react-router-dom';

export const AdminAppointmentsPage: React.FC = () => {
    const [stats, setStats] = useState<AdminAppointmentStatsDto[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await adminService.getAppointmentStats();
                setStats(data);
            } catch (error) {
                toast.error('İstatistikler yüklenirken bir hata oluştu.');
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    const getTotal = (manual: number, normal: number) => manual + normal;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Calendar className="w-6 h-6 text-primary-600" />
                        Randevular İstatistiği
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">
                        Sistemdeki tüm salonların manuel ve normal randevu oluşturma istatistikleri.
                    </p>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
                </div>
            ) : stats.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-100 p-12 flex flex-col items-center justify-center text-center">
                    <Calendar className="w-12 h-12 text-gray-300 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Kayıt Bulunamadı</h3>
                    <p className="text-gray-500">Henüz sistemde randevu istatistiği oluşturulmamış.</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-500 whitespace-nowrap">
                            <thead className="bg-gray-50 text-xs uppercase text-gray-700 border-b border-gray-200">
                                <tr>
                                    <th scope="col" className="px-6 py-4 font-semibold w-64">Salon Adı</th>
                                    <th scope="col" className="px-6 py-4 font-semibold text-center border-l border-gray-200">
                                        Bugün<br/><span className="text-[10px] text-gray-400 font-normal">Manuel / Normal</span>
                                    </th>
                                    <th scope="col" className="px-6 py-4 font-semibold text-center border-l border-gray-200">
                                        Bu Hafta<br/><span className="text-[10px] text-gray-400 font-normal">Manuel / Normal</span>
                                    </th>
                                    <th scope="col" className="px-6 py-4 font-semibold text-center border-l border-gray-200">
                                        Bu Ay<br/><span className="text-[10px] text-gray-400 font-normal">Manuel / Normal</span>
                                    </th>
                                    <th scope="col" className="px-6 py-4 font-semibold text-center border-l border-gray-200">
                                        Bu Yıl<br/><span className="text-[10px] text-gray-400 font-normal">Manuel / Normal</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {stats.map((item) => (
                                    <tr key={item.shopId} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
                                                    <Store className="w-4 h-4 text-primary-600" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-gray-900 truncate max-w-[200px]" title={item.shopName}>
                                                        {item.shopName}
                                                    </span>
                                                    <Link to={`/admin/shops`} className="text-[11px] text-primary-600 hover:underline flex items-center gap-1 mt-0.5">
                                                        Detaya Git <ArrowRight className="w-3 h-3" />
                                                    </Link>
                                                </div>
                                            </div>
                                        </td>
                                        
                                        {/* Bugün */}
                                        <td className="px-6 py-4 text-center border-l border-gray-100">
                                            <div className="flex flex-col items-center justify-center">
                                                <span className="text-lg font-bold text-gray-900 mb-1">{getTotal(item.todayManualCount, item.todayNormalCount)}</span>
                                                <div className="flex items-center gap-2 text-xs">
                                                    <span className="flex items-center gap-1 text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded" title="Manuel">
                                                        <UserCog className="w-3 h-3" /> {item.todayManualCount}
                                                    </span>
                                                    <span className="flex items-center gap-1 text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded" title="Normal">
                                                        <User className="w-3 h-3" /> {item.todayNormalCount}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Bu Hafta */}
                                        <td className="px-6 py-4 text-center border-l border-gray-100">
                                            <div className="flex flex-col items-center justify-center">
                                                <span className="text-lg font-bold text-gray-900 mb-1">{getTotal(item.weekManualCount, item.weekNormalCount)}</span>
                                                <div className="flex items-center gap-2 text-xs">
                                                    <span className="flex items-center gap-1 text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded" title="Manuel">
                                                        <UserCog className="w-3 h-3" /> {item.weekManualCount}
                                                    </span>
                                                    <span className="flex items-center gap-1 text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded" title="Normal">
                                                        <User className="w-3 h-3" /> {item.weekNormalCount}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Bu Ay */}
                                        <td className="px-6 py-4 text-center border-l border-gray-100">
                                            <div className="flex flex-col items-center justify-center">
                                                <span className="text-lg font-bold text-gray-900 mb-1">{getTotal(item.monthManualCount, item.monthNormalCount)}</span>
                                                <div className="flex items-center gap-2 text-xs">
                                                    <span className="flex items-center gap-1 text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded" title="Manuel">
                                                        <UserCog className="w-3 h-3" /> {item.monthManualCount}
                                                    </span>
                                                    <span className="flex items-center gap-1 text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded" title="Normal">
                                                        <User className="w-3 h-3" /> {item.monthNormalCount}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Bu Yıl */}
                                        <td className="px-6 py-4 text-center border-l border-gray-100">
                                            <div className="flex flex-col items-center justify-center">
                                                <span className="text-lg font-bold text-gray-900 mb-1">{getTotal(item.yearManualCount, item.yearNormalCount)}</span>
                                                <div className="flex items-center gap-2 text-xs">
                                                    <span className="flex items-center gap-1 text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded" title="Manuel">
                                                        <UserCog className="w-3 h-3" /> {item.yearManualCount}
                                                    </span>
                                                    <span className="flex items-center gap-1 text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded" title="Normal">
                                                        <User className="w-3 h-3" /> {item.yearNormalCount}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    
                    {/* Lejant (Bilgilendirme) */}
                    <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-6 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                            <span className="flex items-center gap-1 text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded">
                                <UserCog className="w-4 h-4" />
                            </span>
                            <span>Manuel Randevu (Walk-in / Telefon)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="flex items-center gap-1 text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                                <User className="w-4 h-4" />
                            </span>
                            <span>Normal Randevu (Uygulama İçi)</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
