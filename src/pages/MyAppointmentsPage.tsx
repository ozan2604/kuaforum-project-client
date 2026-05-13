import React, { useEffect, useState, useMemo } from 'react';
import { appointmentService } from '../api/appointment.service';
import { reviewService } from '../api/review.service';
import { ReviewModal } from '../components/ReviewModal';
import type { AppointmentDto } from '../types/appointment';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Calendar, Clock, User, Scissors, MessageSquare, XCircle, Layers, UserX } from 'lucide-react';
import { Button } from '../components/Button';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { EmptyState } from '../components/EmptyState';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

type Appointment = AppointmentDto;

const PAGE_SIZE = 20;

export const MyAppointmentsPage: React.FC = () => {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [selectedAppointmentForReview, setSelectedAppointmentForReview] = useState<Appointment | null>(null);
    const navigate = useNavigate();

    useEffect(() => { loadAppointments(1, true); }, []);

    const loadAppointments = async (pageNum: number, reset: boolean) => {
        try {
            if (reset) setLoading(true); else setLoadingMore(true);
            const result = await appointmentService.getMyAppointments(pageNum, PAGE_SIZE);
            setAppointments(prev => reset ? result.items : [...prev, ...result.items]);
            setHasMore(pageNum < result.totalPages);
            setPage(pageNum);
        } catch (error) {
            console.error('Failed to load appointments', error);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    const handleLoadMore = () => loadAppointments(page + 1, false);

    // Aynı groupId'ye sahip randevuları tek kart altında topla.
    // groupId yoksa (eski tek-hizmet randevuları) appointment.id gruplanma anahtarı olur.
    const groupedAppointments = useMemo(() => {
        const groups = new Map<string, Appointment[]>();
        appointments.forEach(apt => {
            const key = apt.groupId ?? apt.id;
            if (!groups.has(key)) groups.set(key, []);
            groups.get(key)!.push(apt);
        });
        groups.forEach(g => g.sort((a, b) =>
            new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
        ));
        return [...groups.values()].sort((a, b) =>
            new Date(b[0].startTime).getTime() - new Date(a[0].startTime).getTime()
        );
    }, [appointments]);

    const noShowCountByShop = useMemo(() => {
        const counts = new Map<string, number>();
        appointments.forEach(apt => {
            if (apt.status === 5) counts.set(apt.shopId, (counts.get(apt.shopId) ?? 0) + 1);
        });
        return counts;
    }, [appointments]);

    // Gruptaki ilk aktif randevunun başlangıç saatine göre toplu iptal kontrolü
    const canCancelGroup = (group: Appointment[]) => {
        const activeApts = group.filter(a => a.status === 0 || a.status === 1);
        if (activeApts.length === 0) return false;
        const first = activeApts[0];
        const hoursLeft = (new Date(first.startTime).getTime() - Date.now()) / 3600000;
        return hoursLeft >= (first.shopCancellationHours ?? 2);
    };

    // Bireysel randevunun iptali için kontrol
    const canCancelIndividual = (apt: Appointment) => {
        if (apt.status !== 0 && apt.status !== 1) return false;
        const hoursLeft = (new Date(apt.startTime).getTime() - Date.now()) / 3600000;
        return hoursLeft >= (apt.shopCancellationHours ?? 2);
    };

    const handleCancelGroup = async (group: Appointment[]) => {
        const isMulti = group.length > 1 && !!group[0].groupId;
        const msg = isMulti
            ? `"${group[0].shopName}" salonundaki ${group.length} hizmetli randevunuzu tümüyle iptal etmek istediğinizden emin misiniz?`
            : `"${group[0].shopName}" salonundaki randevunuzu iptal etmek istediğinizden emin misiniz?`;
        if (!window.confirm(msg)) return;
        try {
            if (isMulti) {
                await appointmentService.cancelGroup(group[0].groupId!);
            } else {
                await appointmentService.cancelAppointment(group[0].id);
            }
            toast.success('Randevu iptal edildi.');
            await loadAppointments(1, true);
        } catch (error: any) {
            toast.error(error.response?.data?.Message || 'Randevu iptal edilemedi.');
        }
    };

    const handleCancelSingle = async (apt: Appointment) => {
        if (!window.confirm(`"${apt.serviceName}" hizmetini iptal etmek istediğinizden emin misiniz?`)) return;
        try {
            await appointmentService.cancelAppointment(apt.id);
            toast.success('Hizmet iptal edildi.');
            await loadAppointments(1, true);
        } catch (error: any) {
            toast.error(error.response?.data?.Message || 'İptal edilemedi.');
        }
    };

    const handleReviewSubmit = async (rating: number, comment: string, images: File[]) => {
        if (!selectedAppointmentForReview) return;
        try {
            await reviewService.addReview({
                appointmentId: selectedAppointmentForReview.id,
                rating,
                comment,
                images,
            });
            await loadAppointments(1, true);
        } catch (error) {
            console.error('Failed to submit review', error);
        }
    };

    const getStatusBadge = (status: number) => {
        switch (status) {
            case 0: return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 whitespace-nowrap">Onay Bekliyor</span>;
            case 1: return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 whitespace-nowrap">Onaylandı</span>;
            case 2: return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800 whitespace-nowrap">Tamamlandı</span>;
            case 3: return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 whitespace-nowrap">İptal Edildi</span>;
            case 4: return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 whitespace-nowrap">Reddedildi</span>;
            case 5: return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-700 whitespace-nowrap inline-flex items-center gap-1"><UserX className="w-3 h-3" />Gelmedi</span>;
            default: return null;
        }
    };

    if (loading) return <LoadingSpinner fullPage />;

    return (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
            <h1 className="text-2xl font-bold text-gray-900 mb-8">Randevularım</h1>

            {groupedAppointments.length === 0 ? (
                <EmptyState
                    message="Henüz randevunuz yok"
                    description="Kuaför veya berber randevusu almak için hemen göz atın."
                    icon={<Calendar className="h-12 w-12" />}
                    action={<Button onClick={() => navigate('/')}>Randevu Al</Button>}
                />
            ) : (
                <div className="space-y-4">
                    {groupedAppointments.map(group => {
                        const first = group[0];
                        const last  = group[group.length - 1];
                        const totalPrice    = group.reduce((s, a) => s + a.price, 0);
                        const totalDuration = group.reduce((s, a) => s + a.duration, 0);
                        const isMulti    = group.length > 1;
                        const canCancel  = canCancelGroup(group);
                        const reviewable = group.find(a => a.status === 2 && !a.hasReview) ?? null;
                        const hasNoShow  = group.some(a => a.status === 5);
                        const noShowCount = noShowCountByShop.get(first.shopId) ?? 0;

                        return (
                            <div key={first.groupId ?? first.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

                                {/* ── Kart Başlığı ── */}
                                <div className="px-5 py-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h3 className="font-bold text-gray-900 text-base leading-tight">{first.shopName}</h3>
                                                {isMulti && (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[11px] font-semibold rounded-full border border-indigo-100">
                                                        <Layers className="w-3 h-3" />
                                                        {group.length} hizmet · Grup Randevusu
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-sm text-gray-500">
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-3.5 h-3.5 text-primary-400 shrink-0" />
                                                    {format(new Date(first.startTime), 'd MMMM yyyy, EEEE', { locale: tr })}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3.5 h-3.5 text-primary-400 shrink-0" />
                                                    {format(new Date(first.startTime), 'HH:mm')} – {format(new Date(last.endTime), 'HH:mm')}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <User className="w-3.5 h-3.5 text-primary-400 shrink-0" />
                                                    {first.employeeName}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="font-extrabold text-lg text-primary-700">₺{totalPrice}</p>
                                            <p className="text-xs text-gray-400 mt-0.5">{totalDuration} dk</p>
                                        </div>
                                    </div>
                                </div>

                                {/* ── Hizmet Listesi ── */}
                                <div className="border-t border-gray-50">
                                    {group.map((apt, idx) => (
                                        <div
                                            key={apt.id}
                                            className={`px-5 py-3 ${idx < group.length - 1 ? 'border-b border-gray-50' : ''}`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <Scissors className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                                                <span className="text-sm font-medium text-gray-800 flex-1 min-w-0 truncate">
                                                    {apt.serviceName}
                                                </span>
                                                {isMulti && (
                                                    <span className="text-xs text-gray-400 shrink-0">
                                                        {format(new Date(apt.startTime), 'HH:mm')}–{format(new Date(apt.endTime), 'HH:mm')}
                                                    </span>
                                                )}
                                                <span className="font-semibold text-sm text-gray-700 shrink-0">₺{apt.price}</span>
                                                {getStatusBadge(apt.status)}
                                                {/* Bireysel iptal butonu — sadece çok-hizmetli grupta göster */}
                                                {isMulti && canCancelIndividual(apt) && (
                                                    <button
                                                        onClick={() => handleCancelSingle(apt)}
                                                        className="text-xs text-red-500 hover:text-red-700 font-semibold px-2 py-1 rounded-lg hover:bg-red-50 transition-colors shrink-0 whitespace-nowrap"
                                                    >
                                                        İptal
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* ── Müşteri notu ── */}
                                {first.note && (
                                    <div className="flex items-start gap-2 mx-5 my-3 text-sm text-gray-700 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5">
                                        <MessageSquare className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                                        <span>{first.note}</span>
                                    </div>
                                )}

                                {/* ── İptal / Red sebebi ── */}
                                {first.cancellationReason && (
                                    <div className="flex items-start gap-2 mx-5 my-3 text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5">
                                        <XCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                                        <div>
                                            <p className="font-semibold text-xs text-red-500 mb-0.5">Salon tarafından belirtilen sebep</p>
                                            <p>{first.cancellationReason}</p>
                                        </div>
                                    </div>
                                )}

                                {/* ── Gelmedi Uyarısı ── */}
                                {hasNoShow && (
                                    <div className="flex items-start gap-2 mx-5 my-3 text-sm text-orange-800 bg-orange-50 border border-orange-200 rounded-xl px-3 py-2.5">
                                        <UserX className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" />
                                        <div>
                                            <p className="font-semibold text-xs text-orange-600 mb-1">Bu randevuya gidilmedi</p>
                                            {noShowCount >= 2
                                                ? <p>Bu salona <strong>{noShowCount} kez</strong> randevuya gitmediniz. Salon tarafından engellenebilirsiniz — engellendikten sonra bu salona randevu oluşturamazsınız. Lütfen salonla iletişime geçin.</p>
                                                : <p>Bu randevuya gitmediniz. Tekrarlanması durumunda salon sizi engelleyebilir; randevu oluşturamazsınız hale gelebilirsiniz.</p>
                                            }
                                        </div>
                                    </div>
                                )}

                                {/* ── Aksiyonlar ── */}
                                {(canCancel || reviewable) && (
                                    <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-2">
                                        <div className="text-xs text-gray-400">
                                            {isMulti && canCancel && 'Tüm grubu toplu iptal etmek için:'}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {reviewable && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => {
                                                        setSelectedAppointmentForReview(reviewable);
                                                        setIsReviewModalOpen(true);
                                                    }}
                                                >
                                                    Değerlendir
                                                </Button>
                                            )}
                                            {canCancel && (
                                                <button
                                                    onClick={() => handleCancelGroup(group)}
                                                    className="text-sm text-red-600 hover:text-red-700 font-semibold px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                                                >
                                                    {isMulti ? 'Tümünü İptal Et' : 'İptal Et'}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                    {hasMore && (
                        <div className="flex justify-center pt-2 pb-4">
                            <Button
                                variant="outline"
                                onClick={handleLoadMore}
                                disabled={loadingMore}
                            >
                                {loadingMore ? 'Yükleniyor...' : 'Daha Fazla Göster'}
                            </Button>
                        </div>
                    )}
                </div>
            )}

            {selectedAppointmentForReview && (
                <ReviewModal
                    isOpen={isReviewModalOpen}
                    onClose={() => setIsReviewModalOpen(false)}
                    onSubmit={handleReviewSubmit}
                    shopName={selectedAppointmentForReview.shopName}
                    employeeName={selectedAppointmentForReview.employeeName}
                />
            )}
        </div>
    );
};
