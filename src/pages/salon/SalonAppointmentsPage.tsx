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
    Scissors, ChevronLeft, ChevronRight, Zap, ChevronDown, ChevronUp, Filter
} from 'lucide-react';
import { format, addDays } from 'date-fns';
import { tr } from 'date-fns/locale';

const SLOT_HEIGHT = 52;
const TIME_COL_PCT = 12;

function timeToAbsoluteSlot(isoTime: string): number {
    const d = new Date(isoTime);
    return d.getHours() * 4 + Math.floor(d.getMinutes() / 15);
}

function computeAppointmentLayout(appointments: Appointment[]): Map<string, { col: number; totalCols: number }> {
    const sorted = [...appointments].sort(
        (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );
    const columns: Appointment[][] = [];
    const colMap = new Map<string, number>();

    for (const app of sorted) {
        let placed = false;
        for (let c = 0; c < columns.length; c++) {
            const last = columns[c][columns[c].length - 1];
            if (new Date(last.endTime) <= new Date(app.startTime)) {
                columns[c].push(app);
                colMap.set(app.id, c);
                placed = true;
                break;
            }
        }
        if (!placed) {
            colMap.set(app.id, columns.length);
            columns.push([app]);
        }
    }

    const result = new Map<string, { col: number; totalCols: number }>();
    for (const [id, col] of colMap) {
        result.set(id, { col, totalCols: columns.length });
    }
    return result;
}

export const SalonAppointmentsPage: React.FC = () => {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<AppointmentStatus | undefined>(undefined);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDate, setFilterDate] = useState('');
    const [filterEmployeeId, setFilterEmployeeId] = useState('');
    const [filterServiceId, setFilterServiceId] = useState('');
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [services, setServices] = useState<{ id: string; name: string }[]>([]);

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalCount, setTotalCount] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [isAutoProcessEnabled, setIsAutoProcessEnabled] = useState(false);
    const [shopId, setShopId] = useState<string | null>(null);
    const [confirmAction, setConfirmAction] = useState<{ id: string; status: AppointmentStatus; label: string; actionText: string } | null>(null);

    const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
    const [weeklyAppointments, setWeeklyAppointments] = useState<Appointment[]>([]);
    const [weeklyLoading, setWeeklyLoading] = useState(false);
    const [selectedWeekDay, setSelectedWeekDay] = useState(0);

    // Accordion state — both start closed like dashboard
    const [openCards, setOpenCards] = useState({ weeklyCalendar: false, management: false });
    const toggleCard = (card: keyof typeof openCards) =>
        setOpenCards(prev => ({ ...prev, [card]: !prev[card] }));

    const loadData = async () => {
        setLoading(true);
        try {
            const shop = await shopService.getMyShop();
            if (!shop) { toast.error('Salon bilgileri bulunamadı'); return; }
            setShopId(shop.id);
            setIsAutoProcessEnabled(shop.isAutoProcessEnabled || false);
            const result = await appointmentService.getShopAppointments(
                shop.id, page, pageSize, statusFilter, searchTerm,
                filterDate || undefined, filterEmployeeId || undefined, filterServiceId || undefined
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

    useEffect(() => { loadData(); }, [page, pageSize, statusFilter, searchTerm, filterDate, filterEmployeeId, filterServiceId]);

    useEffect(() => {
        (async () => {
            try {
                const emps = await employeeService.getEmployees();
                setEmployees(emps);
                const cats = await serviceManagementService.getShopServices();
                setServices(cats.flatMap(c => c.services || []).map(s => ({ id: s.id, name: s.name })));
            } catch { /* silent */ }
        })();
    }, []);

    const loadWeeklyAppointments = async (id: string) => {
        setWeeklyLoading(true);
        try {
            const today = new Date();
            const results = await Promise.all(
                Array.from({ length: 7 }, (_, i) =>
                    appointmentService.getShopAppointments(id, 1, 200, undefined, undefined, format(addDays(today, i), 'yyyy-MM-dd'))
                )
            );
            setWeeklyAppointments(results.flatMap(r => r.items));
        } catch { /* non-critical */ }
        finally { setWeeklyLoading(false); }
    };

    useEffect(() => { if (shopId) loadWeeklyAppointments(shopId); }, [shopId]);

    const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(new Date(), i)), []);

    const dayAppointments = useMemo(() => {
        const dayStr = format(weekDays[selectedWeekDay], 'yyyy-MM-dd');
        return weeklyAppointments.filter(app => format(new Date(app.startTime), 'yyyy-MM-dd') === dayStr);
    }, [weeklyAppointments, weekDays, selectedWeekDay]);

    const { calendarStart, calendarEnd } = useMemo(() => {
        if (dayAppointments.length === 0) return { calendarStart: 8 * 4, calendarEnd: 18 * 4 };
        const starts = dayAppointments.map(a => timeToAbsoluteSlot(a.startTime));
        const ends = dayAppointments.map(a => timeToAbsoluteSlot(a.endTime));
        return {
            calendarStart: Math.max(0, Math.min(...starts) - 4),
            calendarEnd: Math.min(24 * 4, Math.max(...ends) + 4),
        };
    }, [dayAppointments]);

    const appointmentLayout = useMemo(() => computeAppointmentLayout(dayAppointments), [dayAppointments]);

    const handleAutoProcessToggle = async () => {
        if (!shopId) return;
        const newState = !isAutoProcessEnabled;
        try {
            await shopService.updateAutoProcess(shopId, newState);
            setIsAutoProcessEnabled(newState);
            toast.success(`Otomatik işlemler ${newState ? 'aktif' : 'pasif'} hale getirildi.`);
        } catch (err) { toast.error(getApiError(err, 'Ayarlar güncellenemedi.')); }
    };

    const requestStatusUpdate = (id: string, status: AppointmentStatus, label: string, actionText: string) =>
        setConfirmAction({ id, status, label, actionText });

    const handleStatusUpdate = async (id: string, status: AppointmentStatus) => {
        try {
            await appointmentService.updateStatus(id, status);
            toast.success('Randevu durumu güncellendi');
            const shop = await shopService.getMyShop();
            if (shop) {
                const result = await appointmentService.getShopAppointments(
                    shop.id, page, pageSize, statusFilter, searchTerm,
                    filterDate || undefined, filterEmployeeId || undefined, filterServiceId || undefined
                );
                setAppointments(result.items);
                setTotalCount(result.totalCount);
                setTotalPages(result.totalPages);
                loadWeeklyAppointments(shop.id);
            }
        } catch (err) { toast.error(getApiError(err, 'Durum güncellenemedi')); }
        finally { setConfirmAction(null); }
    };

    const getStatusBadge = (status: AppointmentStatus) => {
        switch (status) {
            case AppointmentStatus.Pending:   return <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold inline-flex items-center gap-1 shadow-sm"><AlertCircle className="w-3.5 h-3.5" /> Onay Bekliyor</span>;
            case AppointmentStatus.Confirmed: return <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold inline-flex items-center gap-1 shadow-sm"><CheckCircle className="w-3.5 h-3.5" /> Onaylandı</span>;
            case AppointmentStatus.Completed: return <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold inline-flex items-center gap-1 shadow-sm"><CheckCircle className="w-3.5 h-3.5" /> Tamamlandı</span>;
            case AppointmentStatus.Cancelled: return <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-semibold inline-flex items-center gap-1 shadow-sm"><XCircle className="w-3.5 h-3.5" /> İptal Edildi</span>;
            case AppointmentStatus.Rejected:  return <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold inline-flex items-center gap-1 shadow-sm"><XCircle className="w-3.5 h-3.5" /> Reddedildi</span>;
            default: return null;
        }
    };

    const getApptStyle = (status: AppointmentStatus) => {
        switch (status) {
            case AppointmentStatus.Pending:   return { bg: 'bg-amber-50 border-l-amber-400',  text: 'text-amber-900',  dot: 'bg-amber-400' };
            case AppointmentStatus.Confirmed: return { bg: 'bg-blue-50 border-l-blue-400',    text: 'text-blue-900',   dot: 'bg-blue-400' };
            case AppointmentStatus.Completed: return { bg: 'bg-emerald-50 border-l-emerald-400', text: 'text-emerald-900', dot: 'bg-emerald-400' };
            case AppointmentStatus.Cancelled: return { bg: 'bg-gray-50 border-l-gray-300',    text: 'text-gray-600',   dot: 'bg-gray-300' };
            case AppointmentStatus.Rejected:  return { bg: 'bg-red-50 border-l-red-400',      text: 'text-red-900',    dot: 'bg-red-400' };
            default:                          return { bg: 'bg-gray-50 border-l-gray-300',    text: 'text-gray-600',   dot: 'bg-gray-300' };
        }
    };

    const tabs = [
        { label: 'Tümü', value: undefined },
        { label: 'Onay Bekliyor', value: AppointmentStatus.Pending },
        { label: 'Onaylandı', value: AppointmentStatus.Confirmed },
        { label: 'Tamamlandı', value: AppointmentStatus.Completed },
        { label: 'İptal', value: AppointmentStatus.Cancelled },
        { label: 'Reddedildi', value: AppointmentStatus.Rejected },
    ];

    const visibleSlotCount = calendarEnd - calendarStart;
    const pendingCount = dayAppointments.filter(a => a.status === AppointmentStatus.Pending).length;
    const totalDuration = dayAppointments.reduce((s, a) => s + a.duration, 0);
    const totalRevenue = dayAppointments
        .filter(a => a.status === AppointmentStatus.Completed)
        .reduce((s, a) => s + a.price, 0);

    const legend = [
        { label: 'Onay Bekliyor', dot: 'bg-amber-400' },
        { label: 'Onaylandı',     dot: 'bg-blue-400' },
        { label: 'Tamamlandı',    dot: 'bg-emerald-400' },
        { label: 'İptal / Red',   dot: 'bg-red-400' },
    ];

    return (
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

            {/* ══════════════════════════════════════════
                CARD 1 — Haftalık Randevu Takvimi
            ══════════════════════════════════════════ */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-200">
                {/* Card header */}
                <div
                    onClick={() => toggleCard('weeklyCalendar')}
                    className="w-full p-5 sm:p-6 flex justify-between items-center hover:bg-gray-50 cursor-pointer transition-colors relative"
                >
                    <div className="flex items-center gap-3 pr-10">
                        <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                            <Calendar className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">Haftalık Randevu Takvimi</h2>
                            <p className="text-xs text-gray-500 mt-0.5">
                                {format(weekDays[0], 'd MMM', { locale: tr })} – {format(weekDays[6], 'd MMM yyyy', { locale: tr })} • Günlük randevu görünümü
                            </p>
                        </div>
                    </div>

                    {/* Summary badges (visible when closed) */}
                    {!openCards.weeklyCalendar && !weeklyLoading && (
                        <div className="hidden sm:flex items-center gap-2 mr-10">
                            <span className="text-xs bg-blue-50 text-blue-700 font-semibold px-2.5 py-1 rounded-full border border-blue-100">
                                {weeklyAppointments.length} randevu
                            </span>
                            {weeklyAppointments.filter(a => a.status === AppointmentStatus.Pending).length > 0 && (
                                <span className="text-xs bg-amber-50 text-amber-700 font-semibold px-2.5 py-1 rounded-full border border-amber-100 animate-pulse">
                                    {weeklyAppointments.filter(a => a.status === AppointmentStatus.Pending).length} bekliyor
                                </span>
                            )}
                        </div>
                    )}
                    {weeklyLoading && (
                        <div className="mr-10 animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500" />
                    )}

                    <div className="absolute right-5 sm:right-6 p-1 bg-gray-50 rounded-full text-gray-400">
                        {openCards.weeklyCalendar ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                </div>

                {openCards.weeklyCalendar && (
                    <div className="border-t border-gray-50 animate-in fade-in slide-in-from-top-4 duration-300">

                        {/* Legend + day summary bar */}
                        <div className="px-5 sm:px-6 py-3 bg-gray-50/80 border-b border-gray-100 flex flex-wrap items-center gap-x-6 gap-y-2">
                            <div className="flex items-center gap-3 flex-wrap">
                                {legend.map(l => (
                                    <span key={l.label} className="flex items-center gap-1.5 text-xs text-gray-600">
                                        <span className={`w-2.5 h-2.5 rounded-full ${l.dot}`} />
                                        {l.label}
                                    </span>
                                ))}
                            </div>
                            {dayAppointments.length > 0 && (
                                <div className="ml-auto flex items-center gap-4 text-xs text-gray-500">
                                    <span><span className="font-semibold text-gray-800">{dayAppointments.length}</span> randevu</span>
                                    {pendingCount > 0 && <span className="text-amber-600 font-semibold">{pendingCount} onay bekliyor</span>}
                                    <span><span className="font-semibold text-gray-800">{totalDuration}</span> dk toplam</span>
                                    {totalRevenue > 0 && <span className="text-emerald-600 font-semibold">₺{totalRevenue} tamamlandı</span>}
                                </div>
                            )}
                        </div>

                        {/* Day tabs */}
                        <div className="flex border-b border-gray-100 overflow-x-auto bg-white">
                            {weekDays.map((day, i) => {
                                const count = weeklyAppointments.filter(
                                    app => format(new Date(app.startTime), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
                                ).length;
                                const hasPending = weeklyAppointments.some(
                                    app => format(new Date(app.startTime), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
                                        && app.status === AppointmentStatus.Pending
                                );
                                const isSelected = selectedWeekDay === i;
                                const isToday = i === 0;
                                return (
                                    <button
                                        key={i}
                                        onClick={() => setSelectedWeekDay(i)}
                                        className={`relative flex-1 min-w-[80px] px-3 py-3.5 text-center transition-all border-b-2 ${
                                            isSelected
                                                ? 'border-blue-500 bg-blue-50'
                                                : 'border-transparent hover:bg-gray-50'
                                        }`}
                                    >
                                        {isToday && (
                                            <span className="absolute top-1 left-1/2 -translate-x-1/2 text-[9px] font-bold uppercase tracking-widest text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded-full leading-none">
                                                Bugün
                                            </span>
                                        )}
                                        <div className={`text-xs font-semibold uppercase tracking-wide mt-3 ${isSelected ? 'text-blue-600' : 'text-gray-400'}`}>
                                            {format(day, 'EEE', { locale: tr })}
                                        </div>
                                        <div className={`text-2xl font-bold leading-tight ${isSelected ? 'text-blue-700' : 'text-gray-700'}`}>
                                            {format(day, 'd')}
                                        </div>
                                        <div className={`text-xs ${isSelected ? 'text-blue-500' : 'text-gray-400'}`}>
                                            {format(day, 'MMM', { locale: tr })}
                                        </div>
                                        {count > 0 ? (
                                            <div className="mt-1.5 flex items-center justify-center gap-1">
                                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isSelected ? 'bg-blue-200 text-blue-800' : 'bg-gray-100 text-gray-600'}`}>
                                                    {count}
                                                </span>
                                                {hasPending && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />}
                                            </div>
                                        ) : (
                                            <div className="mt-1.5 text-xs text-gray-300">—</div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Timeline */}
                        <div className="overflow-y-auto bg-white" style={{ maxHeight: '460px' }}>
                            {dayAppointments.length === 0 ? (
                                <div className="py-16 text-center flex flex-col items-center gap-3">
                                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                                        <Calendar className="h-8 w-8 text-gray-300" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-500">Bu gün için randevu yok</p>
                                        <p className="text-xs text-gray-400 mt-1">
                                            {format(weekDays[selectedWeekDay], 'd MMMM yyyy', { locale: tr })} tarihinde henüz randevu alınmamış.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="relative" style={{ height: `${visibleSlotCount * SLOT_HEIGHT}px` }}>
                                    {/* Grid lines & time labels */}
                                    {Array.from({ length: visibleSlotCount }, (_, i) => {
                                        const absoluteSlot = calendarStart + i;
                                        const hour = Math.floor(absoluteSlot / 4);
                                        const min = (absoluteSlot % 4) * 15;
                                        const isHourMark = absoluteSlot % 4 === 0;
                                        return (
                                            <div
                                                key={i}
                                                className={`absolute left-0 right-0 ${isHourMark ? 'border-t border-gray-200' : 'border-t border-gray-100'}`}
                                                style={{ top: `${i * SLOT_HEIGHT}px`, height: `${SLOT_HEIGHT}px` }}
                                            >
                                                <span
                                                    className={`absolute left-2 top-1 text-xs tabular-nums select-none ${
                                                        isHourMark
                                                            ? 'font-bold text-gray-600'
                                                            : 'text-gray-300 text-[10px]'
                                                    }`}
                                                >
                                                    {`${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`}
                                                </span>
                                            </div>
                                        );
                                    })}

                                    {/* Current-time indicator (only for today) */}
                                    {selectedWeekDay === 0 && (() => {
                                        const now = new Date();
                                        const nowSlot = now.getHours() * 4 + now.getMinutes() / 15 - calendarStart;
                                        if (nowSlot < 0 || nowSlot > visibleSlotCount) return null;
                                        return (
                                            <div
                                                className="absolute left-0 right-0 z-10 flex items-center"
                                                style={{ top: `${nowSlot * SLOT_HEIGHT}px` }}
                                            >
                                                <div className="w-2.5 h-2.5 rounded-full bg-red-500 ml-[10%] shrink-0 shadow" />
                                                <div className="flex-1 h-px bg-red-400" />
                                            </div>
                                        );
                                    })()}

                                    {/* Appointment blocks */}
                                    {dayAppointments.map(app => {
                                        const startSlotRel = timeToAbsoluteSlot(app.startTime) - calendarStart;
                                        const durationSlots = Math.max(1, Math.ceil(app.duration / 15));
                                        const layout = appointmentLayout.get(app.id);
                                        if (!layout || startSlotRel < 0) return null;

                                        const { col, totalCols } = layout;
                                        const usablePct = 100 - TIME_COL_PCT;
                                        const leftPct = TIME_COL_PCT + (col / totalCols) * usablePct;
                                        const widthPct = usablePct / totalCols - 0.4;

                                        const top = startSlotRel * SLOT_HEIGHT;
                                        const height = durationSlots * SLOT_HEIGHT - 3;
                                        const style = getApptStyle(app.status);

                                        return (
                                            <div
                                                key={app.id}
                                                title={`${app.customerName} • ${app.serviceName} • ${app.employeeName} • ${format(new Date(app.startTime), 'HH:mm')}–${format(new Date(app.endTime), 'HH:mm')}`}
                                                className={`absolute rounded-lg border-l-4 px-2 py-1.5 overflow-hidden shadow-sm ${style.bg} ${style.text}`}
                                                style={{ top: `${top}px`, height: `${height}px`, left: `${leftPct}%`, width: `${widthPct}%` }}
                                            >
                                                {/* Time range — always shown */}
                                                <div className="flex items-center gap-1 mb-0.5">
                                                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${style.dot}`} />
                                                    <span className="text-[10px] font-semibold tabular-nums opacity-80">
                                                        {format(new Date(app.startTime), 'HH:mm')}–{format(new Date(app.endTime), 'HH:mm')}
                                                    </span>
                                                </div>
                                                {/* Customer name */}
                                                <div className="text-xs font-bold truncate leading-tight">{app.customerName}</div>
                                                {/* Service */}
                                                {height > 52 && (
                                                    <div className="flex items-center gap-0.5 mt-0.5">
                                                        <Scissors className="w-2.5 h-2.5 shrink-0 opacity-60" />
                                                        <span className="text-[10px] truncate opacity-80">{app.serviceName}</span>
                                                    </div>
                                                )}
                                                {/* Employee */}
                                                {height > 72 && (
                                                    <div className="flex items-center gap-0.5">
                                                        <User className="w-2.5 h-2.5 shrink-0 opacity-60" />
                                                        <span className="text-[10px] truncate opacity-70">{app.employeeName}</span>
                                                    </div>
                                                )}
                                                {/* Price */}
                                                {height > 96 && (
                                                    <div className="text-[10px] opacity-60 mt-0.5">₺{app.price}</div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* ══════════════════════════════════════════
                CARD 2 — Randevu Yönetimi
            ══════════════════════════════════════════ */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-200">
                {/* Card header */}
                <div
                    onClick={() => toggleCard('management')}
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

                    {!openCards.management && !loading && totalCount > 0 && (
                        <div className="hidden sm:flex items-center gap-2 mr-10">
                            <span className="text-xs bg-indigo-50 text-indigo-700 font-semibold px-2.5 py-1 rounded-full border border-indigo-100">
                                {totalCount} kayıt
                            </span>
                        </div>
                    )}

                    <div className="absolute right-5 sm:right-6 p-1 bg-gray-50 rounded-full text-gray-400">
                        {openCards.management ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                </div>

                {openCards.management && (
                    <div className="border-t border-gray-50 animate-in fade-in slide-in-from-top-4 duration-300">

                        {/* Filters */}
                        <div className="px-5 sm:px-6 py-4">
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
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Personel</label>
                                    <select
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm appearance-none"
                                        style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: `right 0.5rem center`, backgroundRepeat: `no-repeat`, backgroundSize: `1.5em 1.5em` }}
                                        value={filterEmployeeId}
                                        onChange={e => { setFilterEmployeeId(e.target.value); setPage(1); }}
                                    >
                                        <option value="">Tümü</option>
                                        {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Hizmet</label>
                                    <select
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm appearance-none"
                                        style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: `right 0.5rem center`, backgroundRepeat: `no-repeat`, backgroundSize: `1.5em 1.5em` }}
                                        value={filterServiceId}
                                        onChange={e => { setFilterServiceId(e.target.value); setPage(1); }}
                                    >
                                        <option value="">Tümü</option>
                                        {services.map(srv => <option key={srv.id} value={srv.id}>{srv.name}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Status Tabs */}
                        <div className="flex overflow-x-auto border-y border-gray-100 bg-gray-50/60">
                            {tabs.map(tab => (
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
                                        <select
                                            className="border-gray-200 bg-white rounded-lg text-sm p-1.5 shadow-sm appearance-none pr-7"
                                            style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: `right 0.25rem center`, backgroundRepeat: `no-repeat`, backgroundSize: `1.5em 1.5em` }}
                                            value={pageSize}
                                            onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
                                        >
                                            {[5, 10, 25, 50, 100].map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <p className="text-sm text-gray-600">
                                            Toplam <span className="font-semibold">{totalCount}</span> kayıttan {' '}
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
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Hizmet & Personel</th>
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

                                                        {/* Service & Employee */}
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm text-gray-900 flex items-center gap-1">
                                                                <Scissors className="h-3.5 w-3.5 text-gray-400" />
                                                                {appointment.serviceName}
                                                            </div>
                                                            <div className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                                                                <User className="h-3.5 w-3.5 text-gray-400" />
                                                                {appointment.employeeName}
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
                                                                {format(new Date(appointment.startTime), 'HH:mm', { locale: tr })}
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
                                                            <div className="flex justify-end gap-2">
                                                                {appointment.status === AppointmentStatus.Pending && (
                                                                    <>
                                                                        <Button size="sm" onClick={() => requestStatusUpdate(appointment.id, AppointmentStatus.Confirmed, 'Randevuyu Onayla', 'Bu randevuyu onaylamak istediğinize emin misiniz?')}>Onayla</Button>
                                                                        <Button size="sm" variant="danger" onClick={() => requestStatusUpdate(appointment.id, AppointmentStatus.Rejected, 'Randevuyu Reddet', 'Bu randevuyu reddetmek istediğinize emin misiniz?')}>Reddet</Button>
                                                                    </>
                                                                )}
                                                                {appointment.status === AppointmentStatus.Confirmed && new Date(appointment.startTime) <= new Date() && (
                                                                    <Button size="sm" variant="outline" onClick={() => requestStatusUpdate(appointment.id, AppointmentStatus.Completed, 'Randevuyu Tamamla', 'Bu randevunun tamamlandığını onaylıyor musunuz?')}>Tamamlandı</Button>
                                                                )}
                                                                {appointment.status === AppointmentStatus.Confirmed && (
                                                                    <Button size="sm" variant="danger" onClick={() => requestStatusUpdate(appointment.id, AppointmentStatus.Cancelled, 'Randevuyu İptal Et', 'Bu randevuyu iptal etmek istediğinize emin misiniz?')}>İptal</Button>
                                                                )}
                                                            </div>
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
                                                    <div className="text-sm font-semibold text-gray-800">{appointment.serviceName}</div>
                                                    <div className="text-sm text-gray-500 mt-0.5">Personel: {appointment.employeeName}</div>
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

                                                <div className="flex flex-wrap gap-2">
                                                    {appointment.status === AppointmentStatus.Pending && (
                                                        <>
                                                            <Button size="sm" className="flex-1" onClick={() => requestStatusUpdate(appointment.id, AppointmentStatus.Confirmed, 'Randevuyu Onayla', 'Bu randevuyu onaylamak istediğinize emin misiniz?')}>Onayla</Button>
                                                            <Button size="sm" variant="danger" className="flex-1" onClick={() => requestStatusUpdate(appointment.id, AppointmentStatus.Rejected, 'Randevuyu Reddet', 'Bu randevuyu reddetmek istediğinize emin misiniz?')}>Reddet</Button>
                                                        </>
                                                    )}
                                                    {appointment.status === AppointmentStatus.Confirmed && new Date(appointment.startTime) <= new Date() && (
                                                        <Button size="sm" variant="outline" className="flex-1" onClick={() => requestStatusUpdate(appointment.id, AppointmentStatus.Completed, 'Randevuyu Tamamla', 'Bu randevunun tamamlandığını onaylıyor musunuz?')}>Tamamlandı</Button>
                                                    )}
                                                    {appointment.status === AppointmentStatus.Confirmed && (
                                                        <Button size="sm" variant="danger" className="flex-1" onClick={() => requestStatusUpdate(appointment.id, AppointmentStatus.Cancelled, 'Randevuyu İptal Et', 'Bu randevuyu iptal etmek istediğinize emin misiniz?')}>İptal</Button>
                                                    )}
                                                </div>
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
                        <p className="text-gray-600 text-sm mb-6">{confirmAction.actionText}</p>
                        <div className="flex gap-3 justify-end">
                            <button onClick={() => setConfirmAction(null)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl">Vazgeç</button>
                            <button
                                onClick={() => handleStatusUpdate(confirmAction.id, confirmAction.status)}
                                className={`px-4 py-2 text-sm font-semibold rounded-xl text-white transition-colors ${
                                    confirmAction.status === AppointmentStatus.Rejected || confirmAction.status === AppointmentStatus.Cancelled
                                        ? 'bg-red-600 hover:bg-red-700' : 'bg-indigo-600 hover:bg-indigo-700'
                                }`}
                            >
                                Onayla
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};
