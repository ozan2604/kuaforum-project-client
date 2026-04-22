import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../context/AuthContext';
import { appointmentService } from '../api/appointment.service';
import { authService } from '../api/auth.service';
import type { AppointmentDto } from '../types/appointment';

import { Button } from '../components/Button';
import { Calendar, User, LogOut, CheckCircle, Clock, XCircle, AlertCircle, Trash2, MapPin, Lock, Plus, Heart, ChevronRight, Briefcase } from 'lucide-react';
import { favoriteService } from '../services/favorite.service';
import { ShopCard } from '../components/ShopCard';
import type { Shop } from '../types/shop';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { toast } from 'react-hot-toast';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { reviewService } from '../api/review.service';
import { ReviewModal } from '../components/ReviewModal';

type TabType = 'appointments' | 'account' | 'favorites' | 'addresses' | 'security';

interface AccordionSection { id: TabType; label: string; icon: React.ReactNode; }
const sections: AccordionSection[] = [
    { id: 'appointments', label: 'Randevularım', icon: <Calendar className="h-5 w-5" /> },
    { id: 'account', label: 'Hesap Bilgileri', icon: <User className="h-5 w-5" /> },
    { id: 'favorites', label: 'Favorilerim', icon: <Heart className="h-5 w-5" /> },

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

export const ProfilePage: React.FC = () => {
    const { user, logout, updateAuthorization } = useAuth();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = (searchParams.get('tab') as TabType | null);
    const [openSection, setOpenSection] = useState<TabType | null>(activeTab || 'appointments');
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const toggle = (id: TabType) => {
        const next = openSection === id ? null : id;
        setOpenSection(next);
        if (next) setSearchParams({ tab: next }); else setSearchParams({});
    };

    // Form State
    const [appointments, setAppointments] = useState<AppointmentDto[]>([]);
    const [firstName, setFirstName] = useState(user?.firstName || '');
    const [lastName, setLastName] = useState(user?.lastName || '');
    const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
    const [updatingProfile, setUpdatingProfile] = useState(false);

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [favorites, setFavorites] = useState<Shop[]>([]);
    const [favLoading, setFavLoading] = useState(false);
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState<AppointmentDto | null>(null);

    useEffect(() => {
        if (user) { setFirstName(user.firstName); setLastName(user.lastName); setPhoneNumber(user.phoneNumber || ''); }
    }, [user]);

    useEffect(() => {
        if (openSection === 'appointments') loadAppointments();

        else if (openSection === 'favorites') loadFavorites();
    }, [openSection]);

    const loadAppointments = async () => { try { setAppointments(await appointmentService.getMyAppointments()); } catch { toast.error('Randevular yüklenemedi.'); } };

    const loadFavorites = async () => { setFavLoading(true); try { setFavorites(await favoriteService.getUserFavorites()); } catch { toast.error('Favoriler yüklenemedi.'); } finally { setFavLoading(false); } };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!/^05\d{9}$/.test(phoneNumber)) { toast.error('Telefon numarası 05XXXXXXXXX formatında olmalıdır.'); return; }
        setUpdatingProfile(true);
        try { updateAuthorization(await authService.updateProfile({ firstName, lastName, phoneNumber, email: user?.email || '' })); toast.success('Profil güncellendi.'); }
        catch (err: any) { toast.error(err.response?.data?.Message || 'Güncelleme başarısız.'); }
        finally { setUpdatingProfile(false); }
    };



    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) { toast.error('Şifreler eşleşmiyor.'); return; }
        try { await authService.changePassword({ currentPassword, newPassword, confirmPassword }); toast.success('Şifre değiştirildi.'); setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); }
        catch (err: any) { const m = err.response?.data || err.message; toast.error(typeof m === 'string' ? m : 'Hata oluştu.'); }
    };

    const handleDeleteAccount = async () => {
        try { await authService.deleteAccount(); toast.success('Hesabınız silindi.'); logout(); navigate('/'); }
        catch { toast.error('Hesap silinemedi.'); }
    };

    const handleReviewSubmit = async (rating: number, comment: string, newImages: File[], _: string[]) => {
        if (!selectedAppointment) return;
        try { await reviewService.addReview({ appointmentId: selectedAppointment.id, rating, comment, images: newImages }); await loadAppointments(); }
        catch { toast.error('Değerlendirme gönderilemedi.'); }
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
    const pastApps = appointments.filter(a => [2, 3, 4].includes(a.status));
    const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Kullanıcı';

    const inputCls = "block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none";

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Profile Header Card */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-2xl mx-auto px-4 py-6 flex items-center gap-4">
                    <div className="h-14 w-14 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 flex-shrink-0 text-xl font-bold">
                        {user?.firstName?.charAt(0) || <User className="h-6 w-6" />}
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-gray-900">{fullName}</h1>
                        <p className="text-sm text-gray-500">{user?.phoneNumber || ''}</p>
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
                                    <div className="space-y-4">
                                        {pendingApps.length > 0 && (
                                            <div>
                                                <p className="text-xs font-semibold text-yellow-700 uppercase tracking-wider mb-2">Onay Bekliyor</p>
                                                <div className="space-y-2">{pendingApps.map(app => <AppCard key={app.id} app={app} badge={getStatusBadge(app.status)} />)}</div>
                                            </div>
                                        )}
                                        {upcomingApps.length > 0 && (
                                            <div>
                                                <p className="text-xs font-semibold text-green-700 uppercase tracking-wider mb-2">Gelecek</p>
                                                <div className="space-y-2">{upcomingApps.map(app => <AppCard key={app.id} app={app} badge={getStatusBadge(app.status)} onReview={!app.hasReview && app.status === 2 ? () => { setSelectedAppointment(app); setIsReviewModalOpen(true); } : undefined} />)}</div>
                                            </div>
                                        )}
                                        <div>
                                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Geçmiş</p>
                                            {pastApps.length > 0 ? <div className="space-y-2">{pastApps.map(app => <AppCard key={app.id} app={app} badge={getStatusBadge(app.status)} onReview={!app.hasReview && app.status === 2 ? () => { setSelectedAppointment(app); setIsReviewModalOpen(true); } : undefined} />)}</div> : <p className="text-sm text-gray-400 text-center py-4">Geçmiş randevu bulunmuyor.</p>}
                                        </div>
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

                {/* Employee Panel Link */}
                {user?.role === 'Employee' && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <button onClick={() => navigate('/employee-panel/appointments')} className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors">
                            <div className="flex items-center gap-3"><Briefcase className="h-5 w-5 text-gray-500" /><span className="font-medium text-sm text-gray-800">Personel Paneli</span></div>
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

            {selectedAppointment && (
                <ReviewModal
                    isOpen={isReviewModalOpen}
                    onClose={() => setIsReviewModalOpen(false)}
                    onSubmit={handleReviewSubmit}
                    shopName={selectedAppointment.shopName}
                    employeeName={selectedAppointment.employeeName}
                />
            )}
        </div>
    );
};

const AppCard: React.FC<{ app: AppointmentDto; badge: React.ReactNode; onReview?: () => void }> = ({ app, badge, onReview }) => (
    <div className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors">
        <div className="flex flex-col sm:flex-row justify-between gap-2">
            <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-gray-900 truncate">{app.shopName}</p>
                <p className="text-xs text-gray-600">{app.serviceName} — {app.employeeName}</p>
                <div className="flex flex-wrap gap-2 mt-1 text-xs text-gray-400">
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{format(new Date(app.startTime), 'd MMM yyyy', { locale: tr })}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{format(new Date(app.startTime), 'HH:mm')}</span>
                </div>
            </div>
            <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 flex-shrink-0">
                {badge}
                <span className="font-bold text-sm text-gray-900">₺{app.price}</span>
                {onReview && <Button size="sm" variant="outline" onClick={onReview} className="text-xs">Değerlendir</Button>}
            </div>
        </div>
    </div>
);
