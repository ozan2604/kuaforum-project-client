import React from 'react';

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

export const ScheduleEditor: React.FC<ScheduleEditorProps> = ({ schedule, onChange }) => {
    const todayDow = new Date().getDay();

    const update = (i: number, field: keyof DaySchedule, value: any) => {
        const next = [...schedule];
        next[i] = { ...next[i], [field]: value };
        onChange(next);
    };

    return (
        <div className="divide-y divide-gray-100">
            {schedule.map((day, i) => {
                const isToday   = day.dayOfWeek === todayDow;
                const dayMeta   = SCHEDULE_DAYS[i] ?? { name: `Gün ${i}`, short: '' };
                const hasBreak  = !!(day.breakStartTime && day.breakEndTime);

                return (
                    <div
                        key={day.dayOfWeek}
                        className={`px-5 py-4 transition-colors ${isToday ? 'bg-primary-50/30' : ''}`}
                    >
                        {/* ── Row header: toggle + day name + preview ── */}
                        <div className="flex items-center gap-3">
                            {/* Toggle switch */}
                            <button
                                type="button"
                                role="switch"
                                aria-checked={day.isWorking}
                                onClick={() => update(i, 'isWorking', !day.isWorking)}
                                className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-1 ${
                                    day.isWorking ? 'bg-primary-600' : 'bg-gray-200'
                                }`}
                            >
                                <span
                                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                        day.isWorking ? 'translate-x-4' : 'translate-x-0'
                                    }`}
                                />
                            </button>

                            {/* Day name + today badge */}
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                                <span className={`text-sm font-semibold truncate ${day.isWorking ? 'text-gray-900' : 'text-gray-400'}`}>
                                    {dayMeta.name}
                                </span>
                                {isToday && (
                                    <span className="shrink-0 text-[9px] font-bold uppercase tracking-widest text-primary-600 bg-primary-100 px-1.5 py-0.5 rounded-full leading-none">
                                        Bugün
                                    </span>
                                )}
                            </div>

                            {/* Hours preview (desktop) */}
                            <div className="hidden sm:flex items-center gap-2 shrink-0 text-xs tabular-nums">
                                {day.isWorking ? (
                                    <>
                                        <span className="text-gray-500 font-medium">
                                            {day.startTime || '–'} – {day.endTime || '–'}
                                        </span>
                                        {hasBreak && (
                                            <span className="inline-flex items-center gap-1 text-orange-400">
                                                <span>☕</span>
                                                <span>{day.breakStartTime}–{day.breakEndTime}</span>
                                            </span>
                                        )}
                                    </>
                                ) : (
                                    <span className="text-gray-300 italic">Kapalı</span>
                                )}
                            </div>
                        </div>

                        {/* ── Time inputs (only when working) ── */}
                        {day.isWorking && (
                            <div className="mt-3 ml-12 grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <div>
                                    <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
                                        Başlangıç
                                    </label>
                                    <input
                                        type="time"
                                        value={day.startTime}
                                        onChange={e => update(i, 'startTime', e.target.value)}
                                        className="w-full text-sm border border-gray-200 rounded-lg px-2.5 py-2 bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/30 focus-visible:border-primary-400 transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
                                        Bitiş
                                    </label>
                                    <input
                                        type="time"
                                        value={day.endTime}
                                        onChange={e => update(i, 'endTime', e.target.value)}
                                        className="w-full text-sm border border-gray-200 rounded-lg px-2.5 py-2 bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/30 focus-visible:border-primary-400 transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
                                        Mola Başlangıç
                                    </label>
                                    <input
                                        type="time"
                                        value={day.breakStartTime ?? ''}
                                        onChange={e => update(i, 'breakStartTime', e.target.value)}
                                        className="w-full text-sm border border-gray-200 rounded-lg px-2.5 py-2 bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/30 focus-visible:border-primary-400 transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
                                        Mola Bitiş
                                    </label>
                                    <input
                                        type="time"
                                        value={day.breakEndTime ?? ''}
                                        onChange={e => update(i, 'breakEndTime', e.target.value)}
                                        className="w-full text-sm border border-gray-200 rounded-lg px-2.5 py-2 bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/30 focus-visible:border-primary-400 transition-colors"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};
