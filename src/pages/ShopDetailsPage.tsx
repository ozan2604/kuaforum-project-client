import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { shopService } from '../api/shop.service';
import { serviceManagementService } from '../api/service.service';
import { employeeService } from '../api/employee.service';
import type { Shop } from '../types/shop';
import type { ServiceCategoryDto, ShopServiceDto } from '../types/service';
import type { PublicEmployeeScheduleDto } from '../types/employee';
import { MapPin, Star, Phone, Clock, Calendar, ChevronLeft, ChevronDown, Heart, Grid, Info, Image, MessageCircle, Users } from 'lucide-react';
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

    const [activeTab, setActiveTab] = useState<'services' | 'about' | 'gallery' | 'reviews' | 'hours'>('services');
    const [employeeSchedules, setEmployeeSchedules] = useState<PublicEmployeeScheduleDto[]>([]);
    const [selectedScheduleEmployeeId, setSelectedScheduleEmployeeId] = useState<string>('');

    // Accordion States for Nested UI (Categories -> Services -> Employees)
    const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
    const [expandedServices, setExpandedServices] = useState<Record<string, boolean>>({});
    const [expandedEmployees, setExpandedEmployees] = useState<Record<string, boolean>>({});

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
                            {(['services', 'about', 'gallery', 'reviews', 'hours'] as const).map((tab) => {
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
                                    reviews: 'Değerlendirmeler',
                                    hours: 'Çalışma Saatleri'
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
                                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 animate-fadeIn">
                                    <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-100">
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
                                        <div className="space-y-5">
                                            {categories.map((cat) => (
                                                <div key={cat.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                                    {/* Category Header */}
                                                    <button
                                                        onClick={() => toggleAccordion(setExpandedCategories, cat.id)}
                                                        className="w-full px-6 py-4 bg-gray-50/50 hover:bg-gray-100/80 transition-colors flex justify-between items-center group text-left"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${expandedCategories[cat.id] ? 'bg-primary-100 text-primary-600' : 'bg-white border border-gray-200 text-gray-400 group-hover:text-primary-500 group-hover:border-primary-200'}`}>
                                                                <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${expandedCategories[cat.id] ? 'rotate-180' : ''}`} />
                                                            </div>
                                                            <h3 className="text-lg font-bold text-gray-900 group-hover:text-primary-700 transition-colors">{cat.name}</h3>
                                                        </div>
                                                        <span className="text-xs font-semibold text-gray-500 bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm">
                                                            {cat.services.length} seçenek
                                                        </span>
                                                    </button>

                                                    {/* Services List (Level 1 Expanded) */}
                                                    <div className={`transition-all duration-400 ease-in-out ${expandedCategories[cat.id] ? 'max-h-[8000px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                                                        <div className="divide-y divide-gray-50 border-t border-gray-100 bg-white">
                                                            {cat.services.map((service) => (
                                                                <div key={service.id} className="p-4 hover:bg-gray-50/30 transition-colors">
                                                                    {/* Service Header */}
                                                                    <div
                                                                        className="flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer"
                                                                        onClick={(e) => {
                                                                            // Prevent triggering if clicked on exactly 'Seç' button
                                                                            if ((e.target as HTMLElement).closest('button')?.textContent === 'Seç') return;
                                                                            toggleAccordion(setExpandedServices, service.id);
                                                                        }}
                                                                    >
                                                                        <div className="w-full md:w-1/2 min-w-0 flex flex-row items-center gap-3">
                                                                            <button
                                                                                className={`shrink-0 w-7 h-7 rounded flex items-center justify-center transition-colors ${expandedServices[service.id] ? 'bg-primary-50 text-primary-600' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                                                                            >
                                                                                <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${expandedServices[service.id] ? 'rotate-180' : ''}`} />
                                                                            </button>
                                                                            <div>
                                                                                <div className="flex items-center gap-2 mb-0.5">
                                                                                    <h4 className="font-bold text-gray-900 text-[15px]">{service.name}</h4>
                                                                                    <span className="text-[11px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                                                                                        {service.duration} dk
                                                                                    </span>
                                                                                </div>
                                                                                <p className="text-sm text-gray-500 mt-0.5 truncate pr-4">Hizmet ayrıntılarını ve kişileri gör</p>
                                                                            </div>
                                                                        </div>

                                                                        <div className="flex items-center justify-between md:justify-end gap-5 shrink-0 mt-3 md:mt-0 pl-10 md:pl-0">
                                                                            <span className="font-extrabold text-gray-900 text-lg">₺{service.price}</span>
                                                                            <Button
                                                                                size="sm"
                                                                                onClick={(e) => { e.stopPropagation(); handleBookClick(service); }}
                                                                                className="px-6 py-2 rounded-xl shadow-sm hover:shadow"
                                                                            >
                                                                                Seç
                                                                            </Button>
                                                                        </div>
                                                                    </div>

                                                                    {/* Service Details & Employees (Level 2 Expanded) */}
                                                                    <div className={`overflow-hidden transition-all duration-400 ease-in-out ${expandedServices[service.id] ? 'max-h-[3000px] opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
                                                                        <div className="pl-10 pr-2 pb-2">
                                                                            <p className="text-[13px] md:text-sm text-gray-600 mb-4 bg-gray-50 p-4 rounded-xl border border-gray-100 shadow-inner">
                                                                                {service.description || `Profesyonel ${service.name.toLowerCase()} hizmeti. Bu işlem ortalama ${service.duration} dakika sürmektedir ve alanında uzman ekibimiz tarafından özenle uygulanır. Randevu alarak size özel saati ayırtabilirsiniz.`}
                                                                            </p>

                                                                            {service.employees && service.employees.length > 0 && (
                                                                                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                                                                                    {/* Employees Header */}
                                                                                    <button
                                                                                        onClick={(e) => { e.stopPropagation(); toggleAccordion(setExpandedEmployees, service.id); }}
                                                                                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors group"
                                                                                    >
                                                                                        <span className="text-[13px] md:text-sm font-bold text-gray-800 flex items-center gap-2">
                                                                                            <span className={`w-2 h-2 rounded-full transition-colors ${expandedEmployees[service.id] ? 'bg-primary-500' : 'bg-gray-300 group-hover:bg-primary-400'}`}></span>
                                                                                            Hizmeti Veren Kişiler
                                                                                        </span>
                                                                                        <div className="flex items-center gap-3">
                                                                                            <span className="text-[11px] font-bold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-md">{service.employees.length} Kişi</span>
                                                                                            <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${expandedEmployees[service.id] ? 'rotate-180 text-primary-500' : 'text-gray-400'}`} />
                                                                                        </div>
                                                                                    </button>

                                                                                    {/* Employees List (Level 3 Expanded) */}
                                                                                    <div className={`transition-all duration-400 ease-in-out ${expandedEmployees[service.id] ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                                                                                        <div className="p-4 border-t border-gray-200 bg-gray-50/50 flex flex-wrap gap-3">
                                                                                            {service.employees.map((emp) => (
                                                                                                <div
                                                                                                    key={emp.id}
                                                                                                    className="flex items-center gap-3 bg-white border border-gray-200 rounded-2xl pl-2 pr-5 py-2 shadow-sm hover:border-primary-300 transition-colors"
                                                                                                >
                                                                                                    <div className="h-10 w-10 rounded-xl bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 overflow-hidden shrink-0">
                                                                                                        {emp.imageUrl ? (
                                                                                                            <img src={emp.imageUrl} alt={emp.firstName} className="h-full w-full object-cover" />
                                                                                                        ) : (
                                                                                                            <span className={emp.averageRating > 0 ? "text-yellow-600" : ""}>
                                                                                                                {emp.averageRating > 0 ? emp.averageRating.toFixed(1) : "-"}
                                                                                                            </span>
                                                                                                        )}
                                                                                                    </div>
                                                                                                    <div className="flex flex-col justify-center">
                                                                                                        <span className="text-sm font-bold text-gray-900 leading-tight">
                                                                                                            {emp.firstName} {emp.lastName}
                                                                                                        </span>
                                                                                                        <span className="text-[11px] font-bold text-gray-500 flex items-center gap-1 leading-tight mt-1">
                                                                                                            Uzman Personel
                                                                                                            {emp.averageRating > 0 && emp.imageUrl && (
                                                                                                                <span className="text-yellow-600 flex items-center bg-yellow-50 px-1 rounded ml-1">
                                                                                                                    ★ {emp.averageRating.toFixed(1)}
                                                                                                                </span>
                                                                                                            )}
                                                                                                        </span>
                                                                                                    </div>
                                                                                                </div>
                                                                                            ))}
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>

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
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 animate-fadeIn">
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
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                                <Users className="w-4 h-4 text-gray-500" />
                                                Personel Çalışma Takvimi
                                            </h3>
                                            <select
                                                value={selectedScheduleEmployeeId}
                                                onChange={e => setSelectedScheduleEmployeeId(e.target.value)}
                                                className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-300"
                                            >
                                                {employeeSchedules.map(emp => (
                                                    <option key={emp.employeeId} value={emp.employeeId}>
                                                        {emp.firstName} {emp.lastName}{emp.title ? ` — ${emp.title}` : ''}
                                                    </option>
                                                ))}
                                            </select>
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

                                {!shop.openTime && !shop.closeTime && employeeSchedules.length === 0 && (!shop.closureDates || shop.closureDates.length === 0) && (
                                    <p className="text-gray-500 italic text-center py-8">Çalışma saati bilgisi henüz girilmemiş.</p>
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
                        {shop.openTime && shop.closeTime && (
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center gap-3">
                                <Clock className="h-5 w-5 text-primary-500 flex-shrink-0" />
                                <div>
                                    <p className="text-xs text-gray-500">Çalışma Saatleri</p>
                                    <p className="font-bold text-gray-900">{shop.openTime} – {shop.closeTime}</p>
                                </div>
                                <button
                                    onClick={() => setActiveTab('hours')}
                                    className="ml-auto text-xs text-primary-600 font-medium hover:underline"
                                >
                                    Detay
                                </button>
                            </div>
                        )}

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
