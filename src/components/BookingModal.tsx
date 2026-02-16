import React, { useState, useEffect } from 'react';
import { X, Calendar as CalendarIcon, User, Clock, Check, ChevronRight, ChevronLeft, Scissors } from 'lucide-react';
import { Button } from './Button';
import { employeeService } from '../api/employee.service';
import { appointmentService } from '../api/appointment.service';
import { serviceManagementService } from '../api/service.service';
import type { Employee } from '../types/employee';
import type { ServiceCategoryDto, ShopServiceDto } from '../types/service';
import { toast } from 'react-hot-toast';
import { format, addMinutes, setHours, setMinutes } from 'date-fns';
import { tr } from 'date-fns/locale';

interface BookingModalProps {
    isOpen: boolean;
    onClose: () => void;
    shopId: string;
    initialServiceId?: string;
    initialServiceName?: string;
    initialServiceDuration?: number;
    initialServicePrice?: number;
}

type Step = 'service' | 'personnel' | 'datetime' | 'confirm';

export const BookingModal: React.FC<BookingModalProps> = ({
    isOpen,
    onClose,
    shopId,
    initialServiceId,
    initialServiceName,
    initialServiceDuration,
    initialServicePrice
}) => {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [categories, setCategories] = useState<ServiceCategoryDto[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // State
    const [currentStep, setCurrentStep] = useState<Step>('service');
    const [selectedService, setSelectedService] = useState<ShopServiceDto | null>(null);
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [selectedTime, setSelectedTime] = useState<string>('');
    const [note, setNote] = useState('');

    useEffect(() => {
        if (isOpen && shopId) {
            loadShopData();
            setCurrentStep('service'); // Reset to first step on open

            // Pre-select service if provided
            if (initialServiceId) {
                setSelectedService({
                    id: initialServiceId,
                    name: initialServiceName || '',
                    duration: initialServiceDuration || 0,
                    price: initialServicePrice || 0,
                    isActive: true
                });
            } else {
                setSelectedService(null);
            }

            setSelectedEmployeeId('');
            setSelectedDate(new Date().toISOString().split('T')[0]);
            setSelectedTime('');
            setNote('');
        }
    }, [isOpen, shopId, initialServiceId]);

    const loadShopData = async () => {
        setLoading(true);
        try {
            const [employeesData, servicesData] = await Promise.all([
                employeeService.getPublicShopEmployees(shopId),
                serviceManagementService.getPublicShopServices(shopId)
            ]);
            setEmployees(employeesData);
            setCategories(servicesData);
        } catch (error) {
            console.error('Failed to load shop data', error);
            toast.error('Veriler yüklenemedi.');
        } finally {
            setLoading(false);
        }
    };

    const [availability, setAvailability] = useState<import('../types/appointment').EmployeeAvailabilityDto | null>(null);

    // Fetch availability when creating new appointment logic
    useEffect(() => {
        if (currentStep === 'datetime' && selectedDate && selectedEmployeeId) {
            fetchAvailability();
        }
    }, [currentStep, selectedDate, selectedEmployeeId]);

    const fetchAvailability = async () => {
        setLoading(true); // Reusing loading state, might want separate one
        try {
            const data = await appointmentService.getAvailability(selectedEmployeeId, selectedDate);
            setAvailability(data);
        } catch (error) {
            console.error('Failed to load availability', error);
            toast.error('Müsaitlik durumu yüklenemedi.');
        } finally {
            setLoading(false);
        }
    };

    const generateTimeSlots = () => {
        if (!availability || !availability.isWorking || !availability.workStartTime || !availability.workEndTime) {
            return [];
        }

        const slots = [];
        // Parse Work Start/End
        const [startHour, startMinute] = availability.workStartTime.split(':').map(Number);
        const [endHour, endMinute] = availability.workEndTime.split(':').map(Number);

        let current = setHours(setMinutes(new Date(), startMinute), startHour);
        const end = setHours(setMinutes(new Date(), endMinute), endHour);

        // Parse Break Start/End if exists
        let breakStart: Date | null = null;
        let breakEnd: Date | null = null;
        if (availability.breakStartTime) {
            const [bsH, bsM] = availability.breakStartTime.split(':').map(Number);
            breakStart = setHours(setMinutes(new Date(), bsM), bsH);
        }
        if (availability.breakEndTime) {
            const [beH, beM] = availability.breakEndTime.split(':').map(Number);
            breakEnd = setHours(setMinutes(new Date(), beM), beH);
        }

        while (current < end) {
            const timeString = format(current, 'HH:mm');

            // Check if Booked
            const isBooked = availability.bookedSlots.some(slot => {
                // Normalize everything to the selected date.
                const slotStartOnDay = new Date(`${selectedDate}T${format(current, 'HH:mm')}:00`);

                // Check if slot start is within the booked range [Start, End)
                return (slotStartOnDay >= new Date(slot.startTime) && slotStartOnDay < new Date(slot.endTime));
            });

            // Check if Break
            let isBreak = false;
            if (breakStart && breakEnd) {
                // Normalize break times to selected date
                const breakStartOnDay = new Date(`${selectedDate}T${format(breakStart, 'HH:mm')}:00`);
                const breakEndOnDay = new Date(`${selectedDate}T${format(breakEnd, 'HH:mm')}:00`);
                const slotStartOnDay = new Date(`${selectedDate}T${format(current, 'HH:mm')}:00`);

                if (slotStartOnDay >= breakStartOnDay && slotStartOnDay < breakEndOnDay) {
                    isBreak = true;
                }
            }

            slots.push({
                time: timeString,
                isBooked,
                isBreak
            });

            current = addMinutes(current, 15); // 15 min intervals
        }
        return slots;
    };

    const handleSubmit = async () => {
        if (!selectedService) return;

        setSubmitting(true);
        try {
            const dateTimeString = `${selectedDate}T${selectedTime}:00`;
            const startTime = new Date(dateTimeString);

            await appointmentService.createAppointment({
                shopId,
                shopServiceId: selectedService.id,
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

    const steps: { id: Step; label: string; number: number }[] = [
        { id: 'service', label: 'Hizmet Seçin', number: 1 },
        { id: 'personnel', label: 'Personel Seçin', number: 2 },
        { id: 'datetime', label: 'Tarih & Saat', number: 3 },
        { id: 'confirm', label: 'Onay', number: 4 }
    ];

    const currentStepIndex = steps.findIndex(s => s.id === currentStep);

    const nextStep = () => {
        if (currentStep === 'service') {
            if (!selectedService) {
                toast.error('Lütfen bir hizmet seçin.');
                return;
            }
            setCurrentStep('personnel');
        }
        else if (currentStep === 'personnel') {
            if (!selectedEmployeeId) {
                if (employees.length > 0 && !selectedEmployeeId) {
                    toast.error('Lütfen bir personel seçin.');
                    return;
                }
                setCurrentStep('datetime');
            } else {
                setCurrentStep('datetime');
            }
        }
        else if (currentStep === 'datetime') {
            if (!selectedDate || !selectedTime) {
                toast.error('Lütfen tarih ve saat seçin.');
                return;
            }
            setCurrentStep('confirm');
        }
    };

    const prevStep = () => {
        if (currentStep === 'personnel') setCurrentStep('service');
        else if (currentStep === 'datetime') setCurrentStep('personnel');
        else if (currentStep === 'confirm') setCurrentStep('datetime');
    };

    const handleSelectService = (service: ShopServiceDto) => {
        setSelectedService(service);
        // Optional: Auto advance? No, let user confirm their choice visually first
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto flex flex-col">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900">Randevu Oluştur</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Stepper */}
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 overflow-x-auto">
                    <div className="flex items-center justify-between min-w-[300px]">
                        {steps.map((step, index) => {
                            const isActive = step.id === currentStep;
                            const isCompleted = index < currentStepIndex;

                            return (
                                <div key={step.id} className="flex flex-col items-center relative z-10">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mb-2 transition-colors duration-200 
                                        ${isActive ? 'bg-primary-600 text-white shadow-md ring-4 ring-primary-50' :
                                            isCompleted ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                                        {isCompleted ? <Check className="h-5 w-5" /> : step.number}
                                    </div>
                                    <span className={`text-xs font-medium ${isActive ? 'text-primary-700' : isCompleted ? 'text-green-600' : 'text-gray-500'}`}>
                                        {step.label}
                                    </span>

                                    {/* Line connector */}
                                    {index < steps.length - 1 && (
                                        <div className={`absolute top-4 left-1/2 w-full h-[2px] -z-10 
                                            ${index < currentStepIndex ? 'bg-green-500' : 'bg-gray-200'}`}
                                            style={{ left: '50%', width: 'calc(100% * 2 + 2rem)' }} // Hacky width for demonstration
                                        ></div>
                                    )}
                                </div>
                            );
                        })}
                        {/* Better Connector Implementation using Flex grow */}
                    </div>
                    {/* Simpler Stepper Implementation for cleaner connector lines */}
                    <div className="flex items-center justify-between mt-2 pt-2 relative">
                        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-200 -z-10 -translate-y-[18px]"></div>
                        <div className="absolute top-1/2 left-0 h-0.5 bg-green-500 -z-10 -translate-y-[18px] transition-all duration-300" style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}></div>
                    </div>

                </div>

                {/* Content */}
                <div className="p-6 flex-1 overflow-y-auto">
                    {currentStep === 'service' && (
                        <div className="space-y-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <Scissors className="h-5 w-5 text-primary-600" />
                                Hizmet Seçin
                            </h3>

                            {loading ? (
                                <div className="text-center py-8">Yükleniyor...</div>
                            ) : categories.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">Bu dükkanda hizmet bulunamadı.</div>
                            ) : (
                                <div className="space-y-6">
                                    {categories.map((cat) => (
                                        <div key={cat.id}>
                                            <h4 className="text-md font-semibold text-gray-800 mb-3 px-1">{cat.name}</h4>
                                            <div className="grid grid-cols-1 gap-3">
                                                {cat.services.map((service) => (
                                                    <div
                                                        key={service.id}
                                                        onClick={() => handleSelectService(service)}
                                                        className={`p-4 rounded-xl border cursor-pointer flex justify-between items-center transition-all duration-200
                                                            ${selectedService?.id === service.id
                                                                ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-500'
                                                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
                                                    >
                                                        <div>
                                                            <p className="font-bold text-gray-900">{service.name}</p>
                                                            <p className="text-sm text-gray-500">{service.duration} dakika</p>
                                                        </div>
                                                        <div className="flex items-center gap-4">
                                                            <span className="font-bold text-primary-700">₺{service.price}</span>
                                                            {selectedService?.id === service.id && (
                                                                <div className="h-6 w-6 bg-primary-600 rounded-full flex items-center justify-center">
                                                                    <Check className="h-4 w-4 text-white" />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {currentStep === 'personnel' && (
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <User className="h-5 w-5 text-primary-600" />
                                Personel Seçin
                            </h3>
                            {loading ? (
                                <div className="text-center py-8">Loading...</div>
                            ) : (
                                <div className="space-y-3">
                                    {/* Option for "Any Personnel" - Logic to implement later, for now just UI 
                                    <div className="p-4 rounded-xl border border-gray-200 hover:border-primary-300 cursor-pointer flex items-center gap-4 transition-all">
                                        <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
                                            <Checks className="h-6 w-6 text-gray-500" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900">Fark Etmez</p>
                                            <p className="text-sm text-gray-500">Müsait olan herhangi bir personel</p>
                                        </div>
                                    </div>
                                    */}

                                    {employees.map((emp) => (
                                        <div
                                            key={emp.id}
                                            onClick={() => setSelectedEmployeeId(emp.id)}
                                            className={`p-4 rounded-xl border cursor-pointer flex items-center justify-between transition-all duration-200
                                                ${selectedEmployeeId === emp.id
                                                    ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-500'
                                                    : 'border-gray-200 hover:border-gray-300 hover:scale-[1.01]'}`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="h-12 w-12 rounded-full bg-gray-200 overflow-hidden">
                                                    {/* Placeholder or actual image if available */}
                                                    <div className="w-full h-full flex items-center justify-center bg-gray-300 text-gray-600">
                                                        <User className="h-6 w-6" />
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900">{emp.firstName} {emp.lastName}</p>
                                                    <p className="text-sm text-gray-500">{emp.title}</p>
                                                    {/* Rating could go here */}
                                                    {emp.averageRating > 0 && (
                                                        <div className="flex items-center text-xs text-yellow-600 mt-1">
                                                            <span className="font-bold mr-1">{emp.averageRating.toFixed(1)}</span>
                                                            <span>({emp.reviewCount} yorum)</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            {selectedEmployeeId === emp.id && (
                                                <div className="h-6 w-6 bg-primary-600 rounded-full flex items-center justify-center">
                                                    <Check className="h-4 w-4 text-white" />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {currentStep === 'datetime' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                    <CalendarIcon className="h-4 w-4" /> Tarih Seçin
                                </label>
                                <input
                                    type="date"
                                    className="block w-full p-3 border border-gray-300 rounded-xl focus:ring-primary-500 focus:border-primary-500"
                                    value={selectedDate}
                                    min={new Date().toISOString().split('T')[0]}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                />
                                <div className="mt-4 p-4 bg-gray-50 rounded-xl text-sm text-gray-600">
                                    <p className="font-medium text-gray-900 mb-1">Seçili Tarih:</p>
                                    <p>{format(new Date(selectedDate), 'd MMMM yyyy, EEEE', { locale: tr })}</p>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                    <Clock className="h-4 w-4" /> Saat Seçin
                                </label>
                                <div className="grid grid-cols-4 gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                    {generateTimeSlots().length === 0 ? (
                                        <div className="col-span-4 text-center text-gray-500 py-4">Bu tarihte uygun saat bulunamadı veya çalışan izinli.</div>
                                    ) : (
                                        generateTimeSlots().map(({ time, isBooked, isBreak }) => (
                                            <button
                                                key={time}
                                                disabled={isBooked || isBreak}
                                                onClick={() => setSelectedTime(time)}
                                                className={`py-2 px-1 text-xs font-medium rounded-lg border transition-all duration-150
                                                    ${isBooked ? 'bg-blue-100 text-blue-800 border-blue-200 cursor-not-allowed' : ''}
                                                    ${isBreak ? 'bg-red-100 text-red-800 border-red-200 cursor-not-allowed' : ''}
                                                    ${!isBooked && !isBreak && selectedTime === time
                                                        ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                                                        : (!isBooked && !isBreak) ? 'bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50' : ''}`}
                                            >
                                                {time}
                                            </button>
                                        ))
                                    )}
                                </div>
                                <div className="mt-2 flex gap-4 text-xs text-gray-500 justify-center">
                                    <div className="flex items-center gap-1"><div className="w-3 h-3 bg-white border border-gray-300 rounded"></div> Müsait</div>
                                    <div className="flex items-center gap-1"><div className="w-3 h-3 bg-blue-100 border border-blue-200 rounded"></div> Dolu</div>
                                    <div className="flex items-center gap-1"><div className="w-3 h-3 bg-red-100 border border-red-200 rounded"></div> Mola</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {currentStep === 'confirm' && (
                        <div className="space-y-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-4 text-center">Randevu Özeti</h3>

                            <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                                <div className="flex justify-between border-b border-gray-200 pb-3">
                                    <span className="text-gray-500">Hizmet</span>
                                    <span className="font-bold text-gray-900">{selectedService?.name}</span>
                                </div>
                                <div className="flex justify-between border-b border-gray-200 pb-3">
                                    <span className="text-gray-500">Personel</span>
                                    <span className="font-bold text-gray-900">
                                        {employees.find(e => e.id === selectedEmployeeId)?.firstName} {employees.find(e => e.id === selectedEmployeeId)?.lastName}
                                    </span>
                                </div>
                                <div className="flex justify-between border-b border-gray-200 pb-3">
                                    <span className="text-gray-500">Tarih</span>
                                    <span className="font-bold text-gray-900">{format(new Date(selectedDate), 'd MMMM yyyy', { locale: tr })}</span>
                                </div>
                                <div className="flex justify-between border-b border-gray-200 pb-3">
                                    <span className="text-gray-500">Saat</span>
                                    <span className="font-bold text-gray-900">{selectedTime}</span>
                                </div>
                                <div className="flex justify-between items-center pt-2">
                                    <span className="text-gray-600 font-medium">Toplam Tutar</span>
                                    <span className="text-2xl font-bold text-primary-700">₺{selectedService?.price}</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Not Ekle (İsteğe Bağlı)</label>
                                <textarea
                                    className="block w-full p-3 border border-gray-300 rounded-xl focus:ring-primary-500 focus:border-primary-500 text-sm"
                                    rows={3}
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    placeholder="Saçımın biraz daha kısa kesilmesini istiyorum..."
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-gray-100 flex justify-between items-center bg-gray-50 rounded-b-xl">
                    {currentStep !== 'service' ? (
                        <Button variant="secondary" onClick={prevStep} className="flex items-center">
                            <ChevronLeft className="h-4 w-4 mr-1" /> Geri
                        </Button>
                    ) : (
                        <div></div>
                    )}

                    {currentStep === 'confirm' ? (
                        <Button onClick={handleSubmit} disabled={submitting} className="min-w-[140px]">
                            {submitting ? 'İşleniyor...' : 'Randevuyu Onayla'}
                        </Button>
                    ) : (
                        <Button onClick={nextStep} className="flex items-center min-w-[140px] justify-center">
                            Devam Et <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
};
