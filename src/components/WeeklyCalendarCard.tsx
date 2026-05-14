import React, { useMemo, useState } from 'react';
import { Calendar, ChevronDown, Scissors, User } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { tr } from 'date-fns/locale';
import { type Appointment, AppointmentStatus } from '../types/appointment';

// ─── Constants ──────────────────────────────────────────────────────────────
const SLOT_H = 56;       // px per 15-min slot
const TIME_PCT = 13;     // % width reserved for time labels

// ─── Helpers ────────────────────────────────────────────────────────────────
function timeToSlot(iso: string) {
    const d = new Date(iso);
    return d.getHours() * 4 + Math.floor(d.getMinutes() / 15);
}

function buildLayout(appts: Appointment[]) {
    const sorted = [...appts].sort((a, b) => +new Date(a.startTime) - +new Date(b.startTime));
    const cols: Appointment[][] = [];
    const map = new Map<string, number>();
    for (const app of sorted) {
        let placed = false;
        for (let c = 0; c < cols.length; c++) {
            if (+new Date(cols[c].at(-1)!.endTime) <= +new Date(app.startTime)) {
                cols[c].push(app); map.set(app.id, c); placed = true; break;
            }
        }
        if (!placed) { map.set(app.id, cols.length); cols.push([app]); }
    }
    const result = new Map<string, { col: number; totalCols: number }>();
    for (const [id, col] of map) result.set(id, { col, totalCols: cols.length });
    return result;
}

// ─── Status styling ─────────────────────────────────────────────────────────
const ST: Record<AppointmentStatus, { card: string; dot: string }> = {
    [AppointmentStatus.Pending]:   { card: 'bg-amber-50   border-l-amber-400   text-amber-900',   dot: 'bg-amber-400' },
    [AppointmentStatus.Confirmed]: { card: 'bg-sky-50     border-l-sky-400     text-sky-900',     dot: 'bg-sky-400' },
    [AppointmentStatus.Completed]: { card: 'bg-emerald-50 border-l-emerald-400 text-emerald-900', dot: 'bg-emerald-400' },
    [AppointmentStatus.Cancelled]: { card: 'bg-gray-50    border-l-gray-300    text-gray-500',    dot: 'bg-gray-300' },
    [AppointmentStatus.Rejected]:  { card: 'bg-red-50     border-l-red-400     text-red-900',     dot: 'bg-red-400' },
    [AppointmentStatus.NoShow]:    { card: 'bg-orange-50  border-l-orange-400  text-orange-900',  dot: 'bg-orange-400' },
};

const LEGEND = [
    { label: 'Onay Bekliyor', dot: 'bg-amber-400' },
    { label: 'Onaylandı',     dot: 'bg-sky-400' },
    { label: 'Tamamlandı',    dot: 'bg-emerald-400' },
];

// ─── Component ──────────────────────────────────────────────────────────────
interface WeeklyCalendarCardProps {
    appointments: Appointment[];
    loading: boolean;
    /** Salon view shows employee name inside each block */
    showEmployeeName?: boolean;
    defaultOpen?: boolean;
    /** How many days to show (default 7) */
    daysAhead?: number;
}

export const WeeklyCalendarCard: React.FC<WeeklyCalendarCardProps> = ({
    appointments,
    loading,
    showEmployeeName = false,
    defaultOpen = false,
    daysAhead = 7,
}) => {
    const [open, setOpen]   = useState(defaultOpen);
    const [selDay, setDay]  = useState(0);

    const weekDays = useMemo(() => Array.from({ length: daysAhead }, (_, i) => addDays(new Date(), i)), [daysAhead]);

    // İptal ve reddedilen randevuları takvimde göstermiyoruz — gereksiz yer kaplarlar
    const activeAppointments = useMemo(() =>
        appointments.filter(a =>
            a.status !== AppointmentStatus.Cancelled &&
            a.status !== AppointmentStatus.Rejected
        ),
        [appointments]
    );

    const dayAppts = useMemo(() => {
        const str = format(weekDays[selDay], 'yyyy-MM-dd');
        return activeAppointments.filter(a => format(new Date(a.startTime), 'yyyy-MM-dd') === str);
    }, [activeAppointments, weekDays, selDay]);

    const { calStart, calEnd } = useMemo(() => {
        if (!dayAppts.length) return { calStart: 8 * 4, calEnd: 18 * 4 };
        const starts = dayAppts.map(a => timeToSlot(a.startTime));
        const ends   = dayAppts.map(a => timeToSlot(a.endTime));
        return {
            calStart: Math.max(0, Math.min(...starts) - 4),
            calEnd:   Math.min(96, Math.max(...ends) + 4),
        };
    }, [dayAppts]);

    const layoutMap  = useMemo(() => buildLayout(dayAppts), [dayAppts]);
    const slotCount  = calEnd - calStart;

    const pending   = dayAppts.filter(a => a.status === AppointmentStatus.Pending).length;
    const dur       = dayAppts.reduce((s, a) => s + a.duration, 0);
    const rev       = dayAppts.filter(a => a.status === AppointmentStatus.Completed).reduce((s, a) => s + a.price, 0);
    const wkPending = activeAppointments.filter(a => a.status === AppointmentStatus.Pending).length;

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

            {/* ── Accordion header ── */}
            <button
                type="button"
                onClick={() => setOpen(v => !v)}
                className="w-full px-5 sm:px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50/70 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-primary-50 text-primary-600 rounded-xl shrink-0">
                        <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-base font-bold text-gray-900">{daysAhead === 7 ? 'Haftalık Takvim' : `${daysAhead} Günlük Takvim`}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                            {format(weekDays[0], 'd MMM', { locale: tr })} – {format(weekDays[weekDays.length - 1], 'd MMM yyyy', { locale: tr })}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    {!open && !loading && (
                        <div className="hidden sm:flex items-center gap-1.5">
                            <span className="text-xs bg-primary-50 text-primary-700 font-semibold px-2.5 py-1 rounded-full border border-primary-100">
                                {appointments.length} randevu
                            </span>
                            {wkPending > 0 && (
                                <span className="text-xs bg-amber-50 text-amber-700 font-semibold px-2.5 py-1 rounded-full border border-amber-100 animate-pulse">
                                    {wkPending} bekliyor
                                </span>
                            )}
                        </div>
                    )}
                    {loading && (
                        <div className="w-4 h-4 rounded-full border-2 border-primary-400 border-t-transparent animate-spin" />
                    )}
                    <div className="p-1.5 rounded-lg bg-gray-50 text-gray-400">
                        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
                    </div>
                </div>
            </button>

            {open && (
                <div className="border-t border-gray-100">

                    {/* ── Legend + daily stats ── */}
                    <div className="px-4 sm:px-6 py-2.5 bg-gray-50/80 border-b border-gray-100 flex flex-wrap items-center gap-x-5 gap-y-1.5">
                        <div className="flex flex-wrap gap-x-4 gap-y-1">
                            {LEGEND.map(l => (
                                <span key={l.label} className="inline-flex items-center gap-1.5 text-xs text-gray-500">
                                    <span className={`w-2 h-2 rounded-full shrink-0 ${l.dot}`} />
                                    {l.label}
                                </span>
                            ))}
                        </div>
                        {dayAppts.length > 0 && (
                            <div className="ml-auto flex flex-wrap items-center gap-3 text-xs">
                                <span className="font-semibold text-gray-600">{dayAppts.length} randevu</span>
                                {pending > 0 && <span className="text-amber-600 font-semibold">{pending} bekliyor</span>}
                                <span className="text-gray-400">{dur} dk</span>
                                {rev > 0 && <span className="text-emerald-600 font-semibold">₺{rev}</span>}
                            </div>
                        )}
                    </div>

                    {/* ── Day selector tabs ── */}
                    <div className="flex overflow-x-auto border-b border-gray-100 bg-white">
                        {weekDays.map((wd, i) => {
                            const dayStr    = format(wd, 'yyyy-MM-dd');
                            const count     = activeAppointments.filter(a => format(new Date(a.startTime), 'yyyy-MM-dd') === dayStr).length;
                            const hasPend   = activeAppointments.some(a => format(new Date(a.startTime), 'yyyy-MM-dd') === dayStr && a.status === AppointmentStatus.Pending);
                            const isSel     = selDay === i;
                            const isToday   = i === 0;

                            return (
                                <button
                                    type="button"
                                    key={i}
                                    onClick={() => setDay(i)}
                                    className={`relative flex-1 min-w-[72px] px-2 pt-5 pb-2.5 flex flex-col items-center gap-0.5 border-b-2 transition-all ${
                                        isSel
                                            ? 'border-primary-600 bg-primary-50/50'
                                            : 'border-transparent hover:bg-gray-50'
                                    }`}
                                >
                                    {/* Bugün pill */}
                                    {isToday && (
                                        <span className="absolute top-1 left-1/2 -translate-x-1/2 text-[8px] font-bold uppercase tracking-widest text-primary-600 bg-primary-100 px-1.5 py-0.5 rounded-full leading-none whitespace-nowrap">
                                            Bugün
                                        </span>
                                    )}

                                    {/* Gün kısaltması */}
                                    <span className={`text-[10px] font-semibold uppercase tracking-wider ${isSel ? 'text-primary-500' : 'text-gray-400'}`}>
                                        {format(wd, 'EEE', { locale: tr })}
                                    </span>

                                    {/* Tarih — dolu daire seçiliyse */}
                                    <span className={`w-8 h-8 flex items-center justify-center rounded-full text-lg font-black transition-all duration-150 ${
                                        isSel ? 'bg-primary-600 text-white shadow-sm shadow-primary-200' : 'text-gray-700'
                                    }`}>
                                        {format(wd, 'd')}
                                    </span>

                                    {/* Ay */}
                                    <span className={`text-[10px] ${isSel ? 'text-primary-400' : 'text-gray-300'}`}>
                                        {format(wd, 'MMM', { locale: tr })}
                                    </span>

                                    {/* Randevu sayısı */}
                                    {count > 0 ? (
                                        <div className="flex items-center gap-1 mt-0.5">
                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none ${
                                                isSel ? 'bg-primary-200 text-primary-800' : 'bg-gray-100 text-gray-500'
                                            }`}>
                                                {count}
                                            </span>
                                            {hasPend && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shrink-0" />}
                                        </div>
                                    ) : (
                                        <span className="text-[10px] text-gray-200 mt-0.5 leading-none">—</span>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* ── Timeline ── */}
                    <div className="overflow-y-auto bg-white" style={{ maxHeight: '500px' }}>
                        {dayAppts.length === 0 ? (
                            <div className="py-14 flex flex-col items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-gray-50 ring-1 ring-gray-100 flex items-center justify-center">
                                    <Calendar className="w-6 h-6 text-gray-300" />
                                </div>
                                <div className="text-center">
                                    <p className="text-sm font-semibold text-gray-400">Bu gün için randevu yok</p>
                                    <p className="text-xs text-gray-300 mt-0.5">
                                        {format(weekDays[selDay], 'd MMMM yyyy', { locale: tr })}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="relative select-none" style={{ height: `${slotCount * SLOT_H}px` }}>

                                {/* Grid satırları + saat etiketleri */}
                                {Array.from({ length: slotCount }, (_, i) => {
                                    const abs   = calStart + i;
                                    const h     = Math.floor(abs / 4);
                                    const m     = (abs % 4) * 15;
                                    const isHr  = abs % 4 === 0;
                                    return (
                                        <div
                                            key={i}
                                            className={`absolute left-0 right-0 ${isHr ? 'border-t border-gray-200' : 'border-t border-gray-100'}`}
                                            style={{ top: `${i * SLOT_H}px`, height: `${SLOT_H}px` }}
                                        >
                                            <span className={`absolute left-2 top-1 tabular-nums select-none leading-none ${
                                                isHr ? 'text-xs font-semibold text-gray-400' : 'text-[9px] text-gray-300'
                                            }`}>
                                                {`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`}
                                            </span>
                                        </div>
                                    );
                                })}

                                {/* Şu anki saat çizgisi (sadece bugün) */}
                                {selDay === 0 && (() => {
                                    const now = new Date();
                                    const rel = now.getHours() * 4 + now.getMinutes() / 15 - calStart;
                                    if (rel < 0 || rel > slotCount) return null;
                                    return (
                                        <div
                                            className="absolute left-0 right-0 z-20 flex items-center pointer-events-none"
                                            style={{ top: `${rel * SLOT_H}px` }}
                                        >
                                            <div
                                                className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm shadow-rose-200 shrink-0"
                                                style={{ marginLeft: `${TIME_PCT - 1}%` }}
                                            />
                                            <div className="flex-1 h-px bg-rose-400 opacity-70" />
                                        </div>
                                    );
                                })()}

                                {/* Randevu blokları */}
                                {dayAppts.map(app => {
                                    const startRel = timeToSlot(app.startTime) - calStart;
                                    const durSlots = Math.max(1, Math.ceil(app.duration / 15));
                                    const lyt = layoutMap.get(app.id);
                                    if (!lyt || startRel < 0) return null;

                                    const { col, totalCols } = lyt;
                                    const usable   = 100 - TIME_PCT;
                                    const leftPct  = TIME_PCT + (col / totalCols) * usable;
                                    const widthPct = usable / totalCols - 0.5;

                                    const top    = startRel * SLOT_H;
                                    const height = durSlots * SLOT_H - 3;
                                    const s      = ST[app.status] ?? ST[AppointmentStatus.Cancelled];

                                    return (
                                        <div
                                            key={app.id}
                                            title={`${app.customerName} • ${app.serviceName}${showEmployeeName ? ` • ${app.employeeName}` : ''} • ${format(new Date(app.startTime), 'HH:mm')}–${format(new Date(app.endTime), 'HH:mm')}`}
                                            className={`absolute rounded-lg border-l-[3px] px-2 py-1.5 overflow-hidden shadow-sm hover:shadow-md hover:z-10 cursor-default transition-shadow ${s.card}`}
                                            style={{ top: `${top}px`, height: `${height}px`, left: `${leftPct}%`, width: `${widthPct}%` }}
                                        >
                                            {/* Saat aralığı */}
                                            <div className="flex items-center gap-1 mb-0.5">
                                                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.dot}`} />
                                                <span className="text-[10px] font-semibold tabular-nums opacity-75">
                                                    {format(new Date(app.startTime), 'HH:mm')}–{format(new Date(app.endTime), 'HH:mm')}
                                                </span>
                                            </div>
                                            {/* Müşteri */}
                                            <div className="text-xs font-bold truncate leading-tight">{app.customerName}</div>
                                            {/* Hizmet */}
                                            {height > SLOT_H && (
                                                <div className="flex items-center gap-1 mt-0.5 opacity-70">
                                                    <Scissors className="w-2.5 h-2.5 shrink-0" />
                                                    <span className="text-[10px] truncate">{app.serviceName}</span>
                                                </div>
                                            )}
                                            {/* Personel (salon görünümü) */}
                                            {showEmployeeName && height > SLOT_H * 1.5 && (
                                                <div className="flex items-center gap-1 opacity-60">
                                                    <User className="w-2.5 h-2.5 shrink-0" />
                                                    <span className="text-[10px] truncate">{app.employeeName}</span>
                                                </div>
                                            )}
                                            {/* Fiyat */}
                                            {height > SLOT_H * 2 && (
                                                <div className="text-[10px] opacity-50 mt-0.5">₺{app.price}</div>
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
    );
};
