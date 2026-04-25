import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '../../components/Button';
import { appointmentService } from '../../api/appointment.service';
import { shopService } from '../../api/shop.service';
import { employeeService } from '../../api/employee.service';
import { serviceManagementService } from '../../api/service.service';
import { type Appointment, AppointmentStatus } from '../../types/appointment';
import type { Employee } from '../../types/employee';
import { toast } from 'react-hot-toast';
import { Calendar, Clock, User, CheckCircle, XCircle, AlertCircle, Scissors, ChevronLeft, ChevronRight, Zap } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

export const SalonAppointmentsPage: React.FC = () => {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<AppointmentStatus | undefined>(undefined);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDate, setFilterDate] = useState('');
    const [filterEmployeeId, setFilterEmployeeId] = useState('');
    const [filterServiceId, setFilterServiceId] = useState('');
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [services, setServices] = useState<{id: string, name: string}[]>([]);
    
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalCount, setTotalCount] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [isAutoProcessEnabled, setIsAutoProcessEnabled] = useState(false);
    const [shopId, setShopId] = useState<string | null>(null);
    const [confirmAction, setConfirmAction] = useState<{ id: string; status: AppointmentStatus; label: string; actionText: string } | null>(null);

    const loadData = async () => {
        setLoading(true);
        try {
            // First get shop details
            const shop = await shopService.getMyShop();
            if (!shop) {
                toast.error('Shop details not found');
                return;
            }
            setShopId(shop.id);
            setIsAutoProcessEnabled(shop.isAutoProcessEnabled || false);

            const result = await appointmentService.getShopAppointments(
                shop.id, page, pageSize, statusFilter, searchTerm, filterDate || undefined, filterEmployeeId || undefined, filterServiceId || undefined
            );
            setAppointments(result.items);
            setTotalCount(result.totalCount);
            setTotalPages(result.totalPages);
        } catch (error) {
            console.error('Failed to load appointments:', error);
            toast.error('Failed to load appointments');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [page, pageSize, statusFilter, searchTerm, filterDate, filterEmployeeId, filterServiceId]);

    useEffect(() => {
        const fetchFiltersData = async () => {
            try {
                const emps = await employeeService.getEmployees();
                setEmployees(emps);

                const cats = await serviceManagementService.getShopServices();
                const allServices = cats.flatMap(c => c.services || []).map(s => ({ id: s.id, name: s.name }));
                setServices(allServices);
            } catch (error) {
                console.error("Failed to load filter data", error);
            }
        };
        fetchFiltersData();
    }, []);

    const handleAutoProcessToggle = async () => {
        if (!shopId) return;

        const newState = !isAutoProcessEnabled;
        try {
            await shopService.updateAutoProcess(shopId, newState);
            setIsAutoProcessEnabled(newState);
            toast.success(`Otomatik işlemler ${newState ? 'aktif' : 'pasif'} hale getirildi.`);
        } catch (error) {
            console.error('Failed to update auto process setting:', error);
            toast.error('Ayarlar güncellenemedi.');
        }
    };

    const requestStatusUpdate = (id: string, status: AppointmentStatus, label: string, actionText: string) => {
        setConfirmAction({ id, status, label, actionText });
    };

    const handleStatusUpdate = async (id: string, status: AppointmentStatus) => {
        try {
            await appointmentService.updateStatus(id, status);
            toast.success('Randevu durumu güncellendi');
            // Refresh data to reflect changes
            const shop = await shopService.getMyShop(); // refresh shop data too to be safe, but mostly appointments
            if (shop) {
                const result = await appointmentService.getShopAppointments(
                    shop.id, page, pageSize, statusFilter, searchTerm, filterDate || undefined, filterEmployeeId || undefined, filterServiceId || undefined
                );
                setAppointments(result.items);
                setTotalCount(result.totalCount);
                setTotalPages(result.totalPages);
            }
        } catch (error) {
            toast.error('Durum güncellenemedi');
        } finally {
            setConfirmAction(null);
        }
    };

    const getStatusBadge = (status: AppointmentStatus) => {
        switch (status) {
            case AppointmentStatus.Pending:
                return <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold inline-flex items-center w-fit shadow-sm"><AlertCircle className="w-3.5 h-3.5 mr-1" /> Onay Bekliyor</span>;
            case AppointmentStatus.Confirmed:
                return <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold inline-flex items-center w-fit shadow-sm"><CheckCircle className="w-3.5 h-3.5 mr-1" /> Onaylandı</span>;
            case AppointmentStatus.Completed:
                return <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold inline-flex items-center w-fit shadow-sm"><CheckCircle className="w-3.5 h-3.5 mr-1" /> Tamamlandı</span>;
            case AppointmentStatus.Cancelled:
                return <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-semibold inline-flex items-center w-fit shadow-sm"><XCircle className="w-3.5 h-3.5 mr-1" /> İptal Edildi</span>;
            case AppointmentStatus.Rejected:
                return <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold inline-flex items-center w-fit shadow-sm"><XCircle className="w-3.5 h-3.5 mr-1" /> Reddedildi</span>;
            default:
                return null;
        }
    };

    // We no longer need local filtering since it's handled by the backend
    // const filteredAppointments = ...

    const tabs = [
        { label: 'Tümü', value: undefined },
        { label: 'Onay Bekliyor', value: AppointmentStatus.Pending },
        { label: 'Onaylandı', value: AppointmentStatus.Confirmed },
        { label: 'Tamamlandı', value: AppointmentStatus.Completed },
        { label: 'İptal', value: AppointmentStatus.Cancelled },
        { label: 'Reddedildi', value: AppointmentStatus.Rejected },
    ];

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                        <Calendar className="mr-3 h-8 w-8 text-primary-600" />
                        Randevular
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">Salonunuzdaki tüm randevuları buradan yönetebilirsiniz.</p>
                </div>

                <div className="flex items-center bg-white p-3 rounded-lg shadow-sm border border-gray-200">
                    <div className="mr-3">
                        <p className="text-sm font-medium text-gray-900 flex items-center">
                            <Zap className={`w-4 h-4 mr-1 ${isAutoProcessEnabled ? 'text-yellow-500' : 'text-gray-400'}`} />
                            Randevuyu Otomatik Onayla ve Tamamla
                        </p>
                        <p className="text-xs text-gray-500">
                            {isAutoProcessEnabled ? 'Aktif: Saati gelince otomatik onay ve tamamlama' : 'Pasif: Manuel yönetim'}
                        </p>
                    </div>
                    <button
                        onClick={handleAutoProcessToggle}
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2 ${isAutoProcessEnabled ? 'bg-primary-600' : 'bg-gray-200'
                            }`}
                        role="switch"
                        aria-checked={isAutoProcessEnabled}
                    >
                        <span
                            aria-hidden="true"
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isAutoProcessEnabled ? 'translate-x-5' : 'translate-x-0'
                                }`}
                        />
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Müşteri Ara</label>
                        <input
                            type="text"
                            placeholder="İsim ile ara..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 text-sm"
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Tarih</label>
                        <div className="relative">
                            <input
                                type="date"
                                className="w-full pl-3 pr-10 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 text-sm appearance-none bg-white"
                                value={filterDate}
                                onChange={(e) => { setFilterDate(e.target.value); setPage(1); }}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Personel</label>
                        <select
                            className="w-full pl-3 pr-10 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 text-sm appearance-none"
                            style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: `right 0.5rem center`, backgroundRepeat: `no-repeat`, backgroundSize: `1.5em 1.5em` }}
                            value={filterEmployeeId}
                            onChange={(e) => { setFilterEmployeeId(e.target.value); setPage(1); }}
                        >
                            <option value="">Tümü</option>
                            {employees.map(emp => (
                                <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Hizmet</label>
                        <select
                            className="w-full pl-3 pr-10 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 text-sm appearance-none"
                            style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: `right 0.5rem center`, backgroundRepeat: `no-repeat`, backgroundSize: `1.5em 1.5em` }}
                            value={filterServiceId}
                            onChange={(e) => { setFilterServiceId(e.target.value); setPage(1); }}
                        >
                            <option value="">Tümü</option>
                            {services.map(srv => (
                                <option key={srv.id} value={srv.id}>{srv.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Status Tabs */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6 overflow-hidden">
                <div className="flex overflow-x-auto">
                    {tabs.map((tab) => (
                        <button
                            key={tab.label}
                            onClick={() => {
                                setStatusFilter(tab.value);
                                setPage(1); // Reset to first page on filter change
                            }}
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
                ) : appointments.length === 0 ? (
                    <div className="p-12 text-center flex flex-col items-center justify-center">
                        <div className="bg-gray-100 p-4 rounded-full mb-4">
                            <Calendar className="h-8 w-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-1">Randevu Bulunamadı</h3>
                        <p className="text-gray-500">Bu filtrelere uygun randevu kaydı mevcut değil.</p>
                    </div>
                ) : (
                    <>
                        {/* Pagination Header (Moved up for better UX) */}
                        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                <span className="text-sm font-medium text-gray-700">Sayfa Başına:</span>
                                <select 
                                    className="border-gray-300 bg-white rounded-md text-sm focus:ring-primary-500 focus:border-primary-500 p-1.5 shadow-sm appearance-none pr-8"
                                    style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: `right 0.25rem center`, backgroundRepeat: `no-repeat`, backgroundSize: `1.5em 1.5em` }}
                                    value={pageSize}
                                    onChange={(e) => {
                                        setPageSize(Number(e.target.value));
                                        setPage(1);
                                    }}
                                >
                                    {[5, 10, 25, 50, 100].map(size => (
                                        <option key={size} value={size}>{size}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex-1 flex justify-between sm:hidden w-full">
                                <Button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    variant="outline"
                                    size="sm"
                                >
                                    Önceki
                                </Button>
                                <Button
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    variant="outline"
                                    size="sm"
                                >
                                    Sonraki
                                </Button>
                            </div>
                            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-end gap-4">
                                <div>
                                    <p className="text-sm text-gray-700">
                                        Toplam <span className="font-medium">{totalCount}</span> kayıttan <span className="font-medium">{(page - 1) * pageSize + 1}</span> - <span className="font-medium">{Math.min(page * pageSize, totalCount)}</span>
                                    </p>
                                </div>
                                <div>
                                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                        <button
                                            onClick={() => setPage(p => Math.max(1, p - 1))}
                                            disabled={page === 1}
                                            className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${page === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
                                                }`}
                                        >
                                            <span className="sr-only">Önceki</span>
                                            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                                        </button>
                                        <button
                                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                            disabled={page === totalPages}
                                            className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${page === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
                                                }`}
                                        >
                                            <span className="sr-only">Sonraki</span>
                                            <ChevronRight className="h-5 w-5" aria-hidden="true" />
                                        </button>
                                    </nav>
                                </div>
                            </div>
                        </div>

                        {/* Desktop Table View */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Müşteri</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hizmet & Personel</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tarih & Saat</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Durum</th>
                                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">İşlemler</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {appointments.map((appointment) => (
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
                                                <div className="text-sm text-gray-500 flex items-center mt-1">
                                                    <User className="h-4 w-4 mr-1 text-gray-400" />
                                                    {appointment.employeeName}
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
                                                <div className="flex flex-col gap-1">
                                                    {getStatusBadge(appointment.status)}
                                                    {appointment.cancellationReason && (
                                                        <div className="text-xs text-red-600 mt-1 max-w-xs truncate" title={appointment.cancellationReason}>
                                                            Sebep: {appointment.cancellationReason}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex justify-end gap-2">
                                                    {appointment.status === AppointmentStatus.Pending && (
                                                        <>
                                                            <Button size="sm" onClick={() => requestStatusUpdate(appointment.id, AppointmentStatus.Confirmed, 'Randevuyu Onayla', 'Bu randevuyu onaylamak istediğinize emin misiniz?')}>
                                                                Onayla
                                                            </Button>
                                                            <Button size="sm" variant="danger" onClick={() => requestStatusUpdate(appointment.id, AppointmentStatus.Rejected, 'Randevuyu Reddet', 'Bu randevuyu reddetmek istediğinize emin misiniz? Müşteriye bildirim gönderilecektir.')}>
                                                                Reddet
                                                            </Button>
                                                        </>
                                                    )}
                                                    {appointment.status === AppointmentStatus.Confirmed && (
                                                        <>
                                                            <Button size="sm" variant="outline" onClick={() => requestStatusUpdate(appointment.id, AppointmentStatus.Completed, 'Randevuyu Tamamla', 'Bu randevunun tamamlandığını onaylıyor musunuz?')}>
                                                                Tamamlandı
                                                            </Button>
                                                            <Button size="sm" variant="danger" onClick={() => requestStatusUpdate(appointment.id, AppointmentStatus.Cancelled, 'Randevuyu İptal Et', 'Bu randevuyu iptal etmek istediğinize emin misiniz? İşlem geri alınamaz.')}>
                                                                İptal
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Card View */}
                        <div className="block md:hidden">
                            <div className="divide-y divide-gray-200">
                                {appointments.map((appointment) => (
                                    <div key={appointment.id} className="p-4 bg-white hover:bg-gray-50 transition-colors">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold shrink-0">
                                                    {appointment.customerName.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-gray-900">{appointment.customerName}</div>
                                                    <div className="text-xs text-gray-500">
                                                        {format(new Date(appointment.startTime), 'd MMM yyyy HH:mm', { locale: tr })}
                                                    </div>
                                                </div>
                                            </div>
                                            <div>
                                                {getStatusBadge(appointment.status)}
                                            </div>
                                        </div>

                                        <div className="mb-3 bg-gray-50 rounded-lg p-3">
                                            <div className="text-sm font-medium text-gray-800">{appointment.serviceName}</div>
                                            <div className="text-sm text-gray-500 mt-0.5">Personel: {appointment.employeeName}</div>
                                            <div className="text-sm text-gray-500">{appointment.duration} dk • ₺{appointment.price}</div>
                                            {appointment.note && (
                                                <div className="text-sm text-gray-600 mt-2 pt-2 border-t border-gray-200">
                                                    📝 {appointment.note}
                                                </div>
                                            )}
                                            {appointment.cancellationReason && (
                                                <div className="text-sm text-red-600 mt-2 pt-2 border-t border-red-100 bg-red-50 -mx-3 -mb-3 p-3 rounded-b-lg">
                                                    ❌ Sebep: {appointment.cancellationReason}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex flex-wrap gap-2">
                                            {appointment.status === AppointmentStatus.Pending && (
                                                <>
                                                    <Button size="sm" className="flex-1" onClick={() => requestStatusUpdate(appointment.id, AppointmentStatus.Confirmed, 'Randevuyu Onayla', 'Bu randevuyu onaylamak istediğinize emin misiniz?')}>
                                                        Onayla
                                                    </Button>
                                                    <Button size="sm" variant="danger" className="flex-1" onClick={() => requestStatusUpdate(appointment.id, AppointmentStatus.Rejected, 'Randevuyu Reddet', 'Bu randevuyu reddetmek istediğinize emin misiniz?')}>
                                                        Reddet
                                                    </Button>
                                                </>
                                            )}
                                            {appointment.status === AppointmentStatus.Confirmed && (
                                                <>
                                                    <Button size="sm" variant="outline" className="flex-1" onClick={() => requestStatusUpdate(appointment.id, AppointmentStatus.Completed, 'Randevuyu Tamamla', 'Bu randevunun tamamlandığını onaylıyor musunuz?')}>
                                                        Tamamlandı
                                                    </Button>
                                                    <Button size="sm" variant="danger" className="flex-1" onClick={() => requestStatusUpdate(appointment.id, AppointmentStatus.Cancelled, 'Randevuyu İptal Et', 'Bu randevuyu iptal etmek istediğinize emin misiniz?')}>
                                                        İptal
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Confirmation Modal */}
            {confirmAction && createPortal(
                <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/50">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">{confirmAction.label}</h3>
                        <p className="text-gray-600 text-sm mb-6">{confirmAction.actionText}</p>
                        <div className="flex gap-3 justify-end">
                            <button onClick={() => setConfirmAction(null)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg">Vazgeç</button>
                            <button onClick={() => handleStatusUpdate(confirmAction.id, confirmAction.status)} className={`px-4 py-2 text-sm font-semibold rounded-lg text-white transition-colors ${confirmAction.status === AppointmentStatus.Rejected || confirmAction.status === AppointmentStatus.Cancelled ? 'bg-red-600 hover:bg-red-700' : 'bg-primary-600 hover:bg-primary-700'}`}>Onayla</button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

