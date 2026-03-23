import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { salonApplicationService } from '../api/salon-application.service';
import { Button } from '../components/Button';
import { Clock, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { TargetGender, TargetGenderLabels } from '../types/shop';

export const SalonApplicationPage: React.FC = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    // Salon Application State
    const [application, setApplication] = useState<any>(null);
    const [applicationLoading, setApplicationLoading] = useState(false);

    // Form State
    const [createApplication, setCreateApplication] = useState({
        shopName: '',
        description: '',
        contactEmail: user?.email || '', // Default to user email
        phoneNumber: user?.phoneNumber || '', // Default to user phone
        categoryId: 1, // Default to Berber
        genderPreference: TargetGender.Unisex as TargetGender, // Default Unisex
        city: '',
        district: '',
        neighborhood: '',
        street: '',
        buildingNumber: '',
        address: '' // Open address / Directions
    });

    const categories = [
        { id: 1, name: 'Berber' },
        { id: 2, name: 'Kuaför' },
        { id: 3, name: 'Güzellik Merkezi' },
        { id: 4, name: 'Spa Merkezi' },
        { id: 5, name: 'Dövme Stüdyosu' },
        { id: 99, name: 'Diğer' }
    ];

    useEffect(() => {
        loadSalonApplication();
    }, []);

    const loadSalonApplication = async () => {
        setApplicationLoading(true);
        try {
            const data = await salonApplicationService.getMyApplication();
            setApplication(data);
        } catch (error) {
            console.error('Failed to load application', error);
            setApplication(null);
        } finally {
            setApplicationLoading(false);
        }
    };

    const handleCreateApplication = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // Validate required fields
            if (!createApplication.shopName || !createApplication.city || !createApplication.district || !createApplication.neighborhood || !createApplication.street || !createApplication.buildingNumber) {
                toast.error('Lütfen tüm zorunlu alanları doldurun.');
                return;
            }

            await salonApplicationService.apply(createApplication);
            toast.success('Başvurunuz alındı. Onay bekleniyor.');
            loadSalonApplication();
        } catch (error) {
            console.error('Application failed', error);
            toast.error('Başvuru yapılamadı. Lütfen bilgilerinizi kontrol edin.');
        }
    };

    return (
        <div className="max-w-5xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                {/* Header Section */}
                <div className="bg-primary-900 py-10 px-8 text-center relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10 bg-[url('https://images.unsplash.com/photo-1560066984-138dadb4c035?ixlib=rb-4.0.3&auto=format&fit=crop&w=1974&q=80')] bg-cover bg-center"></div>
                    <div className="relative z-10">
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">Salon Sahibi Ol</h2>
                        <p className="text-primary-100 max-w-2xl mx-auto text-lg">
                            İşletmenizi dijital dünyaya taşıyın, randevularınızı yönetin ve binlerce yeni müşteriye ulaşın.
                        </p>
                    </div>
                </div>

                <div className="p-8 md:p-12">
                    {applicationLoading ? (
                        <div className="flex justify-center items-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
                        </div>
                    ) : application ? (
                        <div className="space-y-8 animate-fadeIn">
                            <div className={`p-8 rounded-xl border-2 flex flex-col md:flex-row items-center gap-6 ${application.status === 0 ? 'bg-yellow-50 border-yellow-200 text-yellow-800' :
                                application.status === 1 ? 'bg-green-50 border-green-200 text-green-800' :
                                    'bg-red-50 border-red-200 text-red-800'
                                }`}>
                                <div className={`p-4 rounded-full ${application.status === 0 ? 'bg-yellow-100' :
                                    application.status === 1 ? 'bg-green-100' :
                                        'bg-red-100'
                                    }`}>
                                    {application.status === 0 && <Clock className="h-10 w-10 text-yellow-600" />}
                                    {application.status === 1 && <CheckCircle className="h-10 w-10 text-green-600" />}
                                    {application.status === 2 && <XCircle className="h-10 w-10 text-red-600" />}
                                </div>

                                <div className="text-center md:text-left flex-1">
                                    <h3 className="font-bold text-2xl mb-2">
                                        {application.status === 0 && 'Başvurunuz İnceleniyor'}
                                        {application.status === 1 && 'Başvurunuz Onaylandı!'}
                                        {application.status === 2 && 'Başvurunuz Reddedildi'}
                                    </h3>
                                    <p className="text-lg opacity-90">
                                        {application.status === 0 && 'Başvurunuz ekibimiz tarafından titizlikle incelenmektedir. Sonuçlandığında size bildirim göndereceğiz.'}
                                        {application.status === 1 && 'Tebrikler! Mağazanız oluşturuldu. Yönetim paneline erişebilirsiniz.'}
                                        {application.status === 2 && 'Maalesef başvurunuz kriterlerimize uygun bulunmadı.'}
                                    </p>
                                </div>

                                {application.status === 1 && (
                                    <Button
                                        onClick={() => {
                                            if (user?.role !== 'SalonOwner') {
                                                toast.success('Rol değişikliğinin etkinleşmesi için yeniden giriş yapmalısınız.');
                                                logout();
                                                navigate('/login');
                                            } else {
                                                navigate('/salon-panel');
                                            }
                                        }}
                                        className="whitespace-nowrap px-8 py-3 text-lg shadow-lg hover:shadow-xl transition-all"
                                    >
                                        {user?.role !== 'SalonOwner' ? 'Erişimi Aktifleştir' : 'Yönetim Paneline Git'}
                                    </Button>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6">
                                <div>
                                    <label className="text-sm font-semibold text-gray-500 uppercase tracking-wider">İşletme Bilgileri</label>
                                    <div className="mt-3 bg-gray-50 p-4 rounded-lg border border-gray-100">
                                        <div className="text-lg font-bold text-gray-900">{application.shopName}</div>
                                        <div className="text-gray-600">{categories.find(c => c.id === application.category)?.name || 'Kategori Belirtilmemiş'}</div>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-semibold text-gray-500 uppercase tracking-wider">İletişim</label>
                                    <div className="mt-3 bg-gray-50 p-4 rounded-lg border border-gray-100">
                                        <div className="flex items-center gap-2 text-gray-700 mb-1">
                                            <span className="font-medium">Tel:</span> {application.phoneNumber}
                                        </div>
                                        <div className="flex items-center gap-2 text-gray-700">
                                            <span className="font-medium">E-posta:</span> {application.contactEmail}
                                        </div>
                                    </div>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Adres</label>
                                    <div className="mt-3 bg-gray-50 p-4 rounded-lg border border-gray-100 text-gray-700">
                                        {application.neighborhood} Mah., {application.street} Sok., No: {application.buildingNumber}
                                        <br />
                                        {application.district} / {application.city}
                                        {application.address && <div className="mt-2 pt-2 border-t border-gray-200 text-sm italic">{application.address}</div>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleCreateApplication} className="space-y-8 animate-fadeIn">
                            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-sm text-blue-700">
                                            Başvuru formunu eksiksiz doldurmanız, onay sürecini hızlandıracaktır.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <h3 className="text-xl font-semibold text-gray-900 border-b pb-2">Genel Bilgiler</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Salon Adı *</label>
                                        <input
                                            type="text"
                                            value={createApplication.shopName}
                                            onChange={e => setCreateApplication({ ...createApplication, shopName: e.target.value })}
                                            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 transition-colors py-3"
                                            placeholder="Örn: Stil Kuaför"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Kategori *</label>
                                        <select
                                            value={createApplication.categoryId}
                                            onChange={e => setCreateApplication({ ...createApplication, categoryId: Number(e.target.value) })}
                                            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 transition-colors py-3"
                                        >
                                            {categories.map(c => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Hizmet Verilen Cinsiyet *</label>
                                        <div className="flex flex-wrap gap-4">
                                            {[TargetGender.Kadin, TargetGender.Erkek, TargetGender.Unisex].map((gender) => (
                                                <label key={gender} className={`cursor-pointer flex items-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${createApplication.genderPreference === gender ? 'border-primary-600 bg-primary-50 text-primary-900' : 'border-gray-200 hover:border-primary-300'}`}>
                                                    <input
                                                        type="radio"
                                                        name="genderPreference"
                                                        value={gender}
                                                        checked={createApplication.genderPreference === gender}
                                                        onChange={() => setCreateApplication({ ...createApplication, genderPreference: gender })}
                                                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                                                    />
                                                    <span className="font-medium text-sm">{TargetGenderLabels[gender]}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Hakkında / Açıklama</label>
                                        <textarea
                                            value={createApplication.description}
                                            onChange={e => setCreateApplication({ ...createApplication, description: e.target.value })}
                                            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 transition-colors"
                                            rows={3}
                                            placeholder="İşletmeniz hakkında kısa bir bilgilendirme yazısı..."
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <h3 className="text-xl font-semibold text-gray-900 border-b pb-2">İletişim Bilgileri</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">İletişim Numarası *</label>
                                        <input
                                            type="tel"
                                            value={createApplication.phoneNumber}
                                            onChange={e => setCreateApplication({ ...createApplication, phoneNumber: e.target.value })}
                                            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 transition-colors py-3"
                                            placeholder="05..."
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">E-posta Adresi *</label>
                                        <input
                                            type="email"
                                            value={createApplication.contactEmail}
                                            onChange={e => setCreateApplication({ ...createApplication, contactEmail: e.target.value })}
                                            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 transition-colors py-3"
                                            placeholder="ornek@email.com"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <h3 className="text-xl font-semibold text-gray-900 border-b pb-2">Adres Bilgileri</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">İl *</label>
                                        <input
                                            type="text"
                                            value={createApplication.city}
                                            onChange={e => setCreateApplication({ ...createApplication, city: e.target.value })}
                                            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 transition-colors py-3"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">İlçe *</label>
                                        <input
                                            type="text"
                                            value={createApplication.district}
                                            onChange={e => setCreateApplication({ ...createApplication, district: e.target.value })}
                                            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 transition-colors py-3"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Mahalle *</label>
                                        <input
                                            type="text"
                                            value={createApplication.neighborhood}
                                            onChange={e => setCreateApplication({ ...createApplication, neighborhood: e.target.value })}
                                            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 transition-colors py-3"
                                            required
                                        />
                                    </div>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Sokak / Cadde *</label>
                                            <input
                                                type="text"
                                                value={createApplication.street}
                                                onChange={e => setCreateApplication({ ...createApplication, street: e.target.value })}
                                                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 transition-colors py-3"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">No *</label>
                                            <input
                                                type="text"
                                                value={createApplication.buildingNumber}
                                                onChange={e => setCreateApplication({ ...createApplication, buildingNumber: e.target.value })}
                                                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 transition-colors py-3"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Açık Adres / Adres Tarifi</label>
                                        <textarea
                                            value={createApplication.address}
                                            onChange={e => setCreateApplication({ ...createApplication, address: e.target.value })}
                                            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 transition-colors"
                                            rows={2}
                                            placeholder="Adres tarifi veya ek bilgi..."
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-8 flex justify-end gap-4">
                                <Button type="button" variant="outline" size="lg" onClick={() => window.history.back()}>İptal</Button>
                                <Button type="submit" size="lg" className="px-10 bg-primary-900 hover:bg-primary-800 text-white shadow-lg transform hover:-translate-y-0.5 transition-all duration-200">
                                    Başvuruyu Tamamla
                                </Button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};
