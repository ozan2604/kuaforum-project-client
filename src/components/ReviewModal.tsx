import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { Star, X } from 'lucide-react';
import { Button } from './Button';

interface ReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (rating: number, comment: string, newImages: File[], deletedImageUrls: string[]) => Promise<void>;
    shopName: string;
    employeeName: string;
    initialData?: {
        rating: number;
        comment: string;
        imageUrls: string[];
    };
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    shopName,
    employeeName,
    initialData
}) => {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [newImages, setNewImages] = useState<File[]>([]);
    const [existingImages, setExistingImages] = useState<string[]>([]);
    const [deletedImages, setDeletedImages] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [hoveredStar, setHoveredStar] = useState(0);

    // Initialize state when modal opens or initialData changes
    React.useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setRating(initialData.rating);
                setComment(initialData.comment || '');
                setExistingImages(initialData.imageUrls || []);
                setDeletedImages([]);
                setNewImages([]);
            } else {
                setRating(0);
                setComment('');
                setExistingImages([]);
                setDeletedImages([]);
                setNewImages([]);
            }
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (rating === 0) return;

        setIsSubmitting(true);
        try {
            await onSubmit(rating, comment, newImages, deletedImages);
            // Don't close here, let parent decide or close after success
            onClose();
        } catch (error) {
            console.error('Failed to submit review', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteExistingImage = (url: string) => {
        setExistingImages(prev => prev.filter(img => img !== url));
        setDeletedImages(prev => [...prev, url]);
    };

    return ReactDOM.createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-md p-6 relative max-h-[90vh] overflow-y-auto z-[10000]">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                >
                    <X className="h-6 w-6" />
                </button>

                <h2 className="text-xl font-bold text-gray-900 mb-2">
                    {initialData ? 'Yorumu Düzenle' : 'Hizmeti Değerlendir'}
                </h2>
                <p className="text-sm text-gray-500 mb-6">
                    <span className="font-medium text-gray-900">{shopName}</span> - <span className="text-gray-900">{employeeName}</span>
                </p>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Star Rating */}
                    <div className="flex flex-col items-center gap-2">
                        <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setRating(star)}
                                    onMouseEnter={() => setHoveredStar(star)}
                                    onMouseLeave={() => setHoveredStar(0)}
                                    className="p-1 focus:outline-none transition-transform hover:scale-110"
                                >
                                    <Star
                                        className={`h-8 w-8 ${star <= (hoveredStar || rating)
                                            ? 'fill-yellow-400 text-yellow-400'
                                            : 'text-gray-300'
                                            }`}
                                    />
                                </button>
                            ))}
                        </div>
                        <span className="text-sm font-medium text-gray-600">
                            {hoveredStar > 0 ? `${hoveredStar} Yıldız` : rating > 0 ? `${rating} Yıldız` : 'Puan Verin'}
                        </span>
                    </div>

                    {/* Comment */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Yorumunuz (İsteğe bağlı)
                        </label>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all resize-none"
                            placeholder="Deneyiminizi paylaşın..."
                        />
                    </div>

                    {/* Image Upload */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Fotoğraflar (İsteğe bağlı)
                        </label>
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    onChange={(e) => {
                                        if (e.target.files) {
                                            setNewImages(prev => [...prev, ...Array.from(e.target.files || [])]);
                                        }
                                    }}
                                    className="hidden"
                                    id="review-images"
                                />
                                <label
                                    htmlFor="review-images"
                                    className="cursor-pointer px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                >
                                    <span className="text-xl">+</span> Fotoğraf Ekle
                                </label>
                            </div>
                            <span className="text-sm text-gray-500">
                                {newImages.length + existingImages.length > 0 ? `${newImages.length + existingImages.length} dosya` : 'Dosya seçilmedi'}
                            </span>
                        </div>

                        {/* Existing Images */}
                        {existingImages.length > 0 && (
                            <div className="mt-4">
                                <p className="text-xs text-gray-500 mb-2">Mevcut Fotoğraflar:</p>
                                <div className="flex gap-2 overflow-x-auto pb-2">
                                    {existingImages.map((url, idx) => (
                                        <div key={`existing-${idx}`} className="relative h-20 w-20 flex-shrink-0">
                                            <img
                                                src={url}
                                                alt={`Existing ${idx}`}
                                                className="h-full w-full object-cover rounded-md"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteExistingImage(url)}
                                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* New Images */}
                        {newImages.length > 0 && (
                            <div className="mt-4">
                                <p className="text-xs text-gray-500 mb-2">Yeni Fotoğraflar:</p>
                                <div className="flex gap-2 overflow-x-auto pb-2">
                                    {newImages.map((img, idx) => (
                                        <div key={`new-${idx}`} className="relative h-20 w-20 flex-shrink-0">
                                            <img
                                                src={URL.createObjectURL(img)}
                                                alt={`Preview ${idx}`}
                                                className="h-full w-full object-cover rounded-md"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setNewImages(newImages.filter((_, i) => i !== idx))}
                                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            className="flex-1"
                            onClick={onClose}
                        >
                            İptal
                        </Button>
                        <Button
                            type="submit"
                            disabled={rating === 0 || isSubmitting}
                            className="flex-1"
                        >
                            {isSubmitting ? 'Gönderiliyor...' : 'Gönder'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
};
