import React, { useState } from 'react';
import { Coffee, Copy, RotateCcw } from 'lucide-react';

export const SCHEDULE_DAYS = [
    { index: 1, name: 'Pazartesi', short: 'Pts' },
    { index: 2, name: 'Salı',      short: 'Sal' },
    { index: 3, name: 'Çarşamba',  short: 'Çar' },
    { index: 4, name: 'Perşembe',  short: 'Per' },
    { index: 5, name: 'Cuma',      short: 'Cum' },
    { index: 6, name: 'Cumartesi', short: 'Cts' },
    { index: 0, name: 'Pazar',     short: 'Paz' },
];

export interface DaySchedule {
    dayOfWeek: number;
    isWorking: boolean;
    startTime: string;
    endTime: string;
    breakStartTime: string;
    breakEndTime: string;
}

interface ScheduleEditorProps {
    schedule: DaySchedule[];
    onChange: (updated: DaySchedule[]) => void;
}

// Başlangıç için: 00:00 – 23:30
const START_SLOTS: string[] = [];
for (let h = 0; h <= 23; h++) {
    START_SLOTS.push(`${String(h).padStart(2, '0')}:00`);
    if (h < 23) START_SLOTS.push(`${String(h).padStart(2, '0')}:30`);
}

// Bitiş için: 00:30 – 23:30 (backend regex 00-23 kabul eder)
const END_SLOTS: string[] = [];
for (let h = 0; h <= 23; h++) {
    if (h > 0) END_SLOTS.push(`${String(h).padStart(2, '0')}:00`);
    END_SLOTS.push(`${String(h).padStart(2, '0')}:30`);
}

/* ─── Time select ─────────────────────────────────────────────────── */
const TSelect: React.FC<{
    value: string;
    onChange: (v: string) => void;
    options: string[];
    error?: boolean;
    amber?: boolean;
}> = ({ value, onChange, options, error, amber }) => (
    <div className="relative shrink-0">
        <select
            value={value || ''}
            onChange={e => onChange(e.target.value)}
            className={`
                appearance-none w-[78px] text-sm font-semibold cursor-pointer
                rounded-xl border px-2.5 py-2 pr-6 transition-all
                focus:outline-none focus:ring-2
                ${error
                    ? 'border-red-300 bg-red-50 text-red-600 focus:ring-red-100'
                    : value
                        ? amber
                            ? 'border-amber-200 bg-amber-50 text-amber-700 hover:border-amber-300 focus:border-amber-400 focus:ring-amber-100'
                            : 'border-gray-200 bg-white text-gray-800 hover:border-gray-300 focus:border-primary-400 focus:ring-primary-100'
                        : 'border-dashed border-gray-300 bg-gray-50 text-gray-400 hover:border-gray-400'
                }
            `}
        >
            <option value="">--:--</option>
            {options.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <svg className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
    </div>
);

/* ─── Toggle ──────────────────────────────────────────────────────── */
const Toggle: React.FC<{ on: boolean; toggle: () => void }> = ({ on, toggle }) => (
    <button
        type="button"
        role="switch"
        aria-checked={on}
        onClick={toggle}
        className={`relative inline-flex h-[22px] w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${on ? 'bg-primary-600' : 'bg-gray-200'}`}
    >
        <span className={`pointer-events-none inline-block h-[18px] w-[18px] rounded-full bg-white shadow transition-transform duration-200 ${on ? 'translate-x-[18px]' : 'translate-x-0'}`} />
    </button>
);

const Sep = () => <span className="text-gray-300 font-bold shrink-0 select-none">—</span>;

/* ─── ScheduleEditor ──────────────────────────────────────────────── */
export const ScheduleEditor: React.FC<ScheduleEditorProps> = ({ schedule, onChange }) => {
    const todayDow = new Date().getDay();

    const [molaOpen, setMolaOpen] = useState<Set<number>>(() =>
        new Set(schedule.flatMap((d, i) => (d.breakStartTime || d.breakEndTime) ? [i] : []))
    );

    const patch = (i: number, p: Partial<DaySchedule>) =>
        onChange(schedule.map((d, idx) => idx === i ? { ...d, ...p } : d));

    const openMola = (i: number) =>
        setMolaOpen(prev => new Set([...prev, i]));

    const temizle = (i: number) => {
        setMolaOpen(prev => { const s = new Set(prev); s.delete(i); return s; });
        patch(i, { startTime: '', endTime: '', breakStartTime: '', breakEndTime: '' });
    };

    const applyFirst = () => {
        const src = schedule.find(d => d.isWorking);
        if (!src) return;
        onChange(schedule.map(d => d.isWorking
            ? { ...d, startTime: src.startTime, endTime: src.endTime, breakStartTime: src.breakStartTime, breakEndTime: src.breakEndTime }
            : d
        ));
    };

    const workingCount = schedule.filter(d => d.isWorking).length;

    return (
        <div className="px-4 sm:px-6 pt-2 pb-5 space-y-1">
            {workingCount > 1 && (
                <div className="flex justify-end pb-1">
                    <button
                        type="button"
                        onClick={applyFirst}
                        className="inline-flex items-center gap-1.5 text-[11px] text-gray-400 hover:text-primary-600 transition-colors px-2 py-1 rounded-lg hover:bg-primary-50"
                    >
                        <Copy className="h-3 w-3" />
                        İlk günü hepsine uygula
                    </button>
                </div>
            )}

            {schedule.map((day, i) => {
                const meta        = SCHEDULE_DAYS[i] ?? { name: `Gün ${i}` };
                const isToday     = day.dayOfWeek === todayDow;
                const molaVisible = molaOpen.has(i);
                const hasTimes    = !!(day.breakStartTime && day.breakEndTime);

                const timeErr = day.isWorking && !!day.startTime && !!day.endTime
                    && day.endTime <= day.startTime;

                const brkErr = hasTimes && (
                    day.breakEndTime <= day.breakStartTime ||
                    day.breakStartTime < day.startTime    ||
                    day.breakEndTime > day.endTime
                );

                // Başlangıç: seçilen bitişten küçük tüm slotlar
                const startOpts = START_SLOTS.filter(t =>
                    !day.endTime || t < day.endTime
                );

                // Bitiş: seçilen başlangıçtan büyük tüm slotlar (24:00 dahil)
                const endOpts = END_SLOTS.filter(t =>
                    !day.startTime || t > day.startTime
                );

                // Mola başlangıç: startTime'dan (dahil) endTime'a kadar (hariç)
                const brkStartOpts = START_SLOTS.filter(t =>
                    (!day.startTime || t >= day.startTime) &&
                    (!day.endTime   || t <  day.endTime)
                );

                // Mola bitiş: breakStart'tan büyük, endTime'a eşit dahil
                const brkEndOpts = END_SLOTS.filter(t =>
                    (!day.breakStartTime || t > day.breakStartTime) &&
                    (!day.endTime        || t <= day.endTime)
                );

                return (
                    <div
                        key={day.dayOfWeek}
                        className={`rounded-2xl px-3 sm:px-4 pt-3 pb-3 transition-colors
                            ${day.isWorking
                                ? isToday
                                    ? 'bg-primary-50/50 border border-primary-100'
                                    : 'bg-white border border-gray-100 shadow-sm'
                                : 'border border-transparent'
                            }`}
                    >
                        {/* toggle + gün adı + özet */}
                        <div className="flex items-center gap-3">
                            <Toggle on={day.isWorking} toggle={() => patch(i, { isWorking: !day.isWorking })} />

                            <span className={`text-sm font-semibold min-w-[76px] ${day.isWorking ? 'text-gray-900' : 'text-gray-400'}`}>
                                {meta.name}
                                {isToday && (
                                    <span className="ml-1.5 text-[9px] font-bold uppercase tracking-widest text-primary-500 bg-primary-100 px-1.5 py-0.5 rounded-full align-middle">
                                        Bugün
                                    </span>
                                )}
                            </span>

                            <div className="ml-auto text-xs tabular-nums text-right shrink-0">
                                {day.isWorking ? (
                                    <span className={`font-medium ${timeErr ? 'text-red-400' : 'text-gray-400'}`}>
                                        {day.startTime || '–'} – {day.endTime || '–'}
                                        {hasTimes && !brkErr && (
                                            <span className="ml-1.5 text-amber-400">
                                                ☕ {day.breakStartTime}–{day.breakEndTime}
                                            </span>
                                        )}
                                    </span>
                                ) : (
                                    <span className="text-gray-300 italic">Kapalı</span>
                                )}
                            </div>
                        </div>

                        {/* Saatler */}
                        {day.isWorking && (
                            <div className="mt-2.5 ml-[52px] space-y-2">

                                <div className="flex items-center gap-1.5 flex-wrap">
                                    <TSelect
                                        value={day.startTime}
                                        onChange={v => patch(i, { startTime: v })}
                                        options={startOpts}
                                    />
                                    <Sep />
                                    <TSelect
                                        value={day.endTime}
                                        onChange={v => patch(i, { endTime: v })}
                                        options={endOpts}
                                        error={timeErr}
                                    />

                                    {!molaVisible && (
                                        <button
                                            type="button"
                                            onClick={() => openMola(i)}
                                            className="ml-1 inline-flex items-center gap-1 text-xs font-medium text-gray-400 hover:text-amber-600 transition-colors px-2 py-[7px] rounded-xl border border-dashed border-gray-200 hover:border-amber-300 hover:bg-amber-50"
                                        >
                                            <Coffee className="h-3.5 w-3.5" />
                                            Mola Ekle
                                        </button>
                                    )}
                                </div>

                                {timeErr && <p className="text-xs text-red-400">Bitiş başlangıçtan sonra olmalı.</p>}

                                {molaVisible && (
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-1.5">
                                            <Coffee className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                                            <TSelect
                                                value={day.breakStartTime}
                                                onChange={v => patch(i, { breakStartTime: v })}
                                                options={brkStartOpts}
                                                error={brkErr}
                                                amber
                                            />
                                            <Sep />
                                            <TSelect
                                                value={day.breakEndTime}
                                                onChange={v => patch(i, { breakEndTime: v })}
                                                options={brkEndOpts}
                                                error={brkErr}
                                                amber
                                            />
                                            <button
                                                type="button"
                                                onClick={() => temizle(i)}
                                                title="Mola ve çalışma saatlerini sıfırla"
                                                className="shrink-0 inline-flex items-center gap-1 text-[11px] font-medium text-gray-400 hover:text-red-500 transition-colors px-1.5 py-1 rounded-lg hover:bg-red-50"
                                            >
                                                <RotateCcw className="h-3 w-3" />
                                                <span>Temizle</span>
                                            </button>
                                        </div>
                                        {brkErr && (
                                            <p className="text-xs text-amber-500">
                                                Mola çalışma saatleri içinde olmalı.
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};
