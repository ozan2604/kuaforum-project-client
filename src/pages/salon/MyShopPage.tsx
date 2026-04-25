import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { shopService } from '../../api/shop.service';
import { toast } from 'react-hot-toast';
import { MapPin, Phone, Building2, Trash2, Loader2, CalendarX, Clock } from 'lucide-react';
import { SearchableSelect } from '../../components/SearchableSelect';
import { ShopCategory, ShopCategoryLabels, TargetGender, TargetGenderLabels } from '../../types/shop';
import type { ShopClosureDateDto } from '../../types/shop';
import MapPicker from '../../components/MapPicker';

const TURKIYE_API = 'https://turkiyeapi.dev/api/v1';
interface Province { id: number; name: string; districts: { id: number; name: string }[] }
interface Neighborhood { id: number; name: string }

interface ShopFormData {
    name: string;
    description: string;
    address: string;
    city: string;
    district: string;
    neighborhood: string;
    street: string;
    buildingNumber: string;
    phoneNumber: string;
    latitude?: number;
    longitude?: number;
    coverImagePath?: string;
    images?: { id: string; url: string }[];
    genderPreference: TargetGender;
    openTime?: string;
    closeTime?: string;
}

export const MyShopPage: React.FC = () => {

    const { register, handleSubmit, formState: { errors }, reset, setValue, getValues, watch } = useForm<ShopFormData>();
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [shopId, setShopId] = useState<string | null>(null);
    const [refreshImages, setRefreshImages] = useState(0);
    const [selectedCategories, setSelectedCategories] = useState<number[]>([]);

    // Closure dates state
    const [closureDates, setClosureDates] = useState<ShopClosureDateDto[]>([]);
    const [newClosureDate, setNewClosureDate] = useState('');
    const [newClosureReason, setNewClosureReason] = useState('');
    const [addingClosure, setAddingClosure] = useState(false);

    // Address API state
    const [provinces, setProvinces] = useState<Province[]>([]);
    const [districts, setDistricts] = useState<{ id: number; name: string }[]>([]);
    const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
    const [loadingProvinces, setLoadingProvinces] = useState(false);
    const [loadingNeighborhoods, setLoadingNeighborhoods] = useState(false);
    const [selectedProvinceId, setSelectedProvinceId] = useState<number | null>(null);
    const [selectedDistrictId, setSelectedDistrictId] = useState<number | null>(null);

    useEffect(() => {
        loadProvinces();
    }, []);

    const loadProvinces = async () => {
        setLoadingProvinces(true);
        try {
            const res = await fetch(`${TURKIYE_API}/provinces`);
            const json = await res.json();
            const data = (json.data || []).sort((a: any, b: any) => a.name.localeCompare(b.name, 'tr'));
            setProvinces(data);
        } catch {
            toast.error('İller yüklenemedi.');
        } finally {
            setLoadingProvinces(false);
        }
    };

    useEffect(() => {
        const fetchShop = async () => {
            try {
                const shop = await shopService.getMyShop();
                setShopId(shop.id);
                reset({
                    name: shop.name,
                    description: shop.description,
                    address: shop.address,
                    city: shop.city,
                    district: shop.district,
                    neighborhood: shop.neighborhood || '',
                    street: shop.street || '',
                    buildingNumber: shop.buildingNumber || '',
                    phoneNumber: shop.phoneNumber,
                    latitude: shop.latitude,
                    longitude: shop.longitude,
                    coverImagePath: shop.coverImagePath,
                    images: shop.images || [],
                    genderPreference: shop.genderPreference?.toString() as any,
                    openTime: shop.openTime || '',
                    closeTime: shop.closeTime || ''
                });
                setSelectedCategories(shop.categories ?? []);
                setClosureDates(shop.closureDates || []);
                // Pre-select province/district if city data exists
                if (shop.city) {
                    const res = await fetch(`${TURKIYE_API}/provinces`);
                    const json = await res.json();
                    const provs: Province[] = json.data || [];
                    const prov = provs.find((p: Province) => p.name === shop.city);
                    if (prov) {
                        setSelectedProvinceId(prov.id);
                        setDistricts(prov.districts || []);
                        const dist = prov.districts.find((d: any) => d.name === shop.district);
                        if (dist) {
                            setSelectedDistrictId(dist.id);
                            const nRes = await fetch(`${TURKIYE_API}/neighborhoods?districtId=${dist.id}`);
                            const nJson = await nRes.json();
                            setNeighborhoods(nJson.data || []);
                        }
                    }
                }
            } catch (error) {
                console.error('Dükkan bilgileri alınamadı:', error);
                toast.error('Dükkan detayları yüklenemedi');
            } finally {
                setInitialLoading(false);
            }
        };
        fetchShop();
    }, [reset, refreshImages]);

    const handleProvinceChange = (provinceId: number) => {
        const prov = provinces.find(p => p.id === provinceId);
        if (!prov) return;
        setSelectedProvinceId(provinceId);
        setSelectedDistrictId(null);
        setDistricts(prov.districts || []);
        setNeighborhoods([]);
        setValue('city', prov.name);
        setValue('district', '');
        setValue('neighborhood', '');
    };

    const handleDistrictChange = async (districtId: number) => {
        const dist = districts.find(d => d.id === districtId);
        if (!dist) return;
        setSelectedDistrictId(districtId);
        setNeighborhoods([]);
        setValue('district', dist.name);
        setValue('neighborhood', '');
        setLoadingNeighborhoods(true);
        try {
            const res = await fetch(`${TURKIYE_API}/neighborhoods?districtId=${districtId}`);
            const json = await res.json();
            const data = (json.data || []).sort((a: any, b: any) => a.name.localeCompare(b.name, 'tr'));
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
        setValue('neighborhood', n.name);
    };


    const handleCoverImageUpload = async (file: File) => {
        if (!shopId) return;
        try {
            const toastId = toast.loading('Kapak fotoğrafı yükleniyor...');
            await shopService.uploadCoverImage(shopId, file);
            toast.dismiss(toastId);
            toast.success('Kapak fotoğrafı güncellendi');
            setRefreshImages(prev => prev + 1);
        } catch (error) {
            console.error('Upload failed', error);
            toast.error('Kapak fotoğrafı yüklenemedi');
        }
    };

    const handleGalleryUpload = async (files: FileList) => {
        if (!shopId) return;
        try {
            const toastId = toast.loading(`${files.length} fotoğraf yükleniyor...`);
            const fileArray = Array.from(files);
            await shopService.uploadGalleryImages(shopId, fileArray);
            toast.dismiss(toastId);
            toast.success('Galeri fotoğrafları yüklendi');
            setRefreshImages(prev => prev + 1);
        } catch (error) {
            console.error('Upload failed', error);
            toast.error('Galeri fotoğrafları yüklenemedi');
        }
    };

    const handleDeleteGalleryImage = async (imageId: string) => {
        if (!shopId) return;
        if (!confirm('Bu fotoğrafı silmek istediğinize emin misiniz?')) return;

        try {
            const toastId = toast.loading('Fotoğraf siliniyor...');
            await shopService.deleteGalleryImage(imageId);
            toast.dismiss(toastId);
            toast.success('Fotoğraf silindi');
            setRefreshImages(prev => prev + 1);
        } catch (error) {
            console.error('Delete failed', error);
            toast.error('Fotoğraf silinemedi');
        }
    };

    // Helper to render images with full URL
    const getImageUrl = (path: string) => {
        if (!path) return '';
        if (path.startsWith('http')) return path;
        return `http://localhost:5000${path}`;
    };

    const handleAddClosureDate = async () => {
        if (!shopId || !newClosureDate) return;
        setAddingClosure(true);
        try {
            await shopService.addClosureDate(shopId, newClosureDate, newClosureReason || undefined);
            const updated = await shopService.getClosureDates(shopId);
            setClosureDates(updated);
            setNewClosureDate('');
            setNewClosureReason('');
            toast.success('Kapalı gün eklendi.');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Kapalı gün eklenemedi.');
        } finally {
            setAddingClosure(false);
        }
    };

    const handleRemoveClosureDate = async (id: string) => {
        if (!shopId) return;
        try {
            await shopService.removeClosureDate(id);
            setClosureDates(prev => prev.filter(c => c.id !== id));
            toast.success('Kapalı gün silindi.');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Kapalı gün silinemedi.');
        }
    };

    const onSubmit = async (data: ShopFormData) => {
        if (selectedCategories.length === 0) {
            toast.error('En az bir kategori seçimi zorunludur.');
            return;
        }
        setLoading(true);
        try {
            const formattedData = {
                ...data,
                categoryIds: selectedCategories,
                genderPreference: Number(data.genderPreference) as TargetGender,
                latitude: data.latitude ? Number(data.latitude) : undefined,
                longitude: data.longitude ? Number(data.longitude) : undefined
            };
            await shopService.update(formattedData);
            toast.success('Dükkan detayları başarıyla güncellendi');
        } catch (error: any) {
            console.error('Error updating shop:', error);
            let errorMessage = 'Dükkan güncellenemedi';
            if (error.response?.data?.errors) {
                // Handle FluentValidation errors
                const errors = error.response.data.errors;
                errorMessage = Object.values(errors).flat().join('\n');
            } else if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            }
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    if (initialLoading) {
        return <div className="p-8 text-center">Dükkan bilgileri yükleniyor...</div>;
    }

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                <Building2 className="mr-3 h-8 w-8 text-primary-600" />
                Dükkan Profilim
            </h1>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <form onSubmit={handleSubmit(onSubmit)} className="p-6 md:p-8 space-y-8">
                    {/* Cover Image Section */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Salon Görselleri</h3>

                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">Kapak Fotoğrafı</label>
                            <div className="flex items-center gap-6">
                                <div className="relative w-40 h-24 bg-gray-100 rounded-lg overflow-hidden border border-gray-200 group">
                                    {getValues('coverImagePath') ? (
                                        <img
                                            src={getImageUrl(getValues('coverImagePath') || '')}
                                            alt="Kapak"
                                            className="w-full h-full object-cover"
                                            onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150'; }}
                                        />
                                    ) : (
                                        <div className="flex items-center justify-center w-full h-full text-gray-400">
                                            <span className="text-xs">Fotoğraf Yok</span>
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <input
                                        type="file"
                                        id="coverImageInput"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={(e) => {
                                            if (e.target.files && e.target.files[0]) {
                                                handleCoverImageUpload(e.target.files[0]);
                                            }
                                        }}
                                    />
                                    <Button type="button" variant="outline" size="sm" onClick={() => document.getElementById('coverImageInput')?.click()}>
                                        Fotoğraf Değiştir
                                    </Button>
                                    <p className="text-xs text-gray-500 mt-1">Önerilen boyut: 1200x400px</p>
                                </div>
                            </div>
                        </div>

                        {/* Gallery Section */}
                        <div className="space-y-4 pt-4">
                            <div className="flex justify-between items-center">
                                <label className="block text-sm font-medium text-gray-700">Galeri</label>
                                <input
                                    type="file"
                                    id="galleryInput"
                                    className="hidden"
                                    multiple
                                    accept="image/*"
                                    onChange={(e) => {
                                        if (e.target.files && e.target.files.length > 0) {
                                            handleGalleryUpload(e.target.files);
                                        }
                                    }}
                                />
                                <Button type="button" variant="outline" size="sm" onClick={() => document.getElementById('galleryInput')?.click()}>
                                    + Fotoğraf Ekle
                                </Button>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {(getValues('images') || []).map((image, index) => (
                                    <div key={image.id || index} className="relative group aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                                        <img
                                            src={getImageUrl(image.url)}
                                            alt={`Gallery ${index}`}
                                            className="w-full h-full object-cover"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => handleDeleteGalleryImage(image.id)}
                                            className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                            title="Sil"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                ))}
                                {(getValues('images') || []).length === 0 && (
                                    <div className="col-span-2 md:col-span-4 p-8 bg-gray-50 rounded border border-dashed text-center text-gray-400 text-sm">
                                        Henüz fotoğraf yüklenmemiş.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t">
                        <Input
                            label="Dükkan Adı"
                            {...register('name', { required: 'Dükkan adı zorunludur' })}
                            error={errors.name?.message}
                            placeholder="Örn: Elite Hair Studio"
                        />

                        <div className="space-y-1.5 md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700">
                                Kategori <span className="text-xs font-normal text-gray-400">(Birden fazla seçebilirsiniz)</span>
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                {Object.entries(ShopCategoryLabels).map(([id, name]) => {
                                    const catId = Number(id);
                                    const selected = selectedCategories.includes(catId);
                                    return (
                                        <label
                                            key={id}
                                            className={`cursor-pointer flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${selected ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 text-gray-600 hover:border-primary-200 hover:bg-primary-50/50'}`}
                                            onClick={() => setSelectedCategories(prev =>
                                                selected ? prev.filter(c => c !== catId) : [...prev, catId]
                                            )}
                                        >
                                            <div className={`w-4 h-4 rounded flex-shrink-0 border-2 flex items-center justify-center ${selected ? 'bg-primary-500 border-primary-500' : 'border-gray-300'}`}>
                                                {selected && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                                            </div>
                                            {name}
                                        </label>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="space-y-1.5 md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Hizmet Verilen Cinsiyet
                            </label>
                            <div className="flex flex-wrap gap-4">
                                {[TargetGender.Kadin, TargetGender.Erkek, TargetGender.Unisex].map((gender) => (
                                    <label key={gender} className={`cursor-pointer flex items-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${watch('genderPreference')?.toString() === gender.toString() ? 'border-primary-600 bg-primary-50 text-primary-900' : 'border-gray-200 hover:border-primary-300'}`}>
                                        <input
                                            type="radio"
                                            value={gender.toString()}
                                            {...register('genderPreference', { required: 'Lütfen cinsiyet seçimi yapınız' })}
                                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                                        />
                                        <span className="font-medium text-sm">{TargetGenderLabels[gender]}</span>
                                    </label>
                                ))}
                            </div>
                            {errors.genderPreference && <p className="text-xs text-red-500 mt-1">{errors.genderPreference.message}</p>}
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-sm font-medium text-gray-700">
                                Telefon Numarası
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Phone className="h-4 w-4 text-gray-400" />
                                </div>
                                <input
                                    type="tel"
                                    {...register('phoneNumber', {
                                        required: 'Telefon Numarası zorunludur',
                                        pattern: {
                                            value: /^05\d{9}$/,
                                            message: 'Format 05XXXXXXXXX şeklinde olmalıdır'
                                        }
                                    })}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/\D/g, '').slice(0, 11);
                                        setValue('phoneNumber', val, { shouldValidate: true });
                                    }}
                                    className={`w-full pl-10 pr-3 py-2 rounded-lg border ${errors.phoneNumber ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all`}
                                    placeholder="05XXXXXXXXX"
                                    maxLength={11}
                                />
                            </div>
                            {errors.phoneNumber && <p className="text-xs text-red-500 mt-1">{errors.phoneNumber.message}</p>}
                            <p className="text-xs text-gray-400 mt-1">Format: 05XXXXXXXXX (11 digits)</p>
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
                            <textarea
                                {...register('description', { required: 'Açıklama zorunludur' })}
                                rows={4}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                                placeholder="Müşterilerinize salonunuzdan bahsedin..."
                            />
                            {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description.message}</p>}
                        </div>

                        <div className="md:col-span-2 border-t pt-4">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                                    <MapPin className="mr-2 h-5 w-5 text-gray-500" />
                                    Konum Detayları
                                </h3>
                            </div>

                            <div className="flex items-center gap-2 text-sm text-indigo-600 bg-indigo-50 px-4 py-3 rounded-xl border border-indigo-100 mb-4">
                                <MapPin className="h-4 w-4 flex-shrink-0" />
                                <span>İl ve ilçe seçtikten sonra mahalle listesi otomatik yüklenir.</span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
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
                                />
                            </div>

                            <div className="mb-4">
                                <SearchableSelect
                                    label="Mahalle"
                                    required
                                    options={neighborhoods}
                                    value={neighborhoods.find(n => n.name === watch('neighborhood'))?.id ?? ''}
                                    onChange={(val) => handleNeighborhoodChange(val)}
                                    placeholder="Mahalle Seçin"
                                    disabled={!selectedDistrictId || loadingNeighborhoods}
                                    loading={loadingNeighborhoods}
                                />
                            </div>

                            <div className="grid grid-cols-3 gap-4 mb-4">
                                <div className="col-span-2">
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Sokak / Cadde <span className="text-red-500">*</span></label>
                                    <input {...register('street', { required: 'Sokak/Cadde zorunludur' })} className="w-full px-4 py-2.5 rounded-lg border-2 border-gray-200 focus:border-primary-500 outline-none transition-all text-sm" placeholder="Atatürk Caddesi" />
                                    {errors.street && <p className="text-xs text-red-500 mt-1">{errors.street.message}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Bina No <span className="text-red-500">*</span></label>
                                    <input {...register('buildingNumber', { required: 'Bina No zorunludur' })} className="w-full px-4 py-2.5 rounded-lg border-2 border-gray-200 focus:border-primary-500 outline-none transition-all text-sm" placeholder="12B" />
                                    {errors.buildingNumber && <p className="text-xs text-red-500 mt-1">{errors.buildingNumber.message}</p>}
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Açık Adres <span className="text-red-500">*</span></label>
                                <textarea {...register('address', { required: 'Açık adres zorunludur' })} rows={3} className="w-full px-4 py-2.5 rounded-lg border-2 border-gray-200 focus:border-primary-500 outline-none transition-all text-sm" placeholder="Örn: Atatürk Cad. No:12B Kat:2, Karşıyaka AVM yanı, İzmir" />
                                {errors.address && <p className="text-xs text-red-500 mt-1">{errors.address.message}</p>}
                                <p className="text-xs text-gray-400 mt-1">Müşterinin kolayca bulabilmesi için tam adresi girin.</p>
                            </div>

                            <MapPicker
                                latitude={watch('latitude') ?? null}
                                longitude={watch('longitude') ?? null}
                                onLocationChange={(lat, lng) => { setValue('latitude', lat); setValue('longitude', lng); }}
                                city={watch('city')}
                                district={watch('district')}
                                neighborhood={watch('neighborhood')}
                                street={watch('street')}
                            />
                        </div>
                    </div>

                    {/* Working Hours */}
                    <div className="border-t pt-6 space-y-4">
                        <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                            <Clock className="h-5 w-5 text-gray-500" />
                            Genel Çalışma Saatleri
                        </h3>
                        <p className="text-sm text-gray-500">Salonunuzun genel açılış ve kapanış saatini girin (opsiyonel).</p>
                        <div className="grid grid-cols-2 gap-4 max-w-xs">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Açılış</label>
                                <input
                                    type="time"
                                    {...register('openTime')}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Kapanış</label>
                                <input
                                    type="time"
                                    {...register('closeTime')}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-sm"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100 flex justify-end">
                        <Button type="submit" isLoading={loading} size="lg">
                            Değişiklikleri Kaydet
                        </Button>
                    </div>
                </form>
            </div>

            {/* Closure Dates Section */}
            {shopId && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mt-6">
                    <div className="p-6 md:p-8">
                        <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2 mb-1">
                            <CalendarX className="h-5 w-5 text-gray-500" />
                            Kapalı Günler
                        </h3>
                        <p className="text-sm text-gray-500 mb-5">Salonunuzun kapalı olduğu özel günleri ekleyin (bayramlar, tatiller vb.). Bu günlerde müşteriler randevu alamaz.</p>

                        {/* Add new */}
                        <div className="flex flex-wrap gap-3 items-end mb-6">
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Tarih</label>
                                <input
                                    type="date"
                                    value={newClosureDate}
                                    min={new Date().toLocaleDateString('en-CA')}
                                    onChange={e => setNewClosureDate(e.target.value)}
                                    className="px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-sm"
                                />
                            </div>
                            <div className="flex-1 min-w-40">
                                <label className="block text-xs font-medium text-gray-600 mb-1">Açıklama (opsiyonel)</label>
                                <input
                                    type="text"
                                    value={newClosureReason}
                                    onChange={e => setNewClosureReason(e.target.value)}
                                    placeholder="Örn: 23 Nisan Ulusal Egemenlik"
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-sm"
                                />
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleAddClosureDate}
                                isLoading={addingClosure}
                                disabled={!newClosureDate}
                            >
                                + Ekle
                            </Button>
                        </div>

                        {/* List */}
                        {closureDates.length === 0 ? (
                            <div className="text-center py-8 text-gray-400 text-sm bg-gray-50 rounded-lg border border-dashed">
                                Henüz kapalı gün eklenmemiş.
                            </div>
                        ) : (
                            <ul className="divide-y divide-gray-100 border rounded-lg overflow-hidden">
                                {closureDates.map(c => (
                                    <li key={c.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50">
                                        <div>
                                            <span className="font-medium text-sm text-gray-800">
                                                {new Date(c.closureDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                                            </span>
                                            {c.reason && <span className="ml-3 text-xs text-gray-500">{c.reason}</span>}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveClosureDate(c.id)}
                                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Sil"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
