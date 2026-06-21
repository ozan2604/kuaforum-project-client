import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useForm } from 'react-hook-form';
import { Button } from '../../components/Button';
import { shopService } from '../../api/shop.service';
import { useSalon } from '../../context/SalonContext';
import { toast } from 'react-hot-toast';
import { getApiError } from '../../utils/storage';
import {
    MapPin, Phone, Building2, Trash2, CalendarX, Clock,
    Camera, Store, ChevronDown, ChevronUp, ArrowRight, AlertTriangle, CalendarClock, UserX,
    Scissors, Users, CheckCircle, CheckCircle2, Circle, Video, Plus, X as XIcon
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ServicesPage } from './ServicesPage';
import { EmployeesPage } from './EmployeesPage';
import { SearchableSelect } from '../../components/SearchableSelect';
import { ShopCategoryLabels, ShopType, TargetGender, TargetGenderLabels } from '../../types/shop';
import type { ShopClosureDateDto, ServiceAreaDto } from '../../types/shop';
import MapPicker from '../../components/MapPicker';
import { employeeService } from '../../api/employee.service';
import type { Employee, EmployeeLeaveDate } from '../../types/employee';
import { DEFAULT_SALON_COVER } from '../../constants/images';
import api from '../../api/axios';

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
    promoVideoUrl?: string;
    videos?: import('../../types/shop').ShopVideo[];
    images?: { id: string; url: string; tags: { id: string; name: string }[] }[];
    genderPreference: TargetGender;
    openTime?: string;
    closeTime?: string;
    bookingDaysAhead?: number;
    cancellationHours?: number;
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
    cancellationHours?: number;
    weeklyOffDays: number[];
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
    cancellationHours?: number;
    weeklyOffDays?: number[];
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
    infoText?: string;
    onInfoClick?: () => void;
}

const AccordionCard: React.FC<AccordionCardProps> = ({
    icon, iconBg, iconColor, title, subtitle, isOpen, onToggle, children, infoText, onInfoClick
}) => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-200">
        <div
            onClick={onToggle}
            className="p-5 sm:p-6 flex justify-between items-center hover:bg-gray-50 cursor-pointer transition-colors relative select-none"
        >
            <div className="flex items-center gap-3 pr-20">
                <div className={`p-2.5 ${iconBg} ${iconColor} rounded-xl shrink-0`}>
                    {icon}
                </div>
                <div>
                    <h2 className="text-base sm:text-lg font-bold text-gray-900">{title}</h2>
                    {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
                </div>
            </div>
            <div className="absolute right-5 sm:right-6 top-1/2 -translate-y-1/2 flex items-center gap-2">
                {infoText && onInfoClick && (
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onInfoClick(); }}
                        className="w-5 h-5 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center text-[11px] font-bold hover:bg-amber-200 transition-colors flex-shrink-0 leading-none"
                        title="Bu bölüm hakkında bilgi al"
                    >
                        !
                    </button>
                )}
                <div className="p-1 bg-gray-50 rounded-full text-gray-400">
                    {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </div>
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
    const { currentShop, refresh: refreshContext } = useSalon();
    const shopId = currentShop?.id ?? null;

    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [refreshImages, setRefreshImages] = useState(0);
    const [tagInputs, setTagInputs] = useState<Record<string, string>>({});
    const watchedImages = watch('images') || [];
    const watchedVideos = watch('videos') || [];
    const [editingTag, setEditingTag] = useState<{ tagId: string; name: string } | null>(null);
    const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
    const [savedSnapshot, setSavedSnapshot] = useState<ShopSnapshot | null>(null);
    const [setupStatus, setSetupStatus] = useState<any>(null);
    const [deleteImageId, setDeleteImageId] = useState<string | null>(null);
    const [deletingCover, setDeletingCover] = useState(false);

    const [deleteCoverConfirm, setDeleteCoverConfirm] = useState(false);

    const [uploadingVideo, setUploadingVideo] = useState(false);
    const [videoError, setVideoError] = useState(false);
    const [deleteVideoConfirm, setDeleteVideoConfirm] = useState(false);

    const [weeklyOffDays, setWeeklyOffDays] = useState<number[]>([]);

    const [closureDates, setClosureDates] = useState<ShopClosureDateDto[]>([]);
    const [newClosureDate, setNewClosureDate] = useState('');
    const [newClosureReason, setNewClosureReason] = useState('');
    const [addingClosure, setAddingClosure] = useState(false);

    // Employee leave dates
    const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
    const [selectedLeaveEmployee, setSelectedLeaveEmployee] = useState<Employee | null>(null);
    const [employeeLeaveDates, setEmployeeLeaveDates] = useState<EmployeeLeaveDate[]>([]);
    const [newLeaveDate, setNewLeaveDate] = useState('');
    const [newLeaveReason, setNewLeaveReason] = useState('');
    const [addingLeave, setAddingLeave] = useState(false);
    const [loadingLeaveDates, setLoadingLeaveDates] = useState(false);
    const [leaveDateToDelete, setLeaveDateToDelete] = useState<EmployeeLeaveDate | null>(null);

    const [provinces, setProvinces] = useState<Province[]>([]);
    const [districts, setDistricts] = useState<{ id: number; name: string }[]>([]);
    const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
    const [loadingProvinces, setLoadingProvinces] = useState(false);
    const [loadingNeighborhoods, setLoadingNeighborhoods] = useState(false);
    const [selectedProvinceId, setSelectedProvinceId] = useState<number | null>(null);
    const [selectedDistrictId, setSelectedDistrictId] = useState<number | null>(null);

    const [confirmUpdate, setConfirmUpdate] = useState<ConfirmUpdateState | null>(null);
    const [infoPopup, setInfoPopup] = useState<string | null>(null);

    const [shopType, setShopType] = useState<ShopType>(ShopType.Fixed);
    const [serviceAreas, setServiceAreas] = useState<ServiceAreaDto[]>([]);
    const [savedServiceAreas, setSavedServiceAreas] = useState<ServiceAreaDto[]>([]);
    const [newArea, setNewArea] = useState<ServiceAreaDto>({ city: '', district: '', neighborhood: '' });
    const [savingServiceAreas, setSavingServiceAreas] = useState(false);

    const [openCards, setOpenCards] = useState({
        setup: false,
        images: false,
        info: false,
        location: false,
        serviceAreas: false,
        services: false,
        employees: false,
        hours: false,
        closureDates: false,
        map: false,
        employeeLeave: false,
    });

    const toggleCard = (card: keyof typeof openCards) =>
        setOpenCards(prev => ({ ...prev, [card]: !prev[card] }));

    // ─── UNSAVED CHANGES TRACKING ────────────────────────────────────────────

    const watchedValues = watch();

    const infoIsDirty = useMemo(() => {
        if (!savedSnapshot) return false;
        const v = watchedValues;
        const catA = [...selectedCategories].sort().join(',');
        const catB = [...savedSnapshot.categoryIds].sort().join(',');
        return (
            v.name !== savedSnapshot.name ||
            v.description !== savedSnapshot.description ||
            v.phoneNumber !== savedSnapshot.phoneNumber ||
            Number(v.genderPreference) !== savedSnapshot.genderPreference ||
            catA !== catB
        );
    }, [watchedValues, savedSnapshot, selectedCategories]);

    const locationIsDirty = useMemo(() => {
        if (!savedSnapshot) return false;
        const v = watchedValues;
        return (
            v.city !== savedSnapshot.city ||
            v.district !== savedSnapshot.district ||
            v.neighborhood !== savedSnapshot.neighborhood ||
            v.street !== savedSnapshot.street ||
            v.buildingNumber !== savedSnapshot.buildingNumber ||
            v.address !== savedSnapshot.address ||
            (v.latitude ?? null) !== (savedSnapshot.latitude ?? null) ||
            (v.longitude ?? null) !== (savedSnapshot.longitude ?? null)
        );
    }, [watchedValues, savedSnapshot]);

    const hoursIsDirty = useMemo(() => {
        if (!savedSnapshot) return false;
        const v = watchedValues;
        const wA = [...weeklyOffDays].sort().join(',');
        const wB = [...(savedSnapshot.weeklyOffDays ?? [])].sort().join(',');
        return (
            v.openTime !== savedSnapshot.openTime ||
            v.closeTime !== savedSnapshot.closeTime ||
            Number(v.bookingDaysAhead) !== (savedSnapshot.bookingDaysAhead ?? 30) ||
            Number(v.cancellationHours) !== (savedSnapshot.cancellationHours ?? 2) ||
            wA !== wB
        );
    }, [watchedValues, savedSnapshot, weeklyOffDays]);

    const anyDirty = infoIsDirty || locationIsDirty || hoursIsDirty;
    const [navTarget, setNavTarget] = useState<string | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (anyDirty) {
                e.preventDefault();
                e.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [anyDirty]);

    // Uygulama içi tıklamaları yakala (sidebar linkleri)
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (!anyDirty) return;
            const anchor = (e.target as HTMLElement).closest('a[href]') as HTMLAnchorElement | null;
            if (!anchor) return;
            const href = anchor.getAttribute('href') ?? '';
            if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto')) return;
            const currentPath = window.location.pathname;
            if (href === currentPath) return;
            e.preventDefault();
            e.stopPropagation();
            setNavTarget(href);
        };
        document.addEventListener('click', handleClick, true);
        return () => document.removeEventListener('click', handleClick, true);
    }, [anyDirty]);

    // ─────────────────────────────────────────────────────────────────────────

    useEffect(() => {
        loadProvinces();
    }, []);

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

    useEffect(() => {
        if (!shopId) return;
        const fetchShop = async () => {
            try {
                const shop = await shopService.getPublicShopById(shopId);

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
                    promoVideoUrl: shop.promoVideoUrl,
                    videos: shop.videos || [],
                    images: shop.images || [],
                    genderPreference: shop.genderPreference?.toString() as any,
                    openTime: shop.openTime || '',
                    closeTime: shop.closeTime || '',
                    bookingDaysAhead: shop.bookingDaysAhead ?? 30,
                    cancellationHours: shop.cancellationHours ?? 2,
                });

                setSelectedCategories(shop.categories ?? []);
                setClosureDates(shop.closureDates || []);
                setWeeklyOffDays(shop.weeklyOffDays ?? []);
                setShopType(shop.shopType ?? ShopType.Fixed);
                setServiceAreas(shop.serviceAreas ?? []);
                setSavedServiceAreas(shop.serviceAreas ?? []);


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
                    cancellationHours: shop.cancellationHours ?? 2,
                    weeklyOffDays: shop.weeklyOffDays ?? [],
                });

                if (shop.city) {
                    const res = await api.get('/location/provinces');
                    const provs: Province[] = res.data?.data || [];
                    const prov = provs.find((p: Province) => p.name === shop.city);
                    if (prov) {
                        setSelectedProvinceId(prov.id);
                        setDistricts(prov.districts || []);
                        const dist = prov.districts.find((d: any) => d.name === shop.district);
                        if (dist) {
                            setSelectedDistrictId(dist.id);
                            const nRes = await api.get(`/location/neighborhoods?districtId=${dist.id}`);
                            setNeighborhoods(nRes.data?.data || []);
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
        shopService.getDashboardStats(shopId)
            .then(data => setSetupStatus(data.setupStatus))
            .catch(() => {});
    }, [shopId, reset, refreshImages]);

    // Reset employee leave-date selections when shop changes
    useEffect(() => {
        setAllEmployees([]);
        setSelectedLeaveEmployee(null);
        setEmployeeLeaveDates([]);
    }, [shopId]);

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

        const DAY_TR = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
        const fmtOffDays = (days: number[]) =>
            days.length === 0 ? 'Yok' : [...days].sort((a, b) => a - b).map(d => DAY_TR[d]).join(', ');

        if (section === 'hours') {
            check('Açılış Saati', snap.openTime, payload.openTime);
            check('Kapanış Saati', snap.closeTime, payload.closeTime);
            check('Randevu Alma Süresi', String(snap.bookingDaysAhead ?? 30) + ' gün', String(payload.bookingDaysAhead ?? 30) + ' gün');
            check('Min. İptal Süresi', String(snap.cancellationHours ?? 2) + ' saat', String(payload.cancellationHours ?? 2) + ' saat');
            const oldOff = fmtOffDays(snap.weeklyOffDays ?? []);
            const newOff = fmtOffDays(payload.weeklyOffDays ?? []);
            if (oldOff !== newOff) items.push({ label: 'Haftalık Tatil Günleri', oldValue: oldOff, newValue: newOff });
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
            cancellationHours: section === 'hours' ? (Number(values.cancellationHours) ?? 2) : (savedSnapshot.cancellationHours ?? 2),
            weeklyOffDays: section === 'hours' ? weeklyOffDays : savedSnapshot.weeklyOffDays,
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

        if (!shopId) return;
        setLoading(true);
        try {
            await shopService.update(shopId, payload);
            refreshContext();

            setSavedSnapshot(prev => {
                if (!prev) return prev;
                if (section === 'info') {
                    return { ...prev, name: payload.name, description: payload.description, phoneNumber: payload.phoneNumber, genderPreference: payload.genderPreference, categoryIds: payload.categoryIds };
                }
                if (section === 'location') {
                    return { ...prev, address: payload.address, city: payload.city, district: payload.district, neighborhood: payload.neighborhood, street: payload.street, buildingNumber: payload.buildingNumber, latitude: payload.latitude, longitude: payload.longitude };
                }
                return { ...prev, openTime: payload.openTime, closeTime: payload.closeTime, bookingDaysAhead: payload.bookingDaysAhead, cancellationHours: payload.cancellationHours ?? 2, weeklyOffDays: payload.weeklyOffDays ?? [] };
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

    const handleSaveServiceAreas = async () => {
        if (!shopId || !savedSnapshot) return;
        if (serviceAreas.length === 0) {
            toast.error('En az bir hizmet bölgesi eklemelisiniz.');
            return;
        }
        setSavingServiceAreas(true);
        try {
            await shopService.update(shopId, {
                name: savedSnapshot.name,
                description: savedSnapshot.description,
                phoneNumber: savedSnapshot.phoneNumber,
                genderPreference: savedSnapshot.genderPreference as TargetGender,
                categoryIds: savedSnapshot.categoryIds,
                address: savedSnapshot.address || '',
                city: savedSnapshot.city || '',
                district: savedSnapshot.district || '',
                shopType: ShopType.Mobile,
                serviceAreas,
            });
            setSavedServiceAreas(serviceAreas);
            toast.success('Hizmet bölgeleri güncellendi');
        } catch {
            toast.error('Hizmet bölgeleri güncellenemedi');
        } finally {
            setSavingServiceAreas(false);
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
        setValue('neighborhood', n.name);
    };

    const handleCoverImageUpload = async (file: File) => {
        if (!shopId) return;
        if (file.size > 15 * 1024 * 1024) {
            toast.error('Dosya boyutu 15 MB\'ı geçemez.');
            return;
        }
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
        const oversized = Array.from(files).some(f => f.size > 15 * 1024 * 1024);
        if (oversized) {
            toast.error('Her fotoğraf en fazla 15 MB olabilir.');
            return;
        }
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

    const handleDeleteCoverImage = async () => {
        if (!shopId) return;
        setDeletingCover(true);
        try {
            await shopService.deleteCoverImage(shopId);
            setValue('coverImagePath', '');
            toast.success('Kapak fotoğrafı silindi');
            setRefreshImages(prev => prev + 1);
        } catch (err) {
            toast.error(getApiError(err, 'Fotoğraf silinemedi.'));
        } finally {
            setDeletingCover(false);
        }
    };

    const handleShopVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        // Dosya seçimi sıfırla ki aynı dosyayı tekrar seçebilsin
        e.target.value = '';
        
        if (!file || !shopId) return;

        // Size validation (150MB)
        if (file.size > 150 * 1024 * 1024) {
            toast.error('Video boyutu en fazla 150MB olabilir.');
            return;
        }

        const uploadVideoFile = async () => {
            try {
                setUploadingVideo(true);
                const toastId = toast.loading('Tanıtım videosu yükleniyor, bu işlem biraz sürebilir...');
                await shopService.uploadShopVideo(shopId, file);
                toast.dismiss(toastId);
                toast.success('Tanıtım videosu başarıyla yüklendi!');
                setRefreshImages(prev => prev + 1);
            } catch (err) {
                toast.error(getApiError(err, 'Video yüklenemedi.'));
            } finally {
                setUploadingVideo(false);
            }
        };

        // Duration validation (90 seconds)
        const videoElement = document.createElement('video');
        videoElement.preload = 'metadata';
        
        videoElement.onloadedmetadata = async () => {
            window.URL.revokeObjectURL(videoElement.src);
            if (videoElement.duration > 90) {
                toast.error('Video uzunluğu en fazla 90 saniye olabilir.');
                return;
            }
            await uploadVideoFile();
        };

        videoElement.onerror = async () => {
            window.URL.revokeObjectURL(videoElement.src);
            // Tarayıcı videoyu okuyamazsa (ör. desteklenmeyen format), yine de yüklemeyi dene
            console.warn("Video metadata could not be read. Proceeding with upload anyway.");
            await uploadVideoFile();
        };

        videoElement.src = URL.createObjectURL(file);
    };

    const handleDeleteShopVideo = async (id: string) => {
        try {
            const toastId = toast.loading('Video siliniyor...');
            await shopService.deleteShopVideo(id);
            toast.dismiss(toastId);
            toast.success('Tanıtım videosu silindi.');
            setRefreshImages(prev => prev + 1);
        } catch (err) {
            toast.error(getApiError(err, 'Video silinemedi.'));
        }
    };



    const handleDeleteGalleryImage = async (imageId: string) => {
        if (!shopId) return;
        setDeleteImageId(imageId);
    };

    const confirmDeleteGalleryImage = async () => {
        if (!deleteImageId) return;
        const id = deleteImageId;
        setDeleteImageId(null);
        try {
            const toastId = toast.loading('Fotoğraf siliniyor...');
            await shopService.deleteGalleryImage(id);
            toast.dismiss(toastId);
            toast.success('Fotoğraf silindi');
            setRefreshImages(prev => prev + 1);
        } catch (err) {
            toast.error(getApiError(err, 'Fotoğraf silinemedi'));
        }
    };

    const TAG_LIMIT = 10;

    const handleAddTag = async (imageId: string) => {
        const name = (tagInputs[imageId] || '').trim();
        if (!name) return;
        const currentTags = (getValues('images') || []).find(img => img.id === imageId)?.tags || [];
        if (currentTags.length >= TAG_LIMIT) {
            toast.error(`Bir fotoğrafa en fazla ${TAG_LIMIT} etiket eklenebilir`);
            return;
        }
        try {
            const tag = await shopService.addImageTag(imageId, name);
            setValue('images', (getValues('images') || []).map(img =>
                img.id === imageId ? { ...img, tags: [...(img.tags || []), tag] } : img
            ));
            setTagInputs(prev => ({ ...prev, [imageId]: '' }));
        } catch {
            toast.error('Etiket eklenemedi');
        }
    };

    const handleUpdateTag = async (imageId: string, tagId: string, name: string) => {
        const trimmed = name.trim();
        if (!trimmed) return;
        try {
            await shopService.updateImageTag(tagId, trimmed);
            setValue('images', (getValues('images') || []).map(img =>
                img.id === imageId
                    ? { ...img, tags: img.tags.map(t => t.id === tagId ? { ...t, name: trimmed } : t) }
                    : img
            ));
            setEditingTag(null);
        } catch {
            toast.error('Etiket güncellenemedi');
        }
    };

    const handleDeleteTag = async (imageId: string, tagId: string) => {
        try {
            await shopService.deleteImageTag(tagId);
            setValue('images', (getValues('images') || []).map(img =>
                img.id === imageId ? { ...img, tags: img.tags.filter(t => t.id !== tagId) } : img
            ));
        } catch {
            toast.error('Etiket silinemedi');
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

    // ─── EMPLOYEE LEAVE DATE HANDLERS ────────────────────────────────────────

    const loadAllEmployees = async () => {
        if (!shopId) return;
        try {
            const data = await employeeService.getEmployees(shopId);
            setAllEmployees(data.filter(e => !e.isDeleted && e.isActive));
        } catch {
            toast.error('Çalışanlar yüklenemedi.');
        }
    };

    const handleSelectLeaveEmployee = async (emp: Employee) => {
        if (!shopId) return;
        setSelectedLeaveEmployee(emp);
        setLoadingLeaveDates(true);
        try {
            const data = await employeeService.getLeaveDates(shopId, emp.id);
            setEmployeeLeaveDates(data);
        } catch {
            toast.error('İzin günleri yüklenemedi.');
        } finally {
            setLoadingLeaveDates(false);
        }
    };

    const handleAddLeaveDate = async () => {
        if (!selectedLeaveEmployee || !newLeaveDate || !shopId) return;
        setAddingLeave(true);
        try {
            await employeeService.addLeaveDate(shopId, selectedLeaveEmployee.id, newLeaveDate, newLeaveReason || undefined);
            const updated = await employeeService.getLeaveDates(shopId, selectedLeaveEmployee.id);
            setEmployeeLeaveDates(updated);
            setNewLeaveDate('');
            setNewLeaveReason('');
            toast.success('İzin günü eklendi.');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'İzin günü eklenemedi.');
        } finally {
            setAddingLeave(false);
        }
    };

    const handleRemoveLeaveDate = async (id: string) => {
        if (!shopId) return;
        try {
            await employeeService.removeLeaveDate(shopId, id);
            setEmployeeLeaveDates(prev => prev.filter(l => l.id !== id));
            toast.success('İzin günü silindi.');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'İzin günü silinemedi.');
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

            <div>
                <div className="space-y-4">

                    {/* Kart 0: Salon Kurulum Durumu */}
                    {setupStatus && setupStatus.completionPercentage < 100 && (() => {
                        const s = setupStatus;
                        const pct: number = s.completionPercentage;
                        const steps = [
                            { label: 'Salon adı ve açıklama',            done: s.hasName && s.hasDescription },
                            { label: 'Kapak fotoğrafı',                  done: s.hasCoverImage },
                            { label: 'Kategori seçimi',                  done: s.hasCategories },
                            { label: 'Konum bilgisi (şehir & adres)',    done: s.hasLocation },
                            { label: 'Genel çalışma saatleri',           done: s.hasOpeningHours },
                            { label: 'En az 1 aktif hizmet',             done: s.hasActiveServices },
                            { label: 'En az 1 aktif uzman',              done: s.hasActiveEmployees },
                            { label: 'Uzmanlara hizmet atandı',          done: s.hasEmployeeServices },
                            { label: 'Uzman çalışma saatleri ayarlandı', done: s.hasEmployeeSchedules },
                        ];
                        return (
                            <div className={`bg-white border rounded-2xl shadow-sm overflow-hidden ${pct >= 80 ? 'border-green-100' : 'border-red-100'}`}>
                                <button
                                    type="button"
                                    onClick={() => toggleCard('setup')}
                                    className={`w-full px-5 py-4 flex items-center gap-3 transition-colors ${pct >= 80 ? 'hover:bg-green-50/40' : 'hover:bg-red-50/40'}`}
                                >
                                    <div className={`p-2 rounded-xl shrink-0 ${pct >= 80 ? 'bg-green-50' : 'bg-red-50'}`}>
                                        <CheckCircle2 className={`w-5 h-5 ${pct >= 80 ? 'text-green-600' : 'text-red-500'}`} />
                                    </div>
                                    <div className="flex-1 text-left">
                                        <h3 className="text-sm font-bold text-gray-900">Salon Kurulumu</h3>
                                        {pct < 80 ? (
                                            <p className="text-xs text-red-400 font-medium">⚠ Salonunuz henüz yeterince tamamlanmadı, müşteriler göremeyebilir</p>
                                        ) : (
                                            <p className="text-xs text-gray-400">Salonunuzu tamamlamak için aşağıdaki adımları takip edin</p>
                                        )}
                                    </div>
                                    <span className={`text-sm font-bold mr-2 ${pct >= 80 ? 'text-green-600' : 'text-red-500'}`}>{pct}%</span>
                                    {openCards.setup ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                                </button>
                                <div className="h-1.5 bg-gray-100">
                                    <div className={`h-full transition-all duration-500 ${pct >= 80 ? 'bg-green-500' : 'bg-red-500'}`} style={{ width: `${pct}%` }} />
                                </div>
                                {openCards.setup && (
                                    <div className="px-5 py-3 divide-y divide-gray-50">
                                        {steps.map((step, i) => (
                                            <div key={i} className="flex items-center gap-3 py-2.5">
                                                {step.done
                                                    ? <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                                                    : <Circle className="w-4 h-4 text-gray-300 shrink-0" />
                                                }
                                                <span className={`flex-1 text-sm ${step.done ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                                                    {step.label}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })()}

                    {/* Kart 1: Salon Görselleri */}
                    <AccordionCard
                        icon={<Camera className="w-6 h-6" />}
                        iconBg="bg-purple-50"
                        iconColor="text-purple-600"
                        title="Salon Görselleri"
                        subtitle="Kapak ve galeri fotoğraflarını yönetin"
                        isOpen={openCards.images}
                        onToggle={() => toggleCard('images')}
                        infoText="Kapak fotoğrafı, müşterilerin sizi keşfettiğinde gördüğü ilk görseldir. Galeri fotoğraflarına etiket ekleyerek (örn. 'saç boyama', 'erkek kesim') içerik aramasında öne çıkabilirsiniz."
                        onInfoClick={() => setInfoPopup("Kapak fotoğrafı, müşterilerin sizi keşfettiğinde gördüğü ilk görseldir. Galeri fotoğraflarına etiket ekleyerek (örn. 'saç boyama', 'erkek kesim') içerik aramasında öne çıkabilirsiniz.")}
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
                                                onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_SALON_COVER; }}
                                            />
                                        ) : (
                                            <img
                                                src={DEFAULT_SALON_COVER}
                                                alt="Varsayılan kapak"
                                                className="w-full h-full object-cover opacity-70"
                                            />
                                        )}
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <input
                                            type="file"
                                            id="coverImageInput"
                                            className="hidden"
                                            accept="image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif"
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
                                        {getValues('coverImagePath') && (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                disabled={deletingCover}
                                                onClick={() => setDeleteCoverConfirm(true)}
                                                className="text-red-600 border-red-200 hover:bg-red-50"
                                            >
                                                {deletingCover ? 'Siliniyor…' : 'Fotoğrafı Sil'}
                                            </Button>
                                        )}
                                        <p className="text-xs text-gray-400">Önerilen: 1200×400 piksel • JPG, PNG veya WebP</p>
                                    </div>
                                </div>
                            </div>



                            {/* Tanıtım Videosu */}
                            <div className="border-t border-gray-100 pt-4 mb-6">
                                <div className="flex justify-between items-center mb-3">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700">Tanıtım Videosu</label>
                                        <p className="text-xs text-gray-400">En fazla 1 video • Maks 150MB • Maks 90 saniye</p>
                                    </div>
                                    <input
                                        type="file"
                                        id="videoInput"
                                        className="hidden"
                                        accept="video/mp4,video/quicktime,video/x-msvideo,video/x-matroska,video/webm"
                                        onChange={handleShopVideoUpload}
                                    />
                                    {watchedVideos.length === 0 && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            disabled={uploadingVideo}
                                            onClick={() => document.getElementById('videoInput')?.click()}
                                        >
                                            <Video className="w-4 h-4 mr-1.5" />
                                            {uploadingVideo ? 'Yükleniyor...' : 'Video Ekle'}
                                        </Button>
                                    )}
                                </div>
                                {watchedVideos.length > 0 && (
                                    <div className="bg-gray-50 p-4 rounded-xl flex flex-col md:flex-row items-center gap-4">
                                        <div className="w-full md:w-1/2 aspect-video bg-black rounded-lg overflow-hidden relative flex items-center justify-center">
                                            {videoError ? (
                                                <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center bg-gray-900/90 z-10">
                                                    <span className="text-red-500 mb-2">
                                                        <svg className="w-10 h-10 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                                        </svg>
                                                    </span>
                                                    <p className="text-white text-sm font-semibold mb-1">Video Dosyası Bulunamadı</p>
                                                    <p className="text-gray-400 text-xs">Bu video eski ve bozuk. Lütfen aşağıdaki 'Videoyu Sil' butonuna basarak silin ve tekrar yükleyin.</p>
                                                </div>
                                            ) : null}
                                            <video 
                                                key={watchedVideos[0].id}
                                                src={getImageUrl(watchedVideos[0].url)}
                                                controls 
                                                className={`w-full h-full object-cover ${videoError ? 'opacity-0' : 'opacity-100'}`}
                                                preload="metadata"
                                                playsInline
                                                onError={(e) => {
                                                    const v = e.currentTarget;
                                                    console.error('Video oynatma hatası:', v.error?.code, v.error?.message, v.src);
                                                    setVideoError(true);
                                                }}
                                                onLoadStart={() => setVideoError(false)}
                                            >
                                                Tarayıcınız video etiketini desteklemiyor.
                                            </video>
                                        </div>
                                        <div className="flex flex-col gap-2 w-full md:w-auto">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                disabled={uploadingVideo}
                                                onClick={() => setDeleteVideoConfirm(true)}
                                                className="text-red-600 border-red-200 hover:bg-red-50"
                                            >
                                                <Trash2 className="w-4 h-4 mr-1.5" />
                                                Videoyu Sil
                                            </Button>
                                        </div>
                                    </div>
                                )}
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
                                        accept="image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif"
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
                                <div className="columns-2 md:columns-3 gap-4">
                                    {watchedImages.map((image, index) => (
                                        <div key={image.id || index} className="break-inside-avoid mb-4">
                                            <div className="rounded-xl border border-gray-200 overflow-hidden bg-white">
                                            {/* Fotoğraf — tam boyut, masonry */}
                                            <div className="relative group overflow-hidden">
                                                <img
                                                    src={getImageUrl(image.url)}
                                                    alt={`Galeri ${index + 1}`}
                                                    className="w-full h-auto block"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteGalleryImage(image.id)}
                                                    className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                            {/* Etiketler */}
                                            <div className="p-2.5 space-y-2">
                                                <div className="flex flex-wrap gap-1.5">
                                                    {(image.tags || []).map(tag => (
                                                        <span key={tag.id} className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                                                            {editingTag?.tagId === tag.id ? (
                                                                <input
                                                                    autoFocus
                                                                    className="w-16 bg-transparent outline-none text-xs text-purple-800"
                                                                    value={editingTag.name}
                                                                    onChange={e => setEditingTag({ tagId: tag.id, name: e.target.value })}
                                                                    onKeyDown={e => {
                                                                        if (e.key === 'Enter') handleUpdateTag(image.id, tag.id, editingTag.name);
                                                                        if (e.key === 'Escape') setEditingTag(null);
                                                                    }}
                                                                    onBlur={() => handleUpdateTag(image.id, tag.id, editingTag.name)}
                                                                />
                                                            ) : (
                                                                <span
                                                                    className="cursor-pointer"
                                                                    onClick={() => setEditingTag({ tagId: tag.id, name: tag.name })}
                                                                >
                                                                    {tag.name}
                                                                </span>
                                                            )}
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDeleteTag(image.id, tag.id)}
                                                                className="text-purple-400 hover:text-red-500 leading-none shrink-0 text-sm"
                                                            >
                                                                ×
                                                            </button>
                                                        </span>
                                                    ))}
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <input
                                                        type="text"
                                                        placeholder="Etiket ekle..."
                                                        value={tagInputs[image.id] || ''}
                                                        onChange={e => setTagInputs(prev => ({ ...prev, [image.id]: e.target.value }))}
                                                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag(image.id); } }}
                                                        className="min-w-0 flex-1 text-xs px-2 py-1 rounded-lg border border-gray-200 focus:border-purple-400 outline-none bg-white"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => handleAddTag(image.id)}
                                                        className="shrink-0 w-7 h-7 flex items-center justify-center bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors text-base leading-none"
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                            </div>
                                            </div>
                                        </div>
                                    ))}
                                    {watchedImages.length === 0 && (
                                        <div className="py-10 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 text-center text-gray-400 text-sm">
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
                        infoText="Salonunuzun adı, kategorisi (erkek berberi, kadın kuaförü vb.), hizmet verilen cinsiyet ve iletişim bilgilerini yönetin. Doğru kategori seçimi, müşterilerin sizi arama sonuçlarında bulmasını doğrudan etkiler."
                        onInfoClick={() => setInfoPopup("Salonunuzun adı, kategorisi (erkek berberi, kadın kuaförü vb.), hizmet verilen cinsiyet ve iletişim bilgilerini yönetin. Doğru kategori seçimi, müşterilerin sizi arama sonuçlarında bulmasını doğrudan etkiler.")}
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
                                    {[TargetGender.Kadin, TargetGender.Erkek, TargetGender.Unisex, TargetGender.Pet].map((gender) => (
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
                                    {...register('description', { required: 'Açıklama zorunludur', maxLength: { value: 2000, message: 'Açıklama en fazla 2000 karakter olabilir' } })}
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

                    {/* Kart 3a: Hizmet Bölgeleri — yalnızca seyyar berberler */}
                    {shopType === ShopType.Mobile && (
                        <AccordionCard
                            icon={<MapPin className="w-6 h-6" />}
                            iconBg="bg-purple-50"
                            iconColor="text-purple-600"
                            title="Hizmet Bölgeleri"
                            subtitle="Hangi il ve ilçelere gidiyorsunuz?"
                            isOpen={openCards.serviceAreas}
                            onToggle={() => toggleCard('serviceAreas')}
                        >
                            <div className="space-y-4">
                                {/* Mevcut bölgeler */}
                                {serviceAreas.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {serviceAreas.map((area, i) => (
                                            <span key={i} className="flex items-center gap-1 bg-purple-100 text-purple-700 px-3 py-1.5 rounded-full text-sm font-medium">
                                                {area.city} / {area.district}{area.neighborhood ? ` / ${area.neighborhood}` : ''}
                                                <button
                                                    type="button"
                                                    onClick={() => setServiceAreas(prev => prev.filter((_, idx) => idx !== i))}
                                                    className="ml-1 hover:text-purple-900"
                                                >
                                                    <XIcon className="w-3.5 h-3.5" />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                )}

                                {/* Yeni bölge girişi */}
                                <div className="grid grid-cols-3 gap-2">
                                    <input
                                        type="text"
                                        placeholder="Şehir (örn: İstanbul)"
                                        value={newArea.city}
                                        onChange={e => setNewArea(a => ({ ...a, city: e.target.value }))}
                                        className="rounded-xl border-2 border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
                                    />
                                    <input
                                        type="text"
                                        placeholder="İlçe (örn: Kadıköy)"
                                        value={newArea.district}
                                        onChange={e => setNewArea(a => ({ ...a, district: e.target.value }))}
                                        className="rounded-xl border-2 border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Mahalle (opsiyonel)"
                                        value={newArea.neighborhood || ''}
                                        onChange={e => setNewArea(a => ({ ...a, neighborhood: e.target.value }))}
                                        className="rounded-xl border-2 border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (!newArea.city.trim() || !newArea.district.trim()) return;
                                        setServiceAreas(prev => [...prev, {
                                            city: newArea.city.trim(),
                                            district: newArea.district.trim(),
                                            neighborhood: newArea.neighborhood?.trim() || undefined
                                        }]);
                                        setNewArea({ city: '', district: '', neighborhood: '' });
                                    }}
                                    disabled={!newArea.city.trim() || !newArea.district.trim()}
                                    className="flex items-center gap-1.5 text-sm font-medium text-purple-600 hover:text-purple-800 disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    <Plus className="w-4 h-4" /> Bölge Ekle
                                </button>

                                <div className="pt-2 border-t border-gray-100">
                                    <Button
                                        type="button"
                                        onClick={handleSaveServiceAreas}
                                        isLoading={savingServiceAreas}
                                        className="bg-purple-600 hover:bg-purple-700"
                                    >
                                        Hizmet Bölgelerini Güncelle
                                    </Button>
                                </div>
                            </div>
                        </AccordionCard>
                    )}

                    {/* Kart 3b: Konum Detayları — yalnızca sabit salonlar */}
                    {shopType === ShopType.Fixed && <AccordionCard
                        icon={<MapPin className="w-6 h-6" />}
                        iconBg="bg-emerald-50"
                        iconColor="text-emerald-600"
                        title="Konum Detayları"
                        subtitle="İl, ilçe, mahalle ve adres bilgileri"
                        isOpen={openCards.location}
                        onToggle={() => toggleCard('location')}
                        infoText="Salonunuzun fiziksel adresi ve harita konumu. Müşteriler şehir, ilçe ve mahalle bazlı arama yaptığında bu bilgiler kullanılır. Harita pinini de ayarlarsanız müşteriler yol tarifi alabilir."
                        onInfoClick={() => setInfoPopup("Salonunuzun fiziksel adresi ve harita konumu. Müşteriler şehir, ilçe ve mahalle bazlı arama yaptığında bu bilgiler kullanılır. Harita pinini de ayarlarsanız müşteriler yol tarifi alabilir.")}
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
                    </AccordionCard>}

                    {/* Kart 4: Hizmetler */}
                    <AccordionCard
                        icon={<Scissors className="w-6 h-6" />}
                        iconBg="bg-violet-50"
                        iconColor="text-violet-600"
                        title="Hizmetler"
                        subtitle="Kategoriler ve hizmet tanımları"
                        isOpen={openCards.services}
                        onToggle={() => toggleCard('services')}
                        infoText="Sunduğunuz hizmetleri (kesim, boya, bakım vb.) fiyat ve süreleriyle tanımlayın. Tanımladığınız hizmetler daha sonra uzmanlara atanır; uzmanın yapabildiği hizmetler için müşteriler randevu alabilir."
                        onInfoClick={() => setInfoPopup("Sunduğunuz hizmetleri (kesim, boya, bakım vb.) fiyat ve süreleriyle tanımlayın. Tanımladığınız hizmetler daha sonra uzmanlara atanır; uzmanın yapabildiği hizmetler için müşteriler randevu alabilir.")}
                    >
                        <ServicesPage embedded />
                    </AccordionCard>

                    {/* Kart 5: Uzmanlar */}
                    <AccordionCard
                        icon={<Users className="w-6 h-6" />}
                        iconBg="bg-teal-50"
                        iconColor="text-teal-600"
                        title="Uzmanlar"
                        subtitle="Çalışan yönetimi, hizmet atamaları ve çalışma saatleri"
                        isOpen={openCards.employees}
                        onToggle={() => toggleCard('employees')}
                        infoText="Salondaki çalışanları ekleyin, hangi hizmetleri verdiklerini ve günlük çalışma saatlerini ayarlayın. Müşteriler randevu alırken uzman seçimi yapar; uzmanın takvimi ve uzmanlık alanları bu ayarlara göre belirlenir."
                        onInfoClick={() => setInfoPopup("Salondaki çalışanları ekleyin, hangi hizmetleri verdiklerini ve günlük çalışma saatlerini ayarlayın. Müşteriler randevu alırken uzman seçimi yapar; uzmanın takvimi ve uzmanlık alanları bu ayarlara göre belirlenir.")}
                    >
                        <EmployeesPage embedded />
                    </AccordionCard>

                    {/* Kart 6: Çalışma Saatleri */}
                    <AccordionCard
                        icon={<Clock className="w-6 h-6" />}
                        iconBg="bg-orange-50"
                        iconColor="text-orange-600"
                        title="Çalışma Saatleri"
                        subtitle="Salonunuzun genel açılış ve kapanış saatleri"
                        isOpen={openCards.hours}
                        onToggle={() => toggleCard('hours')}
                        infoText="Salonunuzun genel açılış/kapanış saati, kaç gün öncesine kadar randevu alınabileceği ve iptal politikası bu bölümde belirlenir. Haftalık tatil günleri burada seçilir; tatil günlerinde hiçbir uzman için randevu alınamaz."
                        onInfoClick={() => setInfoPopup("Salonunuzun genel açılış/kapanış saati, kaç gün öncesine kadar randevu alınabileceği ve iptal politikası bu bölümde belirlenir. Haftalık tatil günleri burada seçilir; tatil günlerinde hiçbir uzman için randevu alınamaz.")}
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
                                    Randevu Alma Süresi
                                </label>
                                <p className="text-xs text-gray-400 mb-2">Müşteriler bugünden kaç gün sonrasına kadar randevu alabilir?</p>
                                <div className="flex items-center rounded-xl border-2 border-gray-200 focus-within:border-primary-500 transition-all overflow-hidden">
                                    <input
                                        type="number"
                                        min={1}
                                        max={365}
                                        {...register('bookingDaysAhead', { valueAsNumber: true })}
                                        className="flex-1 px-3 py-2.5 outline-none text-sm bg-transparent"
                                        placeholder="30"
                                    />
                                    <span className="px-3 py-2.5 text-sm text-gray-400 bg-gray-50 border-l border-gray-200 select-none whitespace-nowrap">
                                        {(() => { const v = watch('bookingDaysAhead'); return (v && v > 0) ? `${v} gün` : 'gün'; })()}
                                    </span>
                                </div>
                            </div>
                            {/* Minimum İptal Süresi */}
                            <div className="max-w-xs">
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                    Minimum İptal Süresi
                                </label>
                                <p className="text-xs text-gray-400 mb-2">
                                    Müşteriler randevudan en az kaç saat önce iptal edebilir?
                                    Geçerli aralık: <strong>0 – 72 saat</strong>. (0 = her zaman iptal edilebilir)
                                </p>
                                <div className="flex items-center rounded-xl border-2 border-gray-200 focus-within:border-primary-500 transition-all overflow-hidden">
                                    <input
                                        type="number"
                                        min={0}
                                        max={72}
                                        {...register('cancellationHours', { valueAsNumber: true })}
                                        className="flex-1 px-3 py-2.5 outline-none text-sm bg-transparent"
                                        placeholder="2"
                                    />
                                    <span className="px-3 py-2.5 text-sm text-gray-400 bg-gray-50 border-l border-gray-200 select-none whitespace-nowrap">
                                        {(() => { const v = watch('cancellationHours'); return (v != null && v >= 0) ? `${v} saat` : 'saat'; })()}
                                    </span>
                                </div>
                            </div>
                            {/* Haftalık Tatil Günleri */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                    Haftalık Tatil Günleri
                                </label>
                                <p className="text-xs text-gray-400 mb-2">Seçilen günlerde müşteriler randevu alamaz.</p>
                                <div className="flex flex-wrap gap-2">
                                    {[
                                        { label: 'Pazartesi', idx: 1 },
                                        { label: 'Salı',      idx: 2 },
                                        { label: 'Çarşamba',  idx: 3 },
                                        { label: 'Perşembe',  idx: 4 },
                                        { label: 'Cuma',      idx: 5 },
                                        { label: 'Cumartesi', idx: 6 },
                                        { label: 'Pazar',     idx: 0 },
                                    ].map(({ label, idx }) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => setWeeklyOffDays(prev =>
                                                prev.includes(idx) ? prev.filter(d => d !== idx) : [...prev, idx]
                                            )}
                                            className={`px-3 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${
                                                weeklyOffDays.includes(idx)
                                                    ? 'bg-red-500 border-red-500 text-white'
                                                    : 'bg-white border-gray-200 text-gray-600 hover:border-red-300'
                                            }`}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>
                                {weeklyOffDays.length > 0 && (
                                    <p className="text-xs text-red-500 mt-2">
                                        Her hafta{' '}
                                        {[
                                            { label: 'Pazartesi', idx: 1 },
                                            { label: 'Salı',      idx: 2 },
                                            { label: 'Çarşamba',  idx: 3 },
                                            { label: 'Perşembe',  idx: 4 },
                                            { label: 'Cuma',      idx: 5 },
                                            { label: 'Cumartesi', idx: 6 },
                                            { label: 'Pazar',     idx: 0 },
                                        ]
                                            .filter(d => weeklyOffDays.includes(d.idx))
                                            .map(d => d.label)
                                            .join(', ')}{' '}
                                        günleri kapalı
                                    </p>
                                )}
                            </div>
                            <div className="flex justify-end">
                                <Button type="button" onClick={() => handleSaveSection('hours')} isLoading={loading}>
                                    Çalışma Saatlerini Güncelle
                                </Button>
                            </div>
                        </div>
                    </AccordionCard>

                </div>
            </div>

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
                        infoText="Resmi tatiller, özel kapanış günleri veya bakım günleri gibi tarihleri buraya ekleyin. Bu tarihlerde hiçbir müşteri, hiçbir uzman için randevu alamaz. Haftalık tatilden farklı olarak tek seferlik kapamalardır."
                        onInfoClick={() => setInfoPopup("Resmi tatiller, özel kapanış günleri veya bakım günleri gibi tarihleri buraya ekleyin. Bu tarihlerde hiçbir müşteri, hiçbir uzman için randevu alamaz. Haftalık tatilden farklı olarak tek seferlik kapamalardır.")}
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

            {/* Kart 6: Çalışanlar için İzin Günü */}
            {shopId && (
                <div className="mt-4">
                    <AccordionCard
                        icon={<CalendarClock className="w-6 h-6" />}
                        iconBg="bg-violet-50"
                        iconColor="text-violet-600"
                        title="Çalışanlar için İzin Günü"
                        subtitle="Bireysel çalışan izin günlerini takvimden yönetin"
                        isOpen={openCards.employeeLeave}
                        onToggle={() => {
                            toggleCard('employeeLeave');
                            if (!openCards.employeeLeave && allEmployees.length === 0) {
                                loadAllEmployees();
                            }
                        }}
                        infoText="Belirli bir çalışanın izinli olduğu günleri girin. İzin günlerinde yalnızca o çalışan için randevu alınamaz; diğer uzmanlar etkilenmez. Salon geneli kapamaları için 'Kapalı Günler' bölümünü kullanın."
                        onInfoClick={() => setInfoPopup("Belirli bir çalışanın izinli olduğu günleri girin. İzin günlerinde yalnızca o çalışan için randevu alınamaz; diğer uzmanlar etkilenmez. Salon geneli kapamaları için 'Kapalı Günler' bölümünü kullanın.")}
                    >
                        <div className="space-y-5">
                            <p className="text-sm text-gray-500">
                                Bir çalışan seçin, ardından izinli olacağı günleri ekleyin. Müşteriler o günlerde bu personeli seçemez.
                            </p>

                            {/* Çalışan listesi */}
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-2">Çalışan Seç</label>
                                {allEmployees.length === 0 ? (
                                    <p className="text-sm text-gray-400 italic">Aktif çalışan bulunamadı.</p>
                                ) : (
                                    <div className="flex flex-wrap gap-2">
                                        {allEmployees.map(emp => (
                                            <button
                                                key={emp.id}
                                                type="button"
                                                onClick={() => handleSelectLeaveEmployee(emp)}
                                                className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 text-sm font-semibold transition-all ${
                                                    selectedLeaveEmployee?.id === emp.id
                                                        ? 'border-violet-500 bg-violet-50 text-violet-700'
                                                        : 'border-gray-200 text-gray-600 hover:border-violet-300'
                                                }`}
                                            >
                                                <div className="w-7 h-7 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 font-bold text-xs shrink-0">
                                                    {emp.firstName[0]}{emp.lastName[0]}
                                                </div>
                                                {emp.firstName} {emp.lastName}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Seçili çalışanın izin günleri */}
                            {selectedLeaveEmployee && (
                                <div className="border-t border-gray-100 pt-4 space-y-4">
                                    <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                        <UserX className="w-4 h-4 text-violet-500" />
                                        {selectedLeaveEmployee.firstName} {selectedLeaveEmployee.lastName} — İzin Günleri
                                    </p>

                                    {/* Yeni izin ekle */}
                                    <div className="flex flex-wrap gap-3 items-end">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1">Tarih</label>
                                            <input
                                                type="date"
                                                value={newLeaveDate}
                                                min={new Date().toLocaleDateString('en-CA')}
                                                onChange={e => setNewLeaveDate(e.target.value)}
                                                className="px-3 py-2.5 rounded-xl border-2 border-gray-200 focus:border-violet-500 outline-none transition-all text-sm"
                                            />
                                        </div>
                                        <div className="flex-1 min-w-40">
                                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                                Açıklama (opsiyonel)
                                            </label>
                                            <input
                                                type="text"
                                                value={newLeaveReason}
                                                onChange={e => setNewLeaveReason(e.target.value)}
                                                placeholder="Örn: Yıllık izin, Hastalık..."
                                                className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-200 focus:border-violet-500 outline-none transition-all text-sm"
                                            />
                                        </div>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={handleAddLeaveDate}
                                            isLoading={addingLeave}
                                            disabled={!newLeaveDate}
                                            className="border-violet-300 text-violet-700 hover:bg-violet-50"
                                        >
                                            + Ekle
                                        </Button>
                                    </div>

                                    {/* İzin listesi */}
                                    {loadingLeaveDates ? (
                                        <div className="py-6 text-center text-sm text-gray-400">Yükleniyor...</div>
                                    ) : employeeLeaveDates.length === 0 ? (
                                        <div className="text-center py-8 text-gray-400 text-sm bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                                            {selectedLeaveEmployee.firstName} için tanımlı izin günü yok.
                                        </div>
                                    ) : (
                                        <ul className="divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden">
                                            {employeeLeaveDates.map(l => (
                                                <li
                                                    key={l.id}
                                                    className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
                                                >
                                                    <div>
                                                        <span className="font-medium text-sm text-gray-800">
                                                            {new Date(`${l.leaveDate}T12:00:00`).toLocaleDateString('tr-TR', {
                                                                day: 'numeric',
                                                                month: 'long',
                                                                year: 'numeric',
                                                                weekday: 'long',
                                                            })}
                                                        </span>
                                                        {l.reason && (
                                                            <span className="ml-3 text-xs text-gray-500">{l.reason}</span>
                                                        )}
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => setLeaveDateToDelete(l)}
                                                        className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="İzin gününü sil"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            )}
                        </div>
                    </AccordionCard>
                </div>
            )}


            {/* ── Kapak Fotoğrafı Silme Onay Modalı ── */}
            {deleteCoverConfirm && createPortal(
                <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
                        <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
                            <div className="p-2.5 bg-red-50 text-red-600 rounded-xl shrink-0">
                                <Trash2 className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-gray-900">Kapak Fotoğrafı Silinecek</h3>
                                <p className="text-xs text-gray-500 mt-0.5">Bu işlem geri alınamaz</p>
                            </div>
                        </div>
                        <div className="px-6 py-5">
                            <p className="text-sm text-gray-600">
                                Kapak fotoğrafını silmek istediğinizden emin misiniz?
                            </p>
                        </div>
                        <div className="flex gap-3 px-6 pb-5">
                            <button
                                onClick={() => setDeleteCoverConfirm(false)}
                                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition-colors"
                            >
                                Vazgeç
                            </button>
                            <button
                                onClick={async () => {
                                    setDeleteCoverConfirm(false);
                                    await handleDeleteCoverImage();
                                }}
                                className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors"
                            >
                                Evet, Sil
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* ── Galeri Fotoğrafı Silme Onay Modalı ── */}
            {deleteImageId && createPortal(
                <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
                        <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
                            <div className="p-2.5 bg-red-50 text-red-600 rounded-xl shrink-0">
                                <Trash2 className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-gray-900">Fotoğraf Silinecek</h3>
                                <p className="text-xs text-gray-500 mt-0.5">Bu işlem geri alınamaz</p>
                            </div>
                        </div>
                        <div className="px-6 py-5">
                            <p className="text-sm text-gray-600">
                                Bu galeri fotoğrafını silmek istediğinizden emin misiniz?
                            </p>
                        </div>
                        <div className="flex gap-3 px-6 pb-5">
                            <button
                                onClick={() => setDeleteImageId(null)}
                                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition-colors"
                            >
                                Vazgeç
                            </button>
                            <button
                                onClick={confirmDeleteGalleryImage}
                                className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors"
                            >
                                Evet, Sil
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* ── Tanıtım Videosu Silme Onay Modalı ── */}
            {deleteVideoConfirm && createPortal(
                <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
                        <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
                            <div className="p-2.5 bg-red-50 text-red-600 rounded-xl shrink-0">
                                <Trash2 className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-gray-900">Tanıtım Videosu Silinecek</h3>
                                <p className="text-xs text-gray-500 mt-0.5">Bu işlem geri alınamaz</p>
                            </div>
                        </div>
                        <div className="px-6 py-5">
                            <p className="text-sm text-gray-600">
                                Tanıtım videosunu silmek istediğinizden emin misiniz?
                            </p>
                        </div>
                        <div className="flex gap-3 px-6 pb-5">
                            <button
                                onClick={() => setDeleteVideoConfirm(false)}
                                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition-colors"
                            >
                                Vazgeç
                            </button>
                            <button
                                onClick={async () => {
                                    setDeleteVideoConfirm(false);
                                    await handleDeleteShopVideo(watchedVideos[0].id);
                                }}
                                className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors"
                            >
                                Evet, Sil
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* ── İzin Günü Silme Onay Modalı ── */}
            {leaveDateToDelete && createPortal(
                <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
                        <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
                            <div className="p-2.5 bg-red-50 text-red-600 rounded-xl shrink-0">
                                <Trash2 className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-gray-900">İzin Günü Silinecek</h3>
                                <p className="text-xs text-gray-500 mt-0.5">Bu işlem geri alınamaz</p>
                            </div>
                        </div>
                        <div className="px-6 py-5">
                            <p className="text-sm text-gray-600">
                                <span className="font-semibold text-gray-900">
                                    {new Date(`${leaveDateToDelete.leaveDate}T12:00:00`).toLocaleDateString('tr-TR', {
                                        day: 'numeric', month: 'long', year: 'numeric', weekday: 'long'
                                    })}
                                </span>
                                {' '}tarihli izin günü silinsin mi?
                            </p>
                        </div>
                        <div className="flex gap-3 px-6 pb-5">
                            <button
                                onClick={() => setLeaveDateToDelete(null)}
                                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition-colors"
                            >
                                Vazgeç
                            </button>
                            <button
                                onClick={async () => {
                                    await handleRemoveLeaveDate(leaveDateToDelete.id);
                                    setLeaveDateToDelete(null);
                                }}
                                className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors"
                            >
                                Evet, Sil
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* ── Değişiklik Onay Modalı ── */}
            {/* ── Bilgi popup'ı ── */}
            {infoPopup && createPortal(
                <div
                    className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
                    onClick={() => setInfoPopup(null)}
                >
                    <div
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-start gap-3 mb-4">
                            <div className="w-7 h-7 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">!</div>
                            <p className="text-sm text-gray-700 leading-relaxed">{infoPopup}</p>
                        </div>
                        <div className="flex justify-end">
                            <button
                                type="button"
                                onClick={() => setInfoPopup(null)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                            >
                                Tamam
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* ── Kaydedilmemiş değişiklik uyarısı ── */}
            {navTarget && createPortal(
                <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
                        <div className="flex items-start gap-3 mb-4">
                            <div className="p-2 bg-amber-50 rounded-xl shrink-0">
                                <AlertTriangle className="w-5 h-5 text-amber-600" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-gray-900 mb-1">Kaydedilmemiş değişiklikler</h3>
                                <p className="text-sm text-gray-500">
                                    {[infoIsDirty && 'Salon Bilgileri', locationIsDirty && 'Konum Detayları', hoursIsDirty && 'Çalışma Saatleri']
                                        .filter(Boolean).join(', ')} bölümünde yaptığınız değişiklikler henüz kaydedilmedi. Sayfadan ayrılırsanız bu değişiklikler kaybolur.
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-3 justify-end">
                            <button
                                type="button"
                                onClick={() => setNavTarget(null)}
                                className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition-colors"
                            >
                                Geri Dön
                            </button>
                            <button
                                type="button"
                                onClick={() => { navigate(navTarget); setNavTarget(null); }}
                                className="px-4 py-2.5 text-sm font-semibold text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors"
                            >
                                Evet, Çık
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

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
