import React, { useState, useEffect, useCallback } from 'react';
import { X, User, Clock, Check, ChevronRight, ChevronLeft, Scissors, Star, Plus, Minus } from 'lucide-react';
import { Button } from './Button';
import { employeeService } from '../api/employee.service';
import { appointmentService } from '../api/appointment.service';
import { serviceManagementService } from '../api/service.service';
import type { Employee } from '../types/employee';
import type { ServiceCategoryDto, ShopServiceDto } from '../types/service';
import { toast } from 'react-hot-toast';
import { format, addMinutes, setHours, setMinutes, addDays } from 'date-fns';
import { tr } from 'date-fns/locale';

interface BookingModalProps {
    isOpen: boolean;
    onClose: () => void;
    shopId: string;
    bookingDaysAhead?: number;
    initialServiceId?: string;
    initialServiceName?: string;
    initialServiceDuration?: number;
    initialServicePrice?: number;
}

type Step = 'personnel' | 'service' | 'datetime' | 'confirm';

const STEPS: { id: Step; label: string; number: number }[] = [
    { id: 'personnel', label: 'Personel', number: 1 },
    { id: 'service',   label: 'Hizmet',   number: 2 },
    { id: 'datetime',  label: 'Tarih & Saat', number: 3 },
    { id: 'confirm',   label: 'Onay',     number: 4 },
];

export const BookingModal: React.FC<BookingModalProps> = ({
    isOpen,
    onClose,
    shopId,
    bookingDaysAhead = 30,
    initialServiceId,
    initialServiceName,
    initialServiceDuration,
    initialServicePrice,
}) => {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [categories, setCategories] = useState<ServiceCategoryDto[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [currentStep, setCurrentStep] = useState<Step>('personnel');
    const [selectedServices, setSelectedServices] = useState<ShopServiceDto[]>([]);
    const [selectedEmployeeId, setSelectedEmployeeId] = useState('');

    const getTodayLocal = () => new Date().toLocaleDateString('en-CA');
    const [selectedDate, setSelectedDate] = useState(getTodayLocal());
    const [selectedTime, setSelectedTime] = useState('');
    const [note, setNote] = useState('');
    const [availability, setAvailability] = useState<import('../types/appointment').EmployeeAvailabilityDto | null>(null);

    const dayScrollRef = useCallback((node: HTMLDivElement | null) => {
        if (!node) return;
        const onWheel = (e: WheelEvent) => {
            if (e.deltaY === 0) return;
            e.preventDefault();
            node.scrollLeft += e.deltaY;
        };
        node.addEventListener('wheel', onWheel, { passive: false });
    }, []);

    useEffect(() => {
        if (!isOpen || !shopId) return;
        setCurrentStep('personnel');
        setSelectedEmployeeId('');
        setSelectedDate(getTodayLocal());
        setSelectedTime('');
        setNote('');
        setAvailability(null);

        if (initialServiceId) {
            setSelectedServices([{
                id: initialServiceId,
                name: initialServiceName || '',
                duration: initialServiceDuration || 0,
                price: initialServicePrice || 0,
                isActive: true,
            }]);
        } else {
            setSelectedServices([]);
        }

        loadShopData();
    }, [isOpen, shopId, initialServiceId]);

    const loadShopData = async () => {
        setLoading(true);
        try {
            const [emps, svcs] = await Promise.all([
                employeeService.getPublicShopEmployees(shopId),
                serviceManagementService.getPublicShopServices(shopId),
            ]);
            setEmployees(emps);
            setCategories(svcs);
        } catch {
            toast.error('Veriler yüklenemedi.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (currentStep === 'datetime' && selectedDate && selectedEmployeeId) {
            fetchAvailability();
        }
    }, [currentStep, selectedDate, selectedEmployeeId]);

    const fetchAvailability = async () => {
        setLoading(true);
        try {
            const data = await appointmentService.getAvailability(selectedEmployeeId, selectedDate);
            setAvailability(data);
        } catch {
            toast.error('Müsaitlik durumu yüklenemedi.');
        } finally {
            setLoading(false);
        }
    };

    // Seçilebilir günler: bugünden itibaren bookingDaysAhead gün
    const availableDays = Array.from({ length: bookingDaysAhead }, (_, i) => {
        const d = addDays(new Date(), i);
        return d.toLocaleDateString('en-CA');
    });

    const generateTimeSlots = () => {
        if (!availability?.isWorking || !availability.workStartTime || !availability.workEndTime) return [];
        const duration = selectedServices.reduce((t, s) => t + s.duration, 0) || 15;
        const slotInterval = 15;
        const isToday = selectedDate === getTodayLocal();
        const now = new Date();
        const slots = [];
        const [sh, sm] = availability.workStartTime.split(':').map(Number);
        const [eh, em] = availability.workEndTime.split(':').map(Number);
        let cur = setHours(setMinutes(new Date(), sm), sh);
        const end = setHours(setMinutes(new Date(), em), eh);

        let breakStart: Date | null = null;
        let breakEnd: Date | null = null;
        if (availability.breakStartTime) {
            const [bh, bm] = availability.breakStartTime.split(':').map(Number);
            breakStart = setHours(setMinutes(new Date(), bm), bh);
        }
        if (availability.breakEndTime) {
            const [bh, bm] = availability.breakEndTime.split(':').map(Number);
            breakEnd = setHours(setMinutes(new Date(), bm), bh);
        }

        while (cur < end) {
            const timeStr = format(cur, 'HH:mm');
            const slotEnd = addMinutes(cur, duration);
            if (slotEnd > end) { cur = addMinutes(cur, slotInterval); continue; }

            const slotDt = new Date(`${selectedDate}T${timeStr}:00`);
            const isPast = isToday && slotDt <= now;
            const isBooked = availability.bookedSlots.some(s =>
                slotDt >= new Date(s.startTime) && slotDt < new Date(s.endTime)
            );
            let isBreak = false;
            if (breakStart && breakEnd) {
                const bsDt = new Date(`${selectedDate}T${format(breakStart, 'HH:mm')}:00`);
                const beDt = new Date(`${selectedDate}T${format(breakEnd, 'HH:mm')}:00`);
                if (slotDt >= bsDt && slotDt < beDt) isBreak = true;
            }
            slots.push({ time: timeStr, end: format(slotEnd, 'HH:mm'), isBooked, isBreak, isPast });
            cur = addMinutes(cur, slotInterval);
        }
        return slots;
    };

    const handleSubmit = async () => {
        if (!selectedServices.length) return;
        setSubmitting(true);
        try {
            await appointmentService.createAppointment({
                shopId,
                serviceIds: selectedServices.map(s => s.id),
                shopEmployeeId: selectedEmployeeId,
                startTime: new Date(`${selectedDate}T${selectedTime}:00`).toISOString(),
                note,
            });
            toast.success('Randevu başarıyla oluşturuldu!');
            onClose();
        } catch (error: any) {
            toast.error(error.response?.data?.Message || 'Randevu oluşturulamadı.');
        } finally {
            setSubmitting(false);
        }
    };

    const nextStep = () => {
        if (currentStep === 'personnel') {
            if (!selectedEmployeeId) { toast.error('Lütfen bir personel seçin.'); return; }
            setCurrentStep('service');
        } else if (currentStep === 'service') {
            if (!selectedServices.length) { toast.error('Lütfen en az bir hizmet seçin.'); return; }
            setCurrentStep('datetime');
        } else if (currentStep === 'datetime') {
            if (!selectedDate || !selectedTime) { toast.error('Lütfen tarih ve saat seçin.'); return; }
            setCurrentStep('confirm');
        }
    };

    const prevStep = () => {
        if (currentStep === 'service') setCurrentStep('personnel');
        else if (currentStep === 'datetime') setCurrentStep('service');
        else if (currentStep === 'confirm') setCurrentStep('datetime');
    };

    const addService = (s: ShopServiceDto) => setSelectedServices(prev => [...prev, s]);
    const removeService = (id: string) => setSelectedServices(prev => {
        const i = prev.findIndex(s => s.id === id);
        if (i === -1) return prev;
        return [...prev.slice(0, i), ...prev.slice(i + 1)];
    });

    const getImageUrl = (path?: string) => {
        if (!path) return '';
        if (path.startsWith('http')) return path;
        return `http://localhost:5000${path}`;
    };

    if (!isOpen) return null;

    const currentStepIndex = STEPS.findIndex(s => s.id === currentStep);
    const selectedEmployee = employees.find(e => e.id === selectedEmployeeId);

    const totalDuration = selectedServices.reduce((t, s) => t + s.duration, 0);
    const totalPrice = selectedServices.reduce((t, s) => t + s.price, 0);

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
            <div className="bg-white w-full sm:rounded-2xl sm:max-w-xl max-h-[95vh] sm:max-h-[90vh] flex flex-col rounded-t-2xl shadow-2xl">

                {/* Header */}
                <div className="flex justify-between items-center px-5 py-4 border-b border-gray-100 shrink-0">
                    <h2 className="text-lg font-bold text-gray-900">Randevu Oluştur</h2>
                    <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Stepper */}
                <div className="px-5 pt-4 pb-3 border-b border-gray-100 shrink-0">
                    <div className="flex items-center justify-between relative">
                        <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200 z-0" />
                        <div
                            className="absolute top-4 left-0 h-0.5 bg-primary-500 z-0 transition-all duration-500"
                            style={{ width: `${(currentStepIndex / (STEPS.length - 1)) * 100}%` }}
                        />
                        {STEPS.map((step, i) => {
                            const isActive = step.id === currentStep;
                            const isDone = i < currentStepIndex;
                            return (
                                <div key={step.id} className="flex flex-col items-center gap-1.5 z-10">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all duration-300 ${
                                        isDone ? 'bg-primary-500 border-primary-500 text-white' :
                                        isActive ? 'bg-white border-primary-500 text-primary-600 shadow-md' :
                                        'bg-white border-gray-200 text-gray-400'
                                    }`}>
                                        {isDone ? <Check className="w-4 h-4" /> : step.number}
                                    </div>
                                    <span className={`text-[10px] sm:text-xs font-semibold whitespace-nowrap ${
                                        isActive ? 'text-primary-600' : isDone ? 'text-primary-400' : 'text-gray-400'
                                    }`}>{step.label}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto">

                    {/* ── PERSONEL ── */}
                    {currentStep === 'personnel' && (
                        <div className="p-5 space-y-3">
                            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                                <User className="w-4 h-4" /> Personel Seçin
                            </p>
                            {loading ? (
                                <div className="space-y-3">
                                    {[1,2].map(i => <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />)}
                                </div>
                            ) : employees.length === 0 ? (
                                <p className="text-center text-gray-500 py-8 text-sm">Aktif personel bulunamadı.</p>
                            ) : (
                                employees.map(emp => {
                                    const selected = selectedEmployeeId === emp.id;
                                    return (
                                        <button
                                            key={emp.id}
                                            onClick={() => setSelectedEmployeeId(emp.id)}
                                            className={`w-full flex items-center gap-4 py-3 pr-4 pl-3 rounded-2xl border-2 transition-all duration-200 text-left ${
                                                selected ? 'border-primary-500 bg-primary-50' : 'border-gray-100 bg-white hover:border-gray-300'
                                            }`}
                                        >
                                            {/* Avatar */}
                                            <div className="h-14 w-14 min-w-[56px] min-h-[56px] aspect-square rounded-full overflow-hidden shrink-0 bg-primary-100 flex items-center justify-center">
                                                {emp.imageUrl ? (
                                                    <img src={getImageUrl(emp.imageUrl)} alt={emp.firstName} className="h-full w-full object-cover" />
                                                ) : (
                                                    <span className="text-base font-bold text-primary-700">
                                                        {emp.firstName?.[0]}{emp.lastName?.[0]}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <p className={`font-bold text-base leading-tight ${selected ? 'text-primary-900' : 'text-gray-900'}`}>
                                                    {emp.firstName} {emp.lastName}
                                                </p>
                                                <p className="text-sm text-gray-500 mt-0.5">{emp.title}</p>
                                                {emp.averageRating > 0 && (
                                                    <div className="flex items-center gap-1 mt-1">
                                                        <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                                                        <span className="text-xs font-bold text-yellow-600">{emp.averageRating.toFixed(1)}</span>
                                                        <span className="text-xs text-gray-400">({emp.reviewCount})</span>
                                                    </div>
                                                )}
                                            </div>

                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border-2 transition-all ${
                                                selected ? 'bg-primary-500 border-primary-500' : 'border-gray-300'
                                            }`}>
                                                {selected && <Check className="w-3.5 h-3.5 text-white" />}
                                            </div>
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    )}

                    {/* ── HİZMET ── */}
                    {currentStep === 'service' && (
                        <div className="p-5">
                            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2 mb-4">
                                <Scissors className="w-4 h-4" /> Hizmet Seçin
                            </p>

                            {loading ? (
                                <div className="space-y-3">
                                    {[1,2,3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-2xl animate-pulse" />)}
                                </div>
                            ) : (
                                <div className="space-y-5">
                                    {categories
                                        .map(cat => ({
                                            ...cat,
                                            services: cat.services.filter(s =>
                                                employees.find(e => e.id === selectedEmployeeId)?.serviceIds?.includes(s.id)
                                            ),
                                        }))
                                        .filter(cat => cat.services.length > 0)
                                        .map(cat => (
                                            <div key={cat.id}>
                                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">{cat.name}</p>
                                                <div className="space-y-2">
                                                    {cat.services.map(service => {
                                                        const count = selectedServices.filter(s => s.id === service.id).length;
                                                        const isSelected = count > 0;
                                                        return (
                                                            <div
                                                                key={service.id}
                                                                className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl border-2 transition-all duration-200 ${
                                                                    isSelected ? 'border-primary-400 bg-primary-50' : 'border-gray-100 bg-white hover:border-gray-200'
                                                                }`}
                                                            >
                                                                {/* İsim + Süre */}
                                                                <div className="flex-1 min-w-0">
                                                                    <p className={`font-semibold text-sm leading-tight ${isSelected ? 'text-primary-900' : 'text-gray-900'}`}>
                                                                        {service.name}
                                                                    </p>
                                                                    <div className="flex items-center gap-2 mt-1">
                                                                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary-700 bg-primary-50 border border-primary-200 px-2 py-0.5 rounded-full">
                                                                            <Clock className="w-3 h-3" />
                                                                            {service.duration} dk
                                                                        </span>
                                                                    </div>
                                                                </div>

                                                                {/* Fiyat */}
                                                                <span className="font-extrabold text-gray-900 text-base shrink-0">₺{service.price}</span>

                                                                {/* Miktar kontrol */}
                                                                <div className="flex items-center gap-1.5 shrink-0">
                                                                    <button
                                                                        onClick={() => removeService(service.id)}
                                                                        disabled={count === 0}
                                                                        className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all ${
                                                                            count > 0 ? 'border-primary-500 text-primary-600 hover:bg-primary-50' : 'border-gray-200 text-gray-300 cursor-not-allowed'
                                                                        }`}
                                                                    >
                                                                        <Minus className="w-3.5 h-3.5" />
                                                                    </button>
                                                                    <span className={`w-5 text-center font-bold text-sm ${count > 0 ? 'text-primary-700' : 'text-gray-400'}`}>
                                                                        {count}
                                                                    </span>
                                                                    <button
                                                                        onClick={() => addService(service)}
                                                                        className="w-7 h-7 rounded-full flex items-center justify-center border-2 border-primary-500 text-primary-600 hover:bg-primary-50 transition-all"
                                                                    >
                                                                        <Plus className="w-3.5 h-3.5" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            )}

                            {/* Sepet özet */}
                            {selectedServices.length > 0 && (
                                <div className="mt-4 p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between">
                                    <div>
                                        <p className="text-xs text-gray-500 font-medium">Toplam Süre</p>
                                        <p className="font-bold text-primary-700 text-sm">{totalDuration} dk</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-gray-500 font-medium">Toplam Tutar</p>
                                        <p className="font-bold text-lg text-primary-700">₺{totalPrice}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── TARİH & SAAT ── */}
                    {currentStep === 'datetime' && (
                        <div className="p-5 space-y-5">
                            {/* Seçili personel bilgisi */}
                            {selectedEmployee && (
                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                                    <div className="h-9 w-9 rounded-full overflow-hidden bg-primary-100 flex items-center justify-center shrink-0">
                                        {selectedEmployee.imageUrl ? (
                                            <img src={getImageUrl(selectedEmployee.imageUrl)} alt={selectedEmployee.firstName} className="h-full w-full object-cover" />
                                        ) : (
                                            <span className="text-xs font-bold text-primary-700">{selectedEmployee.firstName?.[0]}{selectedEmployee.lastName?.[0]}</span>
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-800">{selectedEmployee.firstName} {selectedEmployee.lastName}</p>
                                        <p className="text-xs text-gray-500">{totalDuration} dk · ₺{totalPrice}</p>
                                    </div>
                                </div>
                            )}

                            {/* Yatay gün seçici */}
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Tarih Seçin</p>
                                <div ref={dayScrollRef} className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                                    {availableDays.map(dateStr => {
                                        const d = new Date(dateStr + 'T12:00:00');
                                        const isSelected = selectedDate === dateStr;
                                        const isToday = dateStr === getTodayLocal();
                                        return (
                                            <button
                                                key={dateStr}
                                                onClick={() => { setSelectedDate(dateStr); setSelectedTime(''); }}
                                                className={`flex flex-col items-center shrink-0 w-14 py-3 px-1 rounded-2xl border-2 transition-all duration-200 ${
                                                    isSelected
                                                        ? 'bg-primary-600 border-primary-600 text-white shadow-md'
                                                        : 'bg-white border-gray-100 text-gray-700 hover:border-primary-300'
                                                }`}
                                            >
                                                <span className={`text-[10px] font-semibold uppercase ${isSelected ? 'text-primary-200' : 'text-gray-400'}`}>
                                                    {isToday ? 'Bugün' : format(d, 'EEE', { locale: tr })}
                                                </span>
                                                <span className={`text-xl font-black leading-tight ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                                                    {format(d, 'd')}
                                                </span>
                                                <span className={`text-[10px] font-medium ${isSelected ? 'text-primary-200' : 'text-gray-400'}`}>
                                                    {format(d, 'MMM', { locale: tr })}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Saat seçici */}
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Saat Seçin</p>

                                {loading ? (
                                    <div className="grid grid-cols-4 gap-2">
                                        {[...Array(8)].map((_, i) => <div key={i} className="h-10 bg-gray-100 rounded-xl animate-pulse" />)}
                                    </div>
                                ) : availability?.isShopClosed ? (
                                    <div className="text-center py-8 bg-red-50 rounded-2xl border border-dashed border-red-200">
                                        <p className="text-red-600 font-medium text-sm">Salon bu tarihte kapalıdır.</p>
                                    </div>
                                ) : generateTimeSlots().length === 0 ? (
                                    <div className="text-center py-8 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                        <p className="text-gray-500 text-sm">Bu tarihte uygun saat bulunamadı.</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="grid grid-cols-4 gap-2">
                                            {generateTimeSlots().map(({ time, end, isBooked, isBreak, isPast }) => {
                                                const disabled = isBooked || isBreak || isPast;
                                                const isSelected = selectedTime === time;
                                                return (
                                                    <button
                                                        key={time}
                                                        disabled={disabled}
                                                        onClick={() => setSelectedTime(time)}
                                                        className={`py-2.5 text-xs font-semibold rounded-xl border transition-all duration-150 ${
                                                            disabled
                                                                ? 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed'
                                                                : isSelected
                                                                    ? 'bg-primary-600 text-white border-primary-600 shadow-md scale-105'
                                                                    : 'bg-white text-gray-700 border-gray-200 hover:border-primary-400 hover:bg-primary-50'
                                                        }`}
                                                    >
                                                        {time}
                                                        {isSelected && <span className="block text-[9px] text-primary-200">–{end}</span>}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        <div className="flex gap-4 text-[11px] text-gray-400 mt-3 justify-center flex-wrap">
                                            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-white border border-gray-300 inline-block" />Müsait</span>
                                            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-gray-50 border border-gray-200 inline-block opacity-50" />Dolu/Mola</span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ── ONAY ── */}
                    {currentStep === 'confirm' && (
                        <div className="p-5 space-y-4">
                            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide text-center">Randevu Özeti</p>

                            {/* Personel */}
                            {selectedEmployee && (
                                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                    <div className="h-11 w-11 rounded-full overflow-hidden bg-primary-100 flex items-center justify-center shrink-0">
                                        {selectedEmployee.imageUrl ? (
                                            <img src={getImageUrl(selectedEmployee.imageUrl)} alt={selectedEmployee.firstName} className="h-full w-full object-cover" />
                                        ) : (
                                            <span className="text-sm font-bold text-primary-700">{selectedEmployee.firstName?.[0]}{selectedEmployee.lastName?.[0]}</span>
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900">{selectedEmployee.firstName} {selectedEmployee.lastName}</p>
                                        <p className="text-xs text-gray-500">{selectedEmployee.title}</p>
                                    </div>
                                </div>
                            )}

                            <div className="bg-gray-50 rounded-2xl border border-gray-100 divide-y divide-gray-100 overflow-hidden">
                                {/* Hizmetler */}
                                <div className="px-4 py-3">
                                    <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-2">Hizmetler</p>
                                    {Array.from(new Set(selectedServices.map(s => s.id))).map(uid => {
                                        const svc = selectedServices.find(s => s.id === uid)!;
                                        const cnt = selectedServices.filter(s => s.id === uid).length;
                                        return (
                                            <div key={uid} className="flex justify-between items-center text-sm py-0.5">
                                                <span className="text-gray-800 font-medium">{cnt > 1 ? `${cnt}× ` : ''}{svc.name}</span>
                                                <span className="font-bold text-gray-900">₺{svc.price * cnt}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                                {/* Tarih & Saat */}
                                <div className="px-4 py-3 flex justify-between items-center text-sm">
                                    <span className="text-gray-500">Tarih</span>
                                    <span className="font-bold text-gray-900">
                                        {format(new Date(selectedDate + 'T12:00:00'), 'd MMMM yyyy, EEEE', { locale: tr })}
                                    </span>
                                </div>
                                <div className="px-4 py-3 flex justify-between items-center text-sm">
                                    <span className="text-gray-500">Saat</span>
                                    <span className="font-bold text-gray-900">
                                        {selectedTime} – {format(addMinutes(new Date(`${selectedDate}T${selectedTime}:00`), totalDuration), 'HH:mm')}
                                    </span>
                                </div>
                                {/* Toplam */}
                                <div className="px-4 py-3 flex justify-between items-center">
                                    <span className="text-gray-600 font-semibold">Toplam</span>
                                    <span className="text-xl font-black text-primary-700">₺{totalPrice}</span>
                                </div>
                            </div>

                            {/* Not */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Not Ekle (İsteğe Bağlı)</label>
                                <textarea
                                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-300 focus:border-primary-400 text-sm resize-none"
                                    rows={3}
                                    value={note}
                                    onChange={e => setNote(e.target.value)}
                                    placeholder="Notunuzu buraya yazın..."
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between gap-3 shrink-0 bg-white rounded-b-2xl">
                    {currentStep !== 'personnel' ? (
                        <Button
                            variant="secondary"
                            onClick={prevStep}
                            className="flex items-center gap-1 px-4"
                        >
                            <ChevronLeft className="h-4 w-4" /> Geri
                        </Button>
                    ) : (
                        <div />
                    )}

                    {currentStep === 'confirm' ? (
                        <Button
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="flex-1 sm:flex-none sm:min-w-[160px] justify-center"
                        >
                            {submitting ? 'İşleniyor...' : 'Randevuyu Onayla'}
                        </Button>
                    ) : (
                        <Button
                            onClick={nextStep}
                            className="flex items-center gap-1 px-6"
                        >
                            Devam Et <ChevronRight className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
};
