import React, { useEffect, useState } from 'react';
import { appointmentService } from '../api/appointment.service';
import { reviewService } from '../api/review.service';
import { ReviewModal } from '../components/ReviewModal';
import type { AppointmentDto } from '../types/appointment'; // Need to ensure DTO exists or reuse Appointment type
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Calendar, Clock, MapPin, User } from 'lucide-react';
import { Button } from '../components/Button';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { EmptyState } from '../components/EmptyState';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

// Reuse Appointment type if Dto is not distinct enough, or define here
// Based on backend MapToDto:
interface Appointment extends AppointmentDto { }

export const MyAppointmentsPage: React.FC = () => {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [selectedAppointmentForReview, setSelectedAppointmentForReview] = useState<Appointment | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        loadAppointments();
    }, []);

    const loadAppointments = async () => {
        try {
            const data = await appointmentService.getMyAppointments();
            setAppointments(data);
        } catch (error) {
            console.error('Failed to load appointments', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCancelAppointment = async (appointment: Appointment) => {
        if (!window.confirm(`"${appointment.shopName}" salonundaki randevunuzu iptal etmek istediğinizden emin misiniz?`)) return;
        try {
            await appointmentService.cancelAppointment(appointment.id);
            toast.success('Randevu iptal edildi.');
            await loadAppointments();
        } catch (error: any) {
            const msg = error.response?.data?.Message || 'Randevu iptal edilemedi.';
            toast.error(msg);
        }
    };

    const handleOpenReviewModal = (appointment: Appointment) => {
        setSelectedAppointmentForReview(appointment);
        setIsReviewModalOpen(true);
    };

    const handleReviewSubmit = async (rating: number, comment: string, images: File[]) => {
        if (!selectedAppointmentForReview) return;

        try {
            await reviewService.addReview({
                appointmentId: selectedAppointmentForReview.id,
                rating,
                comment,
                images
            });
            // Refresh appointments to update "hasReview" status (or update local state)
            await loadAppointments();
        } catch (error) {
            console.error('Failed to submit review', error);
        }
    };

    const getStatusBadge = (status: number) => {
        switch (status) {
            case 0: return <span className="px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">Onay Bekliyor</span>;
            case 1: return <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">Onaylandı</span>;
            case 2: return <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">Tamamlandı</span>;
            case 3: return <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">İptal Edildi</span>;
            case 4: return <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">Reddedildi</span>;
            default: return <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">Bilinmiyor</span>;
        }
    };

    // Only allow reviewing Completed (2) appointments
    const canReview = (appointment: Appointment) => {
        if (appointment.hasReview) return false;

        return appointment.status === 2; // Completed
    };

    if (loading) return <LoadingSpinner fullPage />;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <h1 className="text-2xl font-bold text-gray-900 mb-8">Randevularım</h1>

            {appointments.length === 0 ? (
                <EmptyState
                    message="Henüz randevunuz yok"
                    description="Kuaför veya berber randevusu almak için hemen göz atın."
                    icon={<Calendar className="h-12 w-12" />}
                    action={<Button onClick={() => navigate('/')}>Randevu Al</Button>}
                />
            ) : (
                <div className="grid gap-6">
                    {appointments.map((appointment) => (
                        <div key={appointment.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center">
                            <div className="space-y-4 mb-4 sm:mb-0">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">{appointment.shopName}</h3>
                                    <div className="flex items-center text-gray-500 text-sm mt-1">
                                        <MapPin className="h-4 w-4 mr-1" />
                                        {/* Assuming shop address/city might not be in DTO, if not, remove or fetch */}
                                        <span>Salon Adresi</span>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-4 text-sm">
                                    <div className="flex items-center text-gray-700">
                                        <Calendar className="h-4 w-4 mr-2 text-primary-500" />
                                        {format(new Date(appointment.startTime), 'd MMMM yyyy', { locale: tr })}
                                    </div>
                                    <div className="flex items-center text-gray-700">
                                        <Clock className="h-4 w-4 mr-2 text-primary-500" />
                                        {format(new Date(appointment.startTime), 'HH:mm')} - {format(new Date(appointment.endTime), 'HH:mm')}
                                    </div>
                                    <div className="flex items-center text-gray-700">
                                        <User className="h-4 w-4 mr-2 text-primary-500" />
                                        {appointment.employeeName}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <span className="font-medium text-gray-900">{appointment.serviceName}</span>
                                    <span className="text-gray-400">•</span>
                                    <span className="text-gray-600">{appointment.duration} dk</span>
                                    <span className="text-gray-400">•</span>
                                    <span className="font-bold text-gray-900">₺{appointment.price}</span>
                                </div>
                            </div>

                            <div className="flex flex-col items-end gap-3">
                                {getStatusBadge(appointment.status)}

                                {(appointment.status === 0 || appointment.status === 1) && (
                                    <button
                                        className="text-sm text-red-600 hover:text-red-700 font-medium"
                                        onClick={() => handleCancelAppointment(appointment)}
                                    >
                                        İptal Et
                                    </button>
                                )}

                                {canReview(appointment) && (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleOpenReviewModal(appointment)}
                                    >
                                        Değerlendir
                                    </Button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {
                selectedAppointmentForReview && (
                    <ReviewModal
                        isOpen={isReviewModalOpen}
                        onClose={() => setIsReviewModalOpen(false)}
                        onSubmit={handleReviewSubmit}
                        shopName={selectedAppointmentForReview.shopName}
                        employeeName={selectedAppointmentForReview.employeeName}
                    />
                )
            }
        </div >
    );
};
