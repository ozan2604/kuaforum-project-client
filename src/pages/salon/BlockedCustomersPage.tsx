import React, { useEffect, useState } from 'react';
import { blockService, type BlockedCustomer, type CustomerShopInfo } from '../../api/block.service';
import { shopService } from '../../api/shop.service';
import { toast } from 'react-hot-toast';
import { getApiError } from '../../utils/storage';
import {
    Users, Phone, Search, Star, Scissors, ShieldOff, ShieldCheck,
    CheckCircle, XCircle, Clock, AlertTriangle, TrendingUp, Calendar,
    ChevronDown, ChevronUp, Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { AppointmentStatus } from '../../types/appointment';

const STATUS_LABEL: Record<number, { label: string; color: string }> = {
    [AppointmentStatus.Pending]:   { label: 'Bekliyor',    color: 'text-amber-600 bg-amber-50' },
    [AppointmentStatus.Confirmed]: { label: 'Onaylandı',   color: 'text-blue-600 bg-blue-50' },
    [AppointmentStatus.Completed]: { label: 'Tamamlandı',  color: 'text-green-600 bg-green-50' },
    [AppointmentStatus.Cancelled]: { label: 'İptal',       color: 'text-gray-500 bg-gray-100' },
    [AppointmentStatus.Rejected]:  { label: 'Reddedildi',  color: 'text-red-600 bg-red-50' },
    [AppointmentStatus.NoShow]:    { label: 'Gelmedi',     color: 'text-orange-600 bg-orange-50' },
};

const StatCard: React.FC<{ label: string; value: number | string; icon: React.ReactNode; color: string }> = ({ label, value, icon, color }) => (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3 flex items-center gap-3">
        <div className={`p-2 rounded-xl ${color}`}>{icon}</div>
        <div>
            <p className="text-xs text-gray-400 font-medium">{label}</p>
            <p className="text-lg font-bold text-gray-900 leading-tight">{value}</p>
        </div>
    </div>
);

export const BlockedCustomersPage: React.FC = () => {
    const [shopId, setShopId] = useState<string | null>(null);
    const [blocked, setBlocked] = useState<BlockedCustomer[]>([]);
    const [loadingBlocked, setLoadingBlocked] = useState(true);
    const [unblocking, setUnblocking] = useState<string | null>(null);

    // Customer search
    const [phoneInput, setPhoneInput] = useState('');
    const [searching, setSearching] = useState(false);
    const [customer, setCustomer] = useState<CustomerShopInfo | null>(null);
    const [notFound, setNotFound] = useState(false);
    const [blocking, setBlocking] = useState(false);
    const [blockReason, setBlockReason] = useState('');
    const [showBlockForm, setShowBlockForm] = useState(false);
    const [showAllAppointments, setShowAllAppointments] = useState(false);
    const [showAllReviews, setShowAllReviews] = useState(false);

    useEffect(() => {
        shopService.getMyShop().then(shop => {
            if (!shop) return;
            setShopId(shop.id);
            return blockService.getBlockedCustomers(shop.id);
        }).then(list => {
            if (list) setBlocked(list);
        }).catch(err => {
            toast.error(getApiError(err, 'Engellenen müşteriler yüklenemedi'));
        }).finally(() => setLoadingBlocked(false));
    }, []);

    const handleSearch = async () => {
        const phone = phoneInput.trim();
        if (!phone || !shopId) return;
        setSearching(true);
        setCustomer(null);
        setNotFound(false);
        setShowBlockForm(false);
        setShowAllAppointments(false);
        setShowAllReviews(false);
        try {
            const result = await blockService.getCustomerByPhone(shopId, phone);
            setCustomer(result);
        } catch (err: any) {
            if (err?.response?.status === 404) {
                setNotFound(true);
            } else {
                toast.error(getApiError(err, 'Müşteri bulunamadı'));
            }
        } finally {
            setSearching(false);
        }
    };

    const handleBlock = async () => {
        if (!shopId || !customer) return;
        setBlocking(true);
        try {
            await blockService.blockCustomer(shopId, customer.customerId, blockReason || undefined);
            setCustomer(prev => prev ? { ...prev, isBlocked: true } : prev);
            setBlocked(prev => [...prev, {
                id: crypto.randomUUID(),
                customerId: customer.customerId,
                customerName: customer.customerName,
                customerPhone: customer.customerPhone,
                reason: blockReason || undefined,
                blockedAt: new Date().toISOString(),
            }]);
            setShowBlockForm(false);
            setBlockReason('');
            toast.success(`${customer.customerName} engellendi.`);
        } catch (err) {
            toast.error(getApiError(err, 'Müşteri engellenemedi'));
        } finally {
            setBlocking(false);
        }
    };

    const handleUnblock = async (customerId: string, customerName: string) => {
        if (!shopId) return;
        setUnblocking(customerId);
        try {
            await blockService.unblockCustomer(shopId, customerId);
            setBlocked(prev => prev.filter(b => b.customerId !== customerId));
            if (customer?.customerId === customerId) {
                setCustomer(prev => prev ? { ...prev, isBlocked: false } : prev);
            }
            toast.success(`${customerName} engeli kaldırıldı.`);
        } catch (err) {
            toast.error(getApiError(err, 'Engel kaldırılamadı'));
        } finally {
            setUnblocking(null);
        }
    };

    const renderStars = (rating: number) => (
        <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map(i => (
                <Star key={i} className={`w-3.5 h-3.5 ${i <= rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}`} />
            ))}
        </div>
    );

    const visibleAppointments = showAllAppointments
        ? customer?.recentAppointments ?? []
        : customer?.recentAppointments.slice(0, 5) ?? [];

    const visibleReviews = showAllReviews
        ? customer?.reviews ?? []
        : customer?.reviews.slice(0, 3) ?? [];

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary-50 rounded-xl">
                    <Users className="h-6 w-6 text-primary-600" />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Müşteriler</h1>
                    <p className="text-sm text-gray-400">Müşteri profilini görüntüle, engelle veya engeli kaldır</p>
                </div>
            </div>

            {/* Phone search */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <p className="text-sm font-semibold text-gray-700 mb-3">Müşteri Ara</p>
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="tel"
                            value={phoneInput}
                            onChange={e => setPhoneInput(e.target.value.replace(/\D/g, '').slice(0, 11))}
                            onKeyDown={e => e.key === 'Enter' && handleSearch()}
                            placeholder="05xxxxxxxxx"
                            maxLength={11}
                            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-400"
                        />
                    </div>
                    <button
                        onClick={handleSearch}
                        disabled={searching || !phoneInput.trim()}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-900 text-white text-sm font-medium rounded-xl hover:bg-primary-800 disabled:opacity-50 disabled:pointer-events-none transition-colors"
                    >
                        {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                        Ara
                    </button>
                </div>

                {notFound && (
                    <p className="mt-3 text-sm text-gray-400 flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-amber-400" />
                        Bu numarada kayıtlı müşteri bulunamadı.
                    </p>
                )}
            </div>

            {/* Customer profile */}
            {customer && (
                <div className="space-y-4">
                    {/* Identity + block */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-lg shrink-0">
                                    {customer.customerName.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900">{customer.customerName}</p>
                                    {customer.customerPhone && (
                                        <a href={`tel:${customer.customerPhone}`} className="text-xs text-primary-600 flex items-center gap-1 mt-0.5">
                                            <Phone className="w-3 h-3" /> {customer.customerPhone}
                                        </a>
                                    )}
                                    {customer.customerEmail && (
                                        <p className="text-xs text-gray-400 mt-0.5">{customer.customerEmail}</p>
                                    )}
                                </div>
                            </div>

                            <div className="shrink-0">
                                {customer.isBlocked ? (
                                    <div className="flex flex-col items-end gap-2">
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-50 text-red-600 text-xs font-semibold rounded-full border border-red-200">
                                            <ShieldCheck className="w-3.5 h-3.5" /> Engellendi
                                        </span>
                                        <button
                                            disabled={unblocking === customer.customerId}
                                            onClick={() => handleUnblock(customer.customerId, customer.customerName)}
                                            className="text-xs font-medium text-gray-500 hover:text-primary-600 transition-colors underline"
                                        >
                                            {unblocking === customer.customerId ? 'Kaldırılıyor…' : 'Engeli Kaldır'}
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setShowBlockForm(v => !v)}
                                        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 border border-red-200 rounded-xl transition-colors"
                                    >
                                        <ShieldOff className="w-3.5 h-3.5" /> Engelle
                                    </button>
                                )}
                            </div>
                        </div>

                        {showBlockForm && !customer.isBlocked && (
                            <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                                <input
                                    type="text"
                                    value={blockReason}
                                    onChange={e => setBlockReason(e.target.value)}
                                    placeholder="Engelleme sebebi (isteğe bağlı)"
                                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-300"
                                />
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleBlock}
                                        disabled={blocking}
                                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-xl hover:bg-red-700 disabled:opacity-50 transition-colors"
                                    >
                                        {blocking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldOff className="w-3.5 h-3.5" />}
                                        Engelle
                                    </button>
                                    <button
                                        onClick={() => { setShowBlockForm(false); setBlockReason(''); }}
                                        className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                                    >
                                        İptal
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        <StatCard label="Toplam Randevu" value={customer.totalAppointments} icon={<Calendar className="w-4 h-4" />} color="bg-blue-50 text-blue-600" />
                        <StatCard label="Tamamlanan" value={customer.completedCount} icon={<CheckCircle className="w-4 h-4" />} color="bg-green-50 text-green-600" />
                        <StatCard label="Gelmedi" value={customer.noShowCount} icon={<AlertTriangle className="w-4 h-4" />} color="bg-orange-50 text-orange-500" />
                        <StatCard label="İptal" value={customer.cancelledCount} icon={<XCircle className="w-4 h-4" />} color="bg-gray-100 text-gray-500" />
                        <StatCard label="Reddedildi" value={customer.rejectedCount} icon={<XCircle className="w-4 h-4" />} color="bg-red-50 text-red-500" />
                        <StatCard label="Toplam Harcama" value={`₺${customer.totalSpent.toLocaleString('tr-TR')}`} icon={<TrendingUp className="w-4 h-4" />} color="bg-primary-50 text-primary-600" />
                    </div>

                    {/* Appointment history */}
                    {customer.recentAppointments.length > 0 && (
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
                                <Scissors className="w-4 h-4 text-gray-400" />
                                <span className="font-semibold text-gray-800 text-sm">Randevu Geçmişi</span>
                                <span className="ml-auto text-xs text-gray-400">{customer.totalAppointments} randevu</span>
                            </div>
                            <div className="divide-y divide-gray-50">
                                {visibleAppointments.map((apt, i) => {
                                    const s = STATUS_LABEL[apt.status] ?? { label: String(apt.status), color: 'text-gray-400 bg-gray-50' };
                                    return (
                                        <div key={i} className="px-5 py-3 flex items-center gap-3">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-800 truncate">{apt.serviceName}</p>
                                                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                                    <span className="text-xs text-gray-400 flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        {format(new Date(apt.startTime), 'd MMM yyyy HH:mm', { locale: tr })}
                                                    </span>
                                                    {apt.employeeName && (
                                                        <span className="text-xs text-gray-400">{apt.employeeName}</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="shrink-0 text-right space-y-1">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${s.color}`}>{s.label}</span>
                                                <p className="text-xs font-semibold text-gray-600">₺{apt.price}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            {customer.recentAppointments.length > 5 && (
                                <button
                                    onClick={() => setShowAllAppointments(v => !v)}
                                    className="w-full py-2.5 text-xs font-medium text-gray-400 hover:text-primary-600 flex items-center justify-center gap-1 border-t border-gray-50 hover:bg-gray-50 transition-colors"
                                >
                                    {showAllAppointments ? <><ChevronUp className="w-3.5 h-3.5" /> Daha az göster</> : <><ChevronDown className="w-3.5 h-3.5" /> Tümünü gör ({customer.recentAppointments.length})</>}
                                </button>
                            )}
                        </div>
                    )}

                    {/* Reviews */}
                    {customer.reviews.length > 0 && (
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
                                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                                <span className="font-semibold text-gray-800 text-sm">Yorumlar</span>
                                <span className="ml-auto text-xs text-gray-400">{customer.reviews.length} yorum</span>
                            </div>
                            <div className="divide-y divide-gray-50">
                                {visibleReviews.map((rev, i) => (
                                    <div key={i} className="px-5 py-3.5 space-y-1.5">
                                        <div className="flex items-center justify-between">
                                            {renderStars(rev.rating)}
                                            <span className="text-xs text-gray-400">
                                                {format(new Date(rev.createdAt), 'd MMM yyyy', { locale: tr })}
                                            </span>
                                        </div>
                                        {(rev.serviceName || rev.employeeName) && (
                                            <p className="text-xs text-gray-400">
                                                {[rev.serviceName, rev.employeeName].filter(Boolean).join(' · ')}
                                            </p>
                                        )}
                                        {rev.comment && (
                                            <p className="text-sm text-gray-700 leading-relaxed">"{rev.comment}"</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                            {customer.reviews.length > 3 && (
                                <button
                                    onClick={() => setShowAllReviews(v => !v)}
                                    className="w-full py-2.5 text-xs font-medium text-gray-400 hover:text-primary-600 flex items-center justify-center gap-1 border-t border-gray-50 hover:bg-gray-50 transition-colors"
                                >
                                    {showAllReviews ? <><ChevronUp className="w-3.5 h-3.5" /> Daha az</> : <><ChevronDown className="w-3.5 h-3.5" /> Tümünü gör ({customer.reviews.length})</>}
                                </button>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Blocked customers list */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-red-400" />
                    <span className="font-semibold text-gray-800 text-sm">Engellenen Müşteriler</span>
                    {blocked.length > 0 && (
                        <span className="ml-auto text-xs font-semibold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">{blocked.length}</span>
                    )}
                </div>

                {loadingBlocked ? (
                    <div className="py-10 flex justify-center items-center gap-2 text-gray-400">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span className="text-sm">Yükleniyor…</span>
                    </div>
                ) : blocked.length === 0 ? (
                    <div className="py-10 flex flex-col items-center gap-2 text-center">
                        <ShieldOff className="h-6 w-6 text-gray-300" />
                        <p className="text-sm text-gray-400">Engellenen müşteri yok</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {blocked.map(b => (
                            <div key={b.id} className="px-5 py-3.5 flex items-center gap-3">
                                <div className="h-9 w-9 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold text-sm shrink-0">
                                    {b.customerName.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-gray-800 text-sm truncate">{b.customerName}</p>
                                    {b.customerPhone && (
                                        <a href={`tel:${b.customerPhone}`} className="text-xs text-primary-500 flex items-center gap-1 mt-0.5 w-fit">
                                            <Phone className="w-3 h-3" /> {b.customerPhone}
                                        </a>
                                    )}
                                    {b.reason && <p className="text-xs text-gray-400 mt-0.5 italic">"{b.reason}"</p>}
                                    <p className="text-xs text-gray-300 mt-0.5">
                                        {format(new Date(b.blockedAt), 'd MMM yyyy', { locale: tr })}
                                    </p>
                                </div>
                                <button
                                    disabled={unblocking === b.customerId}
                                    onClick={() => handleUnblock(b.customerId, b.customerName)}
                                    className="shrink-0 text-xs font-medium text-gray-400 hover:text-red-500 border border-gray-200 hover:border-red-200 hover:bg-red-50 rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50"
                                >
                                    {unblocking === b.customerId ? 'Kaldırılıyor…' : 'Kaldır'}
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
