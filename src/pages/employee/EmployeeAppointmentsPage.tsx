import React, { useEffect, useState } from 'react';
import { Button } from '../../components/Button';
import { appointmentService } from '../../api/appointment.service';
import { type Appointment, AppointmentStatus } from '../../types/appointment';
import { toast } from 'react-hot-toast';
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle, Scissors } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

export const EmployeeAppointmentsPage: React.FC = () => {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<AppointmentStatus | undefined>(undefined);

    const loadData = async () => {
        setLoading(true);
        try {
            const result = await appointmentService.getAssignedAppointments();
            setAppointments(result);
        } catch (error) {
            console.error('Failed to load appointments:', error);
            toast.error('Randevular yüklenemedi');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleStatusUpdate = async (id: string, status: AppointmentStatus) => {
        try {
            await appointmentService.updateStatusByEmployee(id, status);
            toast.success('Randevu durumu güncellendi');
            loadData();
        } catch (error) {
            toast.error('Durum güncellenemedi');
        }
    };

    const getStatusBadge = (status: AppointmentStatus) => {
        switch (status) {
            case AppointmentStatus.Pending:
                return <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold flex items-center shadow-sm"><AlertCircle className="w-3.5 h-3.5 mr-1" /> Onay Bekliyor</span>;
            case AppointmentStatus.Confirmed:
                return <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold flex items-center shadow-sm"><CheckCircle className="w-3.5 h-3.5 mr-1" /> Onaylandı</span>;
            case AppointmentStatus.Completed:
                return <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold flex items-center shadow-sm"><CheckCircle className="w-3.5 h-3.5 mr-1" /> Tamamlandı</span>;
            case AppointmentStatus.Cancelled:
                return <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-semibold flex items-center shadow-sm"><XCircle className="w-3.5 h-3.5 mr-1" /> İptal Edildi</span>;
            case AppointmentStatus.Rejected:
                return <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold flex items-center shadow-sm"><XCircle className="w-3.5 h-3.5 mr-1" /> Reddedildi</span>;
            default:
                return null;
        }
    };

    const tabs = [
        { label: 'Tümü', value: undefined },
        { label: 'Onay Bekliyor', value: AppointmentStatus.Pending },
        { label: 'Onaylandı', value: AppointmentStatus.Confirmed },
        { label: 'Tamamlandı', value: AppointmentStatus.Completed },
        { label: 'İptal/Red', value: 'CancelledRejected' }, // Special filter for UI
    ];

    const filteredAppointments = appointments.filter(app => {
        if (statusFilter === undefined) return true;
        if (statusFilter === 'CancelledRejected' as any) {
            return app.status === AppointmentStatus.Cancelled || app.status === AppointmentStatus.Rejected;
        }
        return app.status === statusFilter;
    });

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                    <Calendar className="mr-3 h-8 w-8 text-primary-600" />
                    Randevularım
                </h1>
                <p className="mt-1 text-sm text-gray-500">Size atanan randevuları buradan yönetebilirsiniz.</p>
            </div>

            {/* Status Tabs */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6 overflow-hidden">
                <div className="flex overflow-x-auto">
                    {tabs.map((tab) => (
                        <button
                            key={tab.label}
                            onClick={() => setStatusFilter(tab.value as any)}
                            className={`px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors duration-200 ${statusFilter === tab.value
                                ? 'border-primary-500 text-primary-700 bg-primary-50'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center text-gray-500 flex justify-center items-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mr-2"></div>
                        Yükleniyor...
                    </div>
                ) : filteredAppointments.length === 0 ? (
                    <div className="p-12 text-center flex flex-col items-center justify-center">
                        <div className="bg-gray-100 p-4 rounded-full mb-4">
                            <Calendar className="h-8 w-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-1">Randevu Bulunamadı</h3>
                        <p className="text-gray-500">Bu filtrelere uygun randevu kaydı mevcut değil.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Müşteri</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hizmet</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tarih & Saat</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Durum</th>
                                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">İşlemler</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredAppointments.map((appointment) => (
                                    <tr key={appointment.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10">
                                                    <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold">
                                                        {appointment.customerName.charAt(0).toUpperCase()}
                                                    </div>
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">{appointment.customerName}</div>
                                                    {appointment.note && (
                                                        <div className="text-xs text-gray-500 mt-1 max-w-xs truncate" title={appointment.note}>
                                                            Not: {appointment.note}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900 flex items-center">
                                                <Scissors className="h-4 w-4 mr-1 text-gray-400" />
                                                {appointment.serviceName}
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1">
                                                {appointment.duration} dk • ₺{appointment.price}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900 flex items-center">
                                                <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                                                {format(new Date(appointment.startTime), 'd MMM yyyy', { locale: tr })}
                                            </div>
                                            <div className="text-sm text-gray-500 flex items-center mt-1">
                                                <Clock className="h-4 w-4 mr-1 text-gray-400" />
                                                {format(new Date(appointment.startTime), 'HH:mm', { locale: tr })}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getStatusBadge(appointment.status)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex justify-end gap-2">
                                                {appointment.status === AppointmentStatus.Pending && (
                                                    <>
                                                        <Button size="sm" onClick={() => handleStatusUpdate(appointment.id, AppointmentStatus.Confirmed)}>
                                                            Onayla
                                                        </Button>
                                                        <Button size="sm" variant="danger" onClick={() => handleStatusUpdate(appointment.id, AppointmentStatus.Rejected)}>
                                                            Reddet
                                                        </Button>
                                                    </>
                                                )}
                                                {/* Allow completing if confirmed? Yes, employee should mark as done. */}
                                                {appointment.status === AppointmentStatus.Confirmed && (
                                                    <Button size="sm" variant="outline" onClick={() => handleStatusUpdate(appointment.id, AppointmentStatus.Completed)}>
                                                        Tamamla
                                                    </Button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};
