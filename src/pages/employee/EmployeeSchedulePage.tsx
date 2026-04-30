import React, { useEffect, useState } from 'react';
import { employeeService } from '../../api/employee.service';
import { Button } from '../../components/Button';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { toast } from 'react-hot-toast';
import { Clock } from 'lucide-react';
import { getApiError } from '../../utils/storage';

const DAYS = [
    { index: 1, name: 'Pazartesi' },
    { index: 2, name: 'Salı' },
    { index: 3, name: 'Çarşamba' },
    { index: 4, name: 'Perşembe' },
    { index: 5, name: 'Cuma' },
    { index: 6, name: 'Cumartesi' },
    { index: 0, name: 'Pazar' },
];

interface DaySchedule {
    dayOfWeek: number;
    isWorking: boolean;
    startTime: string;
    endTime: string;
    breakStartTime: string;
    breakEndTime: string;
}

export const EmployeeSchedulePage: React.FC = () => {
    const [schedule, setSchedule] = useState<DaySchedule[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const load = async () => {
            try {
                const data = await employeeService.getMySchedule();
                const full = DAYS.map((d) => {
                    const existing = data.find((s) => s.dayOfWeek === d.index);
                    return existing
                        ? {
                              dayOfWeek: d.index,
                              isWorking: existing.isWorking,
                              startTime: existing.startTime ?? '09:00',
                              endTime: existing.endTime ?? '18:00',
                              breakStartTime: existing.breakStartTime ?? '',
                              breakEndTime: existing.breakEndTime ?? '',
                          }
                        : {
                              dayOfWeek: d.index,
                              isWorking: false,
                              startTime: '09:00',
                              endTime: '18:00',
                              breakStartTime: '',
                              breakEndTime: '',
                          };
                });
                setSchedule(full);
            } catch (err) {
                toast.error(getApiError(err, 'Çalışma saatleri yüklenemedi.'));
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const update = (index: number, field: keyof DaySchedule, value: any) => {
        setSchedule((prev) => {
            const next = [...prev];
            next[index] = { ...next[index], [field]: value };
            return next;
        });
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await employeeService.updateMySchedule({ schedules: schedule });
            toast.success('Çalışma saatleri başarıyla güncellendi.');
        } catch (err) {
            toast.error(getApiError(err, 'Çalışma saatleri güncellenemedi.'));
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                    <Clock className="h-7 w-7 text-primary-600" />
                    Çalışma Saatlerim
                </h1>
                <Button onClick={handleSave} isLoading={saving}>
                    Kaydet
                </Button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-100">
                {schedule.map((day, index) => (
                    <div key={day.dayOfWeek} className="px-5 py-4 flex flex-col md:flex-row md:items-center gap-4">
                        <div className="w-32 flex items-center gap-2 shrink-0">
                            <input
                                type="checkbox"
                                id={`day-${day.dayOfWeek}`}
                                checked={day.isWorking}
                                onChange={(e) => update(index, 'isWorking', e.target.checked)}
                                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                            />
                            <label htmlFor={`day-${day.dayOfWeek}`} className="font-medium text-gray-900 select-none cursor-pointer">
                                {DAYS[index].name}
                            </label>
                        </div>

                        {day.isWorking ? (
                            <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-3">
                                <div>
                                    <label className="text-xs text-gray-500 block mb-1">Başlangıç</label>
                                    <input
                                        type="time"
                                        value={day.startTime}
                                        onChange={(e) => update(index, 'startTime', e.target.value)}
                                        className="w-full text-sm border border-gray-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-300"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 block mb-1">Bitiş</label>
                                    <input
                                        type="time"
                                        value={day.endTime}
                                        onChange={(e) => update(index, 'endTime', e.target.value)}
                                        className="w-full text-sm border border-gray-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-300"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 block mb-1">Mola Başlangıç</label>
                                    <input
                                        type="time"
                                        value={day.breakStartTime}
                                        onChange={(e) => update(index, 'breakStartTime', e.target.value)}
                                        className="w-full text-sm border border-gray-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-300"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 block mb-1">Mola Bitiş</label>
                                    <input
                                        type="time"
                                        value={day.breakEndTime}
                                        onChange={(e) => update(index, 'breakEndTime', e.target.value)}
                                        className="w-full text-sm border border-gray-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-300"
                                    />
                                </div>
                            </div>
                        ) : (
                            <span className="text-sm text-gray-400 italic">Çalışmıyor</span>
                        )}
                    </div>
                ))}
            </div>

            <div className="flex justify-end">
                <Button onClick={handleSave} isLoading={saving}>
                    Kaydet
                </Button>
            </div>
        </div>
    );
};
