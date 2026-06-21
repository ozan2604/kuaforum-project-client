import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, User, Clock, Check, ChevronRight, ChevronLeft, Scissors, Star, Plus, Minus, AlertCircle, Calendar, Phone } from 'lucide-react';
import { Button } from './Button';
import { employeeService } from '../api/employee.service';
import { appointmentService } from '../api/appointment.service';
import { authService } from '../api/auth.service';
import { serviceManagementService } from '../api/service.service';
import { useAuth } from '../context/AuthContext';
import type { Employee } from '../types/employee';
import type { ServiceCategoryDto, ShopServiceDto } from '../types/service';
import { toast } from 'react-hot-toast';
import { getApiError } from '../utils/storage';
import { format, addDays } from 'date-fns';
import { tr } from 'date-fns/locale';

interface ClosureDateEntry {
    closureDate: string;
    reason?: string;
}

interface BookingModalProps {
    isOpen: boolean;
    onClose: () => void;
    shopId: string;
    bookingDaysAhead?: number;
    weeklyOffDays?: number[];
    closureDates?: ClosureDateEntry[];
    initialServiceId?: string;
    initialServiceName?: string;
    initialServiceDuration?: number;
    initialServicePrice?: number;
    isGuest?: boolean;
    isMobile?: boolean;
}

type Step = 'info' | 'personnel' | 'service' | 'datetime' | 'confirm';

const NORMAL_STEPS: { id: Step; label: string; number: number }[] = [
    { id: 'personnel', label: 'Personel',     number: 1 },
    { id: 'service',   label: 'Hizmet',       number: 2 },
    { id: 'datetime',  label: 'Tarih & Saat', number: 3 },
    { id: 'confirm',   label: 'Onay',         number: 4 },
];

const GUEST_STEPS: { id: Step; label: string; number: number }[] = [
    { id: 'personnel', label: 'Personel',     number: 1 },
    { id: 'service',   label: 'Hizmet',       number: 2 },
    { id: 'datetime',  label: 'Tarih & Saat', number: 3 },
    { id: 'confirm',   label: 'Onay',         number: 4 },
    { id: 'info',      label: 'Doğrula',      number: 5 },
];

// Dakikayı "HH:mm" formatına çevirir
function minutesToHHMM(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// "HH:mm:ss" veya "HH:mm" stringini gece yarısından itibaren dakikaya çevirir
function hhmmToMinutes(hhmm: string): number {
    const [h, m] = hhmm.split(':').map(Number);
    return h * 60 + m;
}

// Backend Turkey time'ı "YYYY-MM-DDTHH:mm:ss" olarak döndürür (Z suffix yok).
// Doğrudan T sonrasındaki HH:mm'i okuyoruz — toLocaleString/new Date çevrimi
// bazı tarayıcılarda Invalid Date ürettiğinden kullanmıyoruz.
function dateStringToIstanbulMinutes(dateStr: string): number {
    // Hem 'T' hem de boşluk (' ') ayırıcısını destekler (örn: "2026-05-11T14:30:00" veya "2026-05-11 14:30:00")
    const match = dateStr.match(/[T\s](\d{2}):(\d{2})/);
    if (!match) return 0;
    return parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
}

// Birbiriyle bitişik/örtüşen booked slot'ları birleştirir
// Örn: [{10:00-10:30}, {10:30-11:00}] → [{10:00-11:00}]
function mergeBookedSlots(slots: { startTime: string; endTime: string }[]): { start: number; end: number }[] {
    if (slots.length === 0) return [];
    const ranges = slots
        .map(s => ({ start: dateStringToIstanbulMinutes(s.startTime), end: dateStringToIstanbulMinutes(s.endTime) }))
        .filter(r => r.start < r.end)
        .sort((a, b) => a.start - b.start);
    const merged: { start: number; end: number }[] = [];
    let cur = { ...ranges[0] };
    for (let i = 1; i < ranges.length; i++) {
        if (ranges[i].start <= cur.end) {
            cur.end = Math.max(cur.end, ranges[i].end);
        } else {
            merged.push(cur);
            cur = { ...ranges[i] };
        }
    }
    merged.push(cur);
    return merged;
}

// Bugünün tarihini Istanbul saat diliminde "YYYY-MM-DD" döndürür
function getTodayIstanbul(): string {
    return new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Istanbul' });
}

// Istanbul şu anki saatini gece yarısından dakika olarak döndürür
function getNowIstanbulMinutes(): number {
    // Intl.DateTimeFormat.formatToParts tarayıcılar arası en güvenilir yöntem
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Europe/Istanbul',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    }).formatToParts(new Date());
    const h = parseInt(parts.find(p => p.type === 'hour')?.value  ?? '0', 10);
    const m = parseInt(parts.find(p => p.type === 'minute')?.value ?? '0', 10);
    return h * 60 + m;
}

export const BookingModal: React.FC<BookingModalProps> = ({
    isOpen,
    onClose,
    shopId,
    bookingDaysAhead = 30,
    weeklyOffDays = [],
    closureDates = [],
    initialServiceId,
    initialServiceName,
    initialServiceDuration,
    initialServicePrice,
    isGuest = false,
    isMobile = false,
}) => {
    const { completeAuth } = useAuth();
    const STEPS = isGuest ? GUEST_STEPS : NORMAL_STEPS;
    const [employees, setEmployees]   = useState<Employee[]>([]);
    const [categories, setCategories] = useState<ServiceCategoryDto[]>([]);
    const [loading, setLoading]       = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [currentStep, setCurrentStep]           = useState<Step>('personnel');
    const [selectedServices, setSelectedServices] = useState<ShopServiceDto[]>([]);
    const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
    const [selectedDate, setSelectedDate] = useState(getTodayIstanbul());
    const [selectedTime, setSelectedTime] = useState('');
    const [selectionError, setSelectionError] = useState<string | null>(null);
    const [note, setNote] = useState('');
    const [availability, setAvailability] = useState<import('../types/appointment').EmployeeAvailabilityDto | null>(null);
    const [employeeLeaveDates, setEmployeeLeaveDates] = useState<string[]>([]); // 'yyyy-MM-dd' strings
    const [bookingSuccess, setBookingSuccess] = useState<{
        employeeName: string; date: string; time: string; totalPrice: number; isNewAccount?: boolean;
    } | null>(null);
    const [bookingError, setBookingError] = useState<string | null>(null);

    const [customerAddress, setCustomerAddress] = useState('');

    // Misafir akışı state
    const [guestName, setGuestName]   = useState('');
    const [guestPhone, setGuestPhone] = useState('');
    const [guestErrors, setGuestErrors] = useState<{ name?: string; phone?: string }>({});
    const [infoSubStep, setInfoSubStep] = useState<'form' | 'otp'>('form');
    const [sendingOtp, setSendingOtp]   = useState(false);
    const [guestOtp, setGuestOtp]       = useState('');
    const [otpError, setOtpError]       = useState<string | null>(null);

    const scrollRef = useRef<HTMLDivElement>(null);
    const selectionErrorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // selectionError 5 saniye sonra otomatik kapanır
    useEffect(() => {
        if (selectionErrorTimerRef.current) clearTimeout(selectionErrorTimerRef.current);
        if (!selectionError) return;
        selectionErrorTimerRef.current = setTimeout(() => setSelectionError(null), 5000);
        return () => { if (selectionErrorTimerRef.current) clearTimeout(selectionErrorTimerRef.current); };
    }, [selectionError]);

    // Yatay tarih scrollu için mouse/wheel dinleyicileri
    useEffect(() => {
        const el = scrollRef.current;
        if (!el || currentStep !== 'datetime') return;
        let isDown = false, startX = 0, sLeft = 0, moved = false;

        const onWheel = (e: WheelEvent) => { if (e.deltaY === 0) return; e.preventDefault(); el.scrollLeft += e.deltaY; };
        const onDown  = (e: MouseEvent) => { isDown = true; moved = false; el.style.cursor = 'grabbing'; startX = e.pageX - el.offsetLeft; sLeft = el.scrollLeft; };
        const onLeave = () => { isDown = false; el.style.cursor = 'grab'; };
        const onUp    = () => { isDown = false; el.style.cursor = 'grab'; };
        const onMove  = (e: MouseEvent) => {
            if (!isDown) return;
            const x = e.pageX - el.offsetLeft;
            if (Math.abs(x - startX) > 5) moved = true;
            if (moved) { e.preventDefault(); el.scrollLeft = sLeft - (x - startX) * 2; }
        };
        const onClick = (e: MouseEvent) => { if (moved) { e.preventDefault(); e.stopPropagation(); } };

        el.addEventListener('wheel', onWheel, { passive: false });
        el.addEventListener('mousedown', onDown);
        el.addEventListener('mouseleave', onLeave);
        el.addEventListener('mouseup', onUp);
        el.addEventListener('mousemove', onMove);
        el.addEventListener('click', onClick, true);
        el.style.cursor = 'grab';
        return () => {
            el.removeEventListener('wheel', onWheel);
            el.removeEventListener('mousedown', onDown);
            el.removeEventListener('mouseleave', onLeave);
            el.removeEventListener('mouseup', onUp);
            el.removeEventListener('mousemove', onMove);
            el.removeEventListener('click', onClick, true);
        };
    }, [currentStep]);

    // Modal açılışında sıfırlama
    useEffect(() => {
        if (!isOpen || !shopId) return;
        setCurrentStep('personnel');
        setSelectedEmployeeId('');
        setSelectedDate(getTodayIstanbul());
        setSelectedTime('');
        setNote('');
        setAvailability(null);
        setEmployeeLeaveDates([]);
        setBookingSuccess(null);
        setBookingError(null);
        setGuestName('');
        setGuestPhone('');
        setGuestErrors({});
        setInfoSubStep('form');
        setSendingOtp(false);
        setGuestOtp('');
        setOtpError(null);
        setSelectedServices(
            initialServiceId
                ? [{ id: initialServiceId, name: initialServiceName || '', duration: initialServiceDuration || 0, price: initialServicePrice || 0, isActive: true }]
                : []
        );
        loadShopData();
    }, [isOpen, shopId, initialServiceId]);

    // Hizmetler değiştiğinde seçili saati ve seçim hatasını sıfırla
    useEffect(() => {
        if (currentStep === 'datetime') { setSelectedTime(''); setSelectionError(null); }
    }, [selectedServices]);

    const loadShopData = async () => {
        setLoading(true);
        try {
            const [emps, svcs] = await Promise.all([
                employeeService.getPublicShopEmployees(shopId),
                serviceManagementService.getPublicShopServices(shopId),
            ]);
            setEmployees(emps);
            setCategories(svcs);
        } catch (err) {
            toast.error(getApiError(err, 'Veriler yüklenemedi.'));
        } finally {
            setLoading(false);
        }
    };

    // Personel seçilince izin günlerini çek
    useEffect(() => {
        if (selectedEmployeeId) {
            employeeService.getPublicLeaveDates(selectedEmployeeId)
                .then(data => setEmployeeLeaveDates(data.map(l => l.leaveDate)))
                .catch(() => setEmployeeLeaveDates([]));
        } else {
            setEmployeeLeaveDates([]);
        }
    }, [selectedEmployeeId]);

    // Tarih & saat adımına geçince veya tarih değişince müsaitliği çek
    useEffect(() => {
        if (currentStep === 'datetime' && selectedDate && selectedEmployeeId) {
            fetchAvailability();
        }
    }, [currentStep, selectedDate, selectedEmployeeId]);

    const fetchAvailability = async () => {
        setLoading(true);
        setSelectedTime('');
        setSelectionError(null);
        try {
            const data = await appointmentService.getAvailability(selectedEmployeeId, selectedDate);
            setAvailability(data);
        } catch (err) {
            toast.error(getApiError(err, 'Müsaitlik durumu yüklenemedi.'));
        } finally {
            setLoading(false);
        }
    };

    // ─── SLOT HESABI ────────────────────────────────────────────────────────────
    const timeSlots = useMemo(() => {
        if (!availability?.isWorking || !availability.workStartTime || !availability.workEndTime) return [];

        const totalDuration = selectedServices.reduce((t, s) => t + s.duration, 0);
        if (totalDuration === 0) return [];

        // Çalışma saatlerini dakikaya çevir
        const workStart = hhmmToMinutes(availability.workStartTime);
        const workEnd   = hhmmToMinutes(availability.workEndTime);

        // Mola saatlerini dakikaya çevir (varsa)
        let breakStart: number | null = null;
        let breakEnd:   number | null = null;
        if (availability.breakStartTime && availability.breakEndTime) {
            breakStart = hhmmToMinutes(availability.breakStartTime);
            breakEnd   = hhmmToMinutes(availability.breakEndTime);
        }

        // Mevcut rezervasyonları Istanbul saatiyle dakikaya çevir
        const bookedRanges = availability.bookedSlots.map(s => ({
            start: dateStringToIstanbulMinutes(s.startTime),
            end:   dateStringToIstanbulMinutes(s.endTime),
        }));

        const isToday      = selectedDate === getTodayIstanbul();
        const nowMinutes   = isToday ? getNowIstanbulMinutes() : -1;

        const slots: { time: string; endTime: string; isBooked: boolean; isBreak: boolean; isPast: boolean }[] = [];

        // Tüm slotlar gösterilir: workStart'tan workEnd'e kadar 15'er dakika.
        // isBooked ve isBreak, sadece o 15 dk penceresiyle çakışan gerçek rezervasyonlara/molalara göre belirlenir.
        // Hizmet süresinin sığıp sığmadığı kontrol edilmez — bu yalnızca kullanıcı tıkladığında yapılır.
        for (let slotStart = workStart; slotStart < workEnd; slotStart += 15) {
            const slotWindowEnd  = slotStart + 15;              // Sadece bu 15 dk penceresi
            const slotServiceEnd = slotStart + totalDuration;   // Yalnızca görüntü için

            const isPast   = isToday && slotStart < nowMinutes;
            // Bu 15 dk penceresi mola saatiyle çakışıyor mu?
            const isBreak  = breakStart !== null && breakEnd !== null
                && slotStart < breakEnd && slotWindowEnd > breakStart;
            // Bu 15 dk penceresi gerçek bir rezervasyonla çakışıyor mu?
            const isBooked = bookedRanges.some(b => slotStart < b.end && slotWindowEnd > b.start);

            slots.push({
                time:    minutesToHHMM(slotStart),
                endTime: minutesToHHMM(slotServiceEnd),
                isBooked,
                isBreak,
                isPast,
            });
        }

        return slots;
    }, [availability, selectedServices, selectedDate]);
    // ────────────────────────────────────────────────────────────────────────────

    const totalDuration = selectedServices.reduce((t, s) => t + s.duration, 0);
    const totalPrice    = selectedServices.reduce((t, s) => t + s.price, 0);

    // Pazartesi'den Pazar'a sırala
    const availableDays = useMemo(() => {
        const days = Array.from({ length: bookingDaysAhead }, (_, i) =>
            addDays(new Date(), i).toLocaleDateString('en-CA')
        );
        // Takvim sıralamasını değiştirmiyoruz (kronolojik sıra sabit), sadece bugünden itibaren
        return days;
    }, [bookingDaysAhead]);

    const getClosedReason = (dateStr: string): string | null => {
        if (weeklyOffDays.includes(new Date(`${dateStr}T12:00:00`).getDay())) return 'Haftalık Tatil';
        const closure = closureDates.find(c => c.closureDate.substring(0, 10) === dateStr);
        if (closure) return closure.reason || 'Özel Tatil';
        if (employeeLeaveDates.includes(dateStr)) return 'Personel İzinli';
        return null;
    };

    const handleSubmit = async () => {
        if (!selectedServices.length || !selectedTime) return;
        if (isMobile && !customerAddress.trim()) {
            setBookingError('Seyyar berber randevusu için adresinizi girmelisiniz.');
            return;
        }
        setSubmitting(true);
        try {
            const startTimeIso = new Date(`${selectedDate}T${selectedTime}:00`).toISOString();
            const endTimeStr   = minutesToHHMM(hhmmToMinutes(selectedTime) + totalDuration);

            await appointmentService.createAppointment({
                shopId,
                serviceIds: selectedServices.map(s => s.id),
                shopEmployeeId: selectedEmployeeId,
                startTime: startTimeIso,
                note,
                customerAddress: isMobile ? customerAddress.trim() : undefined,
            });
            setBookingSuccess({
                employeeName: selectedEmployee ? `${selectedEmployee.firstName} ${selectedEmployee.lastName}` : '',
                date: format(new Date(`${selectedDate}T12:00:00`), 'd MMMM yyyy, EEEE', { locale: tr }),
                time: `${selectedTime} – ${endTimeStr}`,
                totalPrice,
            });
        } catch (error: any) {
            const msg =
                error.response?.data?.Message ||
                error.response?.data?.message ||
                (typeof error.response?.data === 'string' ? error.response.data : null) ||
                error.message ||
                'Randevu oluşturulamadı. Lütfen tekrar deneyin.';
            setBookingError(msg);
        } finally {
            setSubmitting(false);
        }
    };

    const handleSlotClick = (time: string) => {
        if (!availability) return;
        const startMin = hhmmToMinutes(time);
        const endMin   = startMin + totalDuration;
        const wEnd     = hhmmToMinutes(availability.workEndTime!);

        if (endMin > wEnd) {
            setSelectionError(
                `${time}'da başlayan ${totalDuration} dk'lık hizmet çalışma bitiş saatini (${minutesToHHMM(wEnd)}) aşıyor. En geç ${minutesToHHMM(wEnd - totalDuration)} seçebilirsiniz.`
            );
            setSelectedTime('');
            return;
        }

        if (availability.breakStartTime && availability.breakEndTime) {
            const bStart = hhmmToMinutes(availability.breakStartTime);
            const bEnd   = hhmmToMinutes(availability.breakEndTime);
            if (startMin < bEnd && endMin > bStart) {
                setSelectionError(
                    `Bu saat aralığı mola zamanıyla çakışıyor (${minutesToHHMM(bStart)}–${minutesToHHMM(bEnd)}). Lütfen başka bir saat seçin.`
                );
                setSelectedTime('');
                return;
            }
        }

        const bookedRanges = availability.bookedSlots.map(s => ({
            start: dateStringToIstanbulMinutes(s.startTime),
            end:   dateStringToIstanbulMinutes(s.endTime),
        }));
        const conflict = bookedRanges.find(b => startMin < b.end && endMin > b.start);
        if (conflict) {
            setSelectionError(
                `Bu saat aralığı mevcut bir randevuyla çakışıyor (${minutesToHHMM(conflict.start)}–${minutesToHHMM(conflict.end)}). Lütfen başka bir saat seçin.`
            );
            setSelectedTime('');
            return;
        }

        setSelectionError(null);
        setSelectedTime(time);
    };

    const nextStep = async () => {
        if (currentStep === 'personnel') {
            if (!selectedEmployeeId) { toast.error('Lütfen bir personel seçin.'); return; }
            setCurrentStep('service');
        } else if (currentStep === 'service') {
            if (!selectedServices.length) { toast.error('Lütfen en az bir hizmet seçin.'); return; }
            setCurrentStep('datetime');
        } else if (currentStep === 'datetime') {
            if (!selectedDate || !selectedTime) { toast.error('Lütfen tarih ve saat seçin.'); return; }
            setCurrentStep('confirm');
        } else if (currentStep === 'confirm' && isGuest) {
            setCurrentStep('info');
        } else if (currentStep === 'info') {
            if (infoSubStep === 'form') {
                const errs: { name?: string; phone?: string } = {};
                if (!guestName.trim()) errs.name = 'Ad soyad zorunludur.';
                if (!guestPhone.trim()) errs.phone = 'Telefon numarası zorunludur.';
                else if (!/^05[0-9]{9}$/.test(guestPhone.trim())) errs.phone = 'Telefon 05XXXXXXXXX formatında olmalıdır.';
                if (Object.keys(errs).length) { setGuestErrors(errs); return; }
                setGuestErrors({});
                setSendingOtp(true);
                try {
                    await authService.sendGuestOtp(guestPhone.trim());
                    setInfoSubStep('otp');
                } catch (err: any) {
                    const msg = err?.response?.data?.Message || err?.response?.data?.message || 'SMS gönderilemedi. Lütfen tekrar deneyin.';
                    toast.error(msg);
                } finally {
                    setSendingOtp(false);
                }
                return;
            }

            if (!guestOtp.trim() || !/^\d{6}$/.test(guestOtp.trim())) {
                setOtpError('6 haneli kodu eksiksiz girin.');
                return;
            }
            setSendingOtp(true);
            try {
                const authResponse = await authService.verifyGuestOtp({
                    phoneNumber: guestPhone.trim(),
                    name: guestName.trim(),
                    otpCode: guestOtp.trim(),
                });
                completeAuth(authResponse);
                setOtpError(null);
                await handleSubmit();
            } catch (err: any) {
                const msg = err?.response?.data?.Message || err?.response?.data?.message || 'Doğrulama kodu hatalı veya süresi dolmuş.';
                setOtpError(msg);
            } finally {
                setSendingOtp(false);
            }
        }
    };

    const prevStep = () => {
        if (currentStep === 'info' && infoSubStep === 'otp') {
            setInfoSubStep('form');
            setGuestOtp('');
            setOtpError(null);
        } else if (currentStep === 'info') {
            setCurrentStep('confirm');
        } else if (currentStep === 'service') {
            setCurrentStep('personnel');
        } else if (currentStep === 'datetime') {
            setSelectedTime('');
            setCurrentStep('service');
        } else if (currentStep === 'confirm') {
            setCurrentStep('datetime');
        }
    };

    const addService = (s: ShopServiceDto) => setSelectedServices(prev => [...prev, s]);
    const removeService = (id: string) => setSelectedServices(prev => {
        const i = prev.findIndex(s => s.id === id);
        return i === -1 ? prev : [...prev.slice(0, i), ...prev.slice(i + 1)];
    });

    const getImageUrl = (path?: string) => {
        if (!path) return '';
        return path.startsWith('http') ? path : `http://localhost:5000${path}`;
    };

    if (!isOpen) return null;

    const currentStepIndex  = STEPS.findIndex(s => s.id === currentStep);
    const selectedEmployee  = employees.find(e => e.id === selectedEmployeeId);

    // Müsait ama seçilebilir slot yok mu?
    const noAvailableSlots = availability?.isWorking && !loading &&
        timeSlots.every(s => s.isBooked || s.isBreak || s.isPast);

    return (
        <>
        {/* Seçim hatası — ekran ortasında popup, 5 sn sonra kapanır */}
        {selectionError && (
            <div className="fixed inset-0 flex items-center justify-center z-[70] pointer-events-none">
                <div className="pointer-events-auto mx-4 max-w-sm w-full bg-red-50 border border-red-200 rounded-2xl shadow-2xl p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
                    <p className="text-sm text-red-700 font-semibold flex-1 leading-snug">{selectionError}</p>
                    <button
                        onClick={() => setSelectionError(null)}
                        className="shrink-0 p-1 rounded-lg hover:bg-red-100 text-red-400 hover:text-red-600 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>
        )}
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center pb-14 sm:pb-4 sm:p-4 z-50">
            <div className="bg-white w-full sm:rounded-2xl sm:max-w-xl max-h-[95vh] sm:max-h-[90vh] flex flex-col rounded-t-2xl shadow-2xl">

                {/* Header */}
                <div className="flex justify-between items-center px-5 py-4 border-b border-gray-100 shrink-0">
                    <h2 className="text-lg font-bold text-gray-900">Randevu Oluştur</h2>
                    <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Stepper */}
                <div className="px-4 pt-4 pb-3 border-b border-gray-100 shrink-0">
                    <div className="flex items-center justify-between relative">
                        <div className="absolute top-4 left-4 right-4 h-0.5 z-0">
                            <div className="absolute inset-0 bg-gray-200" />
                            <div
                                className="absolute left-0 top-0 h-full bg-primary-500 transition-all duration-500"
                                style={{ width: `${(currentStepIndex / (STEPS.length - 1)) * 100}%` }}
                            />
                        </div>
                        {STEPS.map((step, i) => {
                            const isActive = step.id === currentStep;
                            const isDone   = i < currentStepIndex;
                            const isFirst  = i === 0;
                            const isLast   = i === STEPS.length - 1;
                            return (
                                <div key={step.id} className={`flex flex-col gap-1.5 z-10 ${isFirst ? 'items-start' : isLast ? 'items-end' : 'items-center'}`}>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all duration-300 ${
                                        isDone   ? 'bg-primary-500 border-primary-500 text-white' :
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

                    {/* ── BAŞARI ── */}
                    {bookingSuccess && (
                        <div className="flex flex-col items-center justify-center py-12 px-6 text-center space-y-6">
                            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center shadow-inner">
                                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center shadow-md">
                                    <Check className="w-9 h-9 text-white stroke-[3]" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-2xl font-black text-gray-900">Randevunuz Alındı!</h3>
                                <p className="text-gray-500 text-sm">Randevunuz başarıyla oluşturuldu. Sizi bekliyoruz!</p>
                                {bookingSuccess.isNewAccount && (
                                    <p className="text-xs text-primary-600 bg-primary-50 rounded-xl px-3 py-2 mt-2 font-medium">
                                        Hesabınız oluşturuldu — şifreniz SMS ile gönderildi.
                                    </p>
                                )}
                            </div>
                            <div className="w-full bg-gray-50 rounded-2xl border border-gray-100 divide-y divide-gray-100 text-sm">
                                <div className="px-4 py-3 flex justify-between items-center">
                                    <span className="text-gray-500">Personel</span>
                                    <span className="font-semibold text-gray-900">{bookingSuccess.employeeName}</span>
                                </div>
                                <div className="px-4 py-3 flex justify-between items-center">
                                    <span className="text-gray-500">Tarih</span>
                                    <span className="font-semibold text-gray-900">{bookingSuccess.date}</span>
                                </div>
                                <div className="px-4 py-3 flex justify-between items-center">
                                    <span className="text-gray-500">Saat</span>
                                    <span className="font-semibold text-gray-900">{bookingSuccess.time}</span>
                                </div>
                                <div className="px-4 py-3 flex justify-between items-center">
                                    <span className="text-gray-500 font-semibold">Toplam</span>
                                    <span className="font-black text-lg text-primary-700">₺{bookingSuccess.totalPrice}</span>
                                </div>
                            </div>
                            <button onClick={onClose} className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl transition-colors">
                                Tamam
                            </button>
                        </div>
                    )}

                    {/* ── HATA ── */}
                    {bookingError && (
                        <div className="flex flex-col items-center justify-center py-12 px-6 text-center space-y-6">
                            <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center shadow-inner">
                                <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center shadow-md">
                                    <AlertCircle className="w-9 h-9 text-white" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-2xl font-black text-gray-900">Randevu Alınamadı</h3>
                                <p className="text-gray-500 text-sm leading-relaxed">{bookingError}</p>
                            </div>
                            <div className="w-full flex flex-col gap-3">
                                <button onClick={() => setBookingError(null)} className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl transition-colors">
                                    Tekrar Dene
                                </button>
                                <button onClick={onClose} className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors">
                                    Kapat
                                </button>
                            </div>
                        </div>
                    )}

                    {!bookingSuccess && !bookingError && (<>

                    {/* ── BİLGİLER (Misafir) ── */}
                    {currentStep === 'info' && infoSubStep === 'form' && (
                        <div className="p-5 space-y-4">
                            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                                <User className="w-4 h-4" /> Bilgileriniz
                            </p>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Ad Soyad <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        value={guestName}
                                        onChange={e => { setGuestName(e.target.value); setGuestErrors(prev => ({ ...prev, name: undefined })); }}
                                        placeholder="Adınız ve soyadınız"
                                        className={`w-full px-4 py-3 rounded-xl border-2 text-sm transition-colors outline-none focus:border-primary-400 ${guestErrors.name ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'}`}
                                    />
                                    {guestErrors.name && <p className="text-xs text-red-500 mt-1">{guestErrors.name}</p>}
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                                        <Phone className="w-3.5 h-3.5 inline mr-1" />Telefon <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="tel"
                                        value={guestPhone}
                                        onChange={e => {
                                            setGuestPhone(e.target.value);
                                            setGuestErrors(prev => ({ ...prev, phone: undefined }));
                                        }}
                                        placeholder="05XXXXXXXXX"
                                        maxLength={11}
                                        className={`w-full px-4 py-3 rounded-xl border-2 text-sm transition-colors outline-none focus:border-primary-400 ${guestErrors.phone ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'}`}
                                    />
                                    {guestErrors.phone && <p className="text-xs text-red-500 mt-1">{guestErrors.phone}</p>}
                                </div>
                            </div>
                            <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 text-xs text-blue-600 leading-relaxed">
                                Numaranıza SMS doğrulama kodu gönderilecektir.
                            </div>
                        </div>
                    )}

                    {/* ── OTP DOĞRULAMA ── */}
                    {currentStep === 'info' && infoSubStep === 'otp' && (
                        <div className="p-5 space-y-5">
                            <div className="text-center space-y-2">
                                <div className="w-14 h-14 bg-primary-50 rounded-full flex items-center justify-center mx-auto">
                                    <Phone className="w-7 h-7 text-primary-500" />
                                </div>
                                <p className="font-bold text-gray-900">SMS Kodunuzu Girin</p>
                                <p className="text-sm text-gray-500">
                                    <span className="font-semibold text-gray-700">{guestPhone}</span> numarasına gönderilen 6 haneli kodu girin.
                                </p>
                            </div>

                            <div>
                                <input
                                    type="tel"
                                    inputMode="numeric"
                                    maxLength={6}
                                    value={guestOtp}
                                    onChange={e => {
                                        setGuestOtp(e.target.value.replace(/\D/g, ''));
                                        setOtpError(null);
                                    }}
                                    placeholder="_ _ _ _ _ _"
                                    className={`w-full px-4 py-4 rounded-xl border-2 text-2xl font-bold tracking-[0.6em] text-center transition-colors outline-none focus:border-primary-400 ${otpError ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'}`}
                                />
                                {otpError && <p className="text-xs text-red-500 mt-1.5 text-center">{otpError}</p>}
                            </div>

                            <div className="text-center">
                                <button
                                    onClick={async () => {
                                        setSendingOtp(true);
                                        try {
                                            await authService.sendGuestOtp(guestPhone.trim());
                                            setGuestOtp('');
                                            setOtpError(null);
                                            toast.success('Yeni kod gönderildi.');
                                        } catch {
                                            toast.error('Kod gönderilemedi.');
                                        } finally {
                                            setSendingOtp(false);
                                        }
                                    }}
                                    disabled={sendingOtp}
                                    className="text-sm text-primary-600 hover:text-primary-800 font-semibold disabled:opacity-50"
                                >
                                    {sendingOtp ? 'Gönderiliyor...' : 'Kodu tekrar gönder'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── PERSONEL ── */}
                    {currentStep === 'personnel' && (
                        <div className="p-5 space-y-3">
                            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                                <User className="w-4 h-4" /> Personel Seçin
                            </p>
                            {loading ? (
                                <div className="space-y-3">
                                    {[1, 2].map(i => <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />)}
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
                                            <div className="h-14 w-14 min-w-[56px] min-h-[56px] aspect-square rounded-full overflow-hidden shrink-0 bg-primary-100 flex items-center justify-center">
                                                {emp.imageUrl ? (
                                                    <img src={getImageUrl(emp.imageUrl)} alt={emp.firstName} className="h-full w-full object-cover" />
                                                ) : (
                                                    <span className="text-base font-bold text-primary-700">{emp.firstName?.[0]}{emp.lastName?.[0]}</span>
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
                                    {[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-2xl animate-pulse" />)}
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
                                                        const count      = selectedServices.filter(s => s.id === service.id).length;
                                                        const isSelected = count > 0;
                                                        return (
                                                            <div
                                                                key={service.id}
                                                                className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl border-2 transition-all duration-200 ${
                                                                    isSelected ? 'border-primary-400 bg-primary-50' : 'border-gray-100 bg-white hover:border-gray-200'
                                                                }`}
                                                            >
                                                                <div className="flex-1 min-w-0">
                                                                    <p className={`font-semibold text-sm leading-tight ${isSelected ? 'text-primary-900' : 'text-gray-900'}`}>
                                                                        {service.name}
                                                                    </p>
                                                                    <div className="flex items-center gap-2 mt-1">
                                                                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary-700 bg-primary-50 border border-primary-200 px-2 py-0.5 rounded-full">
                                                                            <Clock className="w-3 h-3" />{service.duration} dk
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                <span className="font-extrabold text-gray-900 text-base shrink-0">₺{service.price}</span>
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
                            {/* Personel + süre özeti */}
                            {selectedEmployee && (
                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                                    <div className="h-9 w-9 rounded-full overflow-hidden bg-primary-100 flex items-center justify-center shrink-0">
                                        {selectedEmployee.imageUrl ? (
                                            <img src={getImageUrl(selectedEmployee.imageUrl)} alt={selectedEmployee.firstName} className="h-full w-full object-cover" />
                                        ) : (
                                            <span className="text-xs font-bold text-primary-700">{selectedEmployee.firstName?.[0]}{selectedEmployee.lastName?.[0]}</span>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-gray-800">{selectedEmployee.firstName} {selectedEmployee.lastName}</p>
                                        <p className="text-xs text-gray-500">{totalDuration} dk toplam · ₺{totalPrice}</p>
                                    </div>
                                    {availability?.isWorking && availability.workStartTime && availability.workEndTime && (
                                        <div className="text-right shrink-0">
                                            <p className="text-[10px] text-gray-400">Çalışma saati</p>
                                            <p className="text-xs font-semibold text-gray-600">
                                                {availability.workStartTime.substring(0, 5)} – {availability.workEndTime.substring(0, 5)}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Tarih seçici */}
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Tarih Seçin</p>
                                <div ref={scrollRef} className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 select-none">
                                    {availableDays.map(dateStr => {
                                        const d            = new Date(`${dateStr}T12:00:00`);
                                        const isSelected   = selectedDate === dateStr;
                                        const isToday      = dateStr === getTodayIstanbul();
                                        const closedReason = getClosedReason(dateStr);
                                        return (
                                            <button
                                                key={dateStr}
                                                disabled={!!closedReason}
                                                onClick={() => setSelectedDate(dateStr)}
                                                className={`flex flex-col items-center shrink-0 w-[72px] py-2 px-1 rounded-2xl border-2 transition-all duration-200 ${
                                                    closedReason
                                                        ? 'bg-red-50 border-red-200 cursor-not-allowed'
                                                        : isSelected
                                                            ? 'bg-primary-600 border-primary-600 text-white shadow-md'
                                                            : 'bg-white border-gray-100 text-gray-700 hover:border-primary-300'
                                                }`}
                                            >
                                                <span className={`text-[9px] font-semibold ${closedReason ? 'text-red-400' : isSelected ? 'text-primary-200' : 'text-gray-400'}`}>
                                                    {isToday ? 'Bugün' : format(d, 'EEEE', { locale: tr })}
                                                </span>
                                                <span className={`text-xl font-black leading-tight ${closedReason ? 'text-red-500' : isSelected ? 'text-white' : 'text-gray-900'}`}>
                                                    {format(d, 'd')}
                                                </span>
                                                <span className={`text-[10px] font-medium ${closedReason ? 'text-red-400' : isSelected ? 'text-primary-200' : 'text-gray-400'}`}>
                                                    {format(d, 'MMM', { locale: tr })}
                                                </span>
                                                {closedReason && (
                                                    <span className="text-[8px] font-bold text-red-500 mt-0.5 text-center leading-tight line-clamp-2 break-words w-full">
                                                        {closedReason}
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Saat seçici */}
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Saat Seçin</p>

                                {/* Bu gün gerçekten dolu olan zaman dilimleri */}
                                {!loading && availability?.isWorking && availability.bookedSlots.length > 0 && (() => {
                                    const merged = mergeBookedSlots(availability.bookedSlots);
                                    return (
                                        <div className="flex flex-wrap items-center gap-1.5 mb-3 p-2.5 bg-blue-50 rounded-xl border border-blue-100">
                                            <span className="text-[11px] text-blue-500 font-semibold shrink-0">Meşgul:</span>
                                            {merged.map((r, i) => (
                                                <span key={i} className="text-[11px] font-bold text-blue-700 bg-white border border-blue-200 px-2 py-0.5 rounded-full">
                                                    {minutesToHHMM(r.start)} – {minutesToHHMM(r.end)}
                                                </span>
                                            ))}
                                            <span className="text-[10px] text-blue-400 ml-auto shrink-0">Bu sürelere denk gelen slotlar seçilemez.</span>
                                        </div>
                                    );
                                })()}

                                {loading ? (
                                    <div className="grid grid-cols-4 gap-2">
                                        {[...Array(8)].map((_, i) => <div key={i} className="h-10 bg-gray-100 rounded-xl animate-pulse" />)}
                                    </div>
                                ) : availability?.isShopClosed ? (
                                    <div className="text-center py-8 bg-red-50 rounded-2xl border border-dashed border-red-200">
                                        <p className="text-red-600 font-semibold text-sm">Salon bu tarihte kapalıdır.</p>
                                    </div>
                                ) : availability?.isOnLeave ? (
                                    <div className="text-center py-8 bg-violet-50 rounded-2xl border border-dashed border-violet-200">
                                        <Calendar className="w-8 h-8 text-violet-300 mx-auto mb-2" />
                                        <p className="text-violet-600 font-semibold text-sm">Personel bu tarihte izinlidir.</p>
                                        <p className="text-violet-400 text-xs mt-1">Farklı bir tarih veya personel seçin.</p>
                                    </div>
                                ) : !availability?.isWorking ? (
                                    <div className="text-center py-8 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                        <Calendar className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                        <p className="text-gray-500 font-semibold text-sm">Bu gün çalışma günü değil.</p>
                                        <p className="text-gray-400 text-xs mt-1">Başka bir tarih seçin.</p>
                                    </div>
                                ) : timeSlots.length === 0 ? (
                                    <div className="text-center py-8 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                        <Clock className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                        <p className="text-gray-500 font-semibold text-sm">Bu gün için saat gösterilemiyor.</p>
                                        <p className="text-gray-400 text-xs mt-1">Lütfen başka bir gün deneyin.</p>
                                    </div>
                                ) : noAvailableSlots ? (
                                    <div className="text-center py-8 bg-amber-50 rounded-2xl border border-dashed border-amber-200">
                                        <Clock className="w-8 h-8 text-amber-300 mx-auto mb-2" />
                                        <p className="text-amber-700 font-semibold text-sm">Bu tarihte müsait saat kalmadı.</p>
                                        <p className="text-amber-600 text-xs mt-1">Başka bir gün deneyin.</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="grid grid-cols-4 gap-2">
                                            {(() => {
                                                const selStart = selectedTime ? hhmmToMinutes(selectedTime) : -1;
                                                const selEnd   = selectedTime ? selStart + totalDuration : -1;
                                                return timeSlots.map(({ time, endTime, isBooked, isBreak, isPast }) => {
                                                    const slotMin       = hhmmToMinutes(time);
                                                    const disabled      = isBooked || isBreak || isPast;
                                                    const isSelected    = selectedTime === time;
                                                    const isInRange     = selectedTime !== '' && slotMin >= selStart && slotMin < selEnd;
                                                    let slotClass = '';
                                                    if (isSelected) {
                                                        slotClass = 'bg-primary-600 text-white border-primary-600 shadow-md scale-105';
                                                    } else if (isInRange) {
                                                        slotClass = 'bg-primary-600 text-white border-primary-600';
                                                    } else if (isPast) {
                                                        slotClass = 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed';
                                                    } else if (isBooked) {
                                                        slotClass = 'bg-blue-50 text-blue-300 border-blue-200 cursor-not-allowed';
                                                    } else if (isBreak) {
                                                        slotClass = 'bg-amber-50 text-amber-400 border-amber-200 cursor-not-allowed';
                                                    } else {
                                                        slotClass = 'bg-white text-gray-700 border-gray-200 hover:border-primary-400 hover:bg-primary-50';
                                                    }
                                                    return (
                                                        <button
                                                            key={time}
                                                            disabled={disabled}
                                                            onClick={() => handleSlotClick(time)}
                                                            className={`py-2.5 text-xs font-semibold rounded-xl border transition-all duration-150 ${slotClass}`}
                                                        >
                                                            {time}
                                                            {isSelected && (
                                                                <span className="block text-[9px] text-primary-200">–{endTime}</span>
                                                            )}
                                                        </button>
                                                    );
                                                });
                                            })()}
                                        </div>

                                        {/* Seçili saat bilgisi */}
                                        {selectedTime && (
                                            <div className="mt-3 p-3 bg-primary-50 rounded-xl border border-primary-100 flex items-center justify-between">
                                                <span className="text-xs text-primary-600 font-medium">Seçilen aralık</span>
                                                <span className="text-sm font-bold text-primary-800">
                                                    {selectedTime} – {minutesToHHMM(hhmmToMinutes(selectedTime) + totalDuration)}
                                                    <span className="text-xs font-normal text-primary-500 ml-1">({totalDuration} dk)</span>
                                                </span>
                                            </div>
                                        )}

                                        <div className="flex gap-x-4 gap-y-1.5 text-[11px] text-gray-400 mt-3 justify-center flex-wrap">
                                            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-white border border-gray-300 inline-block" />Müsait</span>
                                            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-blue-100 border border-blue-200 inline-block" />Dolu</span>
                                            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-amber-100 border border-amber-200 inline-block" />Mola</span>
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
                                <div className="px-4 py-3 flex justify-between items-center text-sm">
                                    <span className="text-gray-500">Tarih</span>
                                    <span className="font-bold text-gray-900">
                                        {format(new Date(`${selectedDate}T12:00:00`), 'd MMMM yyyy, EEEE', { locale: tr })}
                                    </span>
                                </div>
                                <div className="px-4 py-3 flex justify-between items-center text-sm">
                                    <span className="text-gray-500">Saat</span>
                                    <span className="font-bold text-gray-900">
                                        {selectedTime} – {minutesToHHMM(hhmmToMinutes(selectedTime) + totalDuration)}
                                        <span className="text-xs font-normal text-gray-400 ml-1">({totalDuration} dk)</span>
                                    </span>
                                </div>
                                <div className="px-4 py-3 flex justify-between items-center">
                                    <span className="text-gray-600 font-semibold">Toplam</span>
                                    <span className="text-xl font-black text-primary-700">₺{totalPrice}</span>
                                </div>
                            </div>

                            {isMobile && (
                                <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 space-y-2">
                                    <label className="block text-xs font-semibold text-purple-700 uppercase tracking-wide">
                                        Adresiniz <span className="text-red-500">*</span>
                                    </label>
                                    <p className="text-xs text-purple-600">Berber size bu adrese gelecektir.</p>
                                    <textarea
                                        className="w-full p-3 border border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-300 focus:border-purple-400 text-sm resize-none bg-white"
                                        rows={2}
                                        value={customerAddress}
                                        onChange={e => setCustomerAddress(e.target.value)}
                                        placeholder="Örn: Moda Cad. No:5 Daire:3, Kadıköy / İstanbul"
                                        required
                                    />
                                </div>
                            )}

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

                    </>)}
                </div>

                {/* Footer */}
                {!bookingSuccess && !bookingError && (
                    <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between gap-3 shrink-0 bg-white rounded-b-2xl">
                        {currentStep !== 'personnel' ? (
                            <Button variant="secondary" onClick={prevStep} className="flex items-center gap-1 px-4">
                                <ChevronLeft className="h-4 w-4" /> Geri
                            </Button>
                        ) : (
                            <div />
                        )}
                        {currentStep === 'confirm' && !isGuest ? (
                            <Button onClick={handleSubmit} disabled={submitting} className="flex-1 sm:flex-none sm:min-w-[160px] justify-center">
                                {submitting ? 'İşleniyor...' : 'Randevuyu Onayla'}
                            </Button>
                        ) : (
                            <Button
                                onClick={nextStep}
                                disabled={currentStep === 'info' && sendingOtp}
                                className="flex items-center gap-1 px-6"
                            >
                                {currentStep === 'info' && infoSubStep === 'form' ? (
                                    sendingOtp ? 'Gönderiliyor...' : 'SMS Kodu Gönder'
                                ) : currentStep === 'info' && infoSubStep === 'otp' ? (
                                    sendingOtp ? 'Doğrulanıyor...' : 'Randevuyu Al'
                                ) : (
                                    <>Devam Et <ChevronRight className="h-4 w-4" /></>
                                )}
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </div>
        </>
    );
};
