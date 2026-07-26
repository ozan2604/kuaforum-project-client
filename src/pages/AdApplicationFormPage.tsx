import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { ImagePlus, Info, Link as LinkIcon, DollarSign, Phone } from 'lucide-react';
import { adsService } from '../services/ads.service';
import type { AdApplicationFormValues } from '../types/ads';

export const AdApplicationFormPage: React.FC = () => {
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [mediaFile, setMediaFile] = useState<File | null>(null);
    const [mediaPreview, setMediaPreview] = useState<string | null>(null);

    const { register, handleSubmit, formState: { errors } } = useForm<AdApplicationFormValues>();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setMediaFile(file);
            const objectUrl = URL.createObjectURL(file);
            setMediaPreview(objectUrl);
        }
    };

    const onSubmit = async (data: AdApplicationFormValues) => {
        if (!mediaFile) {
            toast.error('Lütfen reklam medyasını (fotoğraf/video) seçin.');
            return;
        }

        try {
            setIsSubmitting(true);
            const formData = new FormData();
            formData.append('Media', mediaFile);
            formData.append('Description', data.description);
            formData.append('PhoneNumber', data.phoneNumber);
            if (data.externalLink) formData.append('ExternalLink', data.externalLink);
            if (data.price) formData.append('Price', data.price.toString());

            await adsService.createAd(formData);
            toast.success('Reklam başvurunuz başarıyla alındı! Onaylandıktan sonra yayına girecektir.');
            navigate('/my-ads');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Başvuru sırasında bir hata oluştu.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto py-8 px-4">
            <h1 className="text-3xl font-bold mb-2">Reklam Başvurusu Yap</h1>
            <p className="text-gray-600 mb-6">
                İşletmenizi veya ürününüzü Kolaj ve Önerilenler sekmelerinde öne çıkarın.
                <br/>
                <span className="font-semibold text-primary-600">Sadece 99 TL / Ay</span>
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                
                {/* Media Upload */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Reklam Görseli veya Videosu</label>
                    <div className="flex items-center justify-center w-full">
                        <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 overflow-hidden relative">
                            {mediaPreview ? (
                                mediaFile?.type.startsWith('video/') ? (
                                    <video src={mediaPreview} className="w-full h-full object-contain" autoPlay muted loop />
                                ) : (
                                    <img src={mediaPreview} alt="Preview" className="w-full h-full object-contain" />
                                )
                            ) : (
                                <div className="flex flex-col items-center justify-center pt-5 pb-6 text-gray-500">
                                    <ImagePlus className="w-10 h-10 mb-3" />
                                    <p className="mb-2 text-sm"><span className="font-semibold">Yüklemek için tıklayın</span> veya sürükleyin</p>
                                    <p className="text-xs">PNG, JPG, MP4 (Max. 100MB)</p>
                                </div>
                            )}
                            <input type="file" className="hidden" accept="image/*,video/*" onChange={handleFileChange} />
                        </label>
                    </div>
                </div>

                {/* Description */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Reklam Açıklaması
                    </label>
                    <div className="relative">
                        <Info className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                        <textarea
                            {...register('description', { required: 'Açıklama gereklidir' })}
                            rows={3}
                            className={`w-full pl-10 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-primary-500 outline-none ${errors.description ? 'border-red-500' : 'border-gray-200'}`}
                            placeholder="Ürününüz veya hizmetiniz hakkında ilgi çekici bir metin yazın..."
                        />
                    </div>
                    {errors.description && <span className="text-red-500 text-xs mt-1">{errors.description.message}</span>}
                </div>

                {/* Phone Number */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        İletişim Numarası
                    </label>
                    <div className="relative">
                        <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            {...register('phoneNumber', { required: 'Telefon numarası gereklidir' })}
                            className={`w-full pl-10 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-primary-500 outline-none ${errors.phoneNumber ? 'border-red-500' : 'border-gray-200'}`}
                            placeholder="05XX XXX XX XX"
                        />
                    </div>
                    {errors.phoneNumber && <span className="text-red-500 text-xs mt-1">{errors.phoneNumber.message}</span>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* External Link */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Satış veya PR Linki (Opsiyonel)
                        </label>
                        <div className="relative">
                            <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="url"
                                {...register('externalLink')}
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                                placeholder="https://..."
                            />
                        </div>
                    </div>

                    {/* Price */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Ürün/Hizmet Fiyatı (Opsiyonel)
                        </label>
                        <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="number"
                                step="0.01"
                                {...register('price')}
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                                placeholder="0.00"
                            />
                        </div>
                    </div>
                </div>

                <div className="pt-4 flex items-center justify-between">
                    <button
                        type="button"
                        onClick={() => navigate('/my-ads')}
                        className="text-gray-600 hover:text-gray-800 font-medium px-4 py-2"
                    >
                        Reklamlarımı Görüntüle
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-8 rounded-xl shadow-md transition-colors disabled:opacity-70"
                    >
                        {isSubmitting ? 'Gönderiliyor...' : 'Başvuru Yap - 99 TL'}
                    </button>
                </div>
            </form>
        </div>
    );
};
