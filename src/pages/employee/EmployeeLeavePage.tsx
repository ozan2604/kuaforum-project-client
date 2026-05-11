import React, { useEffect, useState } from 'react';
import { employeeService } from '../../api/employee.service';
import { type EmployeeLeaveDate } from '../../types/employee';
import { Button } from '../../components/Button';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { toast } from 'react-hot-toast';
import { getApiError } from '../../utils/storage';
import { CalendarOff, Plus, Trash2, X } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';
import { createPortal } from 'react-dom';

export const EmployeeLeavePage: React.FC = () => {
    const [leaveDates, setLeaveDates] = useState<EmployeeLeaveDate[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);
    const [newDate, setNewDate] = useState('');
    const [newReason, setNewReason] = useState('');
    const [adding, setAdding] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const load = async () => {
        try {
            const data = await employeeService.getMyLeaveDates();
            setLeaveDates(data.sort((a, b) => a.leaveDate.localeCompare(b.leaveDate)));
        } catch (err) {
            toast.error(getApiError(err, 'İzin günleri yüklenemedi'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const handleAdd = async () => {
        if (!newDate) { toast.error('Lütfen bir tarih seçin'); return; }
        setAdding(true);
        try {
            await employeeService.addMyLeaveDate(newDate, newReason || undefined);
            toast.success('İzin günü eklendi');
            setShowAdd(false);
            setNewDate('');
            setNewReason('');
            await load();
        } catch (err) {
            toast.error(getApiError(err, 'İzin günü eklenemedi'));
        } finally {
            setAdding(false);
        }
    };

    const handleDelete = async (id: string) => {
        setDeletingId(id);
        try {
            await employeeService.removeMyLeaveDate(id);
            toast.success('İzin günü silindi');
            setLeaveDates(prev => prev.filter(l => l.id !== id));
        } catch (err) {
            toast.error(getApiError(err, 'Silinemedi'));
        } finally {
            setDeletingId(null);
        }
    };

    const todayStr = new Date().toISOString().split('T')[0];

    const upcoming = leaveDates.filter(l => l.leaveDate >= todayStr);
    const past = leaveDates.filter(l => l.leaveDate < todayStr);

    if (loading) return <LoadingSpinner />;

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                        <CalendarOff className="h-7 w-7 text-indigo-600" />
                        İzin Günlerim
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">İzinli olduğunuz günlerde müşteriler randevu alamaz.</p>
                </div>
                <Button onClick={() => setShowAdd(true)}>
                    <Plus className="h-4 w-4 mr-1" /> İzin Ekle
                </Button>
            </div>

            {/* Upcoming leaves */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                    <h2 className="font-semibold text-gray-800">Yaklaşan İzinler</h2>
                </div>
                {upcoming.length === 0 ? (
                    <div className="py-12 text-center">
                        <div className="bg-gray-100 p-4 rounded-full w-fit mx-auto mb-3">
                            <CalendarOff className="h-6 w-6 text-gray-400" />
                        </div>
                        <p className="text-gray-500 text-sm">Yaklaşan izin günü yok</p>
                        <p className="text-gray-400 text-xs mt-0.5">Eklemek için "İzin Ekle" butonunu kullanın</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {upcoming.map(leave => (
                            <div key={leave.id} className="px-5 py-4 flex items-center gap-4">
                                <div className="bg-indigo-50 rounded-xl px-3 py-2 text-center min-w-[56px]">
                                    <p className="text-xs text-indigo-500 font-medium">
                                        {format(parseISO(leave.leaveDate), 'MMM', { locale: tr }).toUpperCase()}
                                    </p>
                                    <p className="text-xl font-bold text-indigo-700">
                                        {format(parseISO(leave.leaveDate), 'd', { locale: tr })}
                                    </p>
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-semibold text-gray-900">
                                        {format(parseISO(leave.leaveDate), 'EEEE, d MMMM yyyy', { locale: tr })}
                                    </p>
                                    {leave.reason && (
                                        <p className="text-xs text-gray-500 mt-0.5">{leave.reason}</p>
                                    )}
                                </div>
                                <button
                                    onClick={() => handleDelete(leave.id)}
                                    disabled={deletingId === leave.id}
                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                    title="Sil"
                                >
                                    {deletingId === leave.id
                                        ? <div className="h-4 w-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                                        : <Trash2 className="h-4 w-4" />
                                    }
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Past leaves */}
            {past.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100">
                        <h2 className="font-semibold text-gray-700 text-sm">Geçmiş İzinler</h2>
                    </div>
                    <div className="divide-y divide-gray-50">
                        {past.map(leave => (
                            <div key={leave.id} className="px-5 py-3 flex items-center gap-4 opacity-60">
                                <div className="bg-gray-100 rounded-xl px-3 py-2 text-center min-w-[56px]">
                                    <p className="text-xs text-gray-500 font-medium">
                                        {format(parseISO(leave.leaveDate), 'MMM', { locale: tr }).toUpperCase()}
                                    </p>
                                    <p className="text-xl font-bold text-gray-600">
                                        {format(parseISO(leave.leaveDate), 'd', { locale: tr })}
                                    </p>
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-700">
                                        {format(parseISO(leave.leaveDate), 'EEEE, d MMMM yyyy', { locale: tr })}
                                    </p>
                                    {leave.reason && (
                                        <p className="text-xs text-gray-500 mt-0.5">{leave.reason}</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Add modal */}
            {showAdd && createPortal(
                <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/50">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="text-lg font-bold text-gray-900">İzin Günü Ekle</h3>
                            <button onClick={() => setShowAdd(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tarih *</label>
                                <input
                                    type="date"
                                    min={todayStr}
                                    value={newDate}
                                    onChange={e => setNewDate(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama (İsteğe bağlı)</label>
                                <input
                                    type="text"
                                    value={newReason}
                                    onChange={e => setNewReason(e.target.value)}
                                    placeholder="örn: Sağlık izni, Tatil..."
                                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowAdd(false)}
                                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                            >
                                Vazgeç
                            </button>
                            <Button onClick={handleAdd} isLoading={adding} className="flex-1">
                                Ekle
                            </Button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};
