import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { shopService } from '../api/shop.service';
import { serviceManagementService } from '../api/service.service';
import type { Shop } from '../types/shop';
import type { ServiceCategoryDto, ShopServiceDto } from '../types/service';
import { MapPin, Star, Phone, Clock, Calendar, ChevronLeft, Heart, Grid, Info, Image, MessageCircle } from 'lucide-react';
import { Button } from '../components/Button';
import { toast } from 'react-hot-toast';
import { BookingModal } from '../components/BookingModal';
import { useAuth } from '../context/AuthContext';
import { favoriteService } from '../services/favorite.service';
import { ReviewsList } from '../components/ReviewsList';
import { ReviewModal } from '../components/ReviewModal';
import { appointmentService } from '../api/appointment.service';
import { reviewService } from '../api/review.service';
import type { Appointment } from '../types/appointment';

export const ShopDetailsPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();

    const [shop, setShop] = useState<Shop | null>(null);
    const [categories, setCategories] = useState<ServiceCategoryDto[]>([]);
    const [loading, setLoading] = useState(true);

    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
    const [selectedService, setSelectedService] = useState<ShopServiceDto | null>(null);
    const [isFavorite, setIsFavorite] = useState(false);
    const [favLoading, setFavLoading] = useState(false);

    // Review logic
    const [reviewableAppointment, setReviewableAppointment] = useState<Appointment | null>(null);
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [editingReview, setEditingReview] = useState<any | null>(null);
    const [reviewsRefreshTrigger, setReviewsRefreshTrigger] = useState(0);

    const [activeTab, setActiveTab] = useState<'services' | 'about' | 'gallery' | 'reviews'>('services');

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
                const [shopData, servicesData] = await Promise.all([
                    shopService.getPublicShopById(id),
                    serviceManagementService.getPublicShopServices(id)
                ]);
                setShop(shopData);
                setCategories(servicesData);

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

    const handleBookClick = (service: ShopServiceDto) => {
        if (!isAuthenticated) {
            toast.error('Randevu almak için lütfen giriş yapın.');
            navigate('/login');
            return;
        }

        setSelectedService(service);
        setIsBookingModalOpen(true);
    };

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

    const getImageUrl = (path: string) => {
        if (!path) return '';
        if (path.startsWith('http')) return path;
        return `http://localhost:5000${path}`;
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (!shop) return null;

    return (
        <div className="min-h-screen bg-gray-50 pb-12 font-sans">
            {/* Hero Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
                <div className="relative h-[45vh] min-h-[400px] w-full rounded-3xl overflow-hidden shadow-2xl group">
                    <div className="absolute inset-0">
                        <img
                            src={shop.coverImagePath ? getImageUrl(shop.coverImagePath) : `https://source.unsplash.com/random/1920x1080/?salon,${shop.id}`}
                            alt={shop.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000 ease-in-out"
                            onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1521590832896-bc17251e32ed?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80'; }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-90"></div>
                    </div>

                    <div className="absolute top-6 left-6 z-20">
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => navigate('/')}
                            className="bg-white/90 hover:bg-white text-gray-900 border-0 shadow-md backdrop-blur-sm"
                        >
                            <ChevronLeft className="h-4 w-4 mr-1" />
                            Back to Home
                        </Button>
                    </div>

                    <div className="absolute bottom-0 left-0 right-0 p-8 sm:p-10 z-20">
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                            <div className="space-y-3">
                                <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight drop-shadow-xl">
                                    {shop.name}
                                </h1>
                                <div className="flex flex-wrap items-center gap-4 text-white/95 text-lg font-medium">
                                    <span className="flex items-center drop-shadow-md bg-black/20 px-3 py-1 rounded-full backdrop-blur-sm border border-white/10">
                                        <MapPin className="h-4 w-4 mr-2 text-secondary-300" />
                                        {shop.district}, {shop.city}
                                    </span>
                                    <span className="flex items-center drop-shadow-md bg-black/20 px-3 py-1 rounded-full backdrop-blur-sm border border-white/10">
                                        <Star className="h-4 w-4 mr-2 fill-yellow-400 text-yellow-400" />
                                        <span className="font-bold mr-1">{shop.averageRating?.toFixed(1) || 'New'}</span>
                                        <span className="text-white/90">({shop.reviewCount} Reviews)</span>
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <button
                                    onClick={handleToggleFavorite}
                                    disabled={favLoading}
                                    className={`p-3 rounded-full transition-all duration-300 backdrop-blur-md shadow-lg border border-white/10 ${isFavorite
                                        ? 'bg-secondary-500 text-white hover:bg-secondary-600'
                                        : 'bg-white/20 text-white hover:bg-white/30'
                                        }`}
                                >
                                    <Heart className={`h-6 w-6 ${isFavorite ? 'fill-current' : ''}`} />
                                </button>
                                <Button
                                    size="lg"
                                    variant="secondary"
                                    className="shadow-xl shadow-secondary-900/20 text-white border-0 px-8 py-4 text-lg font-bold"
                                    onClick={() => {
                                        setSelectedService(null);
                                        setIsBookingModalOpen(true);
                                    }}
                                >
                                    <Calendar className="h-5 w-5 mr-2" />
                                    Hemen Randevu Al
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* Left Column: Content with Tabs */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="flex flex-wrap gap-3 pb-2">
                            {(['services', 'about', 'gallery', 'reviews'] as const).map((tab) => {
                                const icons = {
                                    services: Grid,
                                    about: Info,
                                    gallery: Image,
                                    reviews: MessageCircle
                                };
                                const Icon = icons[tab];
                                const labels = {
                                    services: 'Hizmetler',
                                    about: 'Hakkında',
                                    gallery: 'Galeri',
                                    reviews: 'Değerlendirmeler'
                                };

                                return (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-medium text-sm transition-all duration-200 border ${activeTab === tab
                                            ? 'bg-white border-primary-600 text-primary-600 shadow-sm ring-1 ring-primary-600'
                                            : 'bg-gray-100 border-transparent text-gray-600 hover:bg-gray-200'
                                            }`}
                                    >
                                        <Icon className={`w-4 h-4 ${activeTab === tab ? 'text-primary-600' : 'text-gray-500'}`} />
                                        {labels[tab]}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="min-h-[400px]">
                            {activeTab === 'services' && (
                                <div className="space-y-6 animate-fadeIn">
                                    <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                                        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                            Hizmetlerimiz
                                        </h2>
                                        <span className="px-3 py-1 bg-primary-50 text-primary-700 text-xs font-bold rounded-full border border-primary-100">
                                            {categories.reduce((acc, cat) => acc + cat.services.length, 0)} Hizmet
                                        </span>
                                    </div>

                                    {categories.length === 0 ? (
                                        <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-200">
                                            <p className="text-gray-500 italic">Henüz hizmet listelenmemiş.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-8">
                                            {categories.map((cat) => (
                                                <div key={cat.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                                    <div className="px-6 py-4 bg-gray-50/50 border-b border-gray-100 flex justify-between items-center">
                                                        <h3 className="text-lg font-bold text-gray-900">{cat.name}</h3>
                                                        <span className="text-xs font-medium text-gray-500 bg-white px-2 py-1 rounded-md border border-gray-100">
                                                            {cat.services.length} seçenek
                                                        </span>
                                                    </div>
                                                    <div className="divide-y divide-gray-50">
                                                        {cat.services.map((service) => (
                                                            <div key={service.id} className="p-4 border-b border-gray-100 last:border-0 hover:bg-gray-50/50 transition-colors">
                                                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                                    {/* Service Info */}
                                                                    <div className="w-full md:w-1/3 min-w-0">
                                                                        <div className="flex items-center gap-2 mb-1">
                                                                            <h4 className="font-semibold text-gray-900">{service.name}</h4>
                                                                            <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                                                                                {service.duration} dk
                                                                            </span>
                                                                        </div>
                                                                        <p className="text-sm text-gray-500 line-clamp-1">Profesyonel {service.name.toLowerCase()} hizmeti</p>
                                                                    </div>

                                                                    {/* Employees Section - Wrap & Full List */}
                                                                    {service.employees && service.employees.length > 0 && (
                                                                        <div className="flex-1 flex flex-wrap items-center gap-3">
                                                                            {service.employees.map((emp) => (
                                                                                <div
                                                                                    key={emp.id}
                                                                                    className="flex items-center gap-2 bg-white border border-gray-200 rounded-full pl-1 pr-3 py-1"
                                                                                >
                                                                                    <div className="h-6 w-6 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500 overflow-hidden shrink-0">
                                                                                        {emp.imageUrl ? (
                                                                                            <img src={emp.imageUrl} alt={emp.firstName} className="h-full w-full object-cover" />
                                                                                        ) : (
                                                                                            <span className={emp.averageRating > 0 ? "text-yellow-600" : ""}>
                                                                                                {emp.averageRating > 0 ? emp.averageRating.toFixed(1) : "-"}
                                                                                            </span>
                                                                                        )}
                                                                                    </div>
                                                                                    <div className="flex flex-col">
                                                                                        <span className="text-xs font-medium text-gray-700 leading-none">
                                                                                            {emp.firstName} {emp.lastName}
                                                                                        </span>
                                                                                        {emp.averageRating > 0 && emp.imageUrl && (
                                                                                            <span className="text-[10px] text-yellow-500 flex items-center gap-0.5 leading-none mt-0.5">
                                                                                                ★ {emp.averageRating.toFixed(1)}
                                                                                            </span>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    )}

                                                                    {/* Price & Action */}
                                                                    <div className="flex items-center gap-4 shrink-0 md:ml-auto">
                                                                        <span className="font-bold text-gray-900 text-lg">₺{service.price}</span>
                                                                        <Button
                                                                            size="sm"
                                                                            onClick={() => handleBookClick(service)}
                                                                            className="px-4"
                                                                        >
                                                                            Seç
                                                                        </Button>
                                                                    </div>
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

                            {activeTab === 'about' && (
                                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 animate-fadeIn">
                                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Hakkımızda</h2>
                                    <p className="text-gray-600 leading-loose text-lg">
                                        {shop.description || 'Hoş geldiniz. En iyi hizmeti sunmak için buradayız.'}
                                    </p>

                                    <div className="mt-8 grid grid-cols-2 gap-4">
                                        <div className="p-4 bg-gray-50 rounded-xl">
                                            <p className="text-sm text-gray-500 mb-1">Konum</p>
                                            <p className="font-medium text-gray-900">{shop.address}</p>
                                            <p className="text-sm text-gray-600">{shop.district}, {shop.city}</p>
                                        </div>
                                        <div className="p-4 bg-gray-50 rounded-xl">
                                            <p className="text-sm text-gray-500 mb-1">İletişim</p>
                                            <p className="font-medium text-gray-900">{shop.phoneNumber}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'gallery' && (
                                <div className="animate-fadeIn">
                                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Galeri</h2>
                                    {shop.images && shop.images.length > 0 ? (
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                            {shop.images.map((image, index) => (
                                                <div key={index} className="aspect-square rounded-xl overflow-hidden bg-gray-100 group cursor-zoom-in">
                                                    <img
                                                        src={getImageUrl(image.url)}
                                                        alt={`${shop.name} ${index + 1}`}
                                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                        onClick={() => window.open(getImageUrl(image.url), '_blank')}
                                                    />
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

                            {activeTab === 'reviews' && (
                                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 animate-fadeIn">
                                    <div className="flex items-center justify-between mb-8">
                                        <div>
                                            <h2 className="text-2xl font-bold text-gray-900">Değerlendirmeler</h2>
                                            <p className="text-gray-500 mt-1">Müşteri deneyimleri ve puanlar</p>
                                        </div>
                                        <div className="flex items-center gap-3 bg-yellow-50 px-5 py-3 rounded-2xl border border-yellow-100">
                                            <div className="text-3xl font-bold text-yellow-700">{shop.averageRating?.toFixed(1) || '0.0'}</div>
                                            <div className="flex flex-col">
                                                <div className="flex">
                                                    {[1, 2, 3, 4, 5].map((star) => (
                                                        <Star
                                                            key={star}
                                                            className={`h-4 w-4 ${star <= (shop.averageRating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                                                        />
                                                    ))}
                                                </div>
                                                <span className="text-xs text-yellow-700/70 font-medium">{shop.reviewCount} yorum</span>
                                            </div>
                                        </div>
                                    </div>

                                    {reviewableAppointment && !editingReview && (
                                        <div className="mb-8 p-6 bg-primary-50 rounded-xl border border-primary-100 flex items-center justify-between">
                                            <div>
                                                <h4 className="font-bold text-primary-900">Son hizmetini değerlendir</h4>
                                                <p className="text-sm text-primary-700 mt-1">
                                                    {reviewableAppointment.employeeName} ile {new Date(reviewableAppointment.startTime).toLocaleDateString('tr-TR')} tarihindeki randevun nasıldı?
                                                </p>
                                            </div>
                                            <Button onClick={() => setIsReviewModalOpen(true)}>
                                                Hizmeti Değerlendir
                                            </Button>
                                        </div>
                                    )}

                                    <ReviewsList
                                        shopId={shop.id}
                                        onEdit={handleEditReview}
                                        refreshTrigger={reviewsRefreshTrigger}
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Sticky Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-24 space-y-6">
                            <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100 overflow-hidden">
                                <div className="p-6 bg-gradient-to-br from-gray-900 to-gray-800 text-white">
                                    <h3 className="font-bold text-lg flex items-center">
                                        <Clock className="h-5 w-5 mr-2 text-primary-400" />
                                        Çalışma Saatleri
                                    </h3>
                                    <p className="text-gray-400 text-sm mt-1">Haftalık çalışma programı</p>
                                </div>
                                <div className="p-6">
                                    <div className="space-y-4">
                                        {shop.weeklySchedule ? (
                                            shop.weeklySchedule.map((s) => {
                                                const isToday = s.dayOfWeek === new Date().getDay();
                                                return (
                                                    <div key={s.dayOfWeek} className={`flex justify-between items-center text-sm ${isToday ? 'bg-primary-50 -mx-2 px-2 py-1 rounded-md' : ''}`}>
                                                        <span className={`font-medium ${isToday ? 'text-primary-700' : 'text-gray-600'}`}>
                                                            {['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'][s.dayOfWeek]}
                                                        </span>
                                                        <span className={s.isClosed ? 'text-red-500 font-medium' : 'text-gray-900'}>
                                                            {s.isClosed ? 'Kapalı' : `${s.openingTime} - ${s.closingTime}`}
                                                        </span>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <p className="text-gray-500 italic">Saatler yükleniyor...</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                <h3 className="font-bold text-gray-900 mb-4">İletişim</h3>
                                <div className="space-y-4">
                                    <div className="flex items-start">
                                        <MapPin className="h-5 w-5 text-primary-500 mr-3 mt-1" />
                                        <p className="text-gray-600 text-sm leading-relaxed">{shop.address}<br />{shop.district}, {shop.city}</p>
                                    </div>
                                    <div className="flex items-center">
                                        <Phone className="h-5 w-5 text-primary-500 mr-3" />
                                        <p className="text-gray-600 text-sm font-medium">{shop.phoneNumber}</p>
                                    </div>
                                </div>

                                <div className="mt-8 pt-6 border-t border-gray-100">
                                    <Button className="w-full shadow-lg shadow-secondary-500/20 font-bold" size="lg" variant="secondary" onClick={() => {
                                        setSelectedService(null);
                                        setIsBookingModalOpen(true);
                                    }}>
                                        <Calendar className="h-5 w-5 mr-2" />
                                        Randevu Al
                                    </Button>
                                    <p className="text-xs text-center text-gray-400 mt-3">Kolay ve hızlı rezervasyon</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            {isBookingModalOpen && shop && (
                <BookingModal
                    isOpen={isBookingModalOpen}
                    onClose={() => setIsBookingModalOpen(false)}
                    shopId={shop.id}
                    initialServiceId={selectedService?.id}
                    initialServiceName={selectedService?.name}
                    initialServiceDuration={selectedService?.duration}
                    initialServicePrice={selectedService?.price}
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
