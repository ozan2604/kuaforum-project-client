import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { shopService } from '../api/shop.service';
import { serviceManagementService } from '../api/service.service';
import type { Shop } from '../types/shop';
import type { ServiceCategoryDto, ShopServiceDto } from '../types/service';
import { MapPin, Star, Phone, Clock, Calendar, ChevronLeft } from 'lucide-react';
import { Button } from '../components/Button';
import { toast } from 'react-hot-toast';
import { BookingModal } from '../components/BookingModal';
import { useAuth } from '../context/AuthContext';

export const ShopDetailsPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();

    const [shop, setShop] = useState<Shop | null>(null);
    const [categories, setCategories] = useState<ServiceCategoryDto[]>([]);
    const [loading, setLoading] = useState(true);

    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
    const [selectedService, setSelectedService] = useState<ShopServiceDto | null>(null);

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
            } catch (error) {
                console.error('Failed to load shop details', error);
                toast.error('Failed to load shop details');
                navigate('/');
            } finally {
                setLoading(false);
            }
        };
        loadShopData();
    }, [id, navigate]);

    const handleBookClick = (service: ShopServiceDto) => {
        if (!isAuthenticated) {
            toast.error('Randevu almak için lütfen giriş yapın.');
            navigate('/login');
            // TODO: Save return URL
            return;
        }

        setSelectedService(service);
        setIsBookingModalOpen(true);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    // Helper to render images with full URL
    const getImageUrl = (path: string) => {
        if (!path) return '';
        if (path.startsWith('http')) return path;
        return `http://localhost:5000${path}`;
    };

    if (!shop) return null;

    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            {/* Header / Hero */}
            <div className="bg-white shadow-sm">
                <div className="h-64 sm:h-80 bg-gray-200 relative group">
                    <img
                        src={shop.coverImagePath ? getImageUrl(shop.coverImagePath) : `https://source.unsplash.com/random/1200x400/?salon,${shop.id}`}
                        alt={shop.name}
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1521590832896-bc17251e32ed?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80'; }}
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-40"></div>
                    <div className="absolute top-4 left-4">
                        <Button variant="secondary" size="sm" onClick={() => navigate('/')} className="bg-white/90 hover:bg-white text-gray-800">
                            <ChevronLeft className="h-4 w-4 mr-1" />
                            Back to Home
                        </Button>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 text-white">
                        <div className="max-w-7xl mx-auto">
                            <h1 className="text-3xl sm:text-4xl font-bold mb-2">{shop.name}</h1>
                            <div className="flex flex-wrap items-center gap-4 text-sm sm:text-base">
                                <span className="flex items-center">
                                    <MapPin className="h-4 w-4 mr-1" />
                                    {shop.district}, {shop.city}
                                </span>
                                <span className="flex items-center text-yellow-300">
                                    <Star className="h-4 w-4 mr-1 fill-current" />
                                    4.8 (124 Reviews)
                                </span>
                                <span className="flex items-center">
                                    <Clock className="h-4 w-4 mr-1" />
                                    Open until 20:00
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content: Services */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">About the Salon</h2>
                        <p className="text-gray-600 leading-relaxed">
                            {shop.description || 'Welcome to our premium salon. We offer a wide range of services to help you look and feel your best. Our experienced staff uses high-quality products to ensure satisfaction.'}
                        </p>
                    </div>

                    {/* Gallery Section */}
                    {shop.imageUrls && shop.imageUrls.length > 0 && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-6">Gallery</h2>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {shop.imageUrls.map((url, index) => (
                                    <div key={index} className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                                        <img
                                            src={getImageUrl(url)}
                                            alt={`${shop.name} ${index + 1}`}
                                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300 cursor-pointer"
                                            onClick={() => window.open(getImageUrl(url), '_blank')}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-6">Services</h2>
                        {categories.length === 0 ? (
                            <p className="text-gray-500 italic">No services listed yet.</p>
                        ) : (
                            <div className="space-y-6">
                                {categories.map((cat) => (
                                    <div key={cat.id}>
                                        <h3 className="text-lg font-semibold text-gray-800 mb-3 pb-2 border-b border-gray-100">
                                            {cat.name}
                                        </h3>
                                        <div className="space-y-3">
                                            {cat.services.map((service) => (
                                                <div key={service.id} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-lg transition-colors group">
                                                    <div>
                                                        <p className="font-medium text-gray-900">{service.name}</p>
                                                        <p className="text-sm text-gray-500">{service.duration} mins</p>
                                                    </div>
                                                    <div className="flex items-center">
                                                        <span className="font-bold text-gray-900 mr-4">₺{service.price}</span>
                                                        <Button size="sm" onClick={() => handleBookClick(service)}>
                                                            Book
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar: Info */}
                <div className="space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h3 className="font-bold text-gray-900 mb-4">Contact Info</h3>
                        <div className="space-y-4">
                            <div className="flex items-start">
                                <MapPin className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                                <p className="text-gray-600 text-sm">{shop.address}<br />{shop.district}, {shop.city}</p>
                            </div>
                            <div className="flex items-center">
                                <Phone className="h-5 w-5 text-gray-400 mr-3" />
                                <p className="text-gray-600 text-sm">{shop.phoneNumber}</p>
                            </div>
                        </div>
                        <div className="mt-6 pt-6 border-t border-gray-100">
                            {/* General Book Button - maybe scroll to services or open generic modal? */}
                            <Button className="w-full" onClick={() => {
                                if (categories.length > 0 && categories[0].services.length > 0) {
                                    handleBookClick(categories[0].services[0]); // Default to first service for now
                                } else {
                                    toast.error('No services available to book.');
                                }
                            }}>
                                <Calendar className="h-4 w-4 mr-2" />
                                Book Appointment
                            </Button>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h3 className="font-bold text-gray-900 mb-4">Opening Hours</h3>
                        <div className="space-y-2 text-sm text-gray-600">
                            <div className="flex justify-between">
                                <span>Monday - Friday</span>
                                <span>09:00 - 20:00</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Saturday</span>
                                <span>10:00 - 18:00</span>
                            </div>
                            <div className="flex justify-between text-red-500">
                                <span>Sunday</span>
                                <span>Closed</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {selectedService && shop && (
                <BookingModal
                    isOpen={isBookingModalOpen}
                    onClose={() => setIsBookingModalOpen(false)}
                    shopId={shop.id}
                    serviceId={selectedService.id}
                    serviceName={selectedService.name}
                    serviceDuration={selectedService.duration}
                    servicePrice={selectedService.price}
                />
            )}
        </div>
    );
};
