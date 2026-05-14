import React, { useEffect, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '../../components/Button';
import { appointmentService } from '../../api/appointment.service';
import { employeeService } from '../../api/employee.service';
import { type Appointment, AppointmentStatus } from '../../types/appointment';
import { toast } from 'react-hot-toast';
import { getApiError } from '../../utils/storage';
import {
    Calendar, Clock, CheckCircle, XCircle, AlertCircle,
    Scissors, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Filter, X, Plus, UserX
} from 'lucide-react';
import { blockService } from '../../api/block.service';
import { ManualBookingModal } from '../../components/ManualBookingModal';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { CustomSelect } from '../../components/CustomSelect';
import { WeeklyCalendarCard } from '../../components/WeeklyCalendarCard';
import { LoadingSpinner } from '../../components/LoadingSpinner';

export const EmployeeAppointmentsPage: React.FC = () => {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<AppointmentStatus | undefined>(undefined);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDate, setFilterDate] = useState('');
    const [filterServiceId, setFilterServiceId] = useState('');

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalCount, setTotalCount] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [confirmAction, setConfirmAction] = useState<{ id: string; status: AppointmentStatus; label: string; actionText: string; groupSize?: number } | null>(null);
    const [blockOffer, setBlockOffer] = useState<{ customerId: string; customerName: string; noShowCount: number } | null>(null);

    const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
    const [weeklyAppointments, setWeeklyAppointments] = useState<Appointment[]>([]);
    const [weeklyLoading, setWeeklyLoading] = useState(true);

    const [managementOpen, setManagementOpen] = useState(false);
    const [bookingDaysAhead, setBookingDaysAhead] = useState(30);
    const [shopId, setShopId] = useState('');
    const [myEmployeeId, setMyEmployeeId] = useState('');
    const [manualModalOpen, setManualModalOpen] = useState(false);

    // Derive unique services from weekly appointments for service filter
    const services = useMemo(() => {
        const seen = new Set<string>();
        return weeklyAppointments
            .filter(a => { if (seen.has(a.shopServiceId)) return false; seen.add(a.shopServiceId); return true; })
            .map(a => ({ id: a.shopServiceId, name: a.serviceName }))
            .sort((a, b) => a.name.localeCompare(b.name, 'tr'));
    }, [weeklyAppointments]);

    const loadWeeklyAppointments = async () => {
        setWeeklyLoading(true);
        try {
            const result = await appointmentService.getAssignedAppointments();
            setWeeklyAppointments(result);
        } catch {
            /* non-critical */
        } finally {
            setWeeklyLoading(false);
        }
    };

    useEffect(() => {
        loadWeeklyAppointments();
        employeeService.getProfile().then(p => {
            setBookingDaysAhead(p.bookingDaysAhead ?? 30);
            setShopId(p.shopId);
            setMyEmployeeId(p.id);
        }).catch(() => { });
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const result = await appointmentService.getAssignedAppointmentsPaged(
                page, pageSize, statusFilter, searchTerm,
                filterDate || undefined, filterServiceId || undefined
            );
            setAppointments(result.items);
            setTotalCount(result.totalCount);
            setTotalPages(result.totalPages);
        } catch (err) {
            toast.error(getApiError(err, 'Randevular yüklenemedi'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, [page, pageSize, statusFilter, searchTerm, filterDate, filterServiceId]);

    const requestStatusUpdate = (id: string, status: AppointmentStatus, label: string, actionText: string, groupSize?: number) =>
        setConfirmAction({ id, status, label, actionText, groupSize });

    const handleStatusUpdate = async (id: string, status: AppointmentStatus) => {
        try {
            const noShowResult = await appointmentService.updateStatusByEmployee(id, status);
            toast.success('Randevu durumu güncellendi');
            loadData();
            loadWeeklyAppointments();
            if (status === AppointmentStatus.NoShow && noShowResult && noShowResult.noShowCount >= 2 && noShowResult.customerId) {
                setBlockOffer({
                    customerId: noShowResult.customerId,
                    customerName: noShowResult.customerName ?? 'Müşteri',
                    noShowCount: noShowResult.noShowCount,
                });
            }
        } catch (err) {
            toast.error(getApiError(err, 'Durum güncellenemedi'));
        } finally {
            setConfirmAction(null);
        }
    };

    const handleBlockFromOffer = async () => {
        if (!blockOffer || !shopId) return;
        try {
            await blockService.blockCustomer(shopId, blockOffer.customerId);
            toast.success(`${blockOffer.customerName} engellendi.`);
        } catch (err) { toast.error(getApiError(err, 'Engelleme işlemi başarısız.')); }
        finally { setBlockOffer(null); }
    };

    const getStatusBadge = (status: AppointmentStatus) => {
        switch (status) {
            case AppointmentStatus.Pending: return <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold inline-flex items-center gap-1 shadow-sm"><AlertCircle className="w-3.5 h-3.5" /> Onay Bekliyor</span>;
            case AppointmentStatus.Confirmed: return <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold inline-flex items-center gap-1 shadow-sm"><CheckCircle className="w-3.5 h-3.5" /> Onaylandı</span>;
            case AppointmentStatus.Completed: return <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold inline-flex items-center gap-1 shadow-sm"><CheckCircle className="w-3.5 h-3.5" /> Tamamlandı</span>;
            case AppointmentStatus.Cancelled: return <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-semibold inline-flex items-center gap-1 shadow-sm"><XCircle className="w-3.5 h-3.5" /> İptal Edildi</span>;
            case AppointmentStatus.Rejected: return <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold inline-flex items-center gap-1 shadow-sm"><XCircle className="w-3.5 h-3.5" /> Reddedildi</span>;
            case AppointmentStatus.NoShow: return <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-semibold inline-flex items-center gap-1 shadow-sm"><UserX className="w-3.5 h-3.5" /> Gelmedi</span>;
            default: return null;
        }
    };

    const tabs = [
        { label: 'Tümü', value: undefined },
        { label: 'Onay Bekliyor', value: AppointmentStatus.Pending },
        { label: 'Onaylandı', value: AppointmentStatus.Confirmed },
        { label: 'Tamamlandı', value: AppointmentStatus.Completed },
        { label: 'İptal', value: AppointmentStatus.Cancelled },
        { label: 'Reddedildi', value: AppointmentStatus.Rejected },
        { label: 'Gelmedi', value: AppointmentStatus.NoShow },
    ];

    return (
        <>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-4">

                {/* Page Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <Calendar className="h-7 w-7 text-primary-600" />
                            Randevularım
                        </h1>
                        <p className="mt-1 text-sm text-gray-500">Size atanan randevuları buradan yönetebilirsiniz.</p>
                    </div>
                    <button
                        onClick={() => setManualModalOpen(true)}
                        disabled={!shopId || !myEmployeeId}
                        className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm shrink-0"
                    >
                        <Plus className="w-4 h-4" />
                        Manuel Randevu
                    </button>
                </div>

                {/* ── Haftalık Takvim ── */}
                <WeeklyCalendarCard
                    appointments={weeklyAppointments}
                    loading={weeklyLoading}
                    daysAhead={bookingDaysAhead}
                />

                {/* ══════════════════════════════════════════
                CARD 2 — Randevu Yönetimi
            ══════════════════════════════════════════ */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-200">
                    <div
                        onClick={() => setManagementOpen(v => !v)}
                        className="w-full p-5 sm:p-6 flex justify-between items-center hover:bg-gray-50 cursor-pointer transition-colors relative"
                    >
                        <div className="flex items-center gap-3 pr-10">
                            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                                <Filter className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">Randevu Yönetimi</h2>
                                <p className="text-xs text-gray-500 mt-0.5">Filtrele, ara ve randevu durumlarını güncelle</p>
                            </div>
                        </div>

                        {!managementOpen && !loading && totalCount > 0 && (
                            <div className="hidden sm:flex items-center gap-2 mr-10">
                                <span className="text-xs bg-indigo-50 text-indigo-700 font-semibold px-2.5 py-1 rounded-full border border-indigo-100">
                                    {totalCount} kayıt
                                </span>
                            </div>
                        )}

                        <div className="absolute right-5 sm:right-6 p-1 bg-gray-50 rounded-full text-gray-400">
                            {managementOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </div>
                    </div>

                    {managementOpen && (
                        <div className="border-t border-gray-50 animate-in fade-in slide-in-from-top-4 duration-300">

                            {/* Filters */}
                            <div className="px-5 sm:px-6 py-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Müşteri Ara</label>
                                        <input
                                            type="text"
                                            placeholder="İsim ile ara..."
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-gray-50"
                                            value={searchTerm}
                                            onChange={e => { setSearchTerm(e.target.value); setPage(1); }}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Tarih</label>
                                        <input
                                            type="date"
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-gray-50 appearance-none"
                                            value={filterDate}
                                            onChange={e => { setFilterDate(e.target.value); setPage(1); }}
                                        />
                                    </div>
                                    <div>
                                        <CustomSelect
                                            label="Hizmet"
                                            options={[{ value: '', label: 'Tümü' }, ...services.map(srv => ({ value: srv.id, label: srv.name }))]}
                                            value={filterServiceId}
                                            onChange={v => { setFilterServiceId(String(v)); setPage(1); }}
                                        />
                                    </div>
                                </div>
                                {(searchTerm || filterDate || filterServiceId || statusFilter !== undefined) && (
                                    <div className="mt-3 flex justify-end">
                                        <button
                                            onClick={() => { setSearchTerm(''); setFilterDate(''); setFilterServiceId(''); setStatusFilter(undefined); setPage(1); }}
                                            className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-red-600 bg-gray-100 hover:bg-red-50 border border-gray-200 hover:border-red-200 px-3 py-1.5 rounded-lg transition-colors"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                            Filtreleri Temizle
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Status Tabs */}
                            <div className="flex overflow-x-auto border-y border-gray-100 bg-gray-50/60">
                                {tabs.map(tab => (
                                    <button
                                        key={tab.label}
                                        onClick={() => { setStatusFilter(tab.value); setPage(1); }}
                                        className={`px-5 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors duration-200 ${statusFilter === tab.value
                                                ? 'border-indigo-500 text-indigo-700 bg-white'
                                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-white/70'
                                            }`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            {/* Table content */}
                            {loading ? (
                                <div className="py-14 text-center">
                                    <LoadingSpinner />
                                </div>
                            ) : appointments.length === 0 ? (
                                <div className="py-14 text-center flex flex-col items-center gap-3">
                                    <div className="bg-gray-100 p-4 rounded-full">
                                        <Calendar className="h-7 w-7 text-gray-400" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-700">Randevu Bulunamadı</p>
                                        <p className="text-sm text-gray-400 mt-0.5">Bu filtrelere uygun randevu kaydı mevcut değil.</p>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {/* Pagination bar */}
                                    <div className="px-5 sm:px-6 py-3 bg-gray-50/60 border-b border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-gray-600">Sayfa Başına:</span>
                                            <CustomSelect
                                                size="compact"
                                                options={[5, 10, 25, 50, 100].map(s => ({ value: s, label: String(s) }))}
                                                value={pageSize}
                                                onChange={v => { setPageSize(Number(v)); setPage(1); }}
                                            />
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <p className="text-sm text-gray-600">
                                                Toplam <span className="font-semibold">{totalCount}</span> kayıttan{' '}
                                                <span className="font-semibold">{(page - 1) * pageSize + 1}</span>–<span className="font-semibold">{Math.min(page * pageSize, totalCount)}</span>
                                            </p>
                                            <nav className="inline-flex rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                                                <button
                                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                                    disabled={page === 1}
                                                    className={`px-2.5 py-1.5 bg-white text-sm ${page === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-50'}`}
                                                >
                                                    <ChevronLeft className="h-4 w-4" />
                                                </button>
                                                <div className="w-px bg-gray-200" />
                                                <button
                                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                                    disabled={page === totalPages}
                                                    className={`px-2.5 py-1.5 bg-white text-sm ${page === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-50'}`}
                                                >
                                                    <ChevronRight className="h-4 w-4" />
                                                </button>
                                            </nav>
                                        </div>
                                    </div>

                                    {/* Desktop Table */}
                                    <div className="hidden md:block overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-100">
                                            <thead className="bg-gray-50/80">
                                                <tr>
                                                    <th className="w-10 px-3 py-3" />
                                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Müşteri</th>
                                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Hizmet</th>
                                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tarih & Saat</th>
                                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Durum</th>
                                                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">İşlemler</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-100">
                                                {appointments.map(appointment => (
                                                    <React.Fragment key={appointment.id}>
                                                        <tr className="hover:bg-gray-50/70 transition-colors">
                                                            {/* Chevron */}
                                                            <td className="px-3 py-4 text-center">
                                                                <button
                                                                    onClick={() => setExpandedRowId(prev => prev === appointment.id ? null : appointment.id)}
                                                                    className="p-1 rounded-lg hover:bg-gray-200 transition-colors text-gray-400 hover:text-gray-600"
                                                                >
                                                                    {expandedRowId === appointment.id
                                                                        ? <ChevronUp className="h-4 w-4" />
                                                                        : <ChevronDown className="h-4 w-4" />
                                                                    }
                                                                </button>
                                                            </td>

                                                            {/* Customer */}
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="h-9 w-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm flex-shrink-0">
                                                                        {appointment.customerName.charAt(0).toUpperCase()}
                                                                    </div>
                                                                    <div>
                                                                        <div className="text-sm font-semibold text-gray-900">{appointment.customerName}</div>
                                                                        {appointment.note && (
                                                                            <div className="text-xs text-gray-400 mt-0.5 max-w-[160px] truncate" title={appointment.note}>
                                                                                📝 {appointment.note}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </td>

                                                            {/* Service */}
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <div className="text-sm text-gray-900 flex items-center gap-1">
                                                                    <Scissors className="h-3.5 w-3.5 text-gray-400" />
                                                                    {appointment.serviceName}
                                                                    {appointment.groupId && (
                                                                        <span className="ml-1 px-1.5 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-semibold rounded border border-indigo-100">GRUP</span>
                                                                    )}
                                                                </div>
                                                                <div className="text-xs text-gray-400 mt-0.5">
                                                                    {appointment.duration} dk • ₺{appointment.price}
                                                                </div>
                                                            </td>

                                                            {/* Date & Time */}
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <div className="text-sm text-gray-900 flex items-center gap-1">
                                                                    <Calendar className="h-3.5 w-3.5 text-gray-400" />
                                                                    {format(new Date(appointment.startTime), 'd MMM yyyy', { locale: tr })}
                                                                </div>
                                                                <div className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                                                                    <Clock className="h-3.5 w-3.5 text-gray-400" />
                                                                    {format(new Date(appointment.startTime), 'HH:mm', { locale: tr })} - {format(new Date(appointment.endTime), 'HH:mm', { locale: tr })}
                                                                </div>
                                                            </td>

                                                            {/* Status */}
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                {getStatusBadge(appointment.status)}
                                                                {appointment.cancellationReason && (
                                                                    <div className="text-xs text-red-400 mt-1 max-w-[140px] truncate" title={appointment.cancellationReason}>
                                                                        {appointment.cancellationReason}
                                                                    </div>
                                                                )}
                                                            </td>

                                                            {/* Actions */}
                                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                                {(() => {
                                                                    const grpSize = appointment.groupId
                                                                        ? appointments.filter(a => a.groupId === appointment.groupId).length
                                                                        : undefined;
                                                                    return (
                                                                        <div className="flex justify-end gap-2">
                                                                            {appointment.status === AppointmentStatus.Pending && (
                                                                                <Button size="sm" onClick={() => requestStatusUpdate(appointment.id, AppointmentStatus.Confirmed, 'Randevuyu Onayla', 'Bu randevuyu onaylamak istediğinize emin misiniz?', grpSize)}>Onayla</Button>
                                                                            )}
                                                                            {appointment.status === AppointmentStatus.Confirmed && (
                                                                                <>
                                                                                    {new Date(appointment.startTime) <= new Date() && (
                                                                                        <>
                                                                                            <Button size="sm" variant="success" onClick={() => requestStatusUpdate(appointment.id, AppointmentStatus.Completed, 'Randevuyu Tamamla', 'Bu randevunun tamamlandığını onaylıyor musunuz?', grpSize)}>Tamamlandı</Button>
                                                                                            <Button size="sm" variant="warning" onClick={() => requestStatusUpdate(appointment.id, AppointmentStatus.NoShow, 'Müşteri Gelmedi Mi?', 'Bu randevuyu "Gelmedi" olarak işaretlemek istediğinize emin misiniz?', grpSize)}>Gelmedi</Button>
                                                                                        </>
                                                                                    )}
                                                                                </>
                                                                            )}
                                                                            {appointment.status === AppointmentStatus.Completed && (
                                                                                <Button size="sm" variant="warning" onClick={() => requestStatusUpdate(appointment.id, AppointmentStatus.NoShow, 'Müşteri Gelmedi Mi?', 'Bu randevuyu "Gelmedi" olarak işaretlemek istediğinize emin misiniz?', grpSize)}>Gelmedi</Button>
                                                                            )}
                                                                        </div>
                                                                    );
                                                                })()}
                                                            </td>
                                                        </tr>

                                                        {/* Expanded detail row */}
                                                        {expandedRowId === appointment.id && (
                                                            <tr className="bg-indigo-50/30">
                                                                <td colSpan={6} className="px-10 py-4">
                                                                    <div className="flex flex-wrap gap-6 text-sm">
                                                                        <div>
                                                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Bitiş Saati</span>
                                                                            <span className="font-semibold text-gray-800">{format(new Date(appointment.endTime), 'HH:mm', { locale: tr })}</span>
                                                                        </div>
                                                                        {appointment.note && (
                                                                            <div className="flex-1 min-w-[180px]">
                                                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Müşteri Notu</span>
                                                                                <span className="text-gray-700">{appointment.note}</span>
                                                                            </div>
                                                                        )}
                                                                        {appointment.cancellationReason && (
                                                                            <div className="flex-1 min-w-[180px]">
                                                                                <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest block mb-1">İptal / Red Sebebi</span>
                                                                                <span className="text-red-700">{appointment.cancellationReason}</span>
                                                                            </div>
                                                                        )}
                                                                        {appointment.groupId && (
                                                                            <div>
                                                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Grup ID</span>
                                                                                <span className="text-gray-400 text-xs font-mono">{appointment.groupId}</span>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </React.Fragment>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Mobile Cards */}
                                    <div className="block md:hidden divide-y divide-gray-100">
                                        {appointments.map(appointment => {
                                            const isExpanded = expandedRowId === appointment.id;
                                            return (
                                                <div key={appointment.id} className="p-4 bg-white">
                                                    <div className="flex justify-between items-start mb-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold shrink-0">
                                                                {appointment.customerName.charAt(0).toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <div className="font-semibold text-gray-900">{appointment.customerName}</div>
                                                                <div className="text-xs text-gray-500">{format(new Date(appointment.startTime), 'd MMM yyyy HH:mm', { locale: tr })}</div>
                                                            </div>
                                                        </div>
                                                        {getStatusBadge(appointment.status)}
                                                    </div>

                                                    <div className="mb-3 bg-gray-50 rounded-xl p-3">
                                                        <div className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
                                                            {appointment.serviceName}
                                                            {appointment.groupId && (
                                                                <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-semibold rounded border border-indigo-100">GRUP</span>
                                                            )}
                                                        </div>
                                                        <div className="text-sm text-gray-500">{appointment.duration} dk • ₺{appointment.price}</div>
                                                    </div>

                                                    <button
                                                        onClick={() => setExpandedRowId(prev => prev === appointment.id ? null : appointment.id)}
                                                        className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors mb-3 border border-gray-100"
                                                    >
                                                        {isExpanded ? <><ChevronUp className="h-3.5 w-3.5" /> Kapat</> : <><ChevronDown className="h-3.5 w-3.5" /> Detayları Göster</>}
                                                    </button>

                                                    {isExpanded && (
                                                        <div className="mb-3 bg-indigo-50/40 rounded-xl p-3 space-y-2 text-sm border border-indigo-100/50">
                                                            <div><span className="text-[10px] font-bold text-gray-400 uppercase">Bitiş: </span><span className="text-gray-700">{format(new Date(appointment.endTime), 'HH:mm', { locale: tr })}</span></div>
                                                            {appointment.note && <div><span className="text-[10px] font-bold text-gray-400 uppercase">Not: </span><span className="text-gray-700">{appointment.note}</span></div>}
                                                            {appointment.cancellationReason && <div><span className="text-[10px] font-bold text-red-400 uppercase">Sebep: </span><span className="text-red-700">{appointment.cancellationReason}</span></div>}
                                                        </div>
                                                    )}

                                                    {(() => {
                                                        const grpSize = appointment.groupId
                                                            ? appointments.filter(a => a.groupId === appointment.groupId).length
                                                            : undefined;
                                                        return (
                                                            <div className="flex flex-wrap gap-2">
                                                                {appointment.status === AppointmentStatus.Pending && (
                                                                    <Button size="sm" className="flex-1" onClick={() => requestStatusUpdate(appointment.id, AppointmentStatus.Confirmed, 'Randevuyu Onayla', 'Bu randevuyu onaylamak istediğinize emin misiniz?', grpSize)}>Onayla</Button>
                                                                )}
                                                                {appointment.status === AppointmentStatus.Confirmed && (
                                                                    <>
                                                                        {new Date(appointment.startTime) <= new Date() && (
                                                                            <>
                                                                                <Button size="sm" variant="success" className="flex-1" onClick={() => requestStatusUpdate(appointment.id, AppointmentStatus.Completed, 'Randevuyu Tamamla', 'Bu randevunun tamamlandığını onaylıyor musunuz?', grpSize)}>Tamamlandı</Button>
                                                                                <Button size="sm" variant="warning" className="flex-1" onClick={() => requestStatusUpdate(appointment.id, AppointmentStatus.NoShow, 'Müşteri Gelmedi Mi?', 'Bu randevuyu "Gelmedi" olarak işaretlemek istediğinize emin misiniz?', grpSize)}>Gelmedi</Button>
                                                                            </>
                                                                        )}
                                                                    </>
                                                                )}
                                                                {appointment.status === AppointmentStatus.Completed && (
                                                                    <Button size="sm" variant="warning" className="flex-1" onClick={() => requestStatusUpdate(appointment.id, AppointmentStatus.NoShow, 'Müşteri Gelmedi Mi?', 'Bu randevuyu "Gelmedi" olarak işaretlemek istediğinize emin misiniz?', grpSize)}>Gelmedi</Button>
                                                                )}
                                                            </div>
                                                        );
                                                    })()}

                                                </div>
                                            );
                                        })}
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* Confirmation Modal */}
                {confirmAction && createPortal(
                    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/50">
                        <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-2">{confirmAction.label}</h3>
                            <p className="text-gray-600 text-sm mb-3">{confirmAction.actionText}</p>
                            {confirmAction.groupSize && confirmAction.groupSize > 1 && (
                                <div className="flex items-start gap-2 bg-indigo-50 border border-indigo-100 rounded-xl px-3 py-2.5 mb-4">
                                    <span className="text-indigo-500 mt-0.5">ℹ️</span>
                                    <p className="text-xs text-indigo-700 font-medium">
                                        Bu randevu <span className="font-bold">{confirmAction.groupSize} hizmetlik</span> bir grup randevusunun parçasıdır. İşlem gruptaki tüm randevulara uygulanacaktır.
                                    </p>
                                </div>
                            )}
                            <div className="flex gap-3 justify-end">
                                <button onClick={() => setConfirmAction(null)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl">Vazgeç</button>
                                <button
                                    onClick={() => handleStatusUpdate(confirmAction.id, confirmAction.status)}
                                    className={`px-4 py-2 text-sm font-semibold rounded-xl text-white transition-colors ${confirmAction.status === AppointmentStatus.Rejected || confirmAction.status === AppointmentStatus.Cancelled
                                            ? 'bg-red-600 hover:bg-red-700'
                                            : confirmAction.status === AppointmentStatus.NoShow
                                                ? 'bg-orange-500 hover:bg-orange-600'
                                                : 'bg-indigo-600 hover:bg-indigo-700'
                                        }`}
                                >
                                    {confirmAction.status === AppointmentStatus.NoShow ? 'Gelmedi Olarak İşaretle' : 'Onayla'}
                                </button>
                            </div>
                        </div>
                    </div>,
                    document.body
                )}
            </div>

            {blockOffer && createPortal(
                <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/50">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-orange-100 rounded-xl">
                                <UserX className="w-5 h-5 text-orange-600" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">Müşteriyi Engelle?</h3>
                        </div>
                        <p className="text-sm text-gray-600">
                            <span className="font-semibold">{blockOffer.customerName}</span> bu salona{' '}
                            <span className="font-semibold text-orange-600">{blockOffer.noShowCount} kez</span> gelmedi.
                            Bu müşteriyi engellemek ister misiniz?
                        </p>
                        <div className="flex gap-3 justify-end pt-1">
                            <button onClick={() => setBlockOffer(null)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl">Hayır, Geç</button>
                            <button onClick={handleBlockFromOffer} className="px-4 py-2 text-sm font-semibold rounded-xl text-white bg-orange-500 hover:bg-orange-600 transition-colors flex items-center gap-2">
                                <UserX className="w-4 h-4" />
                                Evet, Engelle
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {shopId && myEmployeeId && (
                <ManualBookingModal
                    isOpen={manualModalOpen}
                    onClose={() => setManualModalOpen(false)}
                    shopId={shopId}
                    bookingDaysAhead={bookingDaysAhead}
                    lockedEmployeeId={myEmployeeId}
                    onSuccess={() => { loadWeeklyAppointments(); loadData(); }}
                />
            )}
        </>
    );
};
