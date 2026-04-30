import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { shopService } from '../../api/shop.service';
import { reviewService } from '../../api/review.service';
import type { Review } from '../../api/review.service';
import { toast } from 'react-hot-toast';
import { 
    Calendar, Users, Scissors, CheckCircle, 
    AlertCircle, Clock, PlusCircle, Store, ChevronRight, Activity, XOctagon,
    ChevronDown, ChevronUp, DollarSign, Bell, Star, MessageSquare, Filter
} from 'lucide-react';

interface Stats {
    shopId: string;
    notifications: string[];
    appointments: {
        today: { total: number; completed: number; cancelled: number; rejected: number; revenue: number };
        thisWeek: { total: number; completed: number; cancelled: number; rejected: number; revenue: number };
        thisMonth: { total: number; completed: number; cancelled: number; rejected: number; revenue: number };
        thisYear: { total: number; completed: number; cancelled: number; rejected: number; revenue: number };
    };
    services: { total: number; active: number; passive: number };
    employees: { total: number; active: number; passive: number };
}

export const SalonDashboard: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState<Stats | null>(null);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState<'today' | 'thisWeek' | 'thisMonth' | 'thisYear'>('today');

    // Reviews State
    const [reviewFilter, setReviewFilter] = useState<number | null>(null);
    const [reviewPage, setReviewPage] = useState(1);
    const reviewsPerPage = 5;

    // Accordion state
    const [openCards, setOpenCards] = useState({
        appointments: false,
        revenue: false,
        services: false,
        employees: false,
        reviews: false,
        quickActions: false
    });

    const toggleCard = (card: keyof typeof openCards) => {
        setOpenCards(prev => ({ ...prev, [card]: !prev[card] }));
    };

    useEffect(() => {
        const loadDashboard = async () => {
            try {
                const [data, shopReviews] = await Promise.all([
                    shopService.getDashboardStats(),
                    reviewService.getMyShopReviews()
                ]);
                setStats(data);
                setReviews(shopReviews);
            } catch (error) {
                console.error('Failed to load dashboard', error);
                toast.error('İstatistikler yüklenemedi.');
            } finally {
                setLoading(false);
            }
        };

        loadDashboard();
    }, []);

    // Date formatting helpers
    const now = new Date();
    const formatDate = (d: Date) => d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' });
    
    const dayOfWeek = now.getDay() || 7;
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - dayOfWeek + 1);
    const endOfWeek = new Date(now);
    endOfWeek.setDate(now.getDate() - dayOfWeek + 7);
    
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const dateLabels = {
        today: formatDate(now),
        thisWeek: `${formatDate(startOfWeek)} - ${formatDate(endOfWeek)}`,
        thisMonth: `${formatDate(startOfMonth)} - ${formatDate(endOfMonth)}`,
        thisYear: now.getFullYear().toString()
    };

    const timeRangeLabels = {
        today: 'Bugün',
        thisWeek: 'Bu Hafta',
        thisMonth: 'Bu Ay',
        thisYear: 'Bu Yıl'
    };

    // Derived Review Stats
    const filteredReviews = reviews.filter(r => reviewFilter ? r.rating === reviewFilter : true);
    const totalReviewPages = Math.ceil(filteredReviews.length / reviewsPerPage);
    const currentReviews = filteredReviews.slice((reviewPage - 1) * reviewsPerPage, reviewPage * reviewsPerPage);

    const employeeReviewStats = reviews.reduce((acc, review) => {
        const empName = review.employeeName || 'Bilinmiyor';
        if (!acc[empName]) acc[empName] = { count: 0, totalRating: 0 };
        acc[empName].count += 1;
        acc[empName].totalRating += review.rating;
        return acc;
    }, {} as Record<string, { count: number; totalRating: number }>);

    const renderAppointmentStats = () => {
        if (!stats) return null;
        const currentStats = stats.appointments[timeRange];

        return (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex flex-col items-center justify-center text-center">
                    <div className="bg-blue-100 p-2 rounded-full mb-3">
                        <Clock className="w-5 h-5 text-blue-600" />
                    </div>
                    <span className="text-3xl font-bold text-blue-900">{currentStats.total}</span>
                    <span className="text-sm font-medium text-blue-700 mt-1">Toplam Randevu</span>
                </div>
                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 flex flex-col items-center justify-center text-center">
                    <div className="bg-emerald-100 p-2 rounded-full mb-3">
                        <CheckCircle className="w-5 h-5 text-emerald-600" />
                    </div>
                    <span className="text-3xl font-bold text-emerald-900">{currentStats.completed}</span>
                    <span className="text-sm font-medium text-emerald-700 mt-1">Tamamlanan</span>
                </div>
                <div className="bg-rose-50 p-4 rounded-xl border border-rose-100 flex flex-col items-center justify-center text-center">
                    <div className="bg-rose-100 p-2 rounded-full mb-3">
                        <XOctagon className="w-5 h-5 text-rose-600" />
                    </div>
                    <span className="text-3xl font-bold text-rose-900">{currentStats.cancelled}</span>
                    <span className="text-sm font-medium text-rose-700 mt-1">İptal Edilen</span>
                </div>
                <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 flex flex-col items-center justify-center text-center">
                    <div className="bg-orange-100 p-2 rounded-full mb-3">
                        <AlertCircle className="w-5 h-5 text-orange-600" />
                    </div>
                    <span className="text-3xl font-bold text-orange-900">{currentStats.rejected}</span>
                    <span className="text-sm font-medium text-orange-700 mt-1">Reddedilen</span>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Tekrar Hoş Geldiniz, {user?.firstName || 'Salon Sahibi'}!</h1>
                    <p className="text-gray-500 mt-1">İşte salonunuzun durumu ve özet istatistikleri.</p>
                </div>
            </div>

            {/* Notifications Alert */}
            {!loading && (
                stats?.notifications && stats.notifications.length > 0 ? (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 shadow-sm">
                        <div className="p-2 bg-amber-100 text-amber-600 rounded-lg shrink-0">
                            <Bell className="w-5 h-5 animate-pulse" />
                        </div>
                        <div>
                            <h3 className="font-bold text-amber-800">Bildirimleriniz Var</h3>
                            <ul className="mt-1 space-y-1">
                                {stats.notifications.map((note, idx) => (
                                    <li key={idx} className="text-sm text-amber-700 flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                                        {note}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                ) : (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3 shadow-sm">
                        <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg shrink-0">
                            <CheckCircle className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-emerald-800">Her Şey Yolunda</h3>
                            <p className="text-sm text-emerald-700 mt-0.5">Şu an için bekleyen bir bildiriminiz bulunmuyor. Dükkanınız harika çalışıyor!</p>
                        </div>
                    </div>
                )
            )}

            {loading ? (
                <div className="grid grid-cols-1 gap-4">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-24 bg-gray-100 animate-pulse rounded-2xl"></div>
                    ))}
                </div>
            ) : (
                <div className="space-y-4">
                    {/* Appointments Card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-200">
                        <div 
                            onClick={() => toggleCard('appointments')}
                            className="w-full p-5 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center hover:bg-gray-50 cursor-pointer transition-colors relative"
                        >
                            <div className="flex items-center gap-3 pr-10">
                                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                                    <Calendar className="w-6 h-6" />
                                </div>
                                <h2 className="text-lg font-bold text-gray-900">Randevu Özeti</h2>
                            </div>
                            
                            {openCards.appointments && (
                                <div 
                                    className="flex bg-gray-50 p-1 rounded-lg border border-gray-100 overflow-x-auto w-full sm:w-auto mt-4 sm:mt-0 sm:mr-10"
                                    onClick={e => e.stopPropagation()} 
                                >
                                    {(Object.keys(timeRangeLabels) as Array<keyof typeof timeRangeLabels>).map((range) => (
                                        <button
                                            key={range}
                                            onClick={() => setTimeRange(range as any)}
                                            className={`flex-1 sm:flex-none px-4 py-1.5 text-sm font-medium rounded-md transition-all whitespace-nowrap ${
                                                timeRange === range
                                                    ? 'bg-white text-indigo-600 shadow-sm border border-gray-200'
                                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                                            }`}
                                        >
                                            {timeRangeLabels[range]}
                                        </button>
                                    ))}
                                </div>
                            )}
                            <div className="absolute right-5 sm:right-6 top-6 flex items-center justify-center p-1 bg-gray-50 rounded-full text-gray-400">
                                {openCards.appointments ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                            </div>
                        </div>
                        
                        {openCards.appointments && (
                            <div className="p-5 sm:p-6 pt-0 border-t border-gray-50 animate-in fade-in slide-in-from-top-4 duration-300">
                                {renderAppointmentStats()}
                            </div>
                        )}
                    </div>

                    {/* Revenue Card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-200">
                        <div 
                            onClick={() => toggleCard('revenue')}
                            className="w-full p-5 sm:p-6 flex justify-between items-center hover:bg-gray-50 cursor-pointer transition-colors relative"
                        >
                            <div className="flex items-center gap-3 pr-10">
                                <div className="p-2.5 bg-green-50 text-green-600 rounded-xl">
                                    <DollarSign className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900">Gelir / Ciro Takibi</h2>
                                </div>
                            </div>
                            <div className="absolute right-5 sm:right-6 flex items-center justify-center p-1 bg-gray-50 rounded-full text-gray-400">
                                {openCards.revenue ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                            </div>
                        </div>

                        {openCards.revenue && (
                            <div className="p-5 sm:p-6 pt-0 border-t border-gray-50 animate-in fade-in slide-in-from-top-4 duration-300">
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                                    <div className="p-5 bg-gradient-to-br from-green-500 to-green-600 rounded-xl text-white shadow-sm hover:shadow-md transition-shadow">
                                        <h3 className="text-green-100 text-sm font-medium">Bugün</h3>
                                        <p className="text-xs text-green-200 opacity-90 mt-0.5">{dateLabels.today}</p>
                                        <p className="text-3xl font-bold mt-2">₺{stats?.appointments.today.revenue.toLocaleString('tr-TR')}</p>
                                    </div>
                                    <div className="p-5 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl text-white shadow-sm hover:shadow-md transition-shadow">
                                        <h3 className="text-emerald-100 text-sm font-medium">Bu Hafta</h3>
                                        <p className="text-xs text-emerald-200 opacity-90 mt-0.5">{dateLabels.thisWeek}</p>
                                        <p className="text-3xl font-bold mt-2">₺{stats?.appointments.thisWeek.revenue.toLocaleString('tr-TR')}</p>
                                    </div>
                                    <div className="p-5 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl text-white shadow-sm hover:shadow-md transition-shadow">
                                        <h3 className="text-teal-100 text-sm font-medium">Bu Ay</h3>
                                        <p className="text-xs text-teal-200 opacity-90 mt-0.5">{dateLabels.thisMonth}</p>
                                        <p className="text-3xl font-bold mt-2">₺{stats?.appointments.thisMonth.revenue.toLocaleString('tr-TR')}</p>
                                    </div>
                                    <div className="p-5 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl text-white shadow-sm hover:shadow-md transition-shadow">
                                        <h3 className="text-cyan-100 text-sm font-medium">Bu Yıl</h3>
                                        <p className="text-xs text-cyan-200 opacity-90 mt-0.5">{dateLabels.thisYear}</p>
                                        <p className="text-3xl font-bold mt-2">₺{stats?.appointments.thisYear.revenue.toLocaleString('tr-TR')}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Services Card */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-200">
                            <div 
                                onClick={() => toggleCard('services')}
                                className="w-full p-5 sm:p-6 flex justify-between items-center hover:bg-gray-50 cursor-pointer transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-fuchsia-50 text-fuchsia-600 rounded-xl">
                                        <Scissors className="w-6 h-6" />
                                    </div>
                                    <h2 className="text-lg font-bold text-gray-900">Hizmetler</h2>
                                </div>
                                <div className="flex items-center justify-center p-1 bg-gray-50 rounded-full text-gray-400">
                                    {openCards.services ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                </div>
                            </div>

                            {openCards.services && (
                                <div className="p-5 sm:p-6 pt-0 border-t border-gray-50 animate-in fade-in slide-in-from-top-4 duration-300">
                                    <div className="grid grid-cols-3 gap-4 mt-6">
                                        <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-xl border border-gray-100">
                                            <span className="text-3xl font-bold text-gray-900">{stats?.services.total}</span>
                                            <span className="text-sm font-medium text-gray-500 mt-1">Toplam</span>
                                        </div>
                                        <div className="flex flex-col items-center justify-center p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                                            <span className="text-3xl font-bold text-emerald-700">{stats?.services.active}</span>
                                            <span className="text-sm font-medium text-emerald-600 mt-1">Aktif</span>
                                        </div>
                                        <div className="flex flex-col items-center justify-center p-4 bg-gray-100 rounded-xl border border-gray-200">
                                            <span className="text-3xl font-bold text-gray-600">{stats?.services.passive}</span>
                                            <span className="text-sm font-medium text-gray-500 mt-1">Pasif</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Employees Card */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-200">
                            <div 
                                onClick={() => toggleCard('employees')}
                                className="w-full p-5 sm:p-6 flex justify-between items-center hover:bg-gray-50 cursor-pointer transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-cyan-50 text-cyan-600 rounded-xl">
                                        <Users className="w-6 h-6" />
                                    </div>
                                    <h2 className="text-lg font-bold text-gray-900">Çalışanlar</h2>
                                </div>
                                <div className="flex items-center justify-center p-1 bg-gray-50 rounded-full text-gray-400">
                                    {openCards.employees ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                </div>
                            </div>

                            {openCards.employees && (
                                <div className="p-5 sm:p-6 pt-0 border-t border-gray-50 animate-in fade-in slide-in-from-top-4 duration-300">
                                    <div className="grid grid-cols-3 gap-4 mt-6">
                                        <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-xl border border-gray-100">
                                            <span className="text-3xl font-bold text-gray-900">{stats?.employees.total}</span>
                                            <span className="text-sm font-medium text-gray-500 mt-1">Toplam</span>
                                        </div>
                                        <div className="flex flex-col items-center justify-center p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                                            <span className="text-3xl font-bold text-emerald-700">{stats?.employees.active}</span>
                                            <span className="text-sm font-medium text-emerald-600 mt-1">Aktif</span>
                                        </div>
                                        <div className="flex flex-col items-center justify-center p-4 bg-gray-100 rounded-xl border border-gray-200">
                                            <span className="text-3xl font-bold text-gray-600">{stats?.employees.passive}</span>
                                            <span className="text-sm font-medium text-gray-500 mt-1">Pasif</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Reviews Card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-200">
                        <div 
                            onClick={() => toggleCard('reviews')}
                            className="w-full p-5 sm:p-6 flex justify-between items-center hover:bg-gray-50 cursor-pointer transition-colors relative"
                        >
                            <div className="flex items-center gap-3 pr-10">
                                <div className="p-2.5 bg-yellow-50 text-yellow-600 rounded-xl">
                                    <MessageSquare className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900 text-left">Müşteri Yorumları</h2>
                                    <p className="text-xs text-gray-500 text-left mt-0.5">{reviews.length} Toplam Değerlendirme</p>
                                </div>
                            </div>
                            <div className="absolute right-5 sm:right-6 flex items-center justify-center p-1 bg-gray-50 rounded-full text-gray-400">
                                {openCards.reviews ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                            </div>
                        </div>

                        {openCards.reviews && (
                            <div className="p-5 sm:p-6 pt-0 border-t border-gray-50 animate-in fade-in slide-in-from-top-4 duration-300">
                                {/* Employee Review Stats */}
                                {Object.keys(employeeReviewStats).length > 0 && (
                                    <div className="mb-6 mt-6">
                                        <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider">Çalışan Puan Ortalamaları</h3>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                                            {Object.entries(employeeReviewStats).map(([empName, empData]) => {
                                                const avg = (empData.totalRating / empData.count).toFixed(1);
                                                return (
                                                    <div key={empName} className="p-3 bg-gray-50 border border-gray-100 rounded-lg flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-yellow-100 text-yellow-700 flex items-center justify-center font-bold text-sm shrink-0">
                                                            {avg}
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-gray-900 text-sm line-clamp-1">{empName}</p>
                                                            <p className="text-xs text-gray-500">{empData.count} yorum</p>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Filter & List */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 mt-6 gap-3">
                                    <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Son Yorumlar</h3>
                                    <div className="flex bg-gray-50 p-1 rounded-lg border border-gray-100 overflow-x-auto">
                                        <button onClick={() => { setReviewFilter(null); setReviewPage(1); }} className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${reviewFilter === null ? 'bg-white shadow-sm text-yellow-600' : 'text-gray-500 hover:bg-gray-100'}`}>Tümü</button>
                                        {[5, 4, 3, 2, 1].map(star => (
                                            <button key={star} onClick={() => { setReviewFilter(star); setReviewPage(1); }} className={`px-3 py-1 text-sm font-medium rounded-md transition-colors flex items-center gap-1 ${reviewFilter === star ? 'bg-white shadow-sm text-yellow-600' : 'text-gray-500 hover:bg-gray-100'}`}>
                                                {star} <Star className="w-3 h-3 fill-current" />
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {currentReviews.length === 0 ? (
                                    <div className="text-center py-8 bg-gray-50 rounded-xl border border-gray-100">
                                        <MessageSquare className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                        <p className="text-gray-500">Henüz bu kritere uygun yorum bulunmuyor.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {currentReviews.map(r => (
                                            <div key={r.id} className="p-5 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                                                <div className="flex justify-between items-start mb-3">
                                                    <div className="flex gap-3 items-center">
                                                        <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center font-bold text-indigo-500 shrink-0 uppercase">
                                                            {r.userName.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <h4 className="font-semibold text-gray-900">{r.userName}</h4>
                                                            <div className="text-xs text-gray-500 flex flex-wrap items-center gap-1.5 mt-1">
                                                                <span className="font-medium text-indigo-600">{r.serviceName}</span>
                                                                <span>•</span>
                                                                <span className="font-medium">{r.employeeName}</span>
                                                                <span>•</span>
                                                                <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-600 font-medium">₺{r.servicePrice}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center text-yellow-400">
                                                        {[...Array(5)].map((_, i) => (
                                                            <Star key={i} className={`w-4 h-4 ${i < r.rating ? 'fill-current' : 'text-gray-200'}`} />
                                                        ))}
                                                    </div>
                                                </div>
                                                <p className="text-gray-700 text-sm mt-3 pb-1">
                                                    {r.comment ? `"${r.comment}"` : <span className="italic text-gray-400">Yorum bırakılmadı. Sadece puan verildi.</span>}
                                                </p>
                                                <div className="mt-3 text-xs text-gray-400 flex items-center justify-between pt-3 border-t border-gray-50">
                                                    <span className="flex items-center gap-1.5">
                                                        <Clock className="w-3.5 h-3.5" />
                                                        {new Date(r.appointmentDate).toLocaleString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                    {r.imageUrls && r.imageUrls.length > 0 && (
                                                        <span className="text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-md font-medium">{r.imageUrls.length} Fotoğraf</span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Pagination */}
                                {totalReviewPages > 1 && (
                                    <div className="flex items-center justify-center gap-2 mt-6">
                                        <button 
                                            onClick={() => setReviewPage(p => Math.max(1, p - 1))}
                                            disabled={reviewPage === 1}
                                            className="p-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:bg-gray-50"
                                        >
                                            Önceki
                                        </button>
                                        <span className="text-sm font-medium text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                                            Sayfa {reviewPage} / {totalReviewPages}
                                        </span>
                                        <button 
                                            onClick={() => setReviewPage(p => Math.min(totalReviewPages, p + 1))}
                                            disabled={reviewPage === totalReviewPages}
                                            className="p-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:bg-gray-50"
                                        >
                                            Sonraki
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-200">
                        <div 
                            onClick={() => toggleCard('quickActions')}
                            className="w-full p-5 sm:p-6 flex justify-between items-center hover:bg-gray-50 cursor-pointer transition-colors relative"
                        >
                            <div className="flex items-center gap-3 pr-10">
                                <div className="p-2.5 bg-yellow-50 text-yellow-600 rounded-xl">
                                    <Activity className="w-6 h-6" />
                                </div>
                                <h2 className="text-lg font-bold text-gray-900">Hızlı İşlemler</h2>
                            </div>
                            <div className="absolute right-5 sm:right-6 flex items-center justify-center p-1 bg-gray-50 rounded-full text-gray-400">
                                {openCards.quickActions ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                            </div>
                        </div>

                        {openCards.quickActions && (
                            <div className="p-5 sm:p-6 pt-0 border-t border-gray-50 animate-in fade-in slide-in-from-top-4 duration-300">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                                    <button
                                        onClick={() => navigate('/salon-panel/services')}
                                        className="group p-5 border border-gray-100 rounded-xl text-left hover:border-indigo-100 hover:bg-indigo-50/50 hover:shadow-sm transition-all flex items-center justify-between"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg group-hover:scale-110 transition-transform">
                                                <PlusCircle className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <span className="block font-semibold text-gray-900">Hizmet Ekle</span>
                                                <span className="text-xs text-gray-500">Yeni bir hizmet tanımla</span>
                                            </div>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-indigo-400" />
                                    </button>

                                    <button
                                        onClick={() => navigate('/salon-panel/employees')}
                                        className="group p-5 border border-gray-100 rounded-xl text-left hover:border-cyan-100 hover:bg-cyan-50/50 hover:shadow-sm transition-all flex items-center justify-between"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="p-2 bg-cyan-100 text-cyan-600 rounded-lg group-hover:scale-110 transition-transform">
                                                <Users className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <span className="block font-semibold text-gray-900">Çalışan Ekle</span>
                                                <span className="text-xs text-gray-500">Yeni personel kaydet</span>
                                            </div>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-cyan-400" />
                                    </button>

                                    <button
                                        onClick={() => navigate('/salon-panel/shop')}
                                        className="group p-5 border border-gray-100 rounded-xl text-left hover:border-purple-100 hover:bg-purple-50/50 hover:shadow-sm transition-all flex items-center justify-between"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="p-2 bg-purple-100 text-purple-600 rounded-lg group-hover:scale-110 transition-transform">
                                                <Store className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <span className="block font-semibold text-gray-900">Dükkanı Güncelle</span>
                                                <span className="text-xs text-gray-500">Bilgileri düzenle</span>
                                            </div>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-purple-400" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

