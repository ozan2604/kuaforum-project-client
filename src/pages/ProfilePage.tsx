import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { appointmentService } from '../api/appointment.service';
import { authService } from '../api/auth.service';
import type { AppointmentDto } from '../types/appointment';
import type { Address, CreateAddressRequest } from '../types/address';
import { Button } from '../components/Button';
import { Calendar, User, LogOut, CheckCircle, Clock, XCircle, AlertCircle, Trash2, MapPin, Lock, Plus, Heart, Briefcase } from 'lucide-react';
import { favoriteService } from '../services/favorite.service';
import { ShopCard } from '../components/ShopCard';
import type { Shop } from '../types/shop';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { toast } from 'react-hot-toast';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { reviewService } from '../api/review.service';
import { ReviewModal } from '../components/ReviewModal';

export const ProfilePage: React.FC = () => {
    const { user, logout, updateAuthorization } = useAuth();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = (searchParams.get('tab') as 'appointments' | 'account' | 'security' | 'addresses' | 'salon-owner' | 'favorites') || 'appointments';

    const setActiveTab = (tab: 'appointments' | 'account' | 'security' | 'addresses' | 'salon-owner' | 'favorites') => {
        setSearchParams({ tab });
    };

    // Appointments State
    const [appointments, setAppointments] = useState<AppointmentDto[]>([]);

    // Profile State
    const [firstName, setFirstName] = useState(user?.firstName || '');
    const [lastName, setLastName] = useState(user?.lastName || '');
    const [userName, setUserName] = useState(user?.userName || '');
    const [email, setEmail] = useState(user?.email || '');
    const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
    const [updatingProfile, setUpdatingProfile] = useState(false);

    // Address State
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [showAddAddressModal, setShowAddAddressModal] = useState(false);
    const [newAddress, setNewAddress] = useState<CreateAddressRequest>({ title: '', city: '', district: '', openAddress: '' });

    // Password State
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');



    // Favorites State
    const [favorites, setFavorites] = useState<Shop[]>([]);
    const [favLoading, setFavLoading] = useState(false);

    // Review Modal State
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [selectedAppointmentForReview, setSelectedAppointmentForReview] = useState<AppointmentDto | null>(null);

    useEffect(() => {
        if (activeTab === 'appointments') {
            loadAppointments();
        } else if (activeTab === 'addresses') {
            loadAddresses();
        } else if (activeTab === 'favorites') {
            loadFavorites();
        }
    }, [activeTab]);



    useEffect(() => {
        if (user) {
            setFirstName(user.firstName);
            setLastName(user.lastName);
            setUserName(user.userName);
            setEmail(user.email);
            setPhoneNumber(user.phoneNumber || '');
        }
    }, [user]);

    const loadAppointments = async () => {
        try {
            const data = await appointmentService.getMyAppointments();
            setAppointments(data);
        } catch (error) {
            console.error('Failed to load appointments', error);
            toast.error('Randevular yüklenemedi.');
        }
    };

    const loadAddresses = async () => {
        try {
            const data = await authService.getAddresses();
            setAddresses(data);
        } catch (error) {
            console.error('Failed to load addresses', error);
            toast.error('Adresler yüklenemedi.');
        }
    };

    const loadFavorites = async () => {
        setFavLoading(true);
        try {
            const data = await favoriteService.getUserFavorites();
            setFavorites(data);
        } catch (error) {
            console.error('Failed to load favorites', error);
            toast.error('Favoriler yüklenemedi.');
        } finally {
            setFavLoading(false);
        }
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setUpdatingProfile(true);
        try {
            const response = await authService.updateProfile({
                firstName,
                lastName,
                userName,
                email,
                phoneNumber
            });
            updateAuthorization(response);
            toast.success('Profil güncellendi.');
        } catch (error: any) {
            console.error('Update failed', error);
            const message = error.response?.data?.Message || 'Güncelleme başarısız.';
            toast.error(message);
        } finally {
            setUpdatingProfile(false);
        }
    };

    const handleAddAddress = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const addedAddress = await authService.addAddress(newAddress);
            setAddresses([...addresses, addedAddress]);
            setShowAddAddressModal(false);
            setNewAddress({ title: '', city: '', district: '', openAddress: '' });
            toast.success('Adres eklendi.');
        } catch (error) {
            console.error('Add address failed', error);
            toast.error('Adres eklenemedi.');
        }
    };

    const handleDeleteAddress = async (id: string) => {
        if (!window.confirm('Bu adresi silmek istediğinize emin misiniz?')) return;
        try {
            await authService.deleteAddress(id);
            setAddresses(addresses.filter(a => a.id !== id));
            toast.success('Adres silindi.');
        } catch (error) {
            console.error('Delete address failed', error);
            toast.error('Adres silinemedi.');
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            toast.error('Yeni şifreler eşleşmiyor.');
            return;
        }
        try {
            await authService.changePassword({ currentPassword, newPassword, confirmPassword });
            toast.success('Şifre başarıyla değiştirildi.');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            console.error('Change password failed', error);
            const message = error.response?.data || error.message || 'Şifre değiştirilemedi.'; // Backend might return string directly or error object
            toast.error(typeof message === 'string' ? message : 'Şifre değiştirilemedi.');
        }
    };

    const handleDeleteAccount = async () => {
        if (!window.confirm('Hesabınızı silmek istediğinize emin misiniz? Bu işlem geri alınamaz ve tüm verileriniz silinir.')) return;

        try {
            await authService.deleteAccount();
            toast.success('Hesabınız silindi.');
            logout();
            navigate('/');
        } catch (error) {
            console.error('Delete account failed', error);
            toast.error('Hesap silinemedi.');
        }
    };



    const handleOpenReviewModal = (appointment: AppointmentDto) => {
        setSelectedAppointmentForReview(appointment);
        setIsReviewModalOpen(true);
    };

    const handleReviewSubmit = async (rating: number, comment: string, newImages: File[], _deletedImageUrls: string[]) => {
        if (!selectedAppointmentForReview) return;

        try {
            await reviewService.addReview({
                appointmentId: selectedAppointmentForReview.id,
                rating,
                comment,
                images: newImages
            });
            // Update local state to reflect the review
            await loadAppointments();
        } catch (error) {
            console.error('Failed to submit review', error);
            toast.error('Değerlendirme gönderilemedi.');
        }
    };

    const canReview = (appointment: AppointmentDto) => {
        if (appointment.hasReview) return false;

        return appointment.status === 2; // Completed
    };

    const getStatusBadge = (status: number) => {
        switch (status) {
            case 0: return <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1"><Clock className="h-3 w-3" /> Onay Bekliyor</span>;
            case 1: return <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Onaylandı</span>;
            case 2: return <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Tamamlandı</span>;
            case 3: return <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1"><AlertCircle className="h-3 w-3" /> İptal Edildi</span>;
            case 4: return <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1"><XCircle className="h-3 w-3" /> Reddedildi</span>;
            default: return null;
        }
    };

    // Filter appointments
    const pendingApps = appointments.filter(a => a.status === 0);
    const upcomingApps = appointments.filter(a => a.status === 1);
    const pastApps = appointments.filter(a => [2, 3, 4].includes(a.status));

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="flex flex-col md:flex-row gap-8">
                {/* Sidebar */}
                <div className="w-full md:w-64 flex-shrink-0">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <div className="flex flex-col items-center mb-6">
                            <div className="h-20 w-20 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 mb-3">
                                <User className="h-10 w-10" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900">{user?.firstName} {user?.lastName}</h2>
                            <p className="text-sm text-gray-500">{user?.email}</p>
                            <p className="text-sm text-gray-500">{user?.phoneNumber}</p>
                        </div>

                        <nav className="space-y-2">
                            <button onClick={() => setActiveTab('appointments')} className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'appointments' ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:bg-gray-50'}`}>
                                <Calendar className="h-5 w-5" /> Randevularım
                            </button>
                            <button onClick={() => setActiveTab('account')} className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'account' ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:bg-gray-50'}`}>
                                <User className="h-5 w-5" /> Hesap Bilgileri
                            </button>
                            <button onClick={() => setActiveTab('favorites')} className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'favorites' ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:bg-gray-50'}`}>
                                <Heart className="h-5 w-5" /> Favorilerim
                            </button>
                            <button onClick={() => setActiveTab('addresses')} className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'addresses' ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:bg-gray-50'}`}>
                                <MapPin className="h-5 w-5" /> Adreslerim
                            </button>
                            <button onClick={() => setActiveTab('security')} className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'security' ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:bg-gray-50'}`}>
                                <Lock className="h-5 w-5" /> Güvenlik
                            </button>

                            {user?.role === 'Employee' && (
                                <button onClick={() => navigate('/employee-panel/appointments')} className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                                    <Briefcase className="h-5 w-5" /> Personel Paneli
                                </button>
                            )}
                            <button onClick={() => { logout(); navigate('/login'); }} className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">
                                <LogOut className="h-5 w-5" /> Çıkış Yap
                            </button>
                        </nav>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1">
                    {activeTab === 'appointments' && (
                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold text-gray-900">Randevularım</h2>
                            {pendingApps.length > 0 && (
                                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                    <h3 className="text-lg font-semibold text-yellow-800 mb-4 flex items-center gap-2"><Clock className="h-5 w-5" /> Onay Bekleyenler</h3>
                                    <div className="space-y-4">{pendingApps.map(app => <AppointmentCard key={app.id} appointment={app} badge={getStatusBadge(app.status)} />)}</div>
                                </div>
                            )}
                            {upcomingApps.length > 0 && (
                                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                    <h3 className="text-lg font-semibold text-green-800 mb-4 flex items-center gap-2"><CheckCircle className="h-5 w-5" /> Gelecek Randevular</h3>
                                    <div className="space-y-4">{upcomingApps.map(app => (
                                        <AppointmentCard
                                            key={app.id}
                                            appointment={app}
                                            badge={getStatusBadge(app.status)}
                                            onReview={canReview(app) ? () => handleOpenReviewModal(app) : undefined}
                                        />
                                    ))}</div>
                                </div>
                            )}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                <h3 className="text-lg font-semibold text-gray-700 mb-4">Geçmiş Randevular</h3>
                                {pastApps.length > 0 ? (
                                    <div className="space-y-4">{pastApps.map(app => (
                                        <AppointmentCard
                                            key={app.id}
                                            appointment={app}
                                            badge={getStatusBadge(app.status)}
                                            onReview={canReview(app) ? () => handleOpenReviewModal(app) : undefined}
                                        />
                                    ))}</div>
                                ) : (<p className="text-gray-500 text-sm">Geçmiş randevu bulunmuyor.</p>)}
                            </div>
                        </div>
                    )}

                    {activeTab === 'account' && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">Hesap Bilgileri</h2>
                            <form onSubmit={handleUpdateProfile} className="space-y-6 max-w-lg">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Ad</label>
                                        <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Soyad</label>
                                        <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Kullanıcı Adı</label>
                                    <input type="text" value={userName} onChange={(e) => setUserName(e.target.value)} className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
                                    <input type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500" />
                                </div>
                                <div className="pt-4 flex items-center justify-between">
                                    <Button type="submit" disabled={updatingProfile}>{updatingProfile ? 'Güncelleniyor...' : 'Kayıt Et'}</Button>
                                    <button type="button" onClick={handleDeleteAccount} className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1"><Trash2 className="h-4 w-4" /> Hesabımı Sil</button>
                                </div>
                            </form>
                        </div>
                    )}

                    {activeTab === 'favorites' && (
                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold text-gray-900">Favori Salonlarım</h2>
                            {favLoading ? (
                                <div className="text-center py-12">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                                </div>
                            ) : favorites.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {favorites.map(shop => (
                                        <ShopCard
                                            key={shop.id}
                                            shop={shop}
                                            initialIsFavorite={true}
                                            onToggleFavorite={(status) => {
                                                if (!status) {
                                                    setFavorites(favorites.filter(f => f.id !== shop.id));
                                                }
                                            }}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
                                    <Heart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">Henüz favoriniz yok</h3>
                                    <p className="text-gray-500 mb-6">Beğendiğiniz salonları favorilere ekleyerek burada görebilirsiniz.</p>
                                    <Button onClick={() => navigate('/')}>Salonları Keşfet</Button>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'addresses' && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-gray-900">Adreslerim</h2>
                                <Button onClick={() => setShowAddAddressModal(true)} variant="outline" className="flex items-center gap-2">
                                    <Plus className="h-4 w-4" /> Yeni Adres Ekle
                                </Button>
                            </div>

                            <div className="space-y-4">
                                {addresses.map(address => (
                                    <div key={address.id} className="border border-gray-200 rounded-lg p-4 flex justify-between items-start">
                                        <div>
                                            <h4 className="font-bold text-gray-900">{address.title}</h4>
                                            <p className="text-sm text-gray-600 mt-1">{address.openAddress}</p>
                                            <p className="text-sm text-gray-500">{address.district} / {address.city}</p>
                                        </div>
                                        <button onClick={() => handleDeleteAddress(address.id)} className="text-gray-400 hover:text-red-600 p-1">
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                ))}
                                {addresses.length === 0 && <p className="text-gray-500 text-center py-4">Kayıtlı adresiniz bulunmuyor.</p>}
                            </div>

                            {/* Add Address Modal (Simple inline for now) */}
                            {showAddAddressModal && (
                                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                                    <div className="bg-white rounded-xl p-6 w-full max-w-md">
                                        <h3 className="text-lg font-bold mb-4">Yeni Adres Ekle</h3>
                                        <form onSubmit={handleAddAddress} className="space-y-4">
                                            <input type="text" placeholder="Adres Başlığı (Örn: Ev)" value={newAddress.title} onChange={e => setNewAddress({ ...newAddress, title: e.target.value })} className="w-full rounded-md border-gray-300" required />
                                            <input type="text" placeholder="İl" value={newAddress.city} onChange={e => setNewAddress({ ...newAddress, city: e.target.value })} className="w-full rounded-md border-gray-300" required />
                                            <input type="text" placeholder="İlçe" value={newAddress.district} onChange={e => setNewAddress({ ...newAddress, district: e.target.value })} className="w-full rounded-md border-gray-300" required />
                                            <textarea placeholder="Açık Adres" value={newAddress.openAddress} onChange={e => setNewAddress({ ...newAddress, openAddress: e.target.value })} className="w-full rounded-md border-gray-300" required />

                                            <div className="flex items-end gap-2">
                                                <div className="flex-1">
                                                    <input type="number" step="any" placeholder="Enlem (Latitude)" value={newAddress.latitude || ''} onChange={e => setNewAddress({ ...newAddress, latitude: parseFloat(e.target.value) })} className="w-full rounded-md border-gray-300" />
                                                </div>
                                                <div className="flex-1">
                                                    <input type="number" step="any" placeholder="Boylam (Longitude)" value={newAddress.longitude || ''} onChange={e => setNewAddress({ ...newAddress, longitude: parseFloat(e.target.value) })} className="w-full rounded-md border-gray-300" />
                                                </div>
                                                <Button type="button" variant="outline" onClick={async () => {
                                                    if (!newAddress.city || !newAddress.district) {
                                                        toast.error('Şehir ve ilçe giriniz.');
                                                        return;
                                                    }
                                                    const query = `${newAddress.openAddress} ${newAddress.district} ${newAddress.city}`;
                                                    try {
                                                        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
                                                        const data = await response.json();
                                                        if (data && data.length > 0) {
                                                            setNewAddress(prev => ({
                                                                ...prev,
                                                                latitude: parseFloat(data[0].lat),
                                                                longitude: parseFloat(data[0].lon)
                                                            }));
                                                            toast.success('Konum bulundu!');
                                                        } else {
                                                            toast.error('Konum bulunamadı.');
                                                        }
                                                    } catch (error) {
                                                        console.error(error);
                                                        toast.error('Hata oluştu.');
                                                    }
                                                }}>
                                                    <MapPin className="h-4 w-4" />
                                                </Button>
                                            </div>

                                            <div className="flex justify-end gap-2 pt-2">
                                                <button type="button" onClick={() => setShowAddAddressModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">İptal</button>
                                                <Button type="submit">Ekle</Button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}



                    {activeTab === 'security' && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">Güvenlik</h2>
                            <form onSubmit={handleChangePassword} className="space-y-6 max-w-lg">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Mevcut Şifre</label>
                                    <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Yeni Şifre</label>
                                    <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500" required minLength={6} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Yeni Şifre (Tekrar)</label>
                                    <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500" required minLength={6} />
                                </div>
                                <div className="pt-4">
                                    <Button type="submit">Şifreyi Değiştir</Button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            </div>

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

interface AppointmentCardProps {
    appointment: AppointmentDto;
    badge: React.ReactNode;
    onReview?: () => void;
}

const AppointmentCard: React.FC<AppointmentCardProps> = ({ appointment, badge, onReview }) => {
    return (
        <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div>
                    <h4 className="font-bold text-gray-900">{appointment.shopName}</h4>
                    <p className="text-sm text-gray-600">{appointment.serviceName}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> {format(new Date(appointment.startTime), 'd MMMM yyyy', { locale: tr })}</span>
                        <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {format(new Date(appointment.startTime), 'HH:mm')}</span>
                        <span>{appointment.employeeName}</span>
                    </div>
                </div>
                <div className="flex flex-col items-end gap-2 w-full sm:w-auto">
                    <div className="flex justify-between w-full sm:w-auto sm:block">
                        {badge}
                    </div>
                    <span className="font-bold text-gray-900">₺{appointment.price}</span>

                    {onReview && (
                        <Button size="sm" variant="outline" onClick={onReview} className="mt-2 w-full sm:w-auto">
                            Değerlendir
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
};
