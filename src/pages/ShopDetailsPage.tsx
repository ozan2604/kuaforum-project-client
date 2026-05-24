import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { shopService } from '../api/shop.service';
import { serviceManagementService } from '../api/service.service';
import { employeeService } from '../api/employee.service';
import type { Shop } from '../types/shop';
import { ShopCategoryLabels, ShopCategory, TargetGenderLabels } from '../types/shop';
import type { ServiceCategoryDto, ShopServiceDto } from '../types/service';
import type { PublicEmployeeScheduleDto } from '../types/employee';
import { MapPin, Star, Clock, Calendar, ChevronDown, Heart, Grid, Info, Image, MessageCircle, Users, Undo2, Phone, User, ExternalLink, CheckCircle, Map, Share2, PlayCircle, X } from 'lucide-react';
import { Button } from '../components/Button';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { toast } from 'react-hot-toast';
import { BookingModal } from '../components/BookingModal';
import { PreBookingModal } from '../components/PreBookingModal';
import { useAuth } from '../context/AuthContext';
import { favoriteService } from '../services/favorite.service';
import { ReviewsList } from '../components/ReviewsList';
import { ReviewModal } from '../components/ReviewModal';
import { appointmentService } from '../api/appointment.service';
import { reviewService } from '../api/review.service';
import type { Appointment } from '../types/appointment';
import { CustomSelect } from '../components/CustomSelect';

export const ShopDetailsPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();

    const [shop, setShop] = useState<Shop | null>(null);
    const [categories, setCategories] = useState<ServiceCategoryDto[]>([]);
    const [loading, setLoading] = useState(true);

    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
    const [isPreBookingModalOpen, setIsPreBookingModalOpen] = useState(false);
    const [isGuestBooking, setIsGuestBooking] = useState(false);
    const [selectedService, setSelectedService] = useState<ShopServiceDto | null>(null);
    const [isFavorite, setIsFavorite] = useState(false);
    const [favLoading, setFavLoading] = useState(false);

    // Review logic
    const [reviewableAppointment, setReviewableAppointment] = useState<Appointment | null>(null);
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [editingReview, setEditingReview] = useState<any | null>(null);
    const [reviewsRefreshTrigger, setReviewsRefreshTrigger] = useState(0);

    const [activeTab, setActiveTab] = useState<'services' | 'about' | 'gallery' | 'reviews' | 'hours'>('about');
    const tabsRef = useRef<HTMLDivElement>(null);
    const [isPlayingVideo, setIsPlayingVideo] = useState(false);

    useEffect(() => {
        if (tabsRef.current) {
            const rect = tabsRef.current.getBoundingClientRect();
            // If tab bar is above the header threshold, scroll back to it
            if (rect.top < 96) {
                const y = rect.top + window.scrollY - 100;
                window.scrollTo({ top: y, behavior: 'smooth' });
            }
        }
    }, [activeTab]);

    const [employeeSchedules, setEmployeeSchedules] = useState<PublicEmployeeScheduleDto[]>([]);
    const [selectedScheduleEmployeeId, setSelectedScheduleEmployeeId] = useState<string>('');

    const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

    const toggleAccordion = (setter: React.Dispatch<React.SetStateAction<Record<string, boolean>>>, id: string) => {
        setter(prev => ({ ...prev, [id]: !prev[id] }));
    };

    useEffect(() => {
        const checkFavorite = async () => {
            if (isAuthenticated && id) {
                try {
                    const status = await favoriteService.checkFavoriteStatus(id);
                    setIsFavorite(status);
                } catch (error) {
                    console.error('Failed to check favorite status', error);
                }
            }
        };
        checkFavorite();
    }, [id, isAuthenticated]);

    const handleToggleFavorite = async () => {
        if (!isAuthenticated) {
            toast.error('Favorilere eklemek için giriş yapmalısınız.');
            navigate('/login');
            return;
        }
        if (favLoading || !id) return;

        const newStatus = !isFavorite;
        setIsFavorite(newStatus);
        setFavLoading(true);

        try {
            await favoriteService.toggleFavorite(id);
            toast.success(newStatus ? 'Favorilere eklendi' : 'Favorilerden çıkarıldı');
        } catch (error) {
            setIsFavorite(!newStatus);
            toast.error('İşlem başarısız oldu');
        } finally {
            setFavLoading(false);
        }
    };

    useEffect(() => {
        const loadShopData = async () => {
            if (!id) return;
            try {
                const [shopData, servicesData, schedulesData] = await Promise.all([
                    shopService.getPublicShopById(id),
                    serviceManagementService.getPublicShopServices(id),
                    employeeService.getPublicShopSchedules(id).catch(() => [])
                ]);
                setShop(shopData);
                setCategories(servicesData);
                const initExpanded: Record<string, boolean> = {};
                servicesData.forEach(cat => { initExpanded[cat.id] = false; });
                setExpandedCategories(initExpanded);
                setEmployeeSchedules(schedulesData);
                if (schedulesData.length > 0) setSelectedScheduleEmployeeId(schedulesData[0].employeeId);

                if (isAuthenticated) {
                    try {
                        const appt = await appointmentService.getReviewableAppointment(id);
                        setReviewableAppointment(appt);
                    } catch (err) {
                        console.error('Failed to check review eligibility', err);
                    }
                }

            } catch (error) {
                console.error('Failed to load shop details', error);
                toast.error('Failed to load shop details');
                navigate('/');
            } finally {
                setLoading(false);
            }
        };
        loadShopData();
    }, [id, navigate, isAuthenticated]);


    const handleEditReview = (review: any) => {
        setEditingReview(review);
        setIsReviewModalOpen(true);
    };

    const handleReviewModalClose = () => {
        setIsReviewModalOpen(false);
        setEditingReview(null);
    };

    const handleReviewSubmit = async (rating: number, comment: string, newImages: File[], deletedImageUrls: string[]) => {
        try {
            if (editingReview) {
                await reviewService.updateReview(editingReview.id, {
                    id: editingReview.id,
                    rating,
                    comment,
                    newImages,
                    deletedImageUrls
                });
                toast.success('Yorum güncellendi');
                setReviewsRefreshTrigger(prev => prev + 1);
            } else if (reviewableAppointment) {
                await reviewService.addReview({
                    appointmentId: reviewableAppointment.id,
                    rating,
                    comment,
                    images: newImages
                });
                toast.success('Değerlendirmeniz alındı');
                setReviewableAppointment(null);
                setReviewsRefreshTrigger(prev => prev + 1);
            }

            if (shop && id) {
                const updatedShop = await shopService.getPublicShopById(id);
                setShop(prev => prev ? { ...prev, averageRating: updatedShop.averageRating, reviewCount: updatedShop.reviewCount } : updatedShop);
            }

            handleReviewModalClose();
        } catch (error) {
            console.error('Review action failed', error);
            toast.error('İşlem başarısız oldu');
        }
    };

    const handleShare = async () => {
        const url = `https://www.salonbir.com/shop/${shop?.id}`;
        if (navigator.share) {
            try {
                await navigator.share({ title: shop?.name, url });
            } catch {
                // kullanıcı iptal etti
            }
        } else {
            await navigator.clipboard.writeText(url);
            toast.success('Bağlantı kopyalandı!');
        }
    };

    const getImageUrl = (path: string) => {
        if (!path) return '';
        if (path.startsWith('http')) return path;
        return `http://localhost:5000${path}`;
    };

    const getOptimizedVideoUrl = (path: string) => {
        if (!path) return '';
        if (!path.startsWith('http')) return `https://api.salonbir.com${path}`;
        // URL'i direkt kullan - backend Format="mp4" ile zaten MP4 olarak kaydediyor
        // f_mp4 Cloudinary transformation ekleme: async işlenir, ilk requestte boş dönebilir
        return path;
    };

    if (loading) return <LoadingSpinner fullPage />;

    if (!shop) return null;

    // --- Çalışma Saatleri Mantığı ---
    const getTodayStatus = () => {
        let open = shop.openTime;
        let close = shop.closeTime;

        if (!open && shop.weeklySchedule) {
            const todayNum = new Date().getDay();
            const todaySchedule = shop.weeklySchedule.find(s => s.dayOfWeek === todayNum);
            if (todaySchedule && !todaySchedule.isClosed) {
                open = todaySchedule.openingTime || undefined;
                close = todaySchedule.closingTime || undefined;
            }
        }

        if (!open || !close) return null;

        const now = new Date();
        const [oh, om] = open.split(':').map(Number);
        const [ch, cm] = close.split(':').map(Number);
        const cur = now.getHours() * 60 + now.getMinutes();
        const isOpen = cur >= (oh * 60 + om) && cur < (ch * 60 + cm);

        return { open, close, isOpen };
    };

    const status = getTodayStatus();

    return (
        <div className="min-h-screen bg-gray-50 pb-16 font-sans">
            {/* Hero Section */}
            <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 mt-4 sm:mt-6">

                {/* ── Kart Üstü: Premium İsim + Meta Bilgiler ── */}
                <div className="mb-4 sm:mb-5">

                    {/* İsim + Telefon Satırı */}
                    <div className="flex items-center justify-between gap-4 mb-4 sm:mb-5">

                        <div className="flex-1 min-w-0">
                            <h1 className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-primary-600 text-white text-lg sm:text-xl lg:text-2xl font-black tracking-tight leading-tight shadow-md shadow-primary-500/25 max-w-full">
                                <span className="truncate">{shop.name}</span>
                            </h1>
                        </div>

                        {shop.phoneNumber && (
                            <a
                                href={`tel:${shop.phoneNumber}`}
                                className="group flex items-center gap-2.5 px-3 sm:px-4 py-2.5 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-primary-200 transition-all duration-200 shrink-0"
                            >
                                <div className="w-8 h-8 rounded-full bg-primary-500 group-hover:bg-primary-600 flex items-center justify-center shrink-0 transition-colors shadow-sm">
                                    <Phone className="w-3.5 h-3.5 text-white" />
                                </div>
                                <span className="hidden sm:block text-sm font-bold text-gray-800 tracking-tight">{shop.phoneNumber}</span>
                            </a>
                        )}
                    </div>
                </div>

                {/* ── Hero Kart (Fotoğraf) ── */}
                <div className="relative w-full rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl group" style={{ height: 'clamp(240px, 42vw, 500px)' }}>
                    {/* Fotoğraf veya Video */}
                    <div className="absolute inset-0">
                        {isPlayingVideo && (shop.videos?.[0]?.url || shop.promoVideoUrl) ? (
                            <div className="relative w-full h-full bg-black z-30">
                                <video
                                    key={shop.videos?.[0]?.url || shop.promoVideoUrl}
                                    src={getOptimizedVideoUrl(shop.videos?.[0]?.url || shop.promoVideoUrl || '')}
                                    className="w-full h-full object-contain"
                                    controls
                                    autoPlay
                                    playsInline
                                    preload="auto"
                                    onError={(e) => {
                                        const el = e.target as HTMLVideoElement;
                                        console.error('Video hatası:', el.error?.message, 'URL:', el.src);
                                    }}
                                />
                                <button
                                    onClick={() => setIsPlayingVideo(false)}
                                    className="absolute top-4 right-4 z-40 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        ) : (
                            <>
                                <img
                                    src={shop.coverImagePath ? getImageUrl(shop.coverImagePath) : 'https://images.unsplash.com/photo-1521590832896-bc17251e32ed?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80'}
                                    alt={shop.name}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000 ease-in-out"
                                    onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1521590832896-bc17251e32ed?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80'; }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                                {!isPlayingVideo && (shop.videos?.[0]?.url || shop.promoVideoUrl) && (
                                    <button
                                        onClick={() => setIsPlayingVideo(true)}
                                        className="absolute inset-0 m-auto w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full transition-all hover:scale-110 active:scale-95 group/play z-10"
                                        title="Tanıtım Videosunu İzle"
                                    >
                                        <PlayCircle className="w-10 h-10 sm:w-12 sm:h-12 text-white/90 group-hover/play:text-white drop-shadow-md" />
                                    </button>
                                )}
                            </>
                        )}
                    </div>

                    {/* Üst Bar: Geri + Paylaş + Favori */}
                    <div className="absolute top-3 sm:top-6 left-3 sm:left-6 right-3 sm:right-6 z-20 flex items-center justify-between">
                        {/* Geri Butonu */}
                        <button
                            onClick={() => navigate('/')}
                            className="flex items-center justify-center p-2 sm:p-3.5 bg-white/95 hover:bg-white rounded-full shadow-xl backdrop-blur-md transition-all duration-200 hover:scale-110 active:scale-90 border border-white/60 group"
                            title="Anasayfa"
                        >
                            <Undo2 className="h-5 w-5 sm:h-7 sm:w-7 text-rose-600 group-hover:rotate-[-10deg] transition-transform" />
                        </button>

                        {/* Sağ grup: Paylaş + Favori */}
                        <div className="flex items-center gap-2">
                            {/* Paylaş butonu */}
                            <button
                                onClick={handleShare}
                                title="Paylaş"
                                className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-3 rounded-full border bg-white/95 text-gray-700 border-white/60 hover:bg-white text-sm sm:text-base font-bold shadow-xl backdrop-blur-md transition-all duration-200 hover:scale-105 active:scale-95"
                            >
                                <Share2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary-600" />
                                <span className="hidden sm:inline text-primary-600">Paylaş</span>
                            </button>

                            {/* Favori */}
                            <button
                                onClick={handleToggleFavorite}
                                disabled={favLoading}
                                title={isFavorite ? 'Favorilerden çıkar' : 'Favorilere ekle'}
                                className={`flex items-center gap-2 px-3 sm:px-5 py-1.5 sm:py-3.5 rounded-full border text-sm sm:text-lg font-bold shadow-xl backdrop-blur-md transition-all duration-200 hover:scale-105 active:scale-95 ${isFavorite
                                        ? 'bg-rose-50 text-rose-600 border-rose-200'
                                        : 'bg-white/95 text-gray-700 border-white/60 hover:bg-white'
                                    }`}
                            >
                                <Heart className={`h-4 w-4 sm:h-6 sm:w-6 text-rose-500 drop-shadow-[0_0_8px_rgba(244,63,94,0.4)] ${isFavorite ? 'fill-current' : ''}`} />
                            </button>
                        </div>
                    </div>

                    {/* Alt: Bilgiler + CTA */}
                    <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-6 z-20">
                        <div className="flex items-end justify-between gap-3">

                            {/* Sol kolon: konum + puan + açık/kapalı */}
                            <div className="flex flex-col gap-2 min-w-0">
                                <div className="flex flex-wrap items-center gap-1.5">
                                    <span className="flex items-center gap-1 text-white/95 text-[10px] sm:text-xs font-medium bg-black/40 px-2 sm:px-2.5 py-1 rounded-full backdrop-blur-md border border-white/10 whitespace-nowrap">
                                        <MapPin className="h-3 w-3 text-rose-300 shrink-0" />
                                        {shop.district}, {shop.city}
                                    </span>
                                    <span className="flex items-center gap-1 text-white/95 text-[10px] sm:text-xs font-medium bg-black/40 px-2 sm:px-2.5 py-1 rounded-full backdrop-blur-md border border-white/10 whitespace-nowrap">
                                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 shrink-0" />
                                        <span className="font-bold">{shop.averageRating?.toFixed(1) || 'Yeni'}</span>
                                        <span className="text-white/75">({shop.reviewCount})</span>
                                    </span>
                                </div>
                                {status && (
                                    <div className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl backdrop-blur-md border shadow-lg whitespace-nowrap self-start ${status.isOpen
                                            ? 'bg-green-700/35 text-white border-green-500/40'
                                            : 'bg-black/50 text-white/95 border-white/20'
                                        }`}>
                                        <span className={`w-2 h-2 rounded-full shrink-0 ${status.isOpen ? 'bg-green-400 animate-pulse' : 'bg-red-500'}`} />
                                        <span className="font-black">{status.isOpen ? 'AÇIK' : 'KAPALI'}</span>
                                        <span className="opacity-75 font-semibold text-[11px]">{status.open}–{status.close}</span>
                                    </div>
                                )}
                            </div>

                            {/* Sağ kolon: Haritada Gör + Randevu Al üst üste */}
                            <div className="flex flex-col gap-2 shrink-0">
                                {shop.latitude && shop.longitude && (
                                    <button
                                        onClick={() => navigate(`/?mapLat=${shop.latitude}&mapLng=${shop.longitude}&mapShopId=${shop.id}`)}
                                        className="flex items-center justify-center gap-1 text-[10px] sm:text-xs font-bold px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white backdrop-blur-md border border-white/30 shadow-lg transition-all active:scale-95 whitespace-nowrap"
                                    >
                                        <Map className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
                                        <span>Haritada Gör</span>
                                    </button>
                                )}
                                <Button
                                    variant="secondary"
                                    className="shadow-lg text-white border-0 px-2 sm:px-4 py-0.5 sm:py-1.5 text-[10px] sm:text-xs font-bold rounded-full transition-transform active:scale-95 flex items-center justify-center whitespace-nowrap"
                                    onClick={() => {
                                        setSelectedService(null);
                                        if (isAuthenticated) {
                                            setIsGuestBooking(false);
                                            setIsBookingModalOpen(true);
                                        } else {
                                            setIsPreBookingModalOpen(true);
                                        }
                                    }}
                                >
                                    <Calendar className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1 shrink-0" />
                                    <span>Randevu Al</span>
                                </Button>
                            </div>

                        </div>
                    </div>
                </div>
            </div>

            {/* ── Kart Altı: Kategoriler ── */}
            <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 mt-3 sm:mt-4">
                {shop.categories && shop.categories.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2">
                        {shop.categories.map((catId, idx) => {
                            const bgs = [
                                'bg-violet-50 border-violet-200',
                                'bg-rose-50 border-rose-200',
                                'bg-amber-50 border-amber-200',
                                'bg-emerald-50 border-emerald-200',
                                'bg-sky-50 border-sky-200',
                                'bg-fuchsia-50 border-fuchsia-200',
                            ];
                            const bg = bgs[idx % bgs.length];
                            return (
                                <span
                                    key={catId}
                                    className={`inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-semibold border text-gray-700 ${bg} shadow-sm`}
                                >
                                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                                    {ShopCategoryLabels[catId as ShopCategory] ?? 'Diğer'}
                                </span>
                            );
                        })}
                    </div>
                )}
            </div>

            <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 mt-6 sm:mt-10">
                <div>
                    {/* Content with Tabs */}
                    <div className="space-y-5">
                        {/* Sticky Tab Bar */}
                        <div className="sticky top-[96px] z-30 py-2.5" ref={tabsRef}>
                            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-1.5 flex overflow-x-auto gap-1 scrollbar-hide">
                                {(['about', 'services', 'gallery', 'reviews', 'hours'] as const).map((tab) => {
                                    const icons = {
                                        services: Grid,
                                        about: Info,
                                        gallery: Image,
                                        reviews: MessageCircle,
                                        hours: Clock
                                    };
                                    const Icon = icons[tab];
                                    const labels = {
                                        services: 'Hizmetler',
                                        about: 'Hakkında',
                                        gallery: 'Galeri',
                                        reviews: 'Yorumlar',
                                        hours: 'Çalışma Saatleri'
                                    };
                                    return (
                                        <button
                                            key={tab}
                                            onClick={() => setActiveTab(tab)}
                                            className={`flex-1 min-w-fit flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl font-semibold text-[11px] sm:text-sm transition-all duration-200 whitespace-nowrap ${activeTab === tab
                                                    ? 'bg-primary-600 text-white shadow-md shadow-primary-500/25'
                                                    : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                                                }`}
                                        >
                                            <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${activeTab === tab ? 'text-white' : 'text-gray-400'}`} />
                                            <span>{labels[tab]}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="min-h-[400px]">
                            {activeTab === 'services' && (
                                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-fadeIn">
                                    {/* Başlık */}
                                    <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-gray-100">
                                        <h2 className="text-lg sm:text-xl font-bold text-gray-900">Hizmetlerimiz</h2>
                                        <span className="px-3 py-1 bg-primary-50 text-primary-700 text-xs font-bold rounded-full border border-primary-100">
                                            {categories.reduce((acc, cat) => acc + cat.services.length, 0)} Hizmet
                                        </span>
                                    </div>

                                    {categories.length === 0 ? (
                                        <div className="text-center py-16">
                                            <p className="text-gray-400 italic text-sm">Henüz hizmet listelenmemiş.</p>
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-gray-100">
                                            {categories.map((cat) => (
                                                <div key={cat.id}>
                                                    {/* Kategori Başlığı */}
                                                    <button
                                                        onClick={() => toggleAccordion(setExpandedCategories, cat.id)}
                                                        className="w-full flex items-center justify-between px-5 sm:px-6 py-3.5 bg-gray-50/80 hover:bg-gray-100/60 transition-colors text-left"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-1.5 h-5 rounded-full shrink-0 transition-colors ${expandedCategories[cat.id] ? 'bg-primary-500' : 'bg-gray-300'
                                                                }`} />
                                                            <h3 className={`text-sm sm:text-[15px] font-bold transition-colors ${expandedCategories[cat.id] ? 'text-primary-700' : 'text-gray-700'
                                                                }`}>{cat.name}</h3>
                                                        </div>
                                                        <div className="flex items-center gap-2 shrink-0">
                                                            <span className="text-[11px] font-semibold text-gray-400 bg-white px-2.5 py-0.5 rounded-full border border-gray-200">
                                                                {cat.services.length} hizmet
                                                            </span>
                                                            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${expandedCategories[cat.id] ? 'rotate-180 text-primary-500' : ''}`} />
                                                        </div>
                                                    </button>

                                                    {/* Hizmet Listesi */}
                                                    <div className={`transition-all duration-300 ease-in-out overflow-hidden ${expandedCategories[cat.id] ? 'max-h-[8000px]' : 'max-h-0'
                                                        }`}>
                                                        <div className="divide-y divide-gray-50/80">
                                                            {cat.services.map((service) => (
                                                                <div key={service.id} className="px-5 sm:px-6 py-4 hover:bg-gray-50/40 transition-colors">
                                                                    {/* Hizmet üst satır */}
                                                                    <div className="flex items-start gap-3">
                                                                        <div className="flex-1 min-w-0">
                                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                                <span className="font-semibold text-gray-900 text-sm sm:text-base leading-snug">{service.name}</span>
                                                                                <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-semibold text-primary-700 bg-primary-50 border border-primary-200 px-2 py-0.5 rounded-full">
                                                                                    <Clock className="w-3 h-3" />
                                                                                    {service.duration} dk
                                                                                </span>
                                                                            </div>
                                                                            {service.description && (
                                                                                <p className="text-xs text-gray-400 mt-1 leading-relaxed line-clamp-2">{service.description}</p>
                                                                            )}
                                                                        </div>
                                                                        <div className="flex items-center gap-2.5 shrink-0 mt-0.5">
                                                                            <span className="font-extrabold text-gray-900 text-base sm:text-lg leading-none">&#8378;{service.price}</span>
                                                                        </div>
                                                                    </div>

                                                                    {/* Çalışan chips — her zaman görünür */}
                                                                    {service.employees && service.employees.length > 0 && (
                                                                        <div className="mt-3 flex flex-wrap gap-2">
                                                                            {service.employees.map((emp) => (
                                                                                <div
                                                                                    key={emp.id}
                                                                                    className="flex items-center gap-2 bg-white border border-gray-200 rounded-full pl-0.5 pr-3 py-0.5 shadow-sm hover:border-primary-200 hover:shadow transition-all cursor-default"
                                                                                >
                                                                                    <div className="h-9 w-9 rounded-full bg-primary-100 flex items-center justify-center overflow-hidden shrink-0 ring-2 ring-white shadow-sm">
                                                                                        {emp.imageUrl ? (
                                                                                            <img src={getImageUrl(emp.imageUrl)} alt={emp.firstName} className="h-full w-full object-cover" />
                                                                                        ) : (
                                                                                            <span className="text-[10px] font-bold text-primary-700">
                                                                                                {emp.firstName?.[0]}{emp.lastName?.[0]}
                                                                                            </span>
                                                                                        )}
                                                                                    </div>
                                                                                    <div className="flex items-center gap-1.5">
                                                                                        <p className="text-[11px] font-semibold text-gray-800 leading-none">{emp.firstName} {emp.lastName}</p>
                                                                                        {emp.averageRating > 0 ? (
                                                                                            <div className="flex items-center gap-0.5">
                                                                                                <Star className="w-2.5 h-2.5 fill-yellow-400 text-yellow-400" />
                                                                                                <span className="text-[10px] text-yellow-600 font-semibold leading-none">{emp.averageRating.toFixed(1)}</span>
                                                                                            </div>
                                                                                        ) : (
                                                                                            <span className="text-[10px] text-gray-400 leading-none">Yeni</span>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'about' && (
                                <div className="animate-fadeIn space-y-4">
                                    {/* Açıklama */}
                                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
                                        <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3">Hakkımızda</h2>
                                        <p className="text-gray-600 leading-relaxed text-sm sm:text-base">
                                            {shop.description || 'Henüz bir açıklama eklenmemiş.'}
                                        </p>
                                    </div>

                                    {/* Bilgi Kartları */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {/* Konum */}
                                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                                            <div className="flex items-center gap-2 mb-3">
                                                <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center shrink-0">
                                                    <MapPin className="w-4 h-4 text-rose-500" />
                                                </div>
                                                <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Konum</span>
                                            </div>
                                            <p className="font-semibold text-gray-900 text-sm leading-snug">{shop.address}</p>
                                            <p className="text-xs text-gray-500 mt-1">{shop.district} / {shop.city}</p>
                                            {shop.latitude && shop.longitude && (
                                                <a
                                                    href={`https://www.google.com/maps?q=${shop.latitude},${shop.longitude}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1.5 mt-3 text-xs font-semibold text-primary-600 hover:text-primary-700 transition-colors"
                                                >
                                                    <ExternalLink className="w-3.5 h-3.5" />
                                                    Yol Tarifi Al
                                                </a>
                                            )}
                                        </div>

                                        {/* İletişim */}
                                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                                            <div className="flex items-center gap-2 mb-3">
                                                <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
                                                    <Phone className="w-4 h-4 text-green-500" />
                                                </div>
                                                <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">İletişim</span>
                                            </div>
                                            <a href={`tel:${shop.phoneNumber}`} className="font-semibold text-gray-900 text-sm hover:text-primary-600 transition-colors">
                                                {shop.phoneNumber}
                                            </a>
                                            {shop.ownerEmail && (
                                                <a href={`mailto:${shop.ownerEmail}`} className="block text-xs text-gray-500 mt-1.5 hover:text-primary-600 transition-colors truncate">
                                                    {shop.ownerEmail}
                                                </a>
                                            )}
                                        </div>

                                        {/* Değerlendirme */}
                                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                                            <div className="flex items-center gap-2 mb-3">
                                                <div className="w-8 h-8 rounded-lg bg-yellow-50 flex items-center justify-center shrink-0">
                                                    <Star className="w-4 h-4 text-yellow-500" />
                                                </div>
                                                <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Değerlendirme</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-3xl font-black text-gray-900 leading-none">{shop.averageRating?.toFixed(1) || '—'}</span>
                                                <div>
                                                    <div className="flex gap-0.5">
                                                        {[1, 2, 3, 4, 5].map(s => (
                                                            <Star key={s} className={`w-3.5 h-3.5 ${s <= Math.round(shop.averageRating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />
                                                        ))}
                                                    </div>
                                                    <p className="text-xs text-gray-500 mt-0.5">{shop.reviewCount} yorum</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Hedef Kitle */}
                                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                                            <div className="flex items-center gap-2 mb-3">
                                                <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center shrink-0">
                                                    <Users className="w-4 h-4 text-violet-500" />
                                                </div>
                                                <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Hedef Kitle</span>
                                            </div>
                                            <p className="font-semibold text-gray-900 text-sm">{TargetGenderLabels[shop.genderPreference]}</p>
                                        </div>

                                        {/* Salon Sahibi */}
                                        {shop.ownerName && (
                                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                                                        <User className="w-4 h-4 text-amber-500" />
                                                    </div>
                                                    <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Salon Sahibi</span>
                                                </div>
                                                <p className="font-semibold text-gray-900 text-sm">{shop.ownerName}</p>
                                            </div>
                                        )}

                                        {/* Katılım Tarihi */}
                                        {shop.createdAt && (
                                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center shrink-0">
                                                        <Calendar className="w-4 h-4 text-sky-500" />
                                                    </div>
                                                    <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Katılım Tarihi</span>
                                                </div>
                                                <p className="font-semibold text-gray-900 text-sm">
                                                    {new Date(shop.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                </p>
                                            </div>
                                        )}

                                        {/* Haftalık Tatil */}
                                        {shop.weeklyOffDays && shop.weeklyOffDays.length > 0 && (
                                            <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-5">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
                                                        <Calendar className="w-4 h-4 text-red-500" />
                                                    </div>
                                                    <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Haftalık Tatil</span>
                                                </div>
                                                <p className="font-semibold text-red-700 text-sm leading-snug">
                                                    Her hafta {['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi']
                                                        .filter((_, i) => shop.weeklyOffDays!.includes(i)).join(', ')} günleri kapalı
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Kategoriler */}
                                    {shop.categories && shop.categories.length > 0 && (
                                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
                                            <div className="flex items-center gap-2 mb-4">
                                                <div className="w-8 h-8 rounded-lg bg-fuchsia-50 flex items-center justify-center shrink-0">
                                                    <Grid className="w-4 h-4 text-fuchsia-500" />
                                                </div>
                                                <span className="text-sm font-bold text-gray-800">Hizmet Kategorileri</span>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {shop.categories.map((catId, idx) => {
                                                    const bgs = [
                                                        'bg-violet-50 border-violet-200 text-violet-700',
                                                        'bg-rose-50 border-rose-200 text-rose-700',
                                                        'bg-amber-50 border-amber-200 text-amber-700',
                                                        'bg-emerald-50 border-emerald-200 text-emerald-700',
                                                        'bg-sky-50 border-sky-200 text-sky-700',
                                                        'bg-fuchsia-50 border-fuchsia-200 text-fuchsia-700',
                                                    ];
                                                    return (
                                                        <span key={catId} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border ${bgs[idx % bgs.length]}`}>
                                                            {ShopCategoryLabels[catId as ShopCategory] ?? 'Diğer'}
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {/* Randevu Onay Tipi */}
                                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${shop.isAutoProcessEnabled ? 'bg-green-50' : 'bg-amber-50'}`}>
                                                {shop.isAutoProcessEnabled
                                                    ? <CheckCircle className="w-5 h-5 text-green-500" />
                                                    : <Clock className="w-5 h-5 text-amber-500" />
                                                }
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900 text-sm">
                                                    {shop.isAutoProcessEnabled ? 'Otomatik Onaylı Randevu' : 'Manuel Onaylı Randevu'}
                                                </p>
                                                <p className="text-xs text-gray-500 mt-0.5">
                                                    {shop.isAutoProcessEnabled
                                                        ? 'Randevunuz anında onaylanır, salon sahibinin ek onayına gerek yoktur.'
                                                        : 'Randevunuz salon sahibi tarafından onaylandıktan sonra kesinleşir.'
                                                    }
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* İptal Politikası */}
                                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                                                <Info className="w-5 h-5 text-blue-500" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900 text-sm">İptal Politikası</p>
                                                <p className="text-xs text-gray-500 mt-0.5">
                                                    Randevunuzu en geç <span className="font-semibold text-gray-700">{shop.cancellationHours ?? 2} saat</span> öncesine kadar ücretsiz iptal edebilirsiniz.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'gallery' && (
                                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 animate-fadeIn">
                                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Galeri</h2>
                                    {shop.images && shop.images.length > 0 ? (
                                        <div className="columns-2 md:columns-3 gap-4">
                                            {shop.images.map((image, index) => (
                                                <div key={index} className="break-inside-avoid mb-4">
                                                    <div className="rounded-xl overflow-hidden border border-gray-100 shadow-sm bg-white group cursor-zoom-in">
                                                        <img
                                                            src={getImageUrl(image.url)}
                                                            alt={`${shop.name} ${index + 1}`}
                                                            className="w-full h-auto block group-hover:brightness-95 transition-all duration-300"
                                                            onClick={() => window.open(getImageUrl(image.url), '_blank')}
                                                        />
                                                        {image.tags && image.tags.length > 0 && (
                                                            <div className="px-3 py-2.5 flex flex-wrap gap-1.5">
                                                                {image.tags.map(tag => (
                                                                    <span
                                                                        key={tag.id}
                                                                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-100"
                                                                    >
                                                                        {tag.name}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-200">
                                            <p className="text-gray-500 italic">Henüz görsel yüklenmemiş.</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'hours' && (
                                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 animate-fadeIn space-y-8">
                                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                        <Clock className="w-6 h-6 text-primary-600" />
                                        Çalışma Saatleri
                                    </h2>

                                    {/* General Hours */}
                                    {shop.openTime && shop.closeTime && (
                                        <div className="flex items-center gap-3 px-4 py-3 bg-primary-50 rounded-xl border border-primary-100">
                                            <Clock className="h-5 w-5 text-primary-600 flex-shrink-0" />
                                            <div>
                                                <p className="text-xs text-primary-600 font-medium">Genel Açılış / Kapanış</p>
                                                <p className="font-bold text-primary-900">{shop.openTime} – {shop.closeTime}</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Employee Schedule Dropdown */}
                                    {employeeSchedules.length > 0 && (
                                        <div>
                                            <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-2">
                                                <Users className="w-4 h-4 text-gray-500" />
                                                Personel Çalışma Takvimi
                                            </h3>
                                            <div className="mb-4">
                                                <CustomSelect
                                                    size="default"
                                                    options={employeeSchedules.map(emp => ({
                                                        value: emp.employeeId,
                                                        label: `${emp.firstName} ${emp.lastName}${emp.title ? ` — ${emp.title}` : ''}`,
                                                    }))}
                                                    value={selectedScheduleEmployeeId}
                                                    onChange={v => setSelectedScheduleEmployeeId(String(v))}
                                                />
                                            </div>
                                            {(() => {
                                                const emp = employeeSchedules.find(e => e.employeeId === selectedScheduleEmployeeId);
                                                if (!emp) return null;
                                                const dayNames = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
                                                const todayDow = new Date().getDay();
                                                return (
                                                    <div className="divide-y divide-gray-100 rounded-xl border border-gray-100 overflow-hidden">
                                                        {emp.schedule.length === 0 ? (
                                                            <p className="text-sm text-gray-500 italic p-4">Bu personel için program girilmemiş.</p>
                                                        ) : emp.schedule.map(s => {
                                                            const isToday = s.dayOfWeek === todayDow;
                                                            return (
                                                                <div key={s.dayOfWeek} className={`flex justify-between items-center px-4 py-3 text-sm ${isToday ? 'bg-primary-50' : 'bg-white'}`}>
                                                                    <span className={`font-medium ${isToday ? 'text-primary-700' : 'text-gray-700'}`}>
                                                                        {dayNames[s.dayOfWeek]}
                                                                    </span>
                                                                    {s.isWorking ? (
                                                                        <div className="text-right">
                                                                            <span className="text-gray-900 font-medium">{s.startTime} – {s.endTime}</span>
                                                                            {s.breakStartTime && s.breakEndTime && (
                                                                                <p className="text-xs text-gray-400">Mola: {s.breakStartTime} – {s.breakEndTime}</p>
                                                                            )}
                                                                        </div>
                                                                    ) : (
                                                                        <span className="text-red-500 font-medium">Kapalı</span>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    )}

                                    {/* Haftalık Tatil Günleri */}
                                    {shop.weeklyOffDays && shop.weeklyOffDays.length > 0 && (
                                        <div>
                                            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                                <span>🗓️</span> Haftalık Tatil Günleri
                                            </h3>
                                            <div className="divide-y divide-gray-100 rounded-xl border border-red-100 overflow-hidden">
                                                {['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'].map((dayName, idx) => {
                                                    if (!shop.weeklyOffDays!.includes(idx)) return null;
                                                    const isToday = idx === new Date().getDay();
                                                    return (
                                                        <div key={idx} className={`flex justify-between items-center px-4 py-3 text-sm ${isToday ? 'bg-red-100' : 'bg-red-50/40'}`}>
                                                            <span className={`font-medium ${isToday ? 'text-red-700' : 'text-gray-700'}`}>{dayName}</span>
                                                            <span className="text-red-500 font-semibold">Haftalık Tatil</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {/* Closure Dates */}
                                    {shop.closureDates && shop.closureDates.filter(c => new Date(c.closureDate) >= new Date(new Date().toLocaleDateString('en-CA'))).length > 0 && (
                                        <div>
                                            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                                <span className="text-red-500">🔒</span> Yaklaşan Kapalı Günler
                                            </h3>
                                            <ul className="divide-y divide-gray-100 rounded-xl border border-red-100 overflow-hidden">
                                                {shop.closureDates
                                                    .filter(c => new Date(c.closureDate) >= new Date(new Date().toLocaleDateString('en-CA')))
                                                    .map(c => (
                                                        <li key={c.id} className="px-4 py-3 bg-red-50/40">
                                                            <span className="text-sm font-medium text-gray-800">
                                                                {new Date(c.closureDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' })}
                                                            </span>
                                                            {c.reason && <p className="text-xs text-gray-500 mt-0.5">{c.reason}</p>}
                                                        </li>
                                                    ))}
                                            </ul>
                                        </div>
                                    )}

                                    {!shop.openTime && !shop.closeTime && employeeSchedules.length === 0 && (!shop.closureDates || shop.closureDates.length === 0) && (!shop.weeklyOffDays || shop.weeklyOffDays.length === 0) && (
                                        <p className="text-gray-500 italic text-center py-8">Çalışma saati bilgisi henüz girilmemiş.</p>
                                    )}
                                </div>
                            )}

                            {activeTab === 'reviews' && (
                                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 animate-fadeIn">
                                    {/* Header */}
                                    <div className="flex flex-wrap items-center justify-between gap-3 px-5 sm:px-8 py-5 border-b border-gray-100">
                                        <h2 className="text-lg sm:text-xl font-bold text-gray-900">Yorumlar</h2>
                                        <div className="flex items-center gap-3 bg-yellow-50 px-4 py-2.5 rounded-2xl border border-yellow-100">
                                            <span className="text-2xl sm:text-3xl font-black text-yellow-700 leading-none">
                                                {shop.averageRating?.toFixed(1) || '0.0'}
                                            </span>
                                            <div className="flex flex-col gap-0.5">
                                                <div className="flex gap-0.5">
                                                    {[1, 2, 3, 4, 5].map((star) => (
                                                        <Star
                                                            key={star}
                                                            className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${star <= Math.round(shop.averageRating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`}
                                                        />
                                                    ))}
                                                </div>
                                                <span className="text-[11px] text-yellow-700/70 font-semibold">{shop.reviewCount} yorum</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="px-5 sm:px-8 py-5 sm:py-6 space-y-5">
                                        {reviewableAppointment && !editingReview && (
                                            <div className="p-4 sm:p-5 bg-primary-50 rounded-xl border border-primary-100 flex flex-wrap items-center justify-between gap-3">
                                                <div>
                                                    <h4 className="font-bold text-primary-900 text-sm sm:text-base">Son hizmetini değerlendir</h4>
                                                    <p className="text-xs sm:text-sm text-primary-700 mt-1">
                                                        {reviewableAppointment.employeeName} ile {new Date(reviewableAppointment.startTime).toLocaleDateString('tr-TR')} tarihindeki randevun nasıldı?
                                                    </p>
                                                </div>
                                                <Button onClick={() => setIsReviewModalOpen(true)} className="shrink-0">
                                                    Değerlendir
                                                </Button>
                                            </div>
                                        )}

                                        <ReviewsList
                                            shopId={shop.id}
                                            onEdit={handleEditReview}
                                            refreshTrigger={reviewsRefreshTrigger}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <PreBookingModal
                isOpen={isPreBookingModalOpen}
                onClose={() => setIsPreBookingModalOpen(false)}
                onLogin={() => { setIsPreBookingModalOpen(false); navigate('/login'); }}
                onRegister={() => { setIsPreBookingModalOpen(false); navigate('/register'); }}
                onGuestContinue={() => {
                    setIsPreBookingModalOpen(false);
                    setIsGuestBooking(true);
                    setIsBookingModalOpen(true);
                }}
            />

            {isBookingModalOpen && shop && (
                <BookingModal
                    isOpen={isBookingModalOpen}
                    onClose={() => { setIsBookingModalOpen(false); setIsGuestBooking(false); }}
                    shopId={shop.id}
                    bookingDaysAhead={shop.bookingDaysAhead ?? 30}
                    weeklyOffDays={shop.weeklyOffDays ?? []}
                    closureDates={shop.closureDates ?? []}
                    initialServiceId={selectedService?.id}
                    initialServiceName={selectedService?.name}
                    initialServiceDuration={selectedService?.duration}
                    initialServicePrice={selectedService?.price}
                    isGuest={isGuestBooking}
                    onOpenLogin={() => navigate('/login')}
                />
            )}

            {(isReviewModalOpen && (reviewableAppointment || editingReview)) && (
                <ReviewModal
                    isOpen={isReviewModalOpen}
                    onClose={handleReviewModalClose}
                    shopName={shop.name}
                    employeeName={editingReview ? editingReview.employeeName : reviewableAppointment?.employeeName || ''}
                    initialData={editingReview ? {
                        rating: editingReview.rating,
                        comment: editingReview.comment,
                        imageUrls: editingReview.imageUrls
                    } : undefined}
                    onSubmit={handleReviewSubmit}
                />
            )}
        </div>
    );
};
