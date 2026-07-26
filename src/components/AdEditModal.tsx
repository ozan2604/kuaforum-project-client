import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Upload, Camera, Trash2 } from 'lucide-react';
import { Button } from './Button';
import { adsService, type AdApplication } from '../services/ads.service';
import { getApiError } from '../utils/storage';
import { toast } from 'react-hot-toast';

interface AdEditModalProps {
    ad: AdApplication;
    onClose: () => void;
    onSuccess: () => void;
}

export const AdEditModal: React.FC<AdEditModalProps> = ({ ad, onClose, onSuccess }) => {
    const [description, setDescription] = useState(ad.description);
    const [phoneNumber, setPhoneNumber] = useState(ad.phoneNumber);
    const [externalLink, setExternalLink] = useState(ad.externalLink || '');
    const [price, setPrice] = useState(ad.price?.toString() || '');
    const [mediaFile, setMediaFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(ad.mediaUrl);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 100 * 1024 * 1024) {
            toast.error('Dosya boyutu 100 MB\'ı geçemez.');
            e.target.value = '';
            return;
        }

        setMediaFile(file);
        setPreviewUrl(URL.createObjectURL(file));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const cleanPhone = phoneNumber.replace(/\D/g, '');
        if (!/^05\d{9}$/.test(cleanPhone)) {
            toast.error('Telefon numarası 05XXXXXXXXX formatında olmalıdır.');
            return;
        }

        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('Description', description);
            formData.append('PhoneNumber', cleanPhone);
            if (externalLink) formData.append('ExternalLink', externalLink);
            if (price) formData.append('Price', price);
            if (mediaFile) formData.append('Media', mediaFile);

            await adsService.updateMyAd(ad.id, formData);
            toast.success('Reklam başvurunuz başarıyla güncellendi.');
            onSuccess();
        } catch (err) {
            toast.error(getApiError(err, 'Reklam güncellenemedi.'));
        } finally {
            setIsSubmitting(false);
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full relative my-auto">
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors z-10"
                >
                    <X className="h-5 w-5" />
                </button>

                <div className="p-6 sm:p-8">
                    <div className="mb-6">
                        <h2 className="text-xl font-bold text-gray-900">Reklam Başvurusunu Düzenle</h2>
                        <p className="text-sm text-gray-500 mt-1">Onay bekleyen veya onaylanmış reklamlarınızı güncelleyebilirsiniz.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Media Upload */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">Reklam Medyası (Opsiyonel)</label>
                            <p className="text-xs text-gray-500 mb-3">Fotoğraf veya video yükleyin. Yeni medya yüklemezseniz eski medya kalır.</p>
                            
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*,video/*"
                                className="hidden"
                                onChange={handleFileSelect}
                            />
                            
                            {previewUrl ? (
                                <div className="relative rounded-xl overflow-hidden bg-gray-100 border border-gray-200 group">
                                    {mediaFile?.type.startsWith('video') || (previewUrl === ad.mediaUrl && ad.mediaType === 'video') ? (
                                        <video src={previewUrl} className="w-full aspect-[9/16] object-cover" controls />
                                    ) : (
                                        <img src={previewUrl} alt="Preview" className="w-full aspect-[9/16] object-cover" />
                                    )}
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur-sm transition-colors"
                                        >
                                            <Camera className="h-6 w-6" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => { setMediaFile(null); setPreviewUrl(ad.mediaUrl); }}
                                            className="p-3 bg-red-500/80 hover:bg-red-500 rounded-full text-white backdrop-blur-sm transition-colors"
                                        >
                                            <Trash2 className="h-6 w-6" />
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full aspect-[9/16] rounded-xl border-2 border-dashed border-gray-300 hover:border-primary-500 hover:bg-primary-50 transition-all flex flex-col items-center justify-center gap-3 text-gray-500 hover:text-primary-600"
                                >
                                    <div className="p-4 bg-white rounded-full shadow-sm">
                                        <Upload className="h-8 w-8" />
                                    </div>
                                    <div className="text-center">
                                        <span className="font-semibold block">Medya Seçin</span>
                                        <span className="text-xs opacity-75 mt-1 block">JPG, PNG, MP4 (Max 100MB)</span>
                                    </div>
                                </button>
                            )}
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">Açıklama</label>
                            <textarea
                                required
                                maxLength={2000}
                                rows={4}
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-shadow resize-none"
                                placeholder="Reklamınızın açıklamasını buraya yazın..."
                            />
                        </div>

                        {/* Phone Number */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">İletişim Numarası</label>
                            <input
                                required
                                type="tel"
                                maxLength={11}
                                value={phoneNumber}
                                onChange={e => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 11))}
                                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-shadow"
                                placeholder="05XXXXXXXXX"
                            />
                        </div>

                        {/* External Link */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">Satış / PR Linki (Opsiyonel)</label>
                            <input
                                type="url"
                                value={externalLink}
                                onChange={e => setExternalLink(e.target.value)}
                                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-shadow"
                                placeholder="https://..."
                            />
                        </div>

                        {/* Price */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">Ürün Fiyatı (Opsiyonel)</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={price}
                                    onChange={e => setPrice(e.target.value)}
                                    className="w-full rounded-xl border border-gray-300 pl-4 pr-10 py-3 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-shadow"
                                    placeholder="0.00"
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">TL</span>
                            </div>
                        </div>

                        <div className="pt-4 flex gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-4 py-3 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                            >
                                İptal
                            </button>
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="flex-1 py-3"
                            >
                                {isSubmitting ? 'Güncelleniyor...' : 'Güncelle'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>,
        document.body
    );
};
