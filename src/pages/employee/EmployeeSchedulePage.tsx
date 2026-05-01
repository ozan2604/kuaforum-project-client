import React, { useEffect, useState } from 'react';
import { employeeService } from '../../api/employee.service';
import { Button } from '../../components/Button';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { toast } from 'react-hot-toast';
import { Clock } from 'lucide-react';
import { getApiError } from '../../utils/storage';
import { ScheduleEditor, SCHEDULE_DAYS } from '../../components/ScheduleEditor';
import type { DaySchedule } from '../../components/ScheduleEditor';

export const EmployeeSchedulePage: React.FC = () => {
    const [schedule, setSchedule] = useState<DaySchedule[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

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

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <ScheduleEditor schedule={schedule} onChange={setSchedule} />
            </div>

            <div className="flex justify-end">
                <Button onClick={handleSave} isLoading={saving}>
                    Kaydet
                </Button>
            </div>
        </div>
    );
};
