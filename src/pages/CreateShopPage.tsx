import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { shopService } from '../api/shop.service';
import { ShopCategory, TargetGender } from '../types/shop';

export const CreateShopPage: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        address: '',
        city: '',
        district: '',
        phoneNumber: '',
        latitude: undefined as number | undefined,
        longitude: undefined as number | undefined,
        category: 2 as ShopCategory, // Default Kuafor
        genderPreference: 3 as TargetGender // Unisex
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await shopService.create(formData);
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
                <Input
                    label="Salon Adı"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="Örn: Stil Kuaför"
                />

                <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-gray-700">
                        Açıklama
                    </label>
                    <textarea
                        name="description"
                        rows={4}
                        className="flex w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200"
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="Salonunuz hakkında kısa bir bilgi..."
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                        label="Şehir"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        required
                        placeholder="İstanbul"
                    />
                    <Input
                        label="İlçe"
                        name="district"
                        value={formData.district}
                        onChange={handleChange}
                        required
                        placeholder="Kadıköy"
                    />
                </div>

                <Input
                    label="Adres"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    required
                    placeholder="Tam adresiniz..."
                />

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
                        Kategori
                    </label>
                    <select
                        name="category"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: parseInt(e.target.value) as any })}
                        className="flex w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200"
                    >
                        <option value={1}>Berber</option>
                        <option value={2}>Kuaför</option>
                        <option value={3}>Güzellik Merkezi</option>
                        <option value={4}>Spa Merkezi</option>
                        <option value={5}>Dövme Stüdyosu</option>
                        <option value={99}>Diğer</option>
                    </select>
                </div>

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
                                        setFormData(prev => ({
                                            ...prev,
                                            latitude: parseFloat(data[0].lat),
                                            longitude: parseFloat(data[0].lon)
                                        }));
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
                        <Input
                            label="Enlem (Latitude)"
                            name="latitude"
                            type="number"
                            step="any"
                            value={formData.latitude || ''}
                            onChange={handleChange}
                            placeholder="Örn: 41.0082"
                        />
                        <Input
                            label="Boylam (Longitude)"
                            name="longitude"
                            type="number"
                            step="any"
                            value={formData.longitude || ''}
                            onChange={handleChange}
                            placeholder="Örn: 28.9784"
                        />
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                        * Haritada görünmek için konum bilgilerini doldurunuz. "Konumu Otomatik Bul" butonunu kullanabilir veya Google Maps'ten koordinatlarınızı alabilirsiniz.
                    </p>
                </div>

                <div className="pt-4">
                    <Button type="submit" size="lg" className="w-full" isLoading={loading}>
                        Salonu Oluştur
                    </Button>
                </div>
            </form>
        </div>
    );
};
