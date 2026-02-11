import React, { useState, useEffect } from 'react';
import { X, Calendar as CalendarIcon, User } from 'lucide-react';
import { Button } from './Button';
import { employeeService } from '../api/employee.service';
import { appointmentService } from '../api/appointment.service';
import type { Employee } from '../types/employee';
import { toast } from 'react-hot-toast';
import { format, addMinutes, setHours, setMinutes } from 'date-fns';

interface BookingModalProps {
    isOpen: boolean;
    onClose: () => void;
    shopId: string;
    serviceId: string;
    serviceName: string;
    serviceDuration: number;
    servicePrice: number;
}

export const BookingModal: React.FC<BookingModalProps> = ({
    isOpen,
    onClose,
    shopId,
    serviceId,
    serviceName,
    serviceDuration,
    servicePrice
}) => {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [selectedTime, setSelectedTime] = useState<string>('');
    const [note, setNote] = useState('');

    useEffect(() => {
        if (isOpen && shopId) {
            loadEmployees();
        }
    }, [isOpen, shopId]);

    const loadEmployees = async () => {
        setLoading(true);
        try {
            const data = await employeeService.getPublicShopEmployees(shopId);
            setEmployees(data);
            if (data.length > 0) {
                setSelectedEmployeeId(data[0].id);
            }
        } catch (error) {
            console.error('Failed to load employees', error);
            toast.error('Çalışanlar yüklenemedi.');
        } finally {
            setLoading(false);
        }
    };

    const generateTimeSlots = () => {
        const slots = [];
        let start = setHours(setMinutes(new Date(), 0), 9); // 09:00
        const end = setHours(setMinutes(new Date(), 0), 20); // 20:00

        while (start < end) {
            slots.push(format(start, 'HH:mm'));
            start = addMinutes(start, 30); // 30 min intervals
        }
        return slots;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedEmployeeId || !selectedDate || !selectedTime) {
            toast.error('Lütfen tüm alanları doldurun.');
            return;
        }

        setSubmitting(true);
        try {
            // Construct DateTime
            const dateTimeString = `${selectedDate}T${selectedTime}:00`;
            const startTime = new Date(dateTimeString);

            await appointmentService.createAppointment({
                shopId,
                shopServiceId: serviceId,
                shopEmployeeId: selectedEmployeeId,
                startTime: startTime.toISOString(),
                note: note
            });

            toast.success('Randevu başarıyla oluşturuldu!');
            onClose();
        } catch (error: any) {
            console.error('Booking failed', error);
            const msg = error.response?.data?.Message || error.message || 'Randevu oluşturulamadı.';
            toast.error(msg);
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900">Randevu Oluştur</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Service Info */}
                    <div className="bg-primary-50 p-4 rounded-lg">
                        <p className="text-sm text-primary-700 font-medium">Seçilen Hizmet</p>
                        <h3 className="text-lg font-bold text-primary-900">{serviceName}</h3>
                        <div className="flex justify-between mt-1 text-sm text-primary-800">
                            <span>{serviceDuration} dk</span>
                            <span className="font-bold">₺{servicePrice}</span>
                        </div>
                    </div>

                    {/* Employee Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Uzman Seçimi
                        </label>
                        {loading ? (
                            <div className="text-center py-2 text-gray-500">Yükleniyor...</div>
                        ) : (
                            <div className="grid grid-cols-1 gap-2">
                                {employees.map((emp) => (
                                    <div
                                        key={emp.id}
                                        onClick={() => setSelectedEmployeeId(emp.id)}
                                        className={`p-3 rounded-lg border cursor-pointer flex items-center transition-colors ${selectedEmployeeId === emp.id
                                                ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-500'
                                                : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 mr-3">
                                            <User className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">{emp.firstName} {emp.lastName}</p>
                                            <p className="text-xs text-gray-500">{emp.title}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Date Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Tarih
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <CalendarIcon className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="date"
                                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                                value={selectedDate}
                                min={new Date().toISOString().split('T')[0]}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    {/* Time Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Saat
                        </label>
                        <div className="grid grid-cols-4 gap-2">
                            {generateTimeSlots().map((time) => (
                                <button
                                    key={time}
                                    type="button"
                                    onClick={() => setSelectedTime(time)}
                                    className={`py-2 text-sm font-medium rounded-md border ${selectedTime === time
                                            ? 'bg-primary-600 text-white border-primary-600'
                                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                        }`}
                                >
                                    {time}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Note */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Not (İsteğe bağlı)
                        </label>
                        <textarea
                            className="block w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 text-sm"
                            rows={2}
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="Özel bir isteğiniz var mı?"
                        />
                    </div>

                    <div className="pt-4">
                        <Button type="submit" className="w-full" disabled={submitting}>
                            {submitting ? 'Oluşturuluyor...' : 'Randevuyu Onayla'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};
