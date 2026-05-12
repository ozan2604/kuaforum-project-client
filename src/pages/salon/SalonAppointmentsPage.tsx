import React, { useEffect, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '../../components/Button';
import { appointmentService } from '../../api/appointment.service';
import { shopService } from '../../api/shop.service';
import { employeeService } from '../../api/employee.service';
import { serviceManagementService } from '../../api/service.service';
import { type Appointment, AppointmentStatus } from '../../types/appointment';
import type { Employee } from '../../types/employee';
import { toast } from 'react-hot-toast';
import { getApiError } from '../../utils/storage';
import {
    Calendar, Clock, User, CheckCircle, XCircle, AlertCircle,
    Scissors, ChevronLeft, ChevronRight, Zap, ChevronDown, Filter, Phone, MessageSquare, X, Plus, UserX
} from 'lucide-react';
import { blockService } from '../../api/block.service';
import type { NoShowResultDto } from '../../types/appointment';
import { ManualBookingModal } from '../../components/ManualBookingModal';
import { format, addDays } from 'date-fns';
import { tr } from 'date-fns/locale';
import { CustomSelect } from '../../components/CustomSelect';
import { WeeklyCalendarCard } from '../../components/WeeklyCalendarCard';

type MainTab = 'calendar' | 'management';

export const SalonAppointmentsPage: React.FC = () => {
    // ── Shop / shared ──────────────────────────────────────────────────────
    const [shopId, setShopId] = useState<string | null>(null);
    const [isAutoProcessEnabled, setIsAutoProcessEnabled] = useState(false);
    const [bookingDaysAhead, setBookingDaysAhead] = useState(7);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [services, setServices] = useState<{ id: string; name: string }[]>([]);

    const [weeklyOffDays, setWeeklyOffDays] = useState<number[]>([]);
    const [manualModalOpen, setManualModalOpen] = useState(false);

    // ── Main tab ───────────────────────────────────────────────────────────
    const [activeMainTab, setActiveMainTab] = useState<MainTab>('calendar');
    const [managementEnabled, setManagementEnabled] = useState(false);

    // ── Calendar tab ───────────────────────────────────────────────────────
    const [weeklyAppointments, setWeeklyAppointments] = useState<Appointment[]>([]);
    const [weeklyLoading, setWeeklyLoading] = useState(false);
    const [calendarEmployeeFilter, setCalendarEmployeeFilter] = useState('');

    // ── Management tab ─────────────────────────────────────────────────────
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(false);
    const [statusFilter, setStatusFilter] = useState<AppointmentStatus | undefined>(undefined);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDate, setFilterDate] = useState('');
    const [filterEmployeeId, setFilterEmployeeId] = useState('');
    const [filterServiceId, setFilterServiceId] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalCount, setTotalCount] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
    const [confirmAction, setConfirmAction] = useState<{
        appointmentId?: string;
        groupId?: string;
        isGroup: boolean;
        status: AppointmentStatus;
        label: string;
        actionText: string;
        reason: string;
        firstStartTime?: string;
    } | null>(null);
    const [blockOffer, setBlockOffer] = useState<{
        customerId: string;
        customerName: string;
        noShowCount: number;
    } | null>(null);

    // ── Load shop info + employees + services on mount ─────────────────────
    useEffect(() => {
        (async () => {
            try {
                const [shop, emps, cats] = await Promise.all([
                    shopService.getMyShop(),
                    employeeService.getEmployees(),
                    serviceManagementService.getShopServices(),
                ]);
                if (!shop) { toast.error('Salon bilgileri bulunamadı'); return; }
                setShopId(shop.id);
                setIsAutoProcessEnabled(shop.isAutoProcessEnabled || false);
                setBookingDaysAhead(shop.bookingDaysAhead ?? 7);
                setWeeklyOffDays(shop.weeklyOffDays ?? []);
                setEmployees(emps);
                setServices(cats.flatMap(c => c.services || []).map(s => ({ id: s.id, name: s.name })));
            } catch (err) {
                toast.error(getApiError(err, 'Sayfa yüklenemedi'));
            }
        })();
    }, []);

    // ── Calendar: load N days of appointments in parallel ─────────────────
    const loadCalendarAppointments = async (id: string, days: number) => {
        setWeeklyLoading(true);
        try {
            const today = new Date();
            const results = await Promise.all(
                Array.from({ length: days }, (_, i) =>
                    appointmentService.getShopAppointments(id, 1, 200, undefined, undefined, format(addDays(today, i), 'yyyy-MM-dd'))
                )
            );
            setWeeklyAppointments(results.flatMap(r => r.items));
        } catch { toast.error('Takvim verileri yüklenemedi, lütfen sayfayı yenileyin.'); }
        finally { setWeeklyLoading(false); }
    };

    useEffect(() => {
        if (shopId) loadCalendarAppointments(shopId, bookingDaysAhead);
    }, [shopId, bookingDaysAhead]);

    // Client-side employee filter for calendar (no extra request needed)
    const calendarAppts = useMemo(() =>
        calendarEmployeeFilter
            ? weeklyAppointments.filter(a => a.shopEmployeeId === calendarEmployeeFilter)
            : weeklyAppointments,
        [weeklyAppointments, calendarEmployeeFilter]
    );

    // ── Management: lazy-load, only after first tab switch ─────────────────
    useEffect(() => {
        if (!managementEnabled || !shopId) return;
        setLoading(true);
        appointmentService.getShopAppointments(
            shopId, page, pageSize, statusFilter, searchTerm,
            filterDate || undefined, filterEmployeeId || undefined, filterServiceId || undefined
        ).then(result => {
            setAppointments(result.items);
            setTotalCount(result.totalCount);
            setTotalPages(result.totalPages);
        }).catch(err => {
            toast.error(getApiError(err, 'Randevular yüklenemedi'));
        }).finally(() => {
            setLoading(false);
        });
    }, [managementEnabled, shopId, page, pageSize, statusFilter, searchTerm, filterDate, filterEmployeeId, filterServiceId]);

    const handleMainTabChange = (tab: MainTab) => {
        setActiveMainTab(tab);
        if (tab === 'management') setManagementEnabled(true);
    };

    // ── Auto process toggle ────────────────────────────────────────────────
    const handleAutoProcessToggle = async () => {
        if (!shopId) return;
        const newState = !isAutoProcessEnabled;
        try {
            await shopService.updateAutoProcess(shopId, newState);
            setIsAutoProcessEnabled(newState);
            toast.success(newState
                ? 'Otomatik onay & tamamlama aktif edildi. Yeni randevular otomatik onaylanacak.'
                : 'Otomatik işlemler devre dışı bırakıldı. Randevular manuel yönetilecek.'
            );
        } catch (err) { toast.error(getApiError(err, 'Ayar kaydedilemedi, lütfen tekrar deneyin.')); }
    };

    // ── Status update ──────────────────────────────────────────────────────
    const requestSingleUpdate = (id: string, status: AppointmentStatus, label: string, actionText: string, firstStartTime?: string) =>
        setConfirmAction({ appointmentId: id, isGroup: false, status, label, actionText, reason: '', firstStartTime });

    const requestGroupUpdate = (groupId: string, status: AppointmentStatus, label: string, actionText: string, firstStartTime?: string) =>
        setConfirmAction({ groupId, isGroup: true, status, label, actionText, reason: '', firstStartTime });

    const refreshManagement = async () => {
        if (!shopId) return;
        loadCalendarAppointments(shopId, bookingDaysAhead);
        if (managementEnabled) {
            const result = await appointmentService.getShopAppointments(
                shopId, page, pageSize, statusFilter, searchTerm,
                filterDate || undefined, filterEmployeeId || undefined, filterServiceId || undefined
            );
            setAppointments(result.items);
            setTotalCount(result.totalCount);
            setTotalPages(result.totalPages);
        }
    };

    const handleStatusUpdate = async () => {
        if (!confirmAction) return;
        const needsReason = confirmAction.status === AppointmentStatus.Rejected || confirmAction.status === AppointmentStatus.Cancelled;
        if (needsReason && !confirmAction.reason.trim()) {
            toast.error(confirmAction.status === AppointmentStatus.Rejected
                ? 'Red sebebi zorunludur — müşteri bu bilgiyi görecek.'
                : 'İptal sebebi zorunludur — müşteri bu bilgiyi görecek.'
            );
            return;
        }
        const reason = needsReason ? confirmAction.reason.trim() || undefined : undefined;
        const successMessages: Partial<Record<AppointmentStatus, string>> = {
            [AppointmentStatus.Confirmed]:  confirmAction.isGroup ? 'Tüm randevular onaylandı.' : 'Randevu onaylandı.',
            [AppointmentStatus.Completed]:  confirmAction.isGroup ? 'Tüm randevular tamamlandı olarak işaretlendi.' : 'Randevu tamamlandı olarak işaretlendi.',
            [AppointmentStatus.Cancelled]:  confirmAction.isGroup ? 'Tüm randevular iptal edildi.' : 'Randevu iptal edildi.',
            [AppointmentStatus.Rejected]:   confirmAction.isGroup ? 'Tüm randevular reddedildi.' : 'Randevu reddedildi.',
            [AppointmentStatus.NoShow]:     confirmAction.isGroup ? 'Tüm randevular "Gelmedi" olarak işaretlendi.' : 'Randevu "Gelmedi" olarak işaretlendi.',
        };
        try {
            let noShowResult = null;
            if (confirmAction.isGroup && confirmAction.groupId) {
                noShowResult = await appointmentService.updateGroupStatus(confirmAction.groupId, confirmAction.status, reason);
            } else if (confirmAction.appointmentId) {
                noShowResult = await appointmentService.updateStatus(confirmAction.appointmentId, confirmAction.status, reason);
            }
            toast.success(successMessages[confirmAction.status] ?? 'Randevu güncellendi.');
            await refreshManagement();
            if (confirmAction.status === AppointmentStatus.NoShow && noShowResult && noShowResult.noShowCount >= 2 && noShowResult.customerId) {
                setBlockOffer({
                    customerId: noShowResult.customerId,
                    customerName: noShowResult.customerName ?? 'Müşteri',
                    noShowCount: noShowResult.noShowCount,
                });
            }
        } catch (err) { toast.error(getApiError(err, 'İşlem gerçekleştirilemedi, lütfen tekrar deneyin.')); }
        finally { setConfirmAction(null); }
    };

    const handleBlockFromOffer = async () => {
        if (!blockOffer || !shopId) return;
        try {
            await blockService.blockCustomer(shopId, blockOffer.customerId);
            toast.success(`${blockOffer.customerName} engellendi. Bu müşteri artık salona randevu alamaz.`);
        } catch (err) { toast.error(getApiError(err, 'Engelleme işlemi başarısız.')); }
        finally { setBlockOffer(null); }
    };

    // ── Status badge ───────────────────────────────────────────────────────
    const getStatusBadge = (status: AppointmentStatus) => {
        switch (status) {
            case AppointmentStatus.Pending:   return <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold inline-flex items-center gap-1 shadow-sm"><AlertCircle className="w-3.5 h-3.5" /> Onay Bekliyor</span>;
            case AppointmentStatus.Confirmed: return <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold inline-flex items-center gap-1 shadow-sm"><CheckCircle className="w-3.5 h-3.5" /> Onaylandı</span>;
            case AppointmentStatus.Completed: return <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold inline-flex items-center gap-1 shadow-sm"><CheckCircle className="w-3.5 h-3.5" /> Tamamlandı</span>;
            case AppointmentStatus.Cancelled: return <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-semibold inline-flex items-center gap-1 shadow-sm"><XCircle className="w-3.5 h-3.5" /> İptal Edildi</span>;
            case AppointmentStatus.Rejected:  return <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold inline-flex items-center gap-1 shadow-sm"><XCircle className="w-3.5 h-3.5" /> Reddedildi</span>;
            case AppointmentStatus.NoShow:    return <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-semibold inline-flex items-center gap-1 shadow-sm"><UserX className="w-3.5 h-3.5" /> Gelmedi</span>;
            default: return null;
        }
    };

    const statusTabs = [
        { label: 'Tümü', value: undefined },
        { label: 'Onay Bekliyor', value: AppointmentStatus.Pending },
        { label: 'Onaylandı', value: AppointmentStatus.Confirmed },
        { label: 'Tamamlandı', value: AppointmentStatus.Completed },
        { label: 'İptal', value: AppointmentStatus.Cancelled },
        { label: 'Reddedildi', value: AppointmentStatus.Rejected },
        { label: 'Gelmedi', value: AppointmentStatus.NoShow },
    ];

    const employeeOptions = [
        { value: '', label: 'Tüm Salon' },
        ...employees.map(emp => ({ value: emp.id, label: `${emp.firstName} ${emp.lastName}` })),
    ];

    // ── Render ─────────────────────────────────────────────────────────────
    return (
        <>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-4">

            {/* Page Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Calendar className="h-7 w-7 text-primary-600" />
                        Randevular
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">Salonunuzdaki tüm randevuları buradan yönetebilirsiniz.</p>
                </div>

                <div className="flex items-center gap-3">
                <button
                    onClick={() => setManualModalOpen(true)}
                    disabled={!shopId}
                    className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
                >
                    <Plus className="w-4 h-4" />
                    Manuel Randevu
                </button>
                <div className="flex items-center bg-white p-3 rounded-2xl shadow-sm border border-gray-100 gap-3">
                    <div>
                        <p className="text-sm font-medium text-gray-900 flex items-center gap-1">
                            <Zap className={`w-4 h-4 ${isAutoProcessEnabled ? 'text-yellow-500' : 'text-gray-400'}`} />
                            Otomatik Onayla & Tamamla
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                            {isAutoProcessEnabled ? 'Aktif: Yeni randevular onaylanır, saati gelince tamamlanır' : 'Pasif: Manuel yönetim'}
                        </p>
                    </div>
                    <button
                        onClick={handleAutoProcessToggle}
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2 ${isAutoProcessEnabled ? 'bg-primary-600' : 'bg-gray-200'}`}
                        role="switch"
                        aria-checked={isAutoProcessEnabled}
                    >
                        <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isAutoProcessEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                </div>
                </div>
            </div>

            {/* ── Main Tab Bar ── */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
                <div className="flex">
                    <button
                        onClick={() => handleMainTabChange('calendar')}
                        className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold border-b-2 transition-colors rounded-tl-2xl ${
                            activeMainTab === 'calendar'
                                ? 'border-primary-600 text-primary-700 bg-primary-50/40'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                        <Calendar className="w-4 h-4" />
                        Randevu Takvimi
                    </button>
                    <button
                        onClick={() => handleMainTabChange('management')}
                        className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold border-b-2 transition-colors ${
                            activeMainTab === 'management'
                                ? 'border-primary-600 text-primary-700 bg-primary-50/40'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                        <Filter className="w-4 h-4" />
                        Randevu Yönetimi
                        {managementEnabled && !loading && totalCount > 0 && (
                            <span className="text-[10px] bg-indigo-100 text-indigo-700 font-bold px-1.5 py-0.5 rounded-full">
                                {totalCount}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {/* ── Calendar Tab ── */}
            {activeMainTab === 'calendar' && (
                <div className="space-y-4">
                    {/* Employee filter */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-5 py-4 flex items-end gap-4">
                        <div className="w-64">
                            <CustomSelect
                                label="Personel"
                                options={employeeOptions}
                                value={calendarEmployeeFilter}
                                onChange={v => setCalendarEmployeeFilter(String(v))}
                            />
                        </div>
                        {calendarEmployeeFilter && (
                            <button
                                onClick={() => setCalendarEmployeeFilter('')}
                                className="mb-0.5 text-xs text-gray-400 hover:text-gray-600 underline underline-offset-2"
                            >
                                Tüm salonu göster
                            </button>
                        )}
                        <div className="ml-auto text-xs text-gray-400">
                            {bookingDaysAhead} günlük takvim gösteriliyor
                        </div>
                    </div>

                    {/* Calendar card */}
                    <WeeklyCalendarCard
                        appointments={calendarAppts}
                        loading={weeklyLoading}
                        showEmployeeName={!calendarEmployeeFilter}
                        defaultOpen
                        daysAhead={bookingDaysAhead}
                    />
                </div>
            )}

            {/* ── Management Tab ── */}
            {activeMainTab === 'management' && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

                    {/* Filters */}
                    <div className="px-5 sm:px-6 py-4 border-b border-gray-100">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                                    label="Personel"
                                    options={[{ value: '', label: 'Tümü' }, ...employees.map(emp => ({ value: emp.id, label: `${emp.firstName} ${emp.lastName}` }))]}
                                    value={filterEmployeeId}
                                    onChange={v => { setFilterEmployeeId(String(v)); setPage(1); }}
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
                        {(searchTerm || filterDate || filterEmployeeId || filterServiceId || statusFilter !== undefined) && (
                            <div className="mt-3 flex justify-end">
                                <button
                                    onClick={() => { setSearchTerm(''); setFilterDate(''); setFilterEmployeeId(''); setFilterServiceId(''); setStatusFilter(undefined); setPage(1); }}
                                    className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-red-600 bg-gray-100 hover:bg-red-50 border border-gray-200 hover:border-red-200 px-3 py-1.5 rounded-lg transition-colors"
                                >
                                    <X className="w-3.5 h-3.5" />
                                    Filtreleri Temizle
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Status Tabs */}
                    <div className="flex overflow-x-auto border-b border-gray-100 bg-gray-50/60">
                        {statusTabs.map(tab => (
                            <button
                                key={tab.label}
                                onClick={() => { setStatusFilter(tab.value); setPage(1); }}
                                className={`px-5 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors duration-200 ${
                                    statusFilter === tab.value
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
                        <div className="py-14 text-center flex justify-center items-center gap-2 text-gray-400">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500" />
                            Yükleniyor...
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

                            {/* Unified Grouped Cards — varsayılan kapalı, başlığa tıklayınca açılır */}
                            <div className="divide-y divide-gray-100">
                                {(() => {
                                    const groups = new Map<string, Appointment[]>();
                                    appointments.forEach(apt => {
                                        const key = apt.groupId ?? apt.id;
                                        if (!groups.has(key)) groups.set(key, []);
                                        groups.get(key)!.push(apt);
                                    });
                                    groups.forEach(g => g.sort((a, b) =>
                                        new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
                                    ));
                                    return [...groups.values()].map(group => {
                                        const first = group[0];
                                        const last  = group[group.length - 1];
                                        const isMulti       = group.length > 1;
                                        const totalPrice    = group.reduce((s, a) => s + a.price, 0);
                                        const primaryStatus = first.status;
                                        const gId           = first.groupId;
                                        const cardKey       = gId ?? first.id;
                                        const isExpanded    = expandedRowId === cardKey;
                                        // Mixed-status aware bulk action flags
                                        const hasAnyPending   = group.some(a => a.status === AppointmentStatus.Pending);
                                        const hasAnyConfirmed = group.some(a => a.status === AppointmentStatus.Confirmed);
                                        const hasAnyCompleted = group.some(a => a.status === AppointmentStatus.Completed);

                                            return (
                                            <div key={cardKey} className="bg-white">
                                                {/* ── Başlık — her zaman görünür, tıklanabilir ── */}
                                                <button
                                                    type="button"
                                                    onClick={() => setExpandedRowId(prev => prev === cardKey ? null : cardKey)}
                                                    className="w-full px-4 sm:px-5 py-3.5 flex items-start gap-3 hover:bg-gray-50/70 transition-colors text-left"
                                                >
                                                    {/* Avatar */}
                                                    <div className="h-9 w-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold shrink-0 text-sm mt-0.5">
                                                        {first.customerName.charAt(0).toUpperCase()}
                                                    </div>

                                                    {/* Orta: isim + meta bilgiler */}
                                                    <div className="flex-1 min-w-0">
                                                        {/* Satır 1: isim + hizmet sayısı + not ikonu */}
                                                        <div className="flex items-center gap-1.5 flex-wrap">
                                                            <span className="font-semibold text-gray-900 text-sm">{first.customerName}</span>
                                                            {isMulti && (
                                                                <span className="text-[10px] font-bold bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-full shrink-0">
                                                                    {group.length} hizmet
                                                                </span>
                                                            )}
                                                            {first.note && (
                                                                <MessageSquare className="w-3 h-3 text-amber-400 shrink-0" />
                                                            )}
                                                        </div>
                                                        {/* Satır 2: tarih + saat + personel + telefon */}
                                                        <div className="text-xs text-gray-400 flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1">
                                                            <span className="flex items-center gap-1 shrink-0">
                                                                <Calendar className="w-3 h-3" />
                                                                {format(new Date(first.startTime), 'd MMM yyyy', { locale: tr })}
                                                            </span>
                                                            <span className="flex items-center gap-1 shrink-0">
                                                                <Clock className="w-3 h-3" />
                                                                {format(new Date(first.startTime), 'HH:mm')} – {format(new Date(last.endTime), 'HH:mm')}
                                                            </span>
                                                            <span className="flex items-center gap-1 shrink-0">
                                                                <User className="w-3 h-3" />
                                                                {first.employeeName}
                                                            </span>
                                                            {first.customerPhone && (
                                                                <a
                                                                    href={`tel:${first.customerPhone}`}
                                                                    onClick={e => e.stopPropagation()}
                                                                    className="flex items-center gap-1 shrink-0 text-indigo-500 hover:text-indigo-700 font-medium"
                                                                >
                                                                    <Phone className="w-3 h-3" />
                                                                    {first.customerPhone}
                                                                </a>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Sağ: durum + fiyat + chevron */}
                                                    <div className="flex items-center gap-2 shrink-0 ml-auto">
                                                        <div className="hidden sm:block">{getStatusBadge(primaryStatus)}</div>
                                                        <span className="font-bold text-gray-900 text-sm whitespace-nowrap">₺{totalPrice}</span>
                                                        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 shrink-0 ${isExpanded ? 'rotate-180' : ''}`} />
                                                    </div>
                                                </button>

                                                {/* ── Açılan detay bölümü ── */}
                                                {isExpanded && (
                                                    <div className="px-4 sm:px-5 pb-4 border-t border-gray-100 bg-gray-50/40">
                                                        <div className="pt-3 space-y-3">
                                                            {/* Mobilde gizlenen durum badge'i */}
                                                            <div className="sm:hidden">{getStatusBadge(primaryStatus)}</div>

                                                            {/* Hizmet listesi */}
                                                            <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50 overflow-hidden">
                                                                {group.map(apt => {
                                                                    const aptBtns = isMulti && (
                                                                        <>
                                                                            {apt.status === AppointmentStatus.Pending && (
                                                                                <>
                                                                                    <Button size="sm" onClick={() => requestSingleUpdate(apt.id, AppointmentStatus.Confirmed, 'Randevuyu Onayla', 'Bu hizmeti onaylamak istediğinizden emin misiniz?', apt.startTime)}>Onayla</Button>
                                                                                    <Button size="sm" variant="danger" onClick={() => requestSingleUpdate(apt.id, AppointmentStatus.Rejected, 'Randevuyu Reddet', 'Bu hizmet reddedilecek. Müşteriye gösterilecek sebebi girin.', apt.startTime)}>Reddet</Button>
                                                                                </>
                                                                            )}
                                                                            {apt.status === AppointmentStatus.Confirmed && (
                                                                                <>
                                                                                    {new Date(apt.startTime) <= new Date() && (
                                                                                        <>
                                                                                            <Button size="sm" variant="success" onClick={() => requestSingleUpdate(apt.id, AppointmentStatus.Completed, 'Randevuyu Tamamla', 'Bu hizmetin tamamlandığını onaylıyor musunuz?', apt.startTime)}>Tamamlandı</Button>
                                                                                            <Button size="sm" variant="warning" onClick={() => requestSingleUpdate(apt.id, AppointmentStatus.NoShow, 'Müşteri Gelmedi Mi?', 'Bu randevuyu "Gelmedi" olarak işaretlemek istediğinize emin misiniz?', apt.startTime)}>Gelmedi</Button>
                                                                                        </>
                                                                                    )}
                                                                                    <Button size="sm" variant="danger" onClick={() => requestSingleUpdate(apt.id, AppointmentStatus.Cancelled, 'Randevuyu İptal Et', 'Bu hizmet iptal edilecek. İsterseniz müşteriye bir sebep bırakabilirsiniz.', apt.startTime)}>İptal</Button>
                                                                                </>
                                                                            )}
                                                                            {apt.status === AppointmentStatus.Completed && (
                                                                                <Button size="sm" variant="warning" onClick={() => requestSingleUpdate(apt.id, AppointmentStatus.NoShow, 'Müşteri Gelmedi Mi?', 'Bu randevuyu "Gelmedi" olarak işaretlemek istediğinize emin misiniz?', apt.startTime)}>Gelmedi</Button>
                                                                            )}
                                                                        </>
                                                                    );
                                                                    const hasAptBtns = isMulti && (apt.status === AppointmentStatus.Pending || apt.status === AppointmentStatus.Confirmed || apt.status === AppointmentStatus.Completed);
                                                                    return (
                                                                        <div key={apt.id} className="px-3 py-2">
                                                                            {/* Tek satır: ikon | isim | [PC butonlar] | fiyat | badge */}
                                                                            <div className="flex items-center gap-2 min-w-0">
                                                                                <Scissors className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                                                                                <span className="text-sm text-gray-700 flex-1 min-w-0 truncate">{apt.serviceName}</span>
                                                                                {hasAptBtns && (
                                                                                    <div className="hidden sm:flex items-center gap-1 shrink-0">{aptBtns}</div>
                                                                                )}
                                                                                <span className="text-xs text-gray-400 shrink-0 whitespace-nowrap">{apt.duration}dk · ₺{apt.price}</span>
                                                                                <div className="shrink-0">{getStatusBadge(apt.status)}</div>
                                                                            </div>
                                                                            {/* Mobil: butonlar alt satırda */}
                                                                            {hasAptBtns && (
                                                                                <div className="sm:hidden flex gap-1.5 mt-2 ml-5 flex-wrap">{aptBtns}</div>
                                                                            )}
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>

                                                            {/* Müşteri notu */}
                                                            {first.note && (
                                                                <div className="flex items-start gap-2 text-sm text-gray-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                                                                    <MessageSquare className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                                                                    <span>{first.note}</span>
                                                                </div>
                                                            )}

                                                            {/* İptal/Red sebebi */}
                                                            {first.cancellationReason && (
                                                                <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                                                                    <XCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                                                                    <span>{first.cancellationReason}</span>
                                                                </div>
                                                            )}

                                                            {/* Toplu aksiyon butonları */}
                                                            {(hasAnyPending || hasAnyConfirmed || hasAnyCompleted) && (
                                                                <div className="flex items-center gap-2 pt-2 border-t border-gray-100 flex-wrap">
                                                                    {isMulti && (
                                                                        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider shrink-0">Toplu İşlem</span>
                                                                    )}
                                                                    <div className="flex flex-wrap gap-1.5 sm:ml-auto">
                                                                        {hasAnyPending && (
                                                                            <>
                                                                                <Button size="sm" onClick={() =>
                                                                                    isMulti && gId
                                                                                        ? requestGroupUpdate(gId, AppointmentStatus.Confirmed, 'Grubu Onayla', `${group.length} hizmetin tamamını onaylamak istediğinize emin misiniz?`, first.startTime)
                                                                                        : requestSingleUpdate(first.id, AppointmentStatus.Confirmed, 'Randevuyu Onayla', 'Bu randevuyu onaylamak istediğinize emin misiniz?', first.startTime)
                                                                                }>{isMulti ? 'Tümünü Onayla' : 'Onayla'}</Button>
                                                                                <Button size="sm" variant="danger" onClick={() =>
                                                                                    isMulti && gId
                                                                                        ? requestGroupUpdate(gId, AppointmentStatus.Rejected, 'Grubu Reddet', `${group.length} hizmet reddedilecek. Müşteriye gösterilecek sebebi girin.`, first.startTime)
                                                                                        : requestSingleUpdate(first.id, AppointmentStatus.Rejected, 'Randevuyu Reddet', 'Bu randevu reddedilecek. Müşteriye gösterilecek sebebi girin.', first.startTime)
                                                                                }>Reddet</Button>
                                                                            </>
                                                                        )}
                                                                        {hasAnyConfirmed && new Date(last.startTime) <= new Date() && (
                                                                            <Button size="sm" variant="success" onClick={() =>
                                                                                isMulti && gId
                                                                                    ? requestGroupUpdate(gId, AppointmentStatus.Completed, 'Grubu Tamamla', `${group.length} hizmetin tamamını tamamlamak istediğinize emin misiniz?`, first.startTime)
                                                                                    : requestSingleUpdate(first.id, AppointmentStatus.Completed, 'Randevuyu Tamamla', 'Bu randevunun tamamlandığını onaylıyor musunuz?', first.startTime)
                                                                            }>{isMulti ? 'Tümünü Tamamla' : 'Tamamlandı'}</Button>
                                                                        )}
                                                                        {((hasAnyConfirmed && new Date(last.startTime) <= new Date()) || hasAnyCompleted) && (
                                                                            <Button size="sm" variant="warning" onClick={() =>
                                                                                isMulti && gId
                                                                                    ? requestGroupUpdate(gId, AppointmentStatus.NoShow, 'Müşteri Gelmedi Mi?', `${group.length} randevu "Gelmedi" olarak işaretlenecek. Devam etmek istiyor musunuz?`, first.startTime)
                                                                                    : requestSingleUpdate(first.id, AppointmentStatus.NoShow, 'Müşteri Gelmedi Mi?', 'Bu randevuyu "Gelmedi" olarak işaretlemek istediğinize emin misiniz?', first.startTime)
                                                                            }>Gelmedi</Button>
                                                                        )}
                                                                        {hasAnyConfirmed && (
                                                                            <Button size="sm" variant="danger" onClick={() =>
                                                                                isMulti && gId
                                                                                    ? requestGroupUpdate(gId, AppointmentStatus.Cancelled, 'Grubu İptal Et', `${group.length} hizmet iptal edilecek. İsterseniz müşteriye bir sebep bırakabilirsiniz.`, first.startTime)
                                                                                    : requestSingleUpdate(first.id, AppointmentStatus.Cancelled, 'Randevuyu İptal Et', 'Bu randevu iptal edilecek. İsterseniz müşteriye bir sebep bırakabilirsiniz.', first.startTime)
                                                                            }>{isMulti ? 'Tümünü İptal Et' : 'İptal'}</Button>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    });
                                })()}
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Confirmation Modal */}
            {confirmAction && createPortal(
                <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/50">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
                        <h3 className="text-lg font-bold text-gray-900">{confirmAction.label}</h3>
                        <p className="text-gray-600 text-sm">{confirmAction.actionText}</p>

                        {/* Geç iptal uyarısı */}
                        {(confirmAction.status === AppointmentStatus.Cancelled || confirmAction.status === AppointmentStatus.Rejected) &&
                            confirmAction.firstStartTime &&
                            (() => {
                                const hoursLeft = (new Date(confirmAction.firstStartTime).getTime() - Date.now()) / 3600000;
                                return hoursLeft >= 0 && hoursLeft < 24 ? (
                                    <div className="flex items-start gap-2 bg-orange-50 border border-orange-200 text-orange-800 rounded-xl px-4 py-3 text-sm">
                                        <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-orange-500" />
                                        <span>
                                            <strong>Dikkat:</strong> Bu randevuya yaklaşık <strong>{Math.ceil(hoursLeft)} saat</strong> kaldı.
                                            Geç iptal müşteriyi mağdur edebilir.
                                        </span>
                                    </div>
                                ) : null;
                            })()
                        }

                        {/* Sebep textarea */}
                        {(confirmAction.status === AppointmentStatus.Cancelled || confirmAction.status === AppointmentStatus.Rejected) && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    {confirmAction.status === AppointmentStatus.Rejected
                                        ? 'Red sebebi (zorunlu — müşteriye gösterilir)'
                                        : 'İptal sebebi (zorunlu — müşteriye gösterilir)'}
                                </label>
                                <textarea
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 resize-none"
                                    placeholder={confirmAction.status === AppointmentStatus.Rejected
                                        ? 'Örn: Personelimiz bu gün müsait değil.'
                                        : 'Örn: Beklenmedik bir durum nedeniyle iptal edildi.'}
                                    value={confirmAction.reason}
                                    onChange={e => setConfirmAction(prev => prev ? { ...prev, reason: e.target.value } : null)}
                                />
                            </div>
                        )}

                        <div className="flex gap-3 justify-end pt-1">
                            <button onClick={() => setConfirmAction(null)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl">Vazgeç</button>
                            <button
                                onClick={handleStatusUpdate}
                                className={`px-4 py-2 text-sm font-semibold rounded-xl text-white transition-colors ${
                                    confirmAction.status === AppointmentStatus.Rejected || confirmAction.status === AppointmentStatus.Cancelled
                                        ? 'bg-red-600 hover:bg-red-700'
                                        : confirmAction.status === AppointmentStatus.NoShow
                                        ? 'bg-orange-500 hover:bg-orange-600'
                                        : 'bg-indigo-600 hover:bg-indigo-700'
                                }`}
                            >
                                {confirmAction.status === AppointmentStatus.Rejected ? 'Reddet'
                                    : confirmAction.status === AppointmentStatus.Cancelled ? 'İptal Et'
                                    : confirmAction.status === AppointmentStatus.NoShow ? 'Gelmedi Olarak İşaretle'
                                    : 'Onayla'}
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
                        Bu müşteriyi engellemek ister misiniz? Engellenen müşteri salona randevu alamaz.
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

        {shopId && (
            <ManualBookingModal
                isOpen={manualModalOpen}
                onClose={() => setManualModalOpen(false)}
                shopId={shopId}
                bookingDaysAhead={bookingDaysAhead}
                weeklyOffDays={weeklyOffDays}
                onSuccess={refreshManagement}
            />
        )}
        </>
    );
};
