import React, { useEffect, useState } from 'react';
import { Star, User, Edit2, Trash2 } from 'lucide-react';
import { reviewService, type Review } from '../api/review.service';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { ConfirmationModal } from './ConfirmationModal';

interface ReviewsListProps {
    shopId: string;
    onEdit?: (review: Review) => void;
    refreshTrigger?: number; // To trigger reload from parent
}

export const ReviewsList: React.FC<ReviewsListProps> = ({ shopId, onEdit, refreshTrigger }) => {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    useEffect(() => {
        loadReviews();
    }, [shopId, refreshTrigger]);

    const loadReviews = async () => {
        try {
            const data = await reviewService.getShopReviews(shopId);
            setReviews(data);
        } catch (error) {
            console.error('Failed to load reviews', error);
        } finally {
            setLoading(false);
        }
    };

    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [reviewToDelete, setReviewToDelete] = useState<string | null>(null);

    const handleDeleteClick = (reviewId: string) => {
        setReviewToDelete(reviewId);
        setDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!reviewToDelete) return;

        try {
            await reviewService.deleteReview(reviewToDelete);
            toast.success('Yorum silindi.');
            loadReviews(); // Refresh list
        } catch (error) {
            console.error('Failed to delete review', error);
            toast.error('Yorum silinemedi.');
        } finally {
            setDeleteModalOpen(false);
            setReviewToDelete(null);
        }
    };

    if (loading) {
        return <div className="text-center py-4 text-gray-500">Yorumlar yükleniyor...</div>;
    }

    if (reviews.length === 0) {
        return <div className="text-center py-4 text-gray-500">Henüz yorum yapılmamış.</div>;
    }

    return (
        <div className="space-y-6">
            {reviews.map((review) => {
                const isOwner = user?.id === review.userId;

                return (
                    <div key={review.id} className="border-b border-gray-100 last:border-0 pb-6 last:pb-0">
                        <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                                    {review.userProfileImage ? (
                                        <img src={review.userProfileImage} alt={review.userName} className="h-10 w-10 rounded-full object-cover" />
                                    ) : (
                                        <User className="h-6 w-6 text-gray-500" />
                                    )}
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900">
                                        {review.userName} {isOwner && <span className="text-xs text-primary-600 bg-primary-50 px-1 rounded ml-1">(Sen)</span>}
                                    </p>
                                    <p className="text-xs text-gray-500">{format(new Date(review.createdAt), 'd MMMM yyyy', { locale: tr })}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded">
                                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                    <span className="text-sm font-medium text-gray-700">{review.rating}</span>
                                </div>
                                {isOwner && (
                                    <div className="flex items-center gap-1 ml-2">
                                        <button
                                            onClick={() => onEdit && onEdit(review)}
                                            className="p-1 text-gray-400 hover:text-primary-600 transition-colors"
                                            title="Düzenle"
                                        >
                                            <Edit2 className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteClick(review.id)}
                                            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                                            title="Sil"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="pl-13 ml-13">
                            <p className="text-gray-600 text-sm mb-2">{review.comment}</p>

                            {/* Employee Badge */}
                            <div className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-md">
                                <User className="h-3 w-3" />
                                <span>İşlem: {review.employeeName}</span>
                            </div>

                            {/* Images */}
                            {review.imageUrls && review.imageUrls.length > 0 && (
                                <div className="flex gap-2 mt-3">
                                    {review.imageUrls.map((url, idx) => (
                                        <img key={idx} src={url} alt="Review" className="h-16 w-16 object-cover rounded-md" />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}

            <ConfirmationModal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                title="Yorumu Sil"
                message="Bu yorumu silmek istediğinize emin misiniz? Bu işlem geri alınamaz."
                confirmText="Sil"
                cancelText="İptal"
            />
        </div>
    );
};
