import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { salonApplicationService } from '../api/salon-application.service';
import { toast } from 'react-hot-toast';

export const SalonApplicationPage: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const [formData, setFormData] = useState({
        shopName: '',
        description: '',
        address: '',
        city: '',
        district: '',
        phoneNumber: '',
        taxNumber: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await salonApplicationService.apply(formData);
            setSuccess(true);
            toast.success('Başvurunuz başarıyla alındı!');
        } catch (err: any) {
            console.error('Submit error:', err);
            const errorMessage = err.response?.data?.message || 'Başvuru gönderilirken bir hata oluştu.';
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="max-w-2xl mx-auto py-12 px-4 text-center">
                <div className="bg-green-50 rounded-full h-24 w-24 flex items-center justify-center mx-auto mb-6">
                    <svg className="h-12 w-12 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Başvurunuz Alındı!</h2>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                    Salon sahibi olma başvurunuz bize ulaştı. Ekibimiz başvurunuzu inceledikten sonra size geri dönüş yapacaktır.
                </p>
                <Button onClick={() => navigate('/')}>Anasayfaya Dön</Button>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto py-8 px-4">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Salon Sahibi Olun</h1>
                <p className="mt-2 text-gray-600">
                    Kuaforum ailesine katılın, müşterilerinize daha kolay ulaşın.
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
                    name="shopName"
                    value={formData.shopName}
                    onChange={handleChange}
                    required
                    placeholder="Örn: Elit Güzellik Salonu"
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
                        placeholder="Salonunuz ve hizmetleriniz hakkında bilgi..."
                        required
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
                        placeholder="Beşiktaş"
                    />
                </div>

                <Input
                    label="Adres"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    required
                    placeholder="Açık adresiniz..."
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                        label="Telefon Numarası"
                        name="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={handleChange}
                        required
                        placeholder="0555 555 55 55"
                    />
                    <Input
                        label="Vergi Numarası"
                        name="taxNumber"
                        value={formData.taxNumber}
                        onChange={handleChange}
                        required
                        placeholder="Vergi kimlik numaranız"
                    />
                </div>

                <div className="pt-4">
                    <Button type="submit" size="lg" className="w-full" isLoading={loading}>
                        Başvuruyu Gönder
                    </Button>
                </div>
            </form>
        </div>
    );
};
