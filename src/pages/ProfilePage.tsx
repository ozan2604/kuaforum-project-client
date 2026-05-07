import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../context/AuthContext';
import { appointmentService } from '../api/appointment.service';
import { authService } from '../api/auth.service';
import type { AppointmentDto } from '../types/appointment';

import { Button } from '../components/Button';
import { Calendar, User, LogOut, CheckCircle, Clock, XCircle, AlertCircle, Trash2, Lock, Heart, ChevronRight, MessageSquare, Camera, Edit2, Store } from 'lucide-react';
import { favoriteService } from '../services/favorite.service';
import { ShopCard } from '../components/ShopCard';
import type { Shop } from '../types/shop';
import type { Review } from '../api/review.service';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { toast } from 'react-hot-toast';
import { getApiError } from '../utils/storage';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { reviewService } from '../api/review.service';
import { ReviewModal } from '../components/ReviewModal';

type TabType = 'appointments' | 'account' | 'favorites' | 'reviews' | 'security';

interface AccordionSection { id: TabType; label: string; icon: React.ReactNode; }
const sections: AccordionSection[] = [
    { id: 'appointments', label: 'Randevularım', icon: <Calendar className="h-5 w-5" /> },
    { id: 'account', label: 'Hesap Bilgileri', icon: <User className="h-5 w-5" /> },
    { id: 'favorites', label: 'Favorilerim', icon: <Heart className="h-5 w-5" /> },
    { id: 'reviews', label: 'Yorumlarım', icon: <MessageSquare className="h-5 w-5" /> },
    { id: 'security', label: 'Güvenlik', icon: <Lock className="h-5 w-5" /> },
];

const ConfirmModal: React.FC<{
    title: string; message: string; confirmLabel: string;
    onConfirm: () => void; onCancel: () => void;
}> = ({ title, message, confirmLabel, onConfirm, onCancel }) =>
    createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-gray-600 text-sm mb-6">{message}</p>
                <div className="flex gap-3 justify-end">
                    <button onClick={onCancel} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg">İptal</button>
                    <button onClick={onConfirm} className="px-4 py-2 text-sm font-semibold rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors">{confirmLabel}</button>
                </div>
            </div>
        </div>,
        document.body
    );

const ResultModal: React.FC<{
    type: 'success' | 'error';
    message: string;
    onClose: () => void;
}> = ({ type, message, onClose }) =>
    createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center">
                <div className={`mx-auto w-14 h-14 rounded-full flex items-center justify-center mb-4 ${type === 'success' ? 'bg-green-100' : 'bg-red-100'}`}>
                    {type === 'success'
                        ? <CheckCircle className="h-7 w-7 text-green-600" />
                        : <XCircle className="h-7 w-7 text-red-600" />
                    }
                </div>
                <h3 className={`text-lg font-bold mb-2 ${type === 'success' ? 'text-green-800' : 'text-red-800'}`}>
                    {type === 'success' ? 'Başarılı' : 'Hata'}
                </h3>
                <p className="text-gray-600 text-sm mb-6 leading-relaxed">{message}</p>
                <button
                    onClick={onClose}
                    className={`w-full px-4 py-2.5 text-sm font-semibold rounded-lg text-white transition-colors ${type === 'success' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
                >
                    Tamam
                </button>
            </div>
        </div>,
        document.body
    );

export const ProfilePage: React.FC = () => {
    const { user, logout, updateAuthorization } = useAuth();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = (searchParams.get('tab') as TabType | null);
    const [openSection, setOpenSection] = useState<TabType | null>(activeTab || null);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [resultModal, setResultModal] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const showResult = (type: 'success' | 'error', message: string) => setResultModal({ type, message });
    const [reviewToDelete, setReviewToDelete] = useState<string | null>(null);
    const [appointmentToCancel, setAppointmentToCancel] = useState<AppointmentDto | null>(null);
    const [cancelReason, setCancelReason] = useState('');
    const [openGroups, setOpenGroups] = useState<Set<string>>(new Set<string>());

    const toggle = (id: TabType) => {
        const next = openSection === id ? null : id;
        setOpenSection(next);
        if (next) setSearchParams({ tab: next }); else setSearchParams({});
    };

    const toggleGroup = (group: string) => setOpenGroups(prev => {
        const next = new Set(prev);
        if (next.has(group)) next.delete(group); else next.add(group);
        return next;
    });

    const hasRole = (r: string) => Array.isArray(user?.role) ? user!.role.includes(r) : user?.role === r;
    const isSalonRelated = hasRole('SalonOwner') || hasRole('Employee');
    const salonPanelPath = hasRole('SalonOwner') ? '/salon-panel' : '/salon-panel/employee-appointments';
    const roleLabel = hasRole('SalonOwner') ? 'İşletme Sahibi' : hasRole('Employee') ? 'Personel' : 'Müşteri';

    // Form State
    const [appointments, setAppointments] = useState<AppointmentDto[]>([]);
    const [appointmentsLoading, setAppointmentsLoading] = useState(false);
    const [firstName, setFirstName] = useState(user?.firstName || '');
    const [lastName, setLastName] = useState(user?.lastName || '');
    const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
    const [email, setEmail] = useState(user?.email || '');
    const [updatingProfile, setUpdatingProfile] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [favorites, setFavorites] = useState<Shop[]>([]);
    const [favLoading, setFavLoading] = useState(false);
    const [myReviews, setMyReviews] = useState<Review[]>([]);
    const [reviewsLoading, setReviewsLoading] = useState(false);
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState<AppointmentDto | null>(null);
    const [selectedReview, setSelectedReview] = useState<Review | null>(null);

    useEffect(() => {
        if (user) { 
            setFirstName(user.firstName); 
            setLastName(user.lastName); 
            setPhoneNumber(user.phoneNumber || ''); 
            setEmail(user.email || '');
        }
    }, [user]);

    useEffect(() => {
        if (openSection === 'appointments') loadAppointments();
        else if (openSection === 'favorites') loadFavorites();
        else if (openSection === 'reviews') loadReviews();
    }, [openSection]);

    const loadAppointments = async () => { setAppointmentsLoading(true); try { const result = await appointmentService.getMyAppointments(1, 50); setAppointments(result.items); } catch (err) { toast.error(getApiError(err, 'Randevular yüklenemedi.')); } finally { setAppointmentsLoading(false); } };

    const loadFavorites = async () => { setFavLoading(true); try { setFavorites(await favoriteService.getUserFavorites()); } catch (err) { toast.error(getApiError(err, 'Favoriler yüklenemedi.')); } finally { setFavLoading(false); } };

    const loadReviews = async () => { setReviewsLoading(true); try { setMyReviews(await reviewService.getMyReviews()); } catch (err) { toast.error(getApiError(err, 'Yorumlar yüklenemedi.')); } finally { setReviewsLoading(false); } };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!/^05\d{9}$/.test(phoneNumber)) { showResult('error', 'Telefon numarası 05XXXXXXXXX formatında olmalıdır.'); return; }
        setUpdatingProfile(true);
        try {
            const updatedUser = await authService.updateProfile({ firstName, lastName, phoneNumber, email });
            updateAuthorization(updatedUser);
            showResult('success', 'Profil bilgileriniz başarıyla güncellendi.');
        }
        catch (err: any) { showResult('error', getApiError(err, 'Profil güncellenemedi.')); }
        finally { setUpdatingProfile(false); }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadingImage(true);
        try {
            const { imageUrl } = await authService.updateProfileImage(file);
            updateAuthorization({ ...user!, profileImageUrl: imageUrl } as any);
            showResult('success', 'Profil fotoğrafınız başarıyla güncellendi.');
        } catch (err) {
            showResult('error', getApiError(err, 'Fotoğraf yüklenemedi.'));
        } finally {
            setUploadingImage(false);
        }
    };

    const handleDeleteImage = async () => {
        try {
            await authService.deleteProfileImage();
            updateAuthorization({ ...user!, profileImageUrl: undefined } as any);
            showResult('success', 'Profil fotoğrafınız silindi.');
        } catch (err) {
            showResult('error', getApiError(err, 'Fotoğraf silinemedi.'));
        }
    };



    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) { showResult('error', 'Yeni şifreler birbiriyle eşleşmiyor.'); return; }
        try {
            await authService.changePassword({ currentPassword, newPassword, confirmPassword });
            showResult('success', 'Şifreniz başarıyla değiştirildi.');
            setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
        }
        catch (err: any) { showResult('error', getApiError(err, 'Şifre değiştirilemedi.')); }
    };

    const handleDeleteAccount = async () => {
        try { await authService.deleteAccount(); logout(); navigate('/'); }
        catch (err) { showResult('error', getApiError(err, 'Hesap silinemedi.')); }
    };

    const handleReviewSubmit = async (rating: number, comment: string, newImages: File[], deletedImageUrls: string[]) => {
        try {
            if (selectedReview) {
                await reviewService.updateReview(selectedReview.id, { id: selectedReview.id, rating, comment, newImages, deletedImageUrls });
                showResult('success', 'Değerlendirmeniz başarıyla güncellendi.');
            } else if (selectedAppointment) {
                await reviewService.addReview({ appointmentId: selectedAppointment.id, rating, comment, images: newImages });
                showResult('success', 'Değerlendirmeniz başarıyla gönderildi.');
            }
            if (openSection === 'reviews') loadReviews();
            if (openSection === 'appointments') loadAppointments();
        }
        catch (err) { showResult('error', getApiError(err, 'Değerlendirme gönderilemedi.')); }
        finally { setSelectedReview(null); setSelectedAppointment(null); setIsReviewModalOpen(false); }
    };

    const handleDeleteReview = async (id: string) => {
        setReviewToDelete(id);
    };

    const confirmDeleteReview = async () => {
        if (!reviewToDelete) return;
        try {
            await reviewService.deleteReview(reviewToDelete);
            loadReviews();
            showResult('success', 'Yorumunuz başarıyla silindi.');
        } catch (err) {
            showResult('error', getApiError(err, 'Yorum silinemedi.'));
        } finally {
            setReviewToDelete(null);
        }
    };

    const confirmCancelAppointment = async () => {
        if (!appointmentToCancel) return;
        try {
            await appointmentService.cancelAppointment(appointmentToCancel.id, cancelReason);
            loadAppointments();
            showResult('success', 'Randevunuz başarıyla iptal edildi.');
        } catch (err) {
            showResult('error', getApiError(err, 'Randevu iptal edilemedi.'));
        } finally {
            setAppointmentToCancel(null);
            setCancelReason('');
        }
    };

    const getStatusBadge = (status: number) => {
        const map: Record<number, React.ReactNode> = {
            0: <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1"><Clock className="h-3 w-3" /> Onay Bekliyor</span>,
            1: <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Onaylandı</span>,
            2: <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Tamamlandı</span>,
            3: <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1"><AlertCircle className="h-3 w-3" /> İptal Edildi</span>,
            4: <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1"><XCircle className="h-3 w-3" /> Reddedildi</span>,
        };
        return map[status] ?? null;
    };

    const pendingApps = appointments.filter(a => a.status === 0);
    const upcomingApps = appointments.filter(a => a.status === 1);
    const completedApps = appointments.filter(a => a.status === 2);
    const cancelledApps = appointments.filter(a => a.status === 3 || a.status === 4);
    const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Kullanıcı';

    const inputCls = "block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none";

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Profile Header Card */}
            <div className="bg-white border-b border-gray-200 shadow-sm relative overflow-hidden">
                {/* Decorative background element for premium feel */}
                <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-primary-600/5 to-secondary-600/5 -z-10" />
                
                <div className="max-w-2xl mx-auto px-4 pt-10 pb-8">
                    <div className="flex flex-col items-center text-center">
                        {/* Avatar Section */}
                        <div className="relative mb-6">
                            <div className="h-32 w-32 bg-gradient-to-br from-white to-gray-50 rounded-full flex items-center justify-center text-primary-700 flex-shrink-0 text-4xl font-black overflow-hidden border-4 border-white shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] ring-1 ring-gray-100">
                                {user?.profileImageUrl ? (
                                    <img 
                                        src={user.profileImageUrl} 
                                        alt={fullName} 
                                        className="h-full w-full object-cover transition-all duration-700 hover:scale-105"
                                        style={{ imageRendering: 'auto' }}
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = ''; 
                                        }}
                                    />
                                ) : (
                                    <span className="uppercase text-gray-400 font-light">{user?.firstName?.charAt(0) || 'K'}</span>
                                )}
                                {uploadingImage && (
                                    <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center z-10">
                                        <div className="animate-spin rounded-full h-8 w-8 border-[3px] border-primary-600 border-t-transparent" />
                                    </div>
                                )}
                            </div>
                            <label className="absolute bottom-1 right-1 bg-primary-600 shadow-xl rounded-full p-2.5 cursor-pointer hover:bg-primary-700 border-2 border-white transition-all hover:scale-110 active:scale-95 z-20 group">
                                <Camera className="h-5 w-5 text-white" />
                                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploadingImage} />
                            </label>
                        </div>

                        {/* Info Section */}
                        <div className="space-y-4 w-full">
                            <div className="space-y-1">
                                <h1 className="text-3xl font-black text-gray-900 tracking-tight leading-tight">{fullName}</h1>
                                
                                <div className="flex flex-wrap items-center justify-center gap-2">
                                    {user?.phoneNumber && (
                                        <div className="inline-flex items-center gap-1.5 text-gray-600 font-bold text-sm bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
                                            {user.phoneNumber}
                                        </div>
                                    )}
                                    <div className="inline-flex items-center gap-1.5 text-sm bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
                                        {user?.email
                                            ? <span className="text-gray-500 font-medium">{user.email}</span>
                                            : <span className="text-gray-400 italic text-xs">Mail adresi yok</span>
                                        }
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                                <div className="px-4 py-1.5 bg-gray-900 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-md">
                                    {roleLabel}
                                </div>
                                {isSalonRelated ? (
                                    <button
                                        onClick={() => navigate(salonPanelPath)}
                                        className="flex items-center gap-1.5 px-4 py-1.5 bg-primary-50 hover:bg-primary-100 text-primary-700 text-[10px] font-black uppercase tracking-widest rounded-full border border-primary-200 transition-colors"
                                    >
                                        <Store className="h-3 w-3" />
                                        Salonuma Git
                                        <ChevronRight className="h-3 w-3" />
                                    </button>
                                ) : (
                                    <div className="px-4 py-1.5 bg-white text-green-600 rounded-full text-[10px] font-black uppercase tracking-widest border-2 border-green-500 shadow-sm flex items-center gap-2">
                                        <span className="relative flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                        </span>
                                        Aktif Profil
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Accordion List */}
            <div className="max-w-2xl mx-auto px-4 py-4 space-y-2">
                {sections.map(section => (
                    <div key={section.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        {/* Section Header Row */}
                        <button
                            onClick={() => toggle(section.id)}
                            className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <span className={openSection === section.id ? 'text-primary-600' : 'text-gray-500'}>{section.icon}</span>
                                <span className={`font-medium text-sm ${openSection === section.id ? 'text-primary-700' : 'text-gray-800'}`}>{section.label}</span>
                            </div>
                            <ChevronRight className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${openSection === section.id ? 'rotate-90' : ''}`} />
                        </button>

                        {/* Section Content */}
                        {openSection === section.id && (
                            <div className="border-t border-gray-100 px-5 py-5">

                                {/* ── APPOINTMENTS ── */}
                                {section.id === 'appointments' && (
                                    <div className="space-y-3">
                                        {appointmentsLoading && (
                                            <div className="flex justify-center py-8">
                                                <svg className="animate-spin w-6 h-6 text-primary-500" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                                </svg>
                                            </div>
                                        )}
                                        {!appointmentsLoading && appointments.length === 0 && (
                                            <p className="text-sm text-gray-400 text-center py-6">Henüz randevunuz bulunmuyor.</p>
                                        )}
                                        {pendingApps.length > 0 && (
                                            <div className="border border-yellow-200 rounded-xl overflow-hidden">
                                                <button onClick={() => toggleGroup('pending')} className="w-full flex items-center justify-between px-4 py-3 bg-yellow-50 hover:bg-yellow-100 transition-colors">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-bold text-yellow-700 uppercase tracking-wider">Onay Bekliyor</span>
                                                        <span className="text-xs bg-yellow-200 text-yellow-800 rounded-full px-2 py-0.5 font-semibold">{pendingApps.length}</span>
                                                    </div>
                                                    <ChevronRight className={`h-4 w-4 text-yellow-600 transition-transform duration-200 ${openGroups.has('pending') ? 'rotate-90' : ''}`} />
                                                </button>
                                                {openGroups.has('pending') && (
                                                    <div className="p-2 space-y-2">
                                                        {pendingApps.map(app => <AppCard key={app.id} app={app} badge={getStatusBadge(app.status)} onCancel={() => setAppointmentToCancel(app)} />)}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        {upcomingApps.length > 0 && (
                                            <div className="border border-green-200 rounded-xl overflow-hidden">
                                                <button onClick={() => toggleGroup('upcoming')} className="w-full flex items-center justify-between px-4 py-3 bg-green-50 hover:bg-green-100 transition-colors">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-bold text-green-700 uppercase tracking-wider">Gelecek</span>
                                                        <span className="text-xs bg-green-200 text-green-800 rounded-full px-2 py-0.5 font-semibold">{upcomingApps.length}</span>
                                                    </div>
                                                    <ChevronRight className={`h-4 w-4 text-green-600 transition-transform duration-200 ${openGroups.has('upcoming') ? 'rotate-90' : ''}`} />
                                                </button>
                                                {openGroups.has('upcoming') && (
                                                    <div className="p-2 space-y-2">
                                                        {upcomingApps.map(app => <AppCard key={app.id} app={app} badge={getStatusBadge(app.status)} onCancel={() => setAppointmentToCancel(app)} onReview={!app.hasReview && app.status === 2 ? () => { setSelectedAppointment(app); setIsReviewModalOpen(true); } : undefined} />)}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        <div className="border border-gray-200 rounded-xl overflow-hidden">
                                            <button onClick={() => toggleGroup('completed')} className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Geçmiş</span>
                                                    {completedApps.length > 0 && <span className="text-xs bg-gray-200 text-gray-700 rounded-full px-2 py-0.5 font-semibold">{completedApps.length}</span>}
                                                </div>
                                                <ChevronRight className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${openGroups.has('completed') ? 'rotate-90' : ''}`} />
                                            </button>
                                            {openGroups.has('completed') && (
                                                <div className="p-2 space-y-2">
                                                    {completedApps.length > 0
                                                        ? completedApps.map((app: AppointmentDto) => <AppCard key={app.id} app={app} badge={getStatusBadge(app.status)} onReview={!app.hasReview ? () => { setSelectedAppointment(app); setIsReviewModalOpen(true); } : undefined} />)
                                                        : <p className="text-sm text-gray-400 text-center py-4">Tamamlanmış randevu bulunmuyor.</p>
                                                    }
                                                </div>
                                            )}
                                        </div>
                                        {cancelledApps.length > 0 && (
                                            <div className="border border-red-200 rounded-xl overflow-hidden">
                                                <button onClick={() => toggleGroup('cancelled')} className="w-full flex items-center justify-between px-4 py-3 bg-red-50 hover:bg-red-100 transition-colors">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-bold text-red-700 uppercase tracking-wider">İptal / Reddedilen</span>
                                                        <span className="text-xs bg-red-200 text-red-800 rounded-full px-2 py-0.5 font-semibold">{cancelledApps.length}</span>
                                                    </div>
                                                    <ChevronRight className={`h-4 w-4 text-red-500 transition-transform duration-200 ${openGroups.has('cancelled') ? 'rotate-90' : ''}`} />
                                                </button>
                                                {openGroups.has('cancelled') && (
                                                    <div className="p-2 space-y-2">
                                                        {cancelledApps.map((app: AppointmentDto) => <AppCard key={app.id} app={app} badge={getStatusBadge(app.status)} />)}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* ── ACCOUNT ── */}
                                {section.id === 'account' && (
                                    <form onSubmit={handleUpdateProfile} className="space-y-4">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600 mb-1">Ad</label>
                                                <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} className={inputCls} required />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600 mb-1">Soyad</label>
                                                <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} className={inputCls} required />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1">Telefon</label>
                                            <input type="tel" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 11))} className={inputCls} placeholder="05XXXXXXXXX" maxLength={11} required />
                                            <p className="text-xs text-gray-400 mt-1">Format: 05XXXXXXXXX</p>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1">E-posta (Opsiyonel)</label>
                                            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className={inputCls} placeholder="ornek@mail.com" />
                                        </div>
                                        {user?.profileImageUrl && (
                                            <button type="button" onClick={handleDeleteImage} className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1">
                                                <Trash2 className="h-3 w-3" /> Profil Fotoğrafını Sil
                                            </button>
                                        )}
                                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pt-1">
                                            <Button type="submit" disabled={updatingProfile} className="w-full sm:w-auto">
                                                {updatingProfile ? 'Kaydediliyor...' : 'Kaydet'}
                                            </Button>
                                            <button type="button" onClick={() => setShowDeleteConfirm(true)}
                                                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors">
                                                <Trash2 className="h-4 w-4" /> Hesabımı Sil
                                            </button>
                                        </div>
                                    </form>
                                )}

                                {/* ── FAVORITES ── */}
                                {section.id === 'favorites' && (
                                    favLoading ? <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>
                                    : favorites.length > 0 ? <div className="grid grid-cols-1 gap-4">{favorites.map(shop => <ShopCard key={shop.id} shop={shop} initialIsFavorite={true} onToggleFavorite={s => { if (!s) setFavorites(favorites.filter(f => f.id !== shop.id)); }} />)}</div>
                                : <div className="text-center py-8"><Heart className="h-10 w-10 text-gray-300 mx-auto mb-2" /><p className="text-gray-500 text-sm">Favori salon eklemediniz.</p><Button className="mt-4" onClick={() => navigate('/')}>Salonları Keşfet</Button></div>
                                )}

                                {/* ── REVIEWS ── */}
                                {section.id === 'reviews' && (
                                    reviewsLoading ? <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>
                                    : myReviews.length > 0 ? (
                                        <div className="space-y-4">
                                            {myReviews.map(review => (
                                                <div key={review.id} className="border border-gray-100 rounded-xl p-4 bg-gray-50/50">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div className="cursor-pointer group" onClick={() => navigate(`/shop/${review.shopId}?tab=reviews`)}>
                                                            <h4 className="font-bold text-sm text-gray-900 group-hover:text-primary-600 transition-colors">{review.shopName}</h4>
                                                            <p className="text-xs text-gray-500">{review.serviceName} • {review.employeeName}</p>
                                                            <p className="text-[10px] text-gray-400 mt-0.5">{format(new Date(review.appointmentDate), 'd MMMM yyyy', { locale: tr })}</p>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <button onClick={() => { setSelectedReview(review); setIsReviewModalOpen(true); }} className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-white rounded-lg transition-all shadow-sm"><Edit2 className="h-3.5 w-3.5" /></button>
                                                            <button onClick={() => handleDeleteReview(review.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-white rounded-lg transition-all shadow-sm"><Trash2 className="h-3.5 w-3.5" /></button>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1 mb-2">
                                                        {[...Array(5)].map((_, i) => (
                                                            <span key={i} className={`h-3 w-3 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}>★</span>
                                                        ))}
                                                    </div>
                                                    {review.comment && <p className="text-sm text-gray-700 leading-relaxed italic">"{review.comment}"</p>}
                                                    {review.imageUrls && review.imageUrls.length > 0 && (
                                                        <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                                                            {review.imageUrls.map((url, i) => (
                                                                <img key={i} src={url} alt="review" className="h-16 w-16 object-cover rounded-lg flex-shrink-0 border border-gray-200" />
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )
                                    : <div className="text-center py-8"><MessageSquare className="h-10 w-10 text-gray-300 mx-auto mb-2" /><p className="text-gray-500 text-sm">Henüz bir değerlendirme yapmadınız.</p></div>
                                )}



                                {/* ── SECURITY ── */}
                                {section.id === 'security' && (
                                    <form onSubmit={handleChangePassword} className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1">Mevcut Şifre</label>
                                            <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className={inputCls} required />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1">Yeni Şifre</label>
                                            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className={inputCls} required minLength={6} />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1">Yeni Şifre (Tekrar)</label>
                                            <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className={inputCls} required minLength={6} />
                                        </div>
                                        <Button type="submit" className="w-full sm:w-auto">Şifreyi Değiştir</Button>
                                    </form>
                                )}
                            </div>
                        )}
                    </div>
                ))}

                {/* Salon / Employee Panel Link */}
                {isSalonRelated && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <button
                            onClick={() => navigate(salonPanelPath)}
                            className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
                        >
                            <div className="flex items-center gap-3"><Store className="h-5 w-5 text-gray-500" /><span className="font-medium text-sm text-gray-800">Salonuma Git</span></div>
                            <ChevronRight className="h-4 w-4 text-gray-400" />
                        </button>
                    </div>
                )}

                {/* Logout */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <button onClick={() => setShowLogoutConfirm(true)} className="w-full flex items-center gap-3 px-5 py-4 hover:bg-red-50 transition-colors text-red-600">
                        <LogOut className="h-5 w-5" />
                        <span className="font-medium text-sm">Çıkış Yap</span>
                    </button>
                </div>
            </div>



            {/* Logout Confirm */}
            {showLogoutConfirm && (
                <ConfirmModal
                    title="Çıkış Yap"
                    message="Hesabınızdan çıkış yapmak istediğinize emin misiniz?"
                    confirmLabel="Evet, Çıkış Yap"
                    onConfirm={() => { logout(); navigate('/login'); }}
                    onCancel={() => setShowLogoutConfirm(false)}
                />
            )}

            {/* Delete Account Confirm */}
            {showDeleteConfirm && (
                <ConfirmModal
                    title="Hesabı Sil"
                    message="Hesabınızı kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz ve tüm verileriniz silinir."
                    confirmLabel="Evet, Hesabımı Sil"
                    onConfirm={() => { setShowDeleteConfirm(false); handleDeleteAccount(); }}
                    onCancel={() => setShowDeleteConfirm(false)}
                />
            )}

            {/* Result Modal */}
            {resultModal && (
                <ResultModal
                    type={resultModal.type}
                    message={resultModal.message}
                    onClose={() => setResultModal(null)}
                />
            )}

            {/* Delete Review Confirm */}
            {reviewToDelete && (
                <ConfirmModal
                    title="Yorumu Sil"
                    message="Bu değerlendirmeyi kalıcı olarak silmek istediğinize emin misiniz?"
                    confirmLabel="Evet, Yorumu Sil"
                    onConfirm={confirmDeleteReview}
                    onCancel={() => setReviewToDelete(null)}
                />
            )}

            {/* Cancel Appointment Confirm */}
            {appointmentToCancel && createPortal(
                <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/50">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Randevu İptali</h3>
                        <p className="text-gray-600 text-sm mb-4">Bu randevuyu iptal etmek istediğinize emin misiniz? Bu işlem geri alınamaz.</p>
                        
                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4 flex gap-2 text-orange-800">
                            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                            <p className="text-xs font-medium">Randevuya {appointmentToCancel.shopCancellationHours} saatten az süre kaldıysa iptal işlemi gerçekleştirilemez.</p>
                        </div>

                        <div className="mb-6">
                            <label className="block text-xs font-medium text-gray-700 mb-1">İptal Sebebi (Opsiyonel)</label>
                            <textarea 
                                value={cancelReason}
                                onChange={(e) => setCancelReason(e.target.value)}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
                                rows={3}
                                placeholder="İptal sebebinizi belirtebilirsiniz..."
                            />
                        </div>

                        <div className="flex gap-3 justify-end">
                            <button onClick={() => { setAppointmentToCancel(null); setCancelReason(''); }} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg">Vazgeç</button>
                            <button onClick={confirmCancelAppointment} className="px-4 py-2 text-sm font-semibold rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors">Evet, İptal Et</button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {selectedAppointment && (
                <ReviewModal
                    isOpen={isReviewModalOpen && !selectedReview}
                    onClose={() => { setIsReviewModalOpen(false); setSelectedAppointment(null); }}
                    onSubmit={handleReviewSubmit}
                    shopName={selectedAppointment.shopName}
                    employeeName={selectedAppointment.employeeName}
                />
            )}

            {selectedReview && (
                <ReviewModal
                    isOpen={isReviewModalOpen}
                    onClose={() => { setIsReviewModalOpen(false); setSelectedReview(null); }}
                    onSubmit={handleReviewSubmit}
                    shopName={selectedReview.shopName}
                    employeeName={selectedReview.employeeName}
                    initialData={{
                        rating: selectedReview.rating,
                        comment: selectedReview.comment || '',
                        imageUrls: selectedReview.imageUrls || []
                    }}
                />
            )}
        </div>
    );
};

const AppCard: React.FC<{ app: AppointmentDto; badge: React.ReactNode; onReview?: () => void; onCancel?: () => void }> = ({ app, badge, onReview, onCancel }) => {
    const [isOpen, setIsOpen] = useState(false);
    const now = new Date().getTime();
    const startMs = new Date(app.startTime).getTime();
    const isPast = startMs < now;
    const isCancelDisabled = (startMs - now) < app.shopCancellationHours * 60 * 60 * 1000;
    const cancelBlockReason = isPast
        ? 'Randevu saati geçtiği için sistem üzerinden iptal yapılamaz.'
        : `Randevuya ${app.shopCancellationHours} saatten az kaldığı için sistem üzerinden iptal yapılamaz.`;

    return (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center gap-3 px-3 py-3 hover:bg-gray-50 transition-colors text-left"
            >
                <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-900 truncate">{app.shopName}</p>
                    <div className="flex flex-wrap gap-2 mt-0.5 text-xs text-gray-400">
                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{format(new Date(app.startTime), 'd MMM yyyy', { locale: tr })}</span>
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{format(new Date(app.startTime), 'HH:mm')} - {format(new Date(app.endTime), 'HH:mm')}</span>
                    </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    {badge}
                    <ChevronRight className={`h-4 w-4 text-gray-400 transition-transform duration-200 flex-shrink-0 ${isOpen ? 'rotate-90' : ''}`} />
                </div>
            </button>
            {isOpen && (
                <div className="border-t border-gray-100 px-3 py-3 bg-gray-50/50 space-y-3">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-800">{app.serviceName}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{app.employeeName} • {app.duration} dk</p>
                        </div>
                        <span className="font-bold text-sm text-gray-900">₺{app.price}</span>
                    </div>
                    {(onCancel || onReview) && (
                        <div className="space-y-2 pt-1">
                            {onCancel && isCancelDisabled && (
                                <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-2.5">
                                    <AlertCircle className="h-3.5 w-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-xs font-medium text-amber-800">{cancelBlockReason}</p>
                                        <p className="text-xs text-amber-700 mt-0.5">Değişiklik için işletme ile iletişime geçebilirsiniz.</p>
                                    </div>
                                </div>
                            )}
                            <div className="flex gap-2">
                                {onCancel && !isCancelDisabled && (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={e => { e.stopPropagation(); onCancel(); }}
                                        className="text-xs text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                                    >
                                        İptal Et
                                    </Button>
                                )}
                                {onReview && (
                                    <Button size="sm" variant="outline" onClick={e => { e.stopPropagation(); onReview(); }} className="text-xs">
                                        Değerlendir
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
