import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { salonApplicationService } from '../../api/salon-application.service';
import { Check, X, Building2, Phone, Mail, Calendar, User, Search, MapPin } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useSearchParams } from 'react-router-dom';

interface SalonApplication {
    id: string;
    userId: string;
    shopName: string;
    description: string;
    userName: string;
    phoneNumber?: string;
    contactEmail?: string;
    city?: string;
    district?: string;
    createdAt: string;
    status: number;
}

type ActionType = 'approve' | 'reject';

interface ConfirmState {
    open: boolean;
    type: ActionType;
    appId: string;
    shopName: string;
}

const ConfirmModal: React.FC<{
    state: ConfirmState;
    loading: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}> = ({ state, loading, onConfirm, onCancel }) => {
    const isApprove = state.type === 'approve';
    return createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${isApprove ? 'bg-green-100' : 'bg-red-100'}`}>
                    {isApprove
                        ? <Check className="h-6 w-6 text-green-600" />
                        : <X className="h-6 w-6 text-red-600" />
                    }
                </div>
                <h3 className="text-lg font-bold text-gray-900 text-center mb-2">
                    {isApprove ? 'Başvuruyu Onayla' : 'Başvuruyu Reddet'}
                </h3>
                <p className="text-gray-500 text-sm text-center mb-1">
                    <span className="font-semibold text-gray-800">{state.shopName}</span>
                </p>
                <p className="text-gray-500 text-sm text-center mb-6">
                    {isApprove
                        ? 'Bu salon başvurusunu onaylayacaksınız. Kullanıcı Salon Sahibi rolüne atanacak ve dükkanı oluşturulacaktır.'
                        : 'Bu salon başvurusunu reddedeceksiniz. Bu işlem geri alınamaz.'
                    }
                </p>
                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        disabled={loading}
                        className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                    >
                        İptal
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className={`flex-1 px-4 py-2.5 text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ${
                            isApprove
                                ? 'bg-green-600 hover:bg-green-700 text-white'
                                : 'bg-red-600 hover:bg-red-700 text-white'
                        }`}
                    >
                        {loading && <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />}
                        {isApprove ? 'Onayla' : 'Reddet'}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export const SalonApplicationsPage: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') === 'rejected' ? 'rejected' : 'pending';

    const [pendingApplications, setPendingApplications] = useState<SalonApplication[]>([]);
    const [rejectedApplications, setRejectedApplications] = useState<SalonApplication[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [confirm, setConfirm] = useState<ConfirmState>({ open: false, type: 'approve', appId: '', shopName: '' });
    const [searchTerm, setSearchTerm] = useState('');

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'pending') {
                const data = await salonApplicationService.getPendingApplications();
                setPendingApplications(data);
            } else {
                const data = await salonApplicationService.getRejectedApplications();
                setRejectedApplications(data);
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Başvurular yüklenemedi.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        setSearchTerm('');
    }, [activeTab]);

    const openConfirm = (type: ActionType, app: SalonApplication) => {
        setConfirm({ open: true, type, appId: app.id, shopName: app.shopName });
    };

    const handleConfirm = async () => {
        setActionLoading(true);
        try {
            if (confirm.type === 'approve') {
                await salonApplicationService.approve(confirm.appId);
                toast.success('Başvuru onaylandı. Dükkan oluşturuldu.');
            } else {
                await salonApplicationService.reject(confirm.appId);
                toast.success('Başvuru reddedildi.');
            }
            setPendingApplications(prev => prev.filter(a => a.id !== confirm.appId));
            setConfirm(c => ({ ...c, open: false }));
        } catch (error: any) {
            toast.error(error.response?.data?.message || error.message || 'İşlem başarısız.');
        } finally {
            setActionLoading(false);
        }
    };

    const currentList = activeTab === 'pending' ? pendingApplications : rejectedApplications;
    const filteredList = currentList.filter(app => {
        const searchStr = searchTerm.toLowerCase();
        return (
            app.shopName?.toLowerCase().includes(searchStr) ||
            app.userName?.toLowerCase().includes(searchStr) ||
            app.city?.toLowerCase().includes(searchStr) ||
            app.district?.toLowerCase().includes(searchStr)
        );
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Salon Başvuruları</h2>
                    <p className="text-sm text-gray-500 mt-1">Sisteme kayıt olmak isteyen işletmeleri yönetin.</p>
                </div>

                <div className="relative w-full md:w-80">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                        placeholder="Salon adı, başvuran veya şehir ara..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200">
                <button
                    onClick={() => setSearchParams({ tab: 'pending' })}
                    className={`pb-3 px-4 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === 'pending' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                    Bekleyen Başvurular
                </button>
                <button
                    onClick={() => setSearchParams({ tab: 'rejected' })}
                    className={`pb-3 px-4 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === 'rejected' ? 'border-red-600 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                    Reddedilen Başvurular
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-20">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
                </div>
            ) : filteredList.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
                    <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">
                        {searchTerm ? 'Aramanıza uygun başvuru bulunamadı.' : (activeTab === 'pending' ? 'Bekleyen başvuru bulunmuyor.' : 'Reddedilen başvuru bulunmuyor.')}
                    </p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {filteredList.map(app => (
                        <div key={app.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:border-primary-300 transition-colors">
                            <div className="p-5 sm:p-6 flex flex-col sm:flex-row gap-6">
                                {/* Left Side: Main Info */}
                                <div className="flex-1 min-w-0 flex flex-col justify-between space-y-4">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <Building2 className="h-6 w-6 text-primary-600 flex-shrink-0" />
                                            <h3 className="font-bold text-gray-900 text-xl truncate">{app.shopName}</h3>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <User className="h-4 w-4 text-gray-400" />
                                            <span className="font-medium text-gray-800">{app.userName}</span>
                                            <span className="text-gray-400 mx-1">•</span>
                                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">Başvuran</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-600">
                                        <div className="flex items-center gap-2">
                                            <Phone className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                            <span>{app.phoneNumber || 'Belirtilmedi'}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Mail className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                            <span className="truncate">{app.contactEmail || 'Belirtilmedi'}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                            <span className="truncate">{[app.district, app.city].filter(Boolean).join(' / ') || 'Lokasyon Belirtilmedi'}</span>
                                        </div>
                                    </div>

                                    {app.description && (
                                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                                            <p className="text-sm text-gray-600 italic line-clamp-2">"{app.description}"</p>
                                        </div>
                                    )}
                                </div>

                                {/* Right Side: Date & Actions */}
                                <div className="sm:w-48 flex flex-col justify-between flex-shrink-0 border-t sm:border-t-0 sm:border-l border-gray-100 pt-4 sm:pt-0 sm:pl-6">
                                    <div className="mb-4">
                                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Başvuru Tarihi</p>
                                        <div className="flex items-center gap-1.5 text-sm font-medium text-gray-800">
                                            <Calendar className="h-4 w-4 text-gray-400" />
                                            {new Date(app.createdAt).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </div>
                                    </div>

                                    {activeTab === 'pending' ? (
                                        <div className="flex flex-col gap-2 mt-auto">
                                            <button
                                                onClick={() => openConfirm('approve', app)}
                                                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-semibold transition-all shadow-sm"
                                            >
                                                <Check className="h-4 w-4" />
                                                Onayla
                                            </button>
                                            <button
                                                onClick={() => openConfirm('reject', app)}
                                                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-white border border-red-200 text-red-600 hover:bg-red-50 text-sm font-semibold transition-all"
                                            >
                                                <X className="h-4 w-4" />
                                                Reddet
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="mt-auto flex items-center justify-center py-2 px-4 bg-red-50 text-red-700 rounded-lg text-sm font-bold border border-red-100">
                                            <X className="h-4 w-4 mr-1.5" /> Reddedildi
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {confirm.open && (
                <ConfirmModal
                    state={confirm}
                    loading={actionLoading}
                    onConfirm={handleConfirm}
                    onCancel={() => setConfirm(c => ({ ...c, open: false }))}
                />
            )}
        </div>
    );
};
