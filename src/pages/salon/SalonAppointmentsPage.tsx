import React, { useEffect, useState } from 'react';
import { Button } from '../../components/Button';
import { appointmentService } from '../../api/appointment.service';
import { shopService } from '../../api/shop.service';
import { type Appointment, AppointmentStatus } from '../../types/appointment'; // Restored
import { toast } from 'react-hot-toast';
import { Calendar, Clock, User, CheckCircle, XCircle, AlertCircle, Scissors } from 'lucide-react';
import { format } from 'date-fns';

export const SalonAppointmentsPage: React.FC = () => {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed'>('all');

    const loadData = async () => {
        setLoading(true);
        try {
            // First get shop ID
            const shop = await shopService.getMyShop();
            if (!shop) {
                toast.error('Shop details not found');
                return;
            }

            const data = await appointmentService.getShopAppointments(shop.id);
            setAppointments(data);
        } catch (error) {
            console.error('Failed to load appointments:', error);
            toast.error('Failed to load appointments');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleStatusUpdate = async (id: string, status: AppointmentStatus) => {
        try {
            await appointmentService.updateStatus(id, status);
            toast.success('Appointment updated');
            loadData(); // Reload to refresh list
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    const getStatusBadge = (status: AppointmentStatus) => {
        switch (status) {
            case AppointmentStatus.Pending:
                return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold flex items-center"><AlertCircle className="w-3 h-3 mr-1" /> Pending</span>;
            case AppointmentStatus.Confirmed:
                return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold flex items-center"><CheckCircle className="w-3 h-3 mr-1" /> Confirmed</span>;
            case AppointmentStatus.Completed:
                return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold flex items-center"><CheckCircle className="w-3 h-3 mr-1" /> Completed</span>;
            case AppointmentStatus.Cancelled:
                return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold flex items-center"><XCircle className="w-3 h-3 mr-1" /> Cancelled</span>;
            case AppointmentStatus.Rejected:
                return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-semibold flex items-center"><XCircle className="w-3 h-3 mr-1" /> Rejected</span>;
            default:
                return null;
        }
    };

    const filteredAppointments = appointments.filter(a => {
        if (filter === 'all') return true;
        if (filter === 'pending') return a.status === AppointmentStatus.Pending;
        if (filter === 'confirmed') return a.status === AppointmentStatus.Confirmed;
        return true;
    });

    if (loading) return <div>Loading...</div>;

    return (
        <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800 flex items-center">
                    <Calendar className="mr-3 h-8 w-8 text-primary-600" />
                    Appointments
                </h1>
                <div className="flex space-x-2">
                    <Button
                        size="sm"
                        variant={filter === 'all' ? 'primary' : 'outline'}
                        onClick={() => setFilter('all')}
                    >
                        All
                    </Button>
                    <Button
                        size="sm"
                        variant={filter === 'pending' ? 'primary' : 'outline'}
                        onClick={() => setFilter('pending')}
                    >
                        Pending
                    </Button>
                    <Button
                        size="sm"
                        variant={filter === 'confirmed' ? 'primary' : 'outline'}
                        onClick={() => setFilter('confirmed')}
                    >
                        Confirmed
                    </Button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {filteredAppointments.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        No appointments found.
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {filteredAppointments.map((appointment) => (
                            <div key={appointment.id} className="p-6 hover:bg-gray-50 transition-colors">
                                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="font-bold text-lg text-gray-900">{appointment.customerName}</span>
                                            {getStatusBadge(appointment.status)}
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                                            <div className="flex items-center">
                                                <Scissors className="h-4 w-4 mr-2 text-primary-500" />
                                                {appointment.serviceName} ({appointment.duration} mins) - ${appointment.price}
                                            </div>
                                            <div className="flex items-center">
                                                <User className="h-4 w-4 mr-2 text-primary-500" />
                                                Stylist: {appointment.employeeName}
                                            </div>
                                            <div className="flex items-center">
                                                <Clock className="h-4 w-4 mr-2 text-primary-500" />
                                                {format(new Date(appointment.startTime), 'MMM d, yyyy h:mm a')}
                                            </div>
                                        </div>
                                        {appointment.note && (
                                            <div className="mt-2 text-sm text-gray-500 bg-gray-50 p-2 rounded">
                                                Note: {appointment.note}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                        {appointment.status === AppointmentStatus.Pending && (
                                            <>
                                                <Button size="sm" onClick={() => handleStatusUpdate(appointment.id, AppointmentStatus.Confirmed)}>
                                                    Confirm
                                                </Button>
                                                <Button size="sm" variant="danger" onClick={() => handleStatusUpdate(appointment.id, AppointmentStatus.Rejected)}>
                                                    Reject
                                                </Button>
                                            </>
                                        )}
                                        {appointment.status === AppointmentStatus.Confirmed && (
                                            <Button size="sm" variant="outline" onClick={() => handleStatusUpdate(appointment.id, AppointmentStatus.Completed)}>
                                                Mark Complete
                                            </Button>
                                        )}
                                        {appointment.status === AppointmentStatus.Confirmed && (
                                            <Button size="sm" variant="danger" onClick={() => handleStatusUpdate(appointment.id, AppointmentStatus.Cancelled)}>
                                                Cancel
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
