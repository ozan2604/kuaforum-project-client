import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Loader2, Phone, Store, MapPin, Plus } from 'lucide-react';
import { adminService } from '../../api/admin.service';
import { getApiError } from '../../utils/storage';
import { TargetGender, TargetGenderLabels, ShopCategoryLabels } from '../../types/shop';
import { SearchableSelect } from '../../components/SearchableSelect';

const TURKIYE_API = 'https://api.turkiyeapi.dev/v1';

interface Province { id: number; name: string; districts: { id: number; name: string }[] }
interface Neighborhood { id: number; name: string }

const inputCls = "w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all text-sm disabled:bg-gray-50";
const labelCls = "block text-sm font-medium text-gray-700 mb-1";

const ALL_CATEGORIES = Object.entries(ShopCategoryLabels).map(([val, label]) => ({
    value: Number(val),
    label,
}));

const ALL_GENDERS = Object.entries(TargetGenderLabels).map(([val, label]) => ({
    value: Number(val) as TargetGender,
    label,
}));

export const AdminCreateSalonPage: React.FC = () => {
    const [submitting, setSubmitting] = useState(false);

    const [provinces, setProvinces] = useState<Province[]>([]);
    const [districts, setDistricts] = useState<{ id: number; name: string }[]>([]);
    const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
    const [loadingProvinces, setLoadingProvinces] = useState(false);
    const [loadingNeighborhoods, setLoadingNeighborhoods] = useState(false);
    const [selectedProvinceId, setSelectedProvinceId] = useState<number | null>(null);
    const [selectedDistrictId, setSelectedDistrictId] = useState<number | null>(null);

    const [form, setForm] = useState({
        phoneNumber: '',
        shopName: '',
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

    useEffect(() => {
        const load = async () => {
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
        load();
    }, []);

    const handleProvinceChange = (id: number) => {
        const prov = provinces.find(p => p.id === id);
        setSelectedProvinceId(id);
        setSelectedDistrictId(null);
        setDistricts(prov?.districts || []);
        setNeighborhoods([]);
        setForm(f => ({ ...f, city: prov?.name ?? '', district: '', neighborhood: '' }));
    };

    const handleDistrictChange = async (id: number) => {
        const dist = districts.find(d => d.id === id);
        setSelectedDistrictId(id);
        setNeighborhoods([]);
        setForm(f => ({ ...f, district: dist?.name ?? '', neighborhood: '' }));
        if (!dist) return;
        setLoadingNeighborhoods(true);
        try {
            const res = await fetch(`${TURKIYE_API}/neighborhoods?districtId=${id}`);
            const json = await res.json();
            const data = (json.data || []).sort((a: any, b: any) => a.name.localeCompare(b.name, 'tr'));
            setNeighborhoods(data);
        } catch {
            toast.error('Mahalleler yüklenemedi.');
        } finally {
            setLoadingNeighborhoods(false);
        }
    };

    const handleNeighborhoodChange = (id: number) => {
        const n = neighborhoods.find(x => x.id === id);
        setForm(f => ({ ...f, neighborhood: n?.name ?? '' }));
    };

    const toggleCategory = (val: number) => {
        setForm(f => ({
            ...f,
            categoryIds: f.categoryIds.includes(val)
                ? f.categoryIds.filter(c => c !== val)
                : [...f.categoryIds, val],
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!/^05\d{9}$/.test(form.phoneNumber)) {
            toast.error('Geçerli bir telefon numarası giriniz (05XXXXXXXXX).');
            return;
        }
        if (!form.shopName.trim()) {
            toast.error('Dükkan adı zorunludur.');
            return;
        }
        if (form.categoryIds.length === 0) {
            toast.error('En az bir kategori seçimi zorunludur.');
            return;
        }

        setSubmitting(true);
        try {
            await adminService.createSalon({
                ...form,
                city: form.city || undefined,
                district: form.district || undefined,
                neighborhood: form.neighborhood || undefined,
                street: form.street || undefined,
                buildingNumber: form.buildingNumber || undefined,
                address: form.address || undefined,
            });
            toast.success('Salon başarıyla oluşturuldu! Salon sahibine SMS gönderildi.');
            setForm({
                phoneNumber: '',
                shopName: '',
                categoryIds: [],
                genderPreference: TargetGender.Unisex,
                city: '',
                district: '',
                neighborhood: '',
                street: '',
                buildingNumber: '',
                address: '',
                latitude: null,
                longitude: null,
            });
            setSelectedProvinceId(null);
            setSelectedDistrictId(null);
            setDistricts([]);
            setNeighborhoods([]);
        } catch (err) {
            toast.error(getApiError(err, 'Salon oluşturulamadı.'));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Salon Ekle</h1>
                <p className="text-sm text-gray-500 mt-1">
                    Telefon numarası sistemde kayıtlı değilse yeni kullanıcı oluşturulur ve SMS ile bilgilendirilir.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Zorunlu Bilgiler */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5">
                    <div className="flex items-center gap-2 mb-1">
                        <Store className="w-4 h-4 text-primary-600" />
                        <h2 className="font-semibold text-gray-800 text-sm">Temel Bilgiler</h2>
                    </div>

                    <div>
                        <label className={labelCls}>
                            İşletme Telefon Numarası <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            <input
                                type="tel"
                                placeholder="05XXXXXXXXX"
                                value={form.phoneNumber}
                                onChange={e => setForm(f => ({ ...f, phoneNumber: e.target.value }))}
                                className={inputCls + " pl-9"}
                                maxLength={11}
                            />
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                            Bu numara hem salon iletişim numarası hem de salon sahibi hesabı için kullanılacak.
                        </p>
                    </div>

                    <div>
                        <label className={labelCls}>
                            Dükkan Adı <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            placeholder="Örn: Ali Berber"
                            value={form.shopName}
                            onChange={e => setForm(f => ({ ...f, shopName: e.target.value }))}
                            className={inputCls}
                            maxLength={100}
                        />
                    </div>

                    <div>
                        <label className={labelCls}>
                            Kategoriler <span className="text-red-500">*</span>
                        </label>
                        <div className="flex flex-wrap gap-2 mt-1">
                            {ALL_CATEGORIES.map(cat => {
                                const selected = form.categoryIds.includes(cat.value);
                                return (
                                    <button
                                        key={cat.value}
                                        type="button"
                                        onClick={() => toggleCategory(cat.value)}
                                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                                            selected
                                                ? 'bg-primary-600 text-white border-primary-600'
                                                : 'bg-white text-gray-600 border-gray-200 hover:border-primary-300 hover:text-primary-600'
                                        }`}
                                    >
                                        {cat.label}
                                    </button>
                                );
                            })}
                        </div>
                        {form.categoryIds.length === 0 && (
                            <p className="text-xs text-gray-400 mt-1.5">En az bir kategori seçiniz.</p>
                        )}
                    </div>

                    <div>
                        <label className={labelCls}>
                            Hizmet Verilen Cinsiyet <span className="text-red-500">*</span>
                        </label>
                        <div className="flex gap-2">
                            {ALL_GENDERS.map(g => (
                                <button
                                    key={g.value}
                                    type="button"
                                    onClick={() => setForm(f => ({ ...f, genderPreference: g.value }))}
                                    className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                                        form.genderPreference === g.value
                                            ? 'bg-primary-600 text-white border-primary-600'
                                            : 'bg-white text-gray-600 border-gray-200 hover:border-primary-300'
                                    }`}
                                >
                                    {g.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Konum Bilgileri */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
                    <div className="flex items-center gap-2 mb-1">
                        <MapPin className="w-4 h-4 text-primary-600" />
                        <h2 className="font-semibold text-gray-800 text-sm">Konum Bilgileri</h2>
                        <span className="text-xs text-gray-400">(isteğe bağlı)</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <SearchableSelect
                            label="İl"
                            options={provinces}
                            value={selectedProvinceId}
                            onChange={handleProvinceChange}
                            placeholder="İl Seçin"
                            loading={loadingProvinces}
                        />
                        <SearchableSelect
                            label="İlçe"
                            options={districts}
                            value={selectedDistrictId}
                            onChange={handleDistrictChange}
                            placeholder="İlçe Seçin"
                            disabled={!selectedProvinceId}
                        />
                        <SearchableSelect
                            label="Mahalle"
                            options={neighborhoods}
                            value={neighborhoods.find(n => n.name === form.neighborhood)?.id ?? null}
                            onChange={handleNeighborhoodChange}
                            placeholder="Mahalle Seçin"
                            disabled={!selectedDistrictId}
                            loading={loadingNeighborhoods}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className={labelCls}>Cadde / Sokak</label>
                            <input
                                type="text"
                                placeholder="Atatürk Cad."
                                value={form.street}
                                onChange={e => setForm(f => ({ ...f, street: e.target.value }))}
                                className={inputCls}
                                maxLength={200}
                            />
                        </div>
                        <div>
                            <label className={labelCls}>Bina No</label>
                            <input
                                type="text"
                                placeholder="12/A"
                                value={form.buildingNumber}
                                onChange={e => setForm(f => ({ ...f, buildingNumber: e.target.value }))}
                                className={inputCls}
                                maxLength={20}
                            />
                        </div>
                    </div>

                    <div>
                        <label className={labelCls}>Açık Adres</label>
                        <textarea
                            placeholder="Tam adres..."
                            value={form.address}
                            onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                            className={inputCls + " resize-none"}
                            rows={2}
                            maxLength={250}
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={submitting}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    {submitting ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Oluşturuluyor...</>
                    ) : (
                        <><Plus className="w-4 h-4" /> Salon Oluştur</>
                    )}
                </button>
            </form>
        </div>
    );
};
