import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { shopService } from '../api/shop.service';
import { TargetGender, TargetGenderLabels, ShopCategory, ShopCategoryLabels, ShopType } from '../types/shop';
import type { ServiceAreaDto } from '../types/shop';
import { X, Plus } from 'lucide-react';

export const CreateShopPage: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [shopType, setShopType] = useState<ShopType>(ShopType.Fixed);
    const [serviceAreas, setServiceAreas] = useState<ServiceAreaDto[]>([]);
    const [newArea, setNewArea] = useState<ServiceAreaDto>({ city: '', district: '', neighborhood: '' });

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        address: '',
        city: '',
        district: '',
        phoneNumber: '',
        latitude: undefined as number | undefined,
        longitude: undefined as number | undefined,
        categoryIds: [] as number[],
        genderPreference: 3 as TargetGender
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    useEffect(() => {
        if (formData.categoryIds.includes(ShopCategory.PetKuafor)) {
            setFormData(f => ({ ...f, genderPreference: TargetGender.Pet }));
        } else if (formData.genderPreference === TargetGender.Pet) {
            setFormData(f => ({ ...f, genderPreference: TargetGender.Unisex }));
        }
    }, [formData.categoryIds]);

    const addServiceArea = () => {
        if (!newArea.city.trim() || !newArea.district.trim()) return;
        setServiceAreas(prev => [...prev, { city: newArea.city.trim(), district: newArea.district.trim(), neighborhood: newArea.neighborhood?.trim() || undefined }]);
        setNewArea({ city: '', district: '', neighborhood: '' });
    };

    const removeServiceArea = (index: number) => {
        setServiceAreas(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (shopType === ShopType.Mobile && serviceAreas.length === 0) {
            setError('Seyyar berber için en az bir hizmet bölgesi eklemelisiniz.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            await shopService.create({
                ...formData,
                shopType,
                serviceAreas: shopType === ShopType.Mobile ? serviceAreas : undefined
            });
            navigate('/my-shop');
        } catch (err: any) {
            setError('Dükkan oluşturulurken bir hata oluştu.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto py-8 px-4">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Salonunuzu Oluşturun</h1>
                <p className="mt-2 text-gray-600">
                    Kuaför salonunuzu kaydedin ve müşterilerinizle buluşmaya başlayın.
                </p>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-xl shadow-sm border border-gray-200">

                {/* Salon Tipi */}
                <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-gray-700">Salon Tipi</label>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            type="button"
                            onClick={() => setShopType(ShopType.Fixed)}
                            className={`flex flex-col items-center gap-1 px-4 py-3 rounded-xl border-2 font-semibold text-sm transition-all ${shopType === ShopType.Fixed ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 text-gray-500 hover:border-primary-200'}`}
                        >
                            <span className="text-lg">🏠</span>
                            <span>Sabit Salon</span>
                            <span className="text-xs font-normal text-gray-400">Belirli bir adreste</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setShopType(ShopType.Mobile)}
                            className={`flex flex-col items-center gap-1 px-4 py-3 rounded-xl border-2 font-semibold text-sm transition-all ${shopType === ShopType.Mobile ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-gray-200 text-gray-500 hover:border-purple-200'}`}
                        >
                            <span className="text-lg">🚐</span>
                            <span>Seyyar Berber</span>
                            <span className="text-xs font-normal text-gray-400">Eve / işyerine gelir</span>
                        </button>
                    </div>
                </div>

                <Input
                    label="Salon Adı"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="Örn: Stil Kuaför"
                />

                <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-gray-700">Açıklama</label>
                    <textarea
                        name="description"
                        rows={4}
                        className="flex w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200"
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="Salonunuz hakkında kısa bir bilgi..."
                    />
                </div>

                {/* Konum: Sabit salon için adres, seyyar için hizmet bölgeleri */}
                {shopType === ShopType.Fixed ? (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Input label="Şehir" name="city" value={formData.city} onChange={handleChange} required placeholder="İstanbul" />
                            <Input label="İlçe" name="district" value={formData.district} onChange={handleChange} required placeholder="Kadıköy" />
                        </div>
                        <Input label="Adres" name="address" value={formData.address} onChange={handleChange} required placeholder="Tam adresiniz..." />
                    </>
                ) : (
                    <div className="space-y-3">
                        <label className="block text-sm font-medium text-gray-700">
                            Hizmet Bölgeleri <span className="text-xs font-normal text-gray-400">(Hangi ilçelere gidiyorsunuz?)</span>
                        </label>

                        {serviceAreas.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {serviceAreas.map((area, i) => (
                                    <span key={i} className="flex items-center gap-1 bg-purple-100 text-purple-700 px-3 py-1.5 rounded-full text-sm font-medium">
                                        {area.city} / {area.district}{area.neighborhood ? ` / ${area.neighborhood}` : ''}
                                        <button type="button" onClick={() => removeServiceArea(i)} className="ml-1 hover:text-purple-900">
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}

                        <div className="grid grid-cols-3 gap-2">
                            <input
                                type="text"
                                placeholder="Şehir (örn: İstanbul)"
                                value={newArea.city}
                                onChange={e => setNewArea(a => ({ ...a, city: e.target.value }))}
                                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                            />
                            <input
                                type="text"
                                placeholder="İlçe (örn: Kadıköy)"
                                value={newArea.district}
                                onChange={e => setNewArea(a => ({ ...a, district: e.target.value }))}
                                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                            />
                            <input
                                type="text"
                                placeholder="Mahalle (opsiyonel)"
                                value={newArea.neighborhood || ''}
                                onChange={e => setNewArea(a => ({ ...a, neighborhood: e.target.value }))}
                                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                            />
                        </div>
                        <button
                            type="button"
                            onClick={addServiceArea}
                            disabled={!newArea.city.trim() || !newArea.district.trim()}
                            className="flex items-center gap-1.5 text-sm font-medium text-purple-600 hover:text-purple-800 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <Plus className="w-4 h-4" /> Bölge Ekle
                        </button>
                    </div>
                )}

                <Input
                    label="Telefon Numarası"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    required
                    placeholder="0555 555 55 55"
                />

                <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-gray-700">
                        Kategori <span className="text-xs font-normal text-gray-400">(Birden fazla seçebilirsiniz)</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        {Object.entries(ShopCategoryLabels).map(([id, name]) => {
                            const catId = Number(id);
                            const selected = formData.categoryIds.includes(catId);
                            return (
                                <label key={catId} className={`cursor-pointer flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${selected ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 text-gray-600 hover:border-primary-200'}`}
                                    onClick={() => setFormData(f => ({ ...f, categoryIds: selected ? f.categoryIds.filter(c => c !== catId) : [...f.categoryIds, catId] }))}>
                                    <div className={`w-4 h-4 rounded flex-shrink-0 border-2 flex items-center justify-center ${selected ? 'bg-primary-500 border-primary-500' : 'border-gray-300'}`}>
                                        {selected && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                                    </div>
                                    {name}
                                </label>
                            );
                        })}
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-gray-700">Hizmet Verilen Cinsiyet</label>
                    <div className="grid grid-cols-2 gap-2">
                        {[TargetGender.Kadin, TargetGender.Erkek, TargetGender.Unisex, TargetGender.Pet].map(g => (
                            <label key={g} className={`cursor-pointer flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 font-semibold text-sm transition-all ${formData.genderPreference === g ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 text-gray-500 hover:border-primary-200'}`}>
                                <input type="radio" name="genderPreference" value={g} checked={formData.genderPreference === g} onChange={() => setFormData(f => ({ ...f, genderPreference: g }))} className="sr-only" />
                                {TargetGenderLabels[g]}
                            </label>
                        ))}
                    </div>
                </div>

                {shopType === ShopType.Fixed && (
                    <div className="border-t pt-4">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-medium text-gray-900">Konum Bilgileri</h3>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={async () => {
                                    if (!formData.city || !formData.district) {
                                        alert('Lütfen önce şehir ve ilçe bilgilerini giriniz.');
                                        return;
                                    }
                                    const query = `${formData.address} ${formData.district} ${formData.city}`;
                                    try {
                                        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
                                        const data = await response.json();
                                        if (data && data.length > 0) {
                                            setFormData(prev => ({ ...prev, latitude: parseFloat(data[0].lat), longitude: parseFloat(data[0].lon) }));
                                        } else {
                                            alert('Konum bulunamadı. Lütfen adresi kontrol ediniz.');
                                        }
                                    } catch (error) {
                                        console.error('Geocoding error:', error);
                                        alert('Konum getirilirken bir hata oluştu.');
                                    }
                                }}
                            >
                                Konumu Otomatik Bul
                            </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Input label="Enlem (Latitude)" name="latitude" type="number" step="any" value={formData.latitude || ''} onChange={handleChange} placeholder="Örn: 41.0082" />
                            <Input label="Boylam (Longitude)" name="longitude" type="number" step="any" value={formData.longitude || ''} onChange={handleChange} placeholder="Örn: 28.9784" />
                        </div>
                        <p className="text-sm text-gray-500 mt-2">* Haritada görünmek için konum bilgilerini doldurunuz.</p>
                    </div>
                )}

                <div className="pt-4">
                    <Button type="submit" size="lg" className="w-full" isLoading={loading}>
                        Salonu Oluştur
                    </Button>
                </div>
            </form>
        </div>
    );
};
