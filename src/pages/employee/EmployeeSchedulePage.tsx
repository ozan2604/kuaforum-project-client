import React, { useEffect, useState, useCallback } from 'react';
import { employeeService } from '../../api/employee.service';
import { Button } from '../../components/Button';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { toast } from 'react-hot-toast';
import { Clock } from 'lucide-react';
import { getApiError } from '../../utils/storage';
import { ScheduleEditor, SCHEDULE_DAYS } from '../../components/ScheduleEditor';
import type { DaySchedule } from '../../components/ScheduleEditor';
import { useUnsavedChanges } from '../../context/UnsavedChangesContext';

export const EmployeeSchedulePage: React.FC = () => {
    const [schedule, setSchedule] = useState<DaySchedule[]>([]);
    const [savedSchedule, setSavedSchedule] = useState<DaySchedule[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const { setIsDirty } = useUnsavedChanges();

    const isDirty = JSON.stringify(schedule) !== JSON.stringify(savedSchedule);

    // Senkronize context dirty durumunu
    useEffect(() => {
        setIsDirty(isDirty);
    }, [isDirty, setIsDirty]);

    // Sayfa unmount olunca dirty'yi temizle
    useEffect(() => {
        return () => setIsDirty(false);
    }, [setIsDirty]);

    // Tarayıcı kapat / sekme kapat / yenile
    useEffect(() => {
        const handler = (e: BeforeUnloadEvent) => {
            if (!isDirty) return;
            e.preventDefault();
        };
        window.addEventListener('beforeunload', handler);
        return () => window.removeEventListener('beforeunload', handler);
    }, [isDirty]);

    useEffect(() => {
        const load = async () => {
            try {
                const data = await employeeService.getMySchedule();
                const full = SCHEDULE_DAYS.map((d) => {
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
                setSavedSchedule(full);
            } catch (err) {
                toast.error(getApiError(err, 'Çalışma saatleri yüklenemedi.'));
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            await employeeService.updateMySchedule({ schedules: schedule });
            setSavedSchedule(schedule);
            toast.success('Çalışma saatleri güncellendi.');
        } catch (err) {
            toast.error(getApiError(err, 'Çalışma saatleri güncellenemedi.'));
        } finally {
            setSaving(false);
        }
    };

    const handleScheduleChange = useCallback((updated: DaySchedule[]) => {
        setSchedule(updated);
    }, []);

    if (loading) return <LoadingSpinner />;

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                    <Clock className="h-7 w-7 text-primary-600" />
                    Çalışma Saatlerim
                </h1>
                {isDirty && (
                    <span className="text-xs text-amber-600 font-medium bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
                        Kaydedilmemiş değişiklikler
                    </span>
                )}
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <ScheduleEditor schedule={schedule} onChange={handleScheduleChange} />
            </div>

            <div className="flex justify-end">
                <Button onClick={handleSave} isLoading={saving} disabled={!isDirty}>
                    Kaydet
                </Button>
            </div>
        </div>
    );
};
