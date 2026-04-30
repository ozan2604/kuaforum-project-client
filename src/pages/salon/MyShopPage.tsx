import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useForm } from 'react-hook-form';
import { Button } from '../../components/Button';
import { shopService } from '../../api/shop.service';
import { toast } from 'react-hot-toast';
import { getApiError } from '../../utils/storage';
import {
    MapPin, Phone, Building2, Trash2, CalendarX, Clock,
    Camera, Store, ChevronDown, ChevronUp, ArrowRight, AlertTriangle
} from 'lucide-react';
import { SearchableSelect } from '../../components/SearchableSelect';
import { ShopCategoryLabels, TargetGender, TargetGenderLabels } from '../../types/shop';
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
    bookingDaysAhead?: number;
}

// Tracks the last successfully saved state per section — prevents cross-section contamination
interface ShopSnapshot {
    name: string;
    description: string;
    phoneNumber: string;
    genderPreference: number;
    categoryIds: number[];
    address: string;
    city: string;
    district: string;
    neighborhood: string;
    street: string;
    buildingNumber: string;
    latitude?: number;
    longitude?: number;
    openTime?: string;
    closeTime?: string;
    bookingDaysAhead?: number;
}

type ShopUpdatePayload = {
    name: string;
    description: string;
    phoneNumber: string;
    genderPreference: TargetGender;
    categoryIds: number[];
    address: string;
    city: string;
    district: string;
    neighborhood: string;
    street: string;
    buildingNumber: string;
    latitude?: number;
    longitude?: number;
    openTime?: string;
    closeTime?: string;
    bookingDaysAhead?: number;
};

interface ChangeItem {
    label: string;
    oldValue: string;
    newValue: string;
}

interface ConfirmUpdateState {
    section: 'info' | 'location' | 'hours';
    sectionLabel: string;
    changes: ChangeItem[];
    payload: ShopUpdatePayload;
}

interface AccordionCardProps {
    icon: React.ReactNode;
    iconBg: string;
    iconColor: string;
    title: string;
    subtitle?: string;
    isOpen: boolean;
    onToggle: () => void;
    children: React.ReactNode;
}

const AccordionCard: React.FC<AccordionCardProps> = ({
    icon, iconBg, iconColor, title, subtitle, isOpen, onToggle, children
}) => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-200">
        <div
            onClick={onToggle}
            className="p-5 sm:p-6 flex justify-between items-center hover:bg-gray-50 cursor-pointer transition-colors relative select-none"
        >
            <div className="flex items-center gap-3 pr-10">
                <div className={`p-2.5 ${iconBg} ${iconColor} rounded-xl shrink-0`}>
                    {icon}
                </div>
                <div>
                    <h2 className="text-base sm:text-lg font-bold text-gray-900">{title}</h2>
                    {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
                </div>
            </div>
            <div className="absolute right-5 sm:right-6 top-1/2 -translate-y-1/2 p-1 bg-gray-50 rounded-full text-gray-400">
                {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </div>
        </div>
        {isOpen && (
            <div className="px-5 pb-6 sm:px-6 sm:pb-6 pt-4 border-t border-gray-100 animate-in fade-in slide-in-from-top-4 duration-300">
                {children}
            </div>
        )}
    </div>
);

export const MyShopPage: React.FC = () => {
    const { register, formState: { errors }, reset, setValue, getValues, watch, trigger } =
        useForm<ShopFormData>();

    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [shopId, setShopId] = useState<string | null>(null);
    const [refreshImages, setRefreshImages] = useState(0);
    const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
    const [savedSnapshot, setSavedSnapshot] = useState<ShopSnapshot | null>(null);

    const [closureDates, setClosureDates] = useState<ShopClosureDateDto[]>([]);
    const [newClosureDate, setNewClosureDate] = useState('');
    const [newClosureReason, setNewClosureReason] = useState('');
    const [addingClosure, setAddingClosure] = useState(false);

    const [provinces, setProvinces] = useState<Province[]>([]);
    const [districts, setDistricts] = useState<{ id: number; name: string }[]>([]);
    const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
    const [loadingProvinces, setLoadingProvinces] = useState(false);
    const [loadingNeighborhoods, setLoadingNeighborhoods] = useState(false);
    const [selectedProvinceId, setSelectedProvinceId] = useState<number | null>(null);
    const [selectedDistrictId, setSelectedDistrictId] = useState<number | null>(null);

    const [confirmUpdate, setConfirmUpdate] = useState<ConfirmUpdateState | null>(null);

    const [openCards, setOpenCards] = useState({
        images: false,
        info: false,
        location: false,
        hours: false,
        closureDates: false,
        map: false,
    });

    const toggleCard = (card: keyof typeof openCards) =>
        setOpenCards(prev => ({ ...prev, [card]: !prev[card] }));

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
                    closeTime: shop.closeTime || '',
                    bookingDaysAhead: shop.bookingDaysAhead ?? 30,
                });

                setSelectedCategories(shop.categories ?? []);
                setClosureDates(shop.closureDates || []);

                setSavedSnapshot({
                    name: shop.name,
                    description: shop.description,
                    phoneNumber: shop.phoneNumber,
                    genderPreference: Number(shop.genderPreference),
                    categoryIds: shop.categories ?? [],
                    address: shop.address,
                    city: shop.city,
                    district: shop.district,
                    neighborhood: shop.neighborhood || '',
                    street: shop.street || '',
                    buildingNumber: shop.buildingNumber || '',
                    latitude: shop.latitude,
                    longitude: shop.longitude,
                    openTime: shop.openTime || '',
                    closeTime: shop.closeTime || '',
                    bookingDaysAhead: shop.bookingDaysAhead ?? 30,
                });

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

    // Computes the human-readable diff between current form values and the last saved snapshot
    const buildChanges = (section: 'info' | 'location' | 'hours', payload: ShopUpdatePayload): ChangeItem[] => {
        if (!savedSnapshot) return [];
        const snap = savedSnapshot;
        const items: ChangeItem[] = [];

        const fmt = (v: string | number | undefined | null): string => {
            if (v === undefined || v === null || v === '') return '(boş)';
            return String(v);
        };

        const check = (label: string, oldVal: unknown, newVal: unknown, format?: (v: unknown) => string) => {
            const f = format ?? ((v) => fmt(v as string | number | undefined | null));
            const o = f(oldVal);
            const n = f(newVal);
            if (o !== n) items.push({ label, oldValue: o, newValue: n });
        };

        if (section === 'info') {
            check('Dükkan Adı', snap.name, payload.name);
            check('Telefon Numarası', snap.phoneNumber, payload.phoneNumber);
            check('Cinsiyet Tercihi', snap.genderPreference, payload.genderPreference,
                v => TargetGenderLabels[v as TargetGender] ?? String(v));
            const catLabel = (ids: number[]) =>
                [...ids].sort((a, b) => a - b)
                    .map(id => (ShopCategoryLabels as Record<number, string>)[id] ?? String(id))
                    .join(', ') || '(boş)';
            if (catLabel(snap.categoryIds) !== catLabel(payload.categoryIds))
                items.push({ label: 'Kategoriler', oldValue: catLabel(snap.categoryIds), newValue: catLabel(payload.categoryIds) });
            check('Açıklama', snap.description, payload.description);
        }

        if (section === 'location') {
            check('İl', snap.city, payload.city);
            check('İlçe', snap.district, payload.district);
            check('Mahalle', snap.neighborhood, payload.neighborhood);
            check('Sokak / Cadde', snap.street, payload.street);
            check('Bina No', snap.buildingNumber, payload.buildingNumber);
            check('Açık Adres', snap.address, payload.address);
            const coordStr = (lat?: number, lng?: number) =>
                lat != null ? `${lat.toFixed(5)}, ${lng?.toFixed(5)}` : '(ayarlanmamış)';
            const oldCoord = coordStr(snap.latitude, snap.longitude);
            const newCoord = coordStr(payload.latitude, payload.longitude);
            if (oldCoord !== newCoord)
                items.push({ label: 'Harita Konumu', oldValue: oldCoord, newValue: newCoord });
        }

        if (section === 'hours') {
            check('Açılış Saati', snap.openTime, payload.openTime);
            check('Kapanış Saati', snap.closeTime, payload.closeTime);
            check('Randevu Alma Süresi', String(snap.bookingDaysAhead ?? 30) + ' gün', String(payload.bookingDaysAhead ?? 30) + ' gün');
        }

        return items;
    };

    // Step 1: validate → compute diff → open confirmation modal
    const handleSaveSection = async (section: 'info' | 'location' | 'hours') => {
        if (!savedSnapshot) return;

        const sectionFields: (keyof ShopFormData)[] =
            section === 'info'
                ? ['name', 'description', 'phoneNumber', 'genderPreference']
                : section === 'location'
                ? ['address', 'city', 'district', 'neighborhood', 'street', 'buildingNumber']
                : [];

        if (sectionFields.length > 0) {
            const isValid = await trigger(sectionFields);
            if (!isValid) return;
        }

        if (section === 'info' && selectedCategories.length === 0) {
            toast.error('En az bir kategori seçimi zorunludur.');
            return;
        }

        const values = getValues();

        const payload: ShopUpdatePayload = {
            name: section === 'info' ? values.name : savedSnapshot.name,
            description: section === 'info' ? values.description : savedSnapshot.description,
            phoneNumber: section === 'info' ? values.phoneNumber : savedSnapshot.phoneNumber,
            genderPreference: (section === 'info'
                ? Number(values.genderPreference)
                : savedSnapshot.genderPreference) as TargetGender,
            categoryIds: section === 'info' ? selectedCategories : savedSnapshot.categoryIds,
            address: section === 'location' ? values.address : savedSnapshot.address,
            city: section === 'location' ? values.city : savedSnapshot.city,
            district: section === 'location' ? values.district : savedSnapshot.district,
            neighborhood: section === 'location' ? values.neighborhood : savedSnapshot.neighborhood,
            street: section === 'location' ? values.street : savedSnapshot.street,
            buildingNumber: section === 'location' ? values.buildingNumber : savedSnapshot.buildingNumber,
            latitude: section === 'location'
                ? (values.latitude ? Number(values.latitude) : undefined)
                : savedSnapshot.latitude,
            longitude: section === 'location'
                ? (values.longitude ? Number(values.longitude) : undefined)
                : savedSnapshot.longitude,
            openTime: section === 'hours' ? values.openTime : savedSnapshot.openTime,
            closeTime: section === 'hours' ? values.closeTime : savedSnapshot.closeTime,
            bookingDaysAhead: section === 'hours' ? (Number(values.bookingDaysAhead) || 30) : (savedSnapshot.bookingDaysAhead ?? 30),
        };

        const changes = buildChanges(section, payload);

        if (changes.length === 0) {
            toast('Herhangi bir değişiklik yapılmadı.', { icon: 'ℹ️' });
            return;
        }

        const sectionLabel =
            section === 'info' ? 'Salon Bilgileri' :
            section === 'location' ? 'Konum Detayları' :
            'Çalışma Saatleri';

        setConfirmUpdate({ section, sectionLabel, changes, payload });
    };

    // Step 2: user confirmed — call API
    const handleConfirmUpdate = async () => {
        if (!confirmUpdate) return;
        const { section, payload } = confirmUpdate;

        setLoading(true);
        try {
            await shopService.update(payload);

            setSavedSnapshot(prev => {
                if (!prev) return prev;
                if (section === 'info') {
                    return { ...prev, name: payload.name, description: payload.description, phoneNumber: payload.phoneNumber, genderPreference: payload.genderPreference, categoryIds: payload.categoryIds };
                }
                if (section === 'location') {
                    return { ...prev, address: payload.address, city: payload.city, district: payload.district, neighborhood: payload.neighborhood, street: payload.street, buildingNumber: payload.buildingNumber, latitude: payload.latitude, longitude: payload.longitude };
                }
                return { ...prev, openTime: payload.openTime, closeTime: payload.closeTime, bookingDaysAhead: payload.bookingDaysAhead };
            });

            toast.success('Dükkan detayları başarıyla güncellendi');
            setConfirmUpdate(null);
        } catch (error: any) {
            console.error('Error updating shop:', error);
            let errorMessage = 'Dükkan güncellenemedi';
            if (error.response?.data?.errors) {
                errorMessage = Object.values(error.response.data.errors).flat().join('\n');
            } else if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            }
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

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
        } catch (err) {
            toast.error(getApiError(err, 'Kapak fotoğrafı yüklenemedi'));
        }
    };

    const handleGalleryUpload = async (files: FileList) => {
        if (!shopId) return;
        try {
            const toastId = toast.loading(`${files.length} fotoğraf yükleniyor...`);
            await shopService.uploadGalleryImages(shopId, Array.from(files));
            toast.dismiss(toastId);
            toast.success('Galeri fotoğrafları yüklendi');
            setRefreshImages(prev => prev + 1);
        } catch (err) {
            toast.error(getApiError(err, 'Galeri fotoğrafları yüklenemedi'));
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
        } catch (err) {
            toast.error(getApiError(err, 'Fotoğraf silinemedi'));
        }
    };

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

    if (initialLoading) {
        return (
            <div className="flex items-center justify-center min-h-64">
                <div className="text-center">
                    <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-sm text-gray-500">Dükkan bilgileri yükleniyor...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto pb-8">
            {/* Sayfa Başlığı */}
            <div className="flex items-center gap-3 mb-6">
                <Building2 className="h-7 w-7 text-primary-600 shrink-0" />
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Dükkan Profilim</h1>
                    <p className="text-sm text-gray-500">Dükkan bilgilerinizi buradan yönetebilirsiniz.</p>
                </div>
            </div>

            <form onSubmit={(e) => e.preventDefault()}>
                <div className="space-y-4">

                    {/* Kart 1: Salon Görselleri */}
                    <AccordionCard
                        icon={<Camera className="w-6 h-6" />}
                        iconBg="bg-purple-50"
                        iconColor="text-purple-600"
                        title="Salon Görselleri"
                        subtitle="Kapak ve galeri fotoğraflarını yönetin"
                        isOpen={openCards.images}
                        onToggle={() => toggleCard('images')}
                    >
                        <div className="space-y-5">
                            {/* Kapak Fotoğrafı */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-3">Kapak Fotoğrafı</label>
                                <div className="flex flex-col sm:flex-row items-start gap-4">
                                    <div className="w-full sm:w-52 h-28 bg-gray-100 rounded-xl overflow-hidden border border-gray-200 shrink-0">
                                        {getValues('coverImagePath') ? (
                                            <img
                                                src={getImageUrl(getValues('coverImagePath') || '')}
                                                alt="Kapak"
                                                className="w-full h-full object-cover"
                                                onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x150'; }}
                                            />
                                        ) : (
                                            <div className="flex flex-col items-center justify-center w-full h-full text-gray-300 gap-2">
                                                <Camera className="w-8 h-8" />
                                                <span className="text-xs">Fotoğraf Yok</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <input
                                            type="file"
                                            id="coverImageInput"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={(e) => { if (e.target.files?.[0]) handleCoverImageUpload(e.target.files[0]); }}
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => document.getElementById('coverImageInput')?.click()}
                                        >
                                            Fotoğraf Değiştir
                                        </Button>
                                        <p className="text-xs text-gray-400">Önerilen: 1200×400 piksel</p>
                                    </div>
                                </div>
                            </div>

                            {/* Galeri */}
                            <div className="border-t border-gray-100 pt-4">
                                <div className="flex justify-between items-center mb-3">
                                    <label className="block text-sm font-semibold text-gray-700">Galeri</label>
                                    <input
                                        type="file"
                                        id="galleryInput"
                                        className="hidden"
                                        multiple
                                        accept="image/*"
                                        onChange={(e) => { if (e.target.files && e.target.files.length > 0) handleGalleryUpload(e.target.files); }}
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => document.getElementById('galleryInput')?.click()}
                                    >
                                        + Fotoğraf Ekle
                                    </Button>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                    {(getValues('images') || []).map((image, index) => (
                                        <div
                                            key={image.id || index}
                                            className="relative group aspect-square bg-gray-100 rounded-xl overflow-hidden border border-gray-200"
                                        >
                                            <img
                                                src={getImageUrl(image.url)}
                                                alt={`Galeri ${index + 1}`}
                                                className="w-full h-full object-cover"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteGalleryImage(image.id)}
                                                className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    ))}
                                    {(getValues('images') || []).length === 0 && (
                                        <div className="col-span-2 sm:col-span-3 md:col-span-4 py-10 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 text-center text-gray-400 text-sm">
                                            Henüz galeri fotoğrafı yüklenmemiş.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </AccordionCard>

                    {/* Kart 2: Salon Bilgileri */}
                    <AccordionCard
                        icon={<Store className="w-6 h-6" />}
                        iconBg="bg-blue-50"
                        iconColor="text-blue-600"
                        title="Salon Bilgileri"
                        subtitle="Dükkan adı, kategori, cinsiyet tercihi ve açıklama"
                        isOpen={openCards.info}
                        onToggle={() => toggleCard('info')}
                    >
                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                    Dükkan Adı <span className="text-red-500">*</span>
                                </label>
                                <input
                                    {...register('name', { required: 'Dükkan adı zorunludur' })}
                                    className={`w-full px-4 py-2.5 rounded-xl border-2 ${errors.name ? 'border-red-400' : 'border-gray-200'} focus:border-primary-500 outline-none transition-all text-sm`}
                                    placeholder="Örn: Elite Hair Studio"
                                />
                                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                    Kategori{' '}
                                    <span className="text-xs font-normal text-gray-400">(Birden fazla seçebilirsiniz)</span>
                                </label>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                    {Object.entries(ShopCategoryLabels).map(([id, name]) => {
                                        const catId = Number(id);
                                        const selected = selectedCategories.includes(catId);
                                        return (
                                            <label
                                                key={id}
                                                className={`cursor-pointer flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${selected ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 text-gray-600 hover:border-primary-200 hover:bg-primary-50/50'}`}
                                                onClick={() =>
                                                    setSelectedCategories(prev =>
                                                        selected ? prev.filter(c => c !== catId) : [...prev, catId]
                                                    )
                                                }
                                            >
                                                <div className={`w-4 h-4 rounded flex-shrink-0 border-2 flex items-center justify-center ${selected ? 'bg-primary-500 border-primary-500' : 'border-gray-300'}`}>
                                                    {selected && (
                                                        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    )}
                                                </div>
                                                {name}
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                    Hizmet Verilen Cinsiyet <span className="text-red-500">*</span>
                                </label>
                                <div className="flex flex-wrap gap-3">
                                    {[TargetGender.Kadin, TargetGender.Erkek, TargetGender.Unisex].map((gender) => (
                                        <label
                                            key={gender}
                                            className={`cursor-pointer flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 transition-all ${watch('genderPreference')?.toString() === gender.toString() ? 'border-primary-600 bg-primary-50 text-primary-900' : 'border-gray-200 hover:border-primary-300'}`}
                                        >
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
                                {errors.genderPreference && (
                                    <p className="text-xs text-red-500 mt-1">{errors.genderPreference.message}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                    Telefon Numarası <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                        <Phone className="h-4 w-4 text-gray-400" />
                                    </div>
                                    <input
                                        type="tel"
                                        {...register('phoneNumber', {
                                            required: 'Telefon Numarası zorunludur',
                                            pattern: { value: /^05\d{9}$/, message: 'Format 05XXXXXXXXX şeklinde olmalıdır' },
                                        })}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/\D/g, '').slice(0, 11);
                                            setValue('phoneNumber', val, { shouldValidate: true });
                                        }}
                                        className={`w-full pl-10 pr-3 py-2.5 rounded-xl border-2 ${errors.phoneNumber ? 'border-red-400' : 'border-gray-200'} focus:border-primary-500 outline-none transition-all text-sm`}
                                        placeholder="05XXXXXXXXX"
                                        maxLength={11}
                                    />
                                </div>
                                {errors.phoneNumber && <p className="text-xs text-red-500 mt-1">{errors.phoneNumber.message}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                    Açıklama <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    {...register('description', { required: 'Açıklama zorunludur' })}
                                    rows={4}
                                    className={`w-full rounded-xl border-2 ${errors.description ? 'border-red-400' : 'border-gray-200'} px-4 py-2.5 text-sm focus:border-primary-500 outline-none transition-all`}
                                    placeholder="Müşterilerinize salonunuzdan bahsedin..."
                                />
                                {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description.message}</p>}
                            </div>

                            <div className="flex justify-end pt-1">
                                <Button type="button" onClick={() => handleSaveSection('info')} isLoading={loading}>
                                    Salon Bilgilerini Güncelle
                                </Button>
                            </div>
                        </div>
                    </AccordionCard>

                    {/* Kart 3: Konum Detayları */}
                    <AccordionCard
                        icon={<MapPin className="w-6 h-6" />}
                        iconBg="bg-emerald-50"
                        iconColor="text-emerald-600"
                        title="Konum Detayları"
                        subtitle="İl, ilçe, mahalle ve adres bilgileri"
                        isOpen={openCards.location}
                        onToggle={() => toggleCard('location')}
                    >
                        <div className="space-y-4">
                            <div className="flex items-start gap-2 text-sm text-indigo-600 bg-indigo-50 px-4 py-3 rounded-xl border border-indigo-100">
                                <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                                <span>İl ve ilçe seçtikten sonra mahalle listesi otomatik yüklenir.</span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <SearchableSelect
                                    label="İl"
                                    required
                                    options={provinces}
                                    value={selectedProvinceId}
                                    onChange={handleProvinceChange}
                                    placeholder="İl Seçin"
                                    loading={loadingProvinces}
                                />
                                <SearchableSelect
                                    label="İlçe"
                                    required
                                    options={districts}
                                    value={selectedDistrictId}
                                    onChange={handleDistrictChange}
                                    placeholder="İlçe Seçin"
                                    disabled={!selectedProvinceId}
                                />
                            </div>

                            <SearchableSelect
                                label="Mahalle"
                                required
                                options={neighborhoods}
                                value={neighborhoods.find(n => n.name === watch('neighborhood'))?.id ?? ''}
                                onChange={handleNeighborhoodChange}
                                placeholder="Mahalle Seçin"
                                disabled={!selectedDistrictId || loadingNeighborhoods}
                                loading={loadingNeighborhoods}
                            />

                            <div className="grid grid-cols-3 gap-3">
                                <div className="col-span-2">
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                        Sokak / Cadde <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        {...register('street', { required: 'Sokak/Cadde zorunludur' })}
                                        className={`w-full px-4 py-2.5 rounded-xl border-2 ${errors.street ? 'border-red-400' : 'border-gray-200'} focus:border-primary-500 outline-none transition-all text-sm`}
                                        placeholder="Atatürk Caddesi"
                                    />
                                    {errors.street && <p className="text-xs text-red-500 mt-1">{errors.street.message}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                        Bina No <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        {...register('buildingNumber', { required: 'Bina No zorunludur' })}
                                        className={`w-full px-4 py-2.5 rounded-xl border-2 ${errors.buildingNumber ? 'border-red-400' : 'border-gray-200'} focus:border-primary-500 outline-none transition-all text-sm`}
                                        placeholder="12B"
                                    />
                                    {errors.buildingNumber && <p className="text-xs text-red-500 mt-1">{errors.buildingNumber.message}</p>}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                    Açık Adres <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    {...register('address', { required: 'Açık adres zorunludur' })}
                                    rows={3}
                                    className={`w-full px-4 py-2.5 rounded-xl border-2 ${errors.address ? 'border-red-400' : 'border-gray-200'} focus:border-primary-500 outline-none transition-all text-sm`}
                                    placeholder="Örn: Atatürk Cad. No:12B Kat:2, Karşıyaka AVM yanı"
                                />
                                {errors.address && <p className="text-xs text-red-500 mt-1">{errors.address.message}</p>}
                                <p className="text-xs text-gray-400 mt-1">Müşterinin kolayca bulabilmesi için tam adresi girin.</p>
                            </div>

                            {/* Harita – ayrı açılır kart */}
                            <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
                                <div
                                    onClick={() => toggleCard('map')}
                                    className="flex justify-between items-center px-4 py-3 bg-white border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors select-none"
                                >
                                    <div className="flex items-center gap-2">
                                        <MapPin className="h-4 w-4 text-indigo-500" />
                                        <span className="text-sm font-semibold text-gray-700">Harita Konumu</span>
                                        <span className="text-xs text-gray-400 hidden sm:inline">(Opsiyonel)</span>
                                    </div>
                                    <div className="text-gray-400">
                                        {openCards.map
                                            ? <ChevronUp className="w-4 h-4" />
                                            : <ChevronDown className="w-4 h-4" />}
                                    </div>
                                </div>
                                {openCards.map && (
                                    <div className="p-3 sm:p-4 animate-in fade-in slide-in-from-top-4 duration-300">
                                        <MapPicker
                                            latitude={watch('latitude') ?? null}
                                            longitude={watch('longitude') ?? null}
                                            onLocationChange={(lat, lng) => {
                                                setValue('latitude', lat);
                                                setValue('longitude', lng);
                                            }}
                                            city={watch('city')}
                                            district={watch('district')}
                                            neighborhood={watch('neighborhood')}
                                            street={watch('street')}
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end pt-1">
                                <Button type="button" onClick={() => handleSaveSection('location')} isLoading={loading}>
                                    Konum Bilgilerini Güncelle
                                </Button>
                            </div>
                        </div>
                    </AccordionCard>

                    {/* Kart 4: Çalışma Saatleri */}
                    <AccordionCard
                        icon={<Clock className="w-6 h-6" />}
                        iconBg="bg-orange-50"
                        iconColor="text-orange-600"
                        title="Çalışma Saatleri"
                        subtitle="Salonunuzun genel açılış ve kapanış saatleri"
                        isOpen={openCards.hours}
                        onToggle={() => toggleCard('hours')}
                    >
                        <div className="space-y-5">
                            <p className="text-sm text-gray-500">
                                Salonunuzun genel açılış ve kapanış saatini girin (opsiyonel).
                            </p>
                            <div className="grid grid-cols-2 gap-4 max-w-xs">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Açılış</label>
                                    <input
                                        type="time"
                                        {...register('openTime')}
                                        className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-200 focus:border-primary-500 outline-none transition-all text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Kapanış</label>
                                    <input
                                        type="time"
                                        {...register('closeTime')}
                                        className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-200 focus:border-primary-500 outline-none transition-all text-sm"
                                    />
                                </div>
                            </div>
                            <div className="max-w-xs">
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                    Randevu Alma Süresi (Gün)
                                </label>
                                <p className="text-xs text-gray-400 mb-2">Müşteriler bugünden kaç gün sonrasına kadar randevu alabilir?</p>
                                <input
                                    type="number"
                                    min={1}
                                    max={365}
                                    {...register('bookingDaysAhead', { valueAsNumber: true })}
                                    className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-200 focus:border-primary-500 outline-none transition-all text-sm"
                                    placeholder="30"
                                />
                            </div>
                            <div className="flex justify-end">
                                <Button type="button" onClick={() => handleSaveSection('hours')} isLoading={loading}>
                                    Çalışma Saatlerini Güncelle
                                </Button>
                            </div>
                        </div>
                    </AccordionCard>

                </div>
            </form>

            {/* Kart 5: Kapalı Günler */}
            {shopId && (
                <div className="mt-4">
                    <AccordionCard
                        icon={<CalendarX className="w-6 h-6" />}
                        iconBg="bg-rose-50"
                        iconColor="text-rose-600"
                        title="Kapalı Günler"
                        subtitle="Bayram, tatil gibi özel kapalı günleri yönetin"
                        isOpen={openCards.closureDates}
                        onToggle={() => toggleCard('closureDates')}
                    >
                        <div className="space-y-5">
                            <p className="text-sm text-gray-500">
                                Bu günlerde müşteriler randevu alamaz.
                            </p>

                            <div className="flex flex-wrap gap-3 items-end">
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Tarih</label>
                                    <input
                                        type="date"
                                        value={newClosureDate}
                                        min={new Date().toLocaleDateString('en-CA')}
                                        onChange={e => setNewClosureDate(e.target.value)}
                                        className="px-3 py-2.5 rounded-xl border-2 border-gray-200 focus:border-primary-500 outline-none transition-all text-sm"
                                    />
                                </div>
                                <div className="flex-1 min-w-40">
                                    <label className="block text-xs font-medium text-gray-600 mb-1">
                                        Açıklama (opsiyonel)
                                    </label>
                                    <input
                                        type="text"
                                        value={newClosureReason}
                                        onChange={e => setNewClosureReason(e.target.value)}
                                        placeholder="Örn: 23 Nisan Ulusal Egemenlik"
                                        className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-200 focus:border-primary-500 outline-none transition-all text-sm"
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

                            {closureDates.length === 0 ? (
                                <div className="text-center py-8 text-gray-400 text-sm bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                                    Henüz kapalı gün eklenmemiş.
                                </div>
                            ) : (
                                <ul className="divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden">
                                    {closureDates.map(c => (
                                        <li
                                            key={c.id}
                                            className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
                                        >
                                            <div>
                                                <span className="font-medium text-sm text-gray-800">
                                                    {new Date(c.closureDate).toLocaleDateString('tr-TR', {
                                                        day: 'numeric',
                                                        month: 'long',
                                                        year: 'numeric',
                                                    })}
                                                </span>
                                                {c.reason && (
                                                    <span className="ml-3 text-xs text-gray-500">{c.reason}</span>
                                                )}
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveClosureDate(c.id)}
                                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </AccordionCard>
                </div>
            )}
            {/* ── Değişiklik Onay Modalı ── */}
            {confirmUpdate && createPortal(
                <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col">
                        {/* Modal header */}
                        <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
                            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl shrink-0">
                                <AlertTriangle className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-gray-900">Değişiklikleri Onayla</h3>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    <span className="font-medium text-gray-700">{confirmUpdate.sectionLabel}</span> bölümünde {confirmUpdate.changes.length} değişiklik tespit edildi
                                </p>
                            </div>
                        </div>

                        {/* Change list */}
                        <div className="overflow-y-auto px-6 py-4 space-y-3 flex-1">
                            {confirmUpdate.changes.map((change, i) => (
                                <div key={i} className="rounded-xl border border-gray-100 bg-gray-50 overflow-hidden">
                                    <div className="px-3 pt-2.5 pb-1">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                            {change.label}
                                        </span>
                                    </div>
                                    <div className="flex items-stretch gap-2 px-3 pb-3">
                                        <div className="flex-1 min-w-0 bg-white border border-red-100 rounded-lg px-3 py-2">
                                            <p className="text-xs text-gray-400 font-medium mb-0.5">Mevcut</p>
                                            <p className="text-sm text-gray-600 break-words line-clamp-3">{change.oldValue}</p>
                                        </div>
                                        <div className="flex items-center shrink-0 text-gray-300">
                                            <ArrowRight className="w-4 h-4" />
                                        </div>
                                        <div className="flex-1 min-w-0 bg-primary-50 border border-primary-200 rounded-lg px-3 py-2">
                                            <p className="text-xs text-primary-500 font-medium mb-0.5">Yeni</p>
                                            <p className="text-sm text-primary-800 font-semibold break-words line-clamp-3">{change.newValue}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 justify-end px-6 py-4 border-t border-gray-100 bg-gray-50/60 rounded-b-2xl">
                            <button
                                onClick={() => setConfirmUpdate(null)}
                                disabled={loading}
                                className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition-colors disabled:opacity-50"
                            >
                                Vazgeç
                            </button>
                            <button
                                onClick={handleConfirmUpdate}
                                disabled={loading}
                                className="px-5 py-2.5 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition-colors disabled:opacity-60 flex items-center gap-2"
                            >
                                {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                                Evet, Güncelle
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};
