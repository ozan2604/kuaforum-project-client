import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { salonApplicationService } from '../api/salon-application.service';
import api from '../api/axios';
import { authService } from '../api/auth.service';
import { Button } from '../components/Button';
import { Clock, CheckCircle, XCircle, MapPin, Phone, Mail, Store, ChevronRight, Loader2, ShieldCheck } from 'lucide-react';
import { SearchableSelect } from '../components/SearchableSelect';
import MapPicker from '../components/MapPicker';
import { toast } from 'react-hot-toast';
import { getApiError, getRefreshToken } from '../utils/storage';
import { useNavigate } from 'react-router-dom';
import { TargetGender, TargetGenderLabels, ShopCategory, ShopCategoryLabels } from '../types/shop';
import { LegalModal } from '../components/LegalModal';
import { LEGAL_TEXTS } from '../constants/legal';


interface Province { id: number; name: string; districts: { id: number; name: string }[] }
interface Neighborhood { id: number; name: string }

const steps = ['Genel Bilgiler', 'İletişim', 'Adres'];

export const SalonApplicationPage: React.FC = () => {
    const { user, isAuthenticated, completeAuth } = useAuth();
    const navigate = useNavigate();

    const [application, setApplication] = useState<any>(null);
    const [applicationLoading, setApplicationLoading] = useState(true);
    const [currentStep, setCurrentStep] = useState(0);

    // Address API state
    const [provinces, setProvinces] = useState<Province[]>([]);
    const [districts, setDistricts] = useState<{ id: number; name: string }[]>([]);
    const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
    const [loadingProvinces, setLoadingProvinces] = useState(false);
    const [loadingDistricts] = useState(false);
    const [loadingNeighborhoods, setLoadingNeighborhoods] = useState(false);

    const [isCheckingEmail, setIsCheckingEmail] = useState(false);

    const [form, setForm] = useState({
        shopName: '',
        description: '',
        contactEmail: user?.email || '',
        phoneNumber: user?.phoneNumber || '',
        categoryIds: [] as number[],
        genderPreference: TargetGender.Unisex as TargetGender,
        city: '',
        district: '',
        neighborhood: '',
        street: '',
        buildingNumber: '',
        address: '',
        latitude: null as number | null,
        longitude: null as number | null,
    });

    // Selected IDs for API chain
    const [selectedProvinceId, setSelectedProvinceId] = useState<number | null>(null);
    const [selectedDistrictId, setSelectedDistrictId] = useState<number | null>(null);

    const [kvkkAccepted, setKvkkAccepted] = useState(false);
    const [kvkkModalOpen, setKvkkModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [showNewApplicationForm, setShowNewApplicationForm] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const handleGoToSalon = async () => {
        const storedRefreshToken = getRefreshToken();
        if (storedRefreshToken) {
            setRefreshing(true);
            try {
                const response = await authService.refresh(storedRefreshToken);
                completeAuth(response);
            } catch {
                // Token refresh başarısız olsa bile yönlendir; korumalı route tekrar kontrol eder
            } finally {
                setRefreshing(false);
            }
        }
        navigate('/salon-panel');
    };

    useEffect(() => {
        loadSalonApplication();
        loadProvinces();
    }, []);

    useEffect(() => {
        if (form.categoryIds.includes(ShopCategory.PetKuafor)) {
            setForm(f => ({ ...f, genderPreference: TargetGender.Pet }));
        }
    }, [form.categoryIds]);

    const loadSalonApplication = async () => {
        try {
            const data = await salonApplicationService.getMyApplication();
            setApplication(data);
        } catch {
            setApplication(null);
        } finally {
            setApplicationLoading(false);
        }
    };

    const loadProvinces = async () => {
        setLoadingProvinces(true);
        try {
            const res = await api.get('/location/provinces');
            const data = (res.data?.data || []).sort((a: any, b: any) => a.name.localeCompare(b.name, 'tr'));
            setProvinces(data);
        } catch {
            toast.error('İller yüklenemedi.');
        } finally {
            setLoadingProvinces(false);
        }
    };

    const handleProvinceChange = (provinceId: number) => {
        const prov = provinces.find(p => p.id === provinceId);
        if (!prov) return;
        setSelectedProvinceId(provinceId);
        setSelectedDistrictId(null);
        setDistricts(prov.districts || []);
        setNeighborhoods([]);
        setForm(f => ({ ...f, city: prov.name, district: '', neighborhood: '' }));
    };

    const handleDistrictChange = async (districtId: number) => {
        const dist = districts.find(d => d.id === districtId);
        if (!dist) return;
        setSelectedDistrictId(districtId);
        setNeighborhoods([]);
        setForm(f => ({ ...f, district: dist.name, neighborhood: '' }));
        setLoadingNeighborhoods(true);
        try {
            const res = await api.get(`/location/neighborhoods?districtId=${districtId}`);
            const data = (res.data?.data || []).sort((a: any, b: any) => a.name.localeCompare(b.name, 'tr'));
            setNeighborhoods(data);
        } catch {
            toast.error('Mahalleler yüklenemedi.');
        } finally {
            setLoadingNeighborhoods(false);
        }
    };

    const handleNeighborhoodChange = (neighborhoodId: number) => {
        const n = neighborhoods.find(x => x.id === neighborhoodId);
        if (!n) return;
        setForm(f => ({ ...f, neighborhood: n.name }));
    };

    const validateStep = (step: number): boolean => {
        if (step === 0) {
            if (!form.shopName.trim()) { toast.error('Salon adı zorunludur.'); return false; }
            if (form.categoryIds.length === 0) { toast.error('En az bir kategori seçimi zorunludur.'); return false; }
            if (!form.description.trim()) { toast.error('Açıklama zorunludur.'); return false; }
        }
        if (step === 1) {
            if (!form.phoneNumber || !/^05\d{9}$/.test(form.phoneNumber)) { toast.error('Geçerli bir telefon numarası giriniz (05XXXXXXXXX).'); return false; }
            if (!form.contactEmail || !/\S+@\S+\.\S+/.test(form.contactEmail)) { toast.error('Geçerli bir e-posta adresi giriniz.'); return false; }
        }
        if (step === 2) {
            if (!form.city) { toast.error('İl seçimi zorunludur.'); return false; }
            if (!form.district) { toast.error('İlçe seçimi zorunludur.'); return false; }
            if (!form.neighborhood) { toast.error('Mahalle seçimi zorunludur.'); return false; }
            if (!form.street.trim()) { toast.error('Sokak/Cadde zorunludur.'); return false; }
            if (!form.buildingNumber.trim()) { toast.error('Bina numarası zorunludur.'); return false; }
            if (!form.address.trim()) { toast.error('Açık adres zorunludur.'); return false; }
            if (!kvkkAccepted) { toast.error('Devam etmek için KVKK Aydınlatma Metnini onaylamalısınız.'); return false; }
        }
        return true;
    };

    const handleNext = async () => {
        if (!validateStep(currentStep)) return;

        if (currentStep === 1) {
            setIsCheckingEmail(true);
            try {
                const result = await salonApplicationService.checkContactEmail(form.contactEmail);
                if (!result.isAvailable) {
                    if (result.isUsedByShop || result.isUsedByApplication)
                        toast.error('Bu e-posta adresi başka bir salona ait.');
                    else if (result.isRegisteredUser)
                        toast.error('Bu e-posta adresi sistemde kayıtlı bir kullanıcıya ait.');
                    return;
                }
            } catch (err) {
                toast.error(getApiError(err, 'E-posta kontrolü sırasında bir hata oluştu.'));
                return;
            } finally {
                setIsCheckingEmail(false);
            }
        }

        setCurrentStep(s => s + 1);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateStep(2)) return;
        if (submitting) return;
        setSubmitting(true);
        try {
            await salonApplicationService.apply(form);
            toast.success('Başvurunuz alındı! Onay bekleniyor.');
            setShowNewApplicationForm(false);
            loadSalonApplication();
        } catch (err) {
            toast.error(getApiError(err, 'Başvuru yapılamadı.'));
        } finally {
            setSubmitting(false);
        }
    };

    const inputCls = "w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all text-sm font-medium disabled:bg-gray-50 disabled:text-gray-500";
    const labelCls = "block text-sm font-semibold text-gray-700 mb-1.5";

    if (applicationLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
                <Loader2 className="h-10 w-10 text-indigo-600 animate-spin" />
            </div>
        );
    }

    return (
        <><div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-8 px-4">
            <div className="max-w-2xl mx-auto">
                {/* Header Banner */}
                <div className="relative rounded-2xl overflow-hidden mb-8 shadow-xl">
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1560066984-138dadb4c035?ixlib=rb-4.0.3&auto=format&fit=crop&w=1974&q=80')] bg-cover bg-center" />
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/90 via-indigo-800/80 to-purple-900/70" />
                    <div className="relative z-10 py-10 px-6 text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm shadow-lg mb-4">
                            <Store className="h-8 w-8 text-white" />
                        </div>
                        <h1 className="text-3xl font-bold text-white">Salon Başvurusu</h1>
                        <p className="text-indigo-200 mt-2 text-sm">İşletmenizi platforma ekleyin, binlerce müşteriye ulaşın.</p>
                    </div>
                </div>
                {!isAuthenticated ? (
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden p-8 sm:p-12 text-center animate-in fade-in zoom-in-95 duration-500">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-indigo-50 text-indigo-600 mb-6 border border-indigo-100">
                            <ShieldCheck className="h-10 w-10" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-3">Giriş Yapmanız Gerekiyor</h2>
                        <p className="text-gray-600 mb-8 max-w-md mx-auto leading-relaxed text-sm">
                            Salon başvurusu yapabilmek için sisteme kayıtlı olmanız gerekmektedir. Bilgilerinizin kaybolmaması için lütfen önce giriş yapın veya ücretsiz kayıt olun.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Button onClick={() => navigate('/login')} className="w-full sm:w-auto px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md shadow-indigo-200">
                                Giriş Yap
                            </Button>
                            <Button onClick={() => navigate('/register')} className="w-full sm:w-auto px-8 py-3.5 bg-white text-indigo-600 border border-indigo-200 hover:border-indigo-300 hover:bg-indigo-50 rounded-xl font-bold transition-all">
                                Ücretsiz Kayıt Ol
                            </Button>
                        </div>
                    </div>
                ) : !showNewApplicationForm && application ? (
                    /* Application Status Card */
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                        <div className={`p-6 ${application.status === 0 ? 'bg-amber-50 border-b-2 border-amber-200' : application.status === 1 ? 'bg-emerald-50 border-b-2 border-emerald-200' : 'bg-red-50 border-b-2 border-red-200'}`}>
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-2xl ${application.status === 0 ? 'bg-amber-100' : application.status === 1 ? 'bg-emerald-100' : 'bg-red-100'}`}>
                                    {application.status === 0 && <Clock className="h-8 w-8 text-amber-600" />}
                                    {application.status === 1 && <CheckCircle className="h-8 w-8 text-emerald-600" />}
                                    {application.status === 2 && <XCircle className="h-8 w-8 text-red-600" />}
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">
                                        {application.status === 0 && 'Başvurunuz İnceleniyor'}
                                        {application.status === 1 && 'Başvurunuz Onaylandı!'}
                                        {application.status === 2 && 'Başvurunuz Reddedildi'}
                                    </h2>
                                    <p className="text-sm text-gray-600 mt-0.5">
                                        {application.status === 0 && 'Ekibimiz başvurunuzu inceliyor. Sonuçlandığında bildirim alacaksınız.'}
                                        {application.status === 1 && 'Tebrikler! Salon panelinize erişebilirsiniz.'}
                                        {application.status === 2 && 'Başvurunuz kriterlerimize uygun bulunmadı.'}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">İşletme</p>
                                <p className="font-bold text-gray-900">{application.shopName}</p>
                                <p className="text-sm text-gray-500">{(application.categories as number[])?.map((c: number) => ShopCategoryLabels[c as ShopCategory]).join(', ') || '-'}</p>
                            </div>
                            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">İletişim</p>
                                <p className="text-sm text-gray-700">{application.phoneNumber}</p>
                                <p className="text-sm text-gray-700">{application.contactEmail}</p>
                            </div>
                            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 sm:col-span-2">
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Adres</p>
                                <p className="text-sm text-gray-700">{application.neighborhood} Mah., {application.street}, No: {application.buildingNumber}</p>
                                <p className="text-sm text-gray-500">{application.district} / {application.city}</p>
                            </div>
                        </div>
                        {application.status === 1 && (
                            <div className="px-6 pb-6 space-y-3">
                                <Button
                                    onClick={handleGoToSalon}
                                    disabled={refreshing}
                                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 disabled:opacity-60"
                                >
                                    {refreshing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Store className="h-5 w-5" />}
                                    Salonuma Git
                                </Button>
                                <button
                                    onClick={() => setShowNewApplicationForm(true)}
                                    className="w-full py-3 text-sm text-indigo-600 hover:text-indigo-800 font-semibold transition-colors"
                                >
                                    + Yeni Salon İçin Başvur
                                </button>
                            </div>
                        )}
                        {application.status === 2 && (
                            <div className="px-6 pb-6">
                                <button
                                    onClick={() => setShowNewApplicationForm(true)}
                                    className="w-full py-3 text-sm text-indigo-600 hover:text-indigo-800 font-semibold transition-colors"
                                >
                                    + Yeni Başvuru Yap
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    /* Application Form */
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                        {/* Step Indicator */}
                        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
                            <div className="flex items-center gap-2">
                                {steps.map((step, i) => (
                                    <React.Fragment key={i}>
                                        <div className="flex items-center gap-2">
                                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${i < currentStep ? 'bg-indigo-600 text-white' : i === currentStep ? 'bg-indigo-600 text-white ring-4 ring-indigo-100' : 'bg-gray-100 text-gray-400'}`}>
                                                {i < currentStep ? '✓' : i + 1}
                                            </div>
                                            <span className={`hidden sm:block text-sm font-medium ${i === currentStep ? 'text-indigo-600' : i < currentStep ? 'text-gray-600' : 'text-gray-400'}`}>{step}</span>
                                        </div>
                                        {i < steps.length - 1 && <div className={`flex-1 h-0.5 rounded transition-all ${i < currentStep ? 'bg-indigo-600' : 'bg-gray-100'}`} />}
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            {/* Step 0: General Info */}
                            {currentStep === 0 && (
                                <div className="space-y-5 animate-fadeIn">
                                    <div>
                                        <label className={labelCls}>Salon Adı <span className="text-red-500">*</span></label>
                                        <input type="text" value={form.shopName} onChange={e => setForm(f => ({ ...f, shopName: e.target.value }))} className={inputCls} placeholder="Örn: Stil Kuaför" required />
                                    </div>
                                    <div>
                                        <label className={labelCls}>Kategori <span className="text-red-500">*</span> <span className="text-xs font-normal text-gray-400">(Birden fazla seçebilirsiniz)</span></label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {Object.entries(ShopCategoryLabels).map(([id, name]) => {
                                                const catId = Number(id);
                                                const selected = form.categoryIds.includes(catId);
                                                return (
                                                    <label
                                                        key={id}
                                                        className={`cursor-pointer flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${selected ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-600 hover:border-indigo-200 hover:bg-indigo-50/50'}`}
                                                        onClick={() => setForm(f => ({
                                                            ...f,
                                                            categoryIds: selected
                                                                ? f.categoryIds.filter(c => c !== catId)
                                                                : [...f.categoryIds, catId]
                                                        }))}
                                                    >
                                                        <div className={`w-4 h-4 rounded flex-shrink-0 border-2 flex items-center justify-center ${selected ? 'bg-indigo-500 border-indigo-500' : 'border-gray-300'}`}>
                                                            {selected && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                                                        </div>
                                                        {name}
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    </div>
                                    <div>
                                        <label className={labelCls}>Hizmet Verilen Cinsiyet <span className="text-red-500">*</span></label>
                                        <div className="grid grid-cols-2 gap-3">
                                            {[TargetGender.Kadin, TargetGender.Erkek, TargetGender.Unisex, TargetGender.Pet].map(g => (
                                                <label key={g} className={`cursor-pointer flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 font-semibold text-sm transition-all ${form.genderPreference === g ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-500 hover:border-indigo-200 hover:bg-indigo-50/50'}`}>
                                                    <input type="radio" name="gender" value={g} checked={form.genderPreference === g} onChange={() => setForm(f => ({ ...f, genderPreference: g }))} className="sr-only" />
                                                    {TargetGenderLabels[g]}
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label className={labelCls}>Hakkında / Açıklama <span className="text-red-500">*</span></label>
                                        <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className={inputCls} rows={4} placeholder="İşletmeniz hakkında kısa bir tanıtım yazısı..." required />
                                    </div>
                                </div>
                            )}

                            {/* Step 1: Contact */}
                            {currentStep === 1 && (
                                <div className="space-y-5 animate-fadeIn">
                                    <div>
                                        <label className={labelCls}><Phone className="inline h-4 w-4 mr-1 text-gray-400" />İletişim Numarası <span className="text-red-500">*</span></label>
                                        <input type="tel" value={form.phoneNumber} onChange={e => setForm(f => ({ ...f, phoneNumber: e.target.value.replace(/\D/g, '').slice(0, 11) }))} className={inputCls} placeholder="05XXXXXXXXX" maxLength={11} required />
                                        <p className="text-xs text-gray-400 mt-1">Format: 05XXXXXXXXX (11 rakam)</p>
                                    </div>
                                    <div>
                                        <label className={labelCls}><Mail className="inline h-4 w-4 mr-1 text-gray-400" />E-posta Adresi <span className="text-red-500">*</span></label>
                                        <input type="email" value={form.contactEmail} onChange={e => setForm(f => ({ ...f, contactEmail: e.target.value }))} className={inputCls} placeholder="ornek@email.com" required />
                                    </div>
                                </div>
                            )}

                            {/* Step 2: Address */}
                            {currentStep === 2 && (
                                <div className="space-y-5 animate-fadeIn">
                                    <div className="flex items-center gap-2 text-sm text-indigo-600 bg-indigo-50 px-4 py-3 rounded-xl border border-indigo-100">
                                        <MapPin className="h-4 w-4 flex-shrink-0" />
                                        <span>İl ve ilçe seçtikten sonra mahalle listesi otomatik yüklenir.</span>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <SearchableSelect
                                            label="İl"
                                            required
                                            options={provinces}
                                            value={selectedProvinceId}
                                            onChange={(val) => handleProvinceChange(val)}
                                            placeholder="İl Seçin"
                                            loading={loadingProvinces}
                                        />
                                        <SearchableSelect
                                            label="İlçe"
                                            required
                                            options={districts}
                                            value={selectedDistrictId}
                                            onChange={(val) => handleDistrictChange(val)}
                                            placeholder="İlçe Seçin"
                                            disabled={!selectedProvinceId}
                                            loading={loadingDistricts}
                                        />
                                    </div>

                                    <div>
                                        <SearchableSelect
                                            label="Mahalle"
                                            required
                                            options={neighborhoods}
                                            value={neighborhoods.find(n => n.name === form.neighborhood)?.id ?? ''}
                                            onChange={(val) => handleNeighborhoodChange(val)}
                                            placeholder="Mahalle Seçin"
                                            disabled={!selectedDistrictId || loadingNeighborhoods}
                                            loading={loadingNeighborhoods}
                                        />
                                        {selectedDistrictId && neighborhoods.length === 0 && !loadingNeighborhoods && (
                                            <p className="text-xs text-amber-600 mt-1">Bu ilçe için mahalle verisi bulunamadı. Lütfen sokak/cadde alanına tüm adresinizi yazın.</p>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="col-span-2">
                                            <label className={labelCls}>Sokak / Cadde <span className="text-red-500">*</span></label>
                                            <input type="text" value={form.street} onChange={e => setForm(f => ({ ...f, street: e.target.value }))} className={inputCls} placeholder="Atatürk Caddesi" required />
                                        </div>
                                        <div>
                                            <label className={labelCls}>Bina No <span className="text-red-500">*</span></label>
                                            <input type="text" value={form.buildingNumber} onChange={e => setForm(f => ({ ...f, buildingNumber: e.target.value }))} className={inputCls} placeholder="12B" required />
                                        </div>
                                    </div>

                                    <div>
                                        <label className={labelCls}>Açık Adres <span className="text-red-500">*</span></label>
                                        <textarea value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} className={inputCls} rows={3} placeholder="Örn: Atatürk Cad. No:12B Kat:2, Karşıyaka AVM yanı, İzmir" required />
                                        <p className="text-xs text-gray-400 mt-1">Kargo veya müşterinin kolayca bulabilmesi için tam adresi girin.</p>
                                    </div>

                                    <MapPicker
                                        latitude={form.latitude}
                                        longitude={form.longitude}
                                        onLocationChange={(lat, lng) => setForm(f => ({ ...f, latitude: lat, longitude: lng }))}
                                        city={form.city}
                                        district={form.district}
                                        neighborhood={form.neighborhood}
                                        street={form.street}
                                    />

                                    {/* KVKK Onay */}
                                    <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                                        <input
                                            id="kvkk"
                                            type="checkbox"
                                            checked={kvkkAccepted}
                                            onChange={(e) => setKvkkAccepted(e.target.checked)}
                                            className="mt-1 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                        />
                                        <label htmlFor="kvkk" className="text-sm text-gray-600 cursor-pointer select-none">
                                            <button type="button" onClick={() => setKvkkModalOpen(true)} className="text-indigo-600 hover:underline font-semibold">
                                                KVKK Aydınlatma Metnini
                                            </button>
                                            {' '}okudum ve kişisel verilerimin işlenmesini, başvurumun değerlendirilmesi amacıyla kabul ediyorum.
                                        </label>
                                    </div>
                                </div>
                            )}

                            {/* Navigation Buttons */}
                            <div className="flex gap-3 pt-2">
                                {currentStep > 0 && (
                                    <button type="button" onClick={() => setCurrentStep(s => s - 1)} className="flex-1 px-6 py-3 rounded-xl border-2 border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 hover:border-gray-300 transition-all">
                                        Geri
                                    </button>
                                )}
                                {currentStep < steps.length - 1 ? (
                                    <button type="button" onClick={handleNext} disabled={isCheckingEmail} className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:bg-indigo-400 shadow-lg shadow-indigo-200 transition-all active:scale-95">
                                        {isCheckingEmail ? <><Loader2 className="h-4 w-4 animate-spin" /> Kontrol ediliyor...</> : <>Devam Et <ChevronRight className="h-4 w-4" /></>}
                                    </button>
                                ) : (
                                    <button type="submit" disabled={submitting} className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-indigo-200 transition-all active:scale-95 text-base">
                                        {submitting ? <><Loader2 className="h-5 w-5 animate-spin" /> Gönderiliyor…</> : <><CheckCircle className="h-5 w-5" /> Başvuruyu Tamamla</>}
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </div>

        <LegalModal
            isOpen={kvkkModalOpen}
            onClose={() => setKvkkModalOpen(false)}
            title="KVKK Aydınlatma Metni"
            content={LEGAL_TEXTS.KVKK_DETAILS}
        /></>
    );
};
