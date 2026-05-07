import React, { useEffect, useState } from 'react';
import { Star, User, Edit2, Trash2, ChevronDown, Scissors } from 'lucide-react';
import { reviewService, type Review } from '../api/review.service';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { getApiError } from '../utils/storage';
import { ConfirmationModal } from './ConfirmationModal';

const PAGE_SIZE = 10;

interface ReviewsListProps {
    shopId: string;
    onEdit?: (review: Review) => void;
    refreshTrigger?: number;
}

export const ReviewsList: React.FC<ReviewsListProps> = ({ shopId, onEdit, refreshTrigger }) => {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [reviewToDelete, setReviewToDelete] = useState<string | null>(null);
    const { user } = useAuth();

    useEffect(() => {
        setReviews([]);
        setCurrentPage(1);
        loadReviews(1, true);
    }, [shopId, refreshTrigger]);

    const loadReviews = async (page: number, reset = false) => {
        if (reset) setLoading(true);
        else setLoadingMore(true);
        try {
            const data = await reviewService.getShopReviews(shopId, page, PAGE_SIZE);
            setReviews(prev => reset ? data.items : [...prev, ...data.items]);
            setCurrentPage(data.pageNumber);
            setTotalPages(data.totalPages);
            setTotalCount(data.totalCount);
        } catch (error) {
            console.error('Failed to load reviews', error);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    const handleLoadMore = () => {
        if (currentPage < totalPages && !loadingMore) {
            loadReviews(currentPage + 1);
        }
    };

    const handleDeleteClick = (reviewId: string) => {
        setReviewToDelete(reviewId);
        setDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!reviewToDelete) return;
        try {
            await reviewService.deleteReview(reviewToDelete);
            toast.success('Yorum silindi.');
            setReviews([]);
            setCurrentPage(1);
            loadReviews(1, true);
        } catch (err) {
            toast.error(getApiError(err, 'Yorum silinemedi.'));
        } finally {
            setDeleteModalOpen(false);
            setReviewToDelete(null);
        }
    };

    if (loading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className="animate-pulse flex gap-3 p-4 rounded-2xl bg-gray-50">
                        <div className="h-10 w-10 rounded-full bg-gray-200 shrink-0" />
                        <div className="flex-1 space-y-2">
                            <div className="h-3 bg-gray-200 rounded w-1/4" />
                            <div className="h-3 bg-gray-200 rounded w-3/4" />
                            <div className="h-3 bg-gray-200 rounded w-1/2" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (reviews.length === 0) {
        return (
            <div className="text-center py-12">
                <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Star className="w-6 h-6 text-gray-300" />
                </div>
                <p className="text-gray-500 text-sm font-medium">Henüz yorum yapılmamış</p>
                <p className="text-gray-400 text-xs mt-1">İlk yorumu sen yap!</p>
            </div>
        );
    }

    const hasMore = currentPage < totalPages;

    return (
        <div>
            <div className="space-y-3">
                {reviews.map((review) => {
                    const isOwner = user?.id === review.userId;

                    return (
                        <div
                            key={review.id}
                            className={`rounded-2xl border p-4 sm:p-5 transition-colors ${
                                isOwner ? 'bg-primary-50/40 border-primary-100' : 'bg-gray-50/50 border-gray-100'
                            }`}
                        >
                            <div className="flex items-start gap-3">
                                <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center shrink-0 overflow-hidden ring-2 ring-white shadow-sm">
                                    {review.userProfileImage ? (
                                        <img src={review.userProfileImage} alt={review.userName} className="h-full w-full object-cover" />
                                    ) : (
                                        <User className="h-5 w-5 text-gray-400" />
                                    )}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <p className="font-semibold text-gray-900 text-sm leading-none">
                                            {review.userName}
                                        </p>
                                        {isOwner && (
                                            <span className="text-[10px] font-bold text-primary-600 bg-primary-100 px-1.5 py-0.5 rounded-full leading-none">Sen</span>
                                        )}
                                        <span className="text-xs text-gray-400 leading-none">
                                            {format(new Date(review.createdAt), 'd MMM yyyy', { locale: tr })}
                                        </span>
                                    </div>

                                    {review.serviceName && (
                                        <div className="flex items-center gap-1 mt-1.5">
                                            <Scissors className="w-3 h-3 text-gray-400 shrink-0" />
                                            <span className="text-[11px] text-gray-500 font-medium truncate">
                                                {review.serviceName}
                                                {review.employeeName && (
                                                    <span className="text-gray-400"> · {review.employeeName}</span>
                                                )}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                    <div className="flex items-center gap-1 px-2 py-1 rounded-lg border text-xs font-bold text-yellow-600 bg-yellow-50 border-yellow-200">
                                        <Star className="h-3 w-3 fill-current" />
                                        {review.rating}
                                    </div>
                                    {isOwner && (
                                        <>
                                            <button
                                                onClick={() => onEdit && onEdit(review)}
                                                className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-white rounded-lg transition-all"
                                                title="Düzenle"
                                            >
                                                <Edit2 className="h-3.5 w-3.5" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteClick(review.id)}
                                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-white rounded-lg transition-all"
                                                title="Sil"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>

                            {review.comment && (
                                <p className="text-gray-700 text-sm leading-relaxed mt-3 ml-[52px]">
                                    {review.comment}
                                </p>
                            )}

                            {review.imageUrls && review.imageUrls.length > 0 && (
                                <div className="flex gap-2 mt-3 ml-[52px] flex-wrap">
                                    {review.imageUrls.map((url, idx) => (
                                        <img
                                            key={idx}
                                            src={url}
                                            alt="Yorum görseli"
                                            className="h-16 w-16 sm:h-20 sm:w-20 object-cover rounded-xl cursor-zoom-in shadow-sm border border-gray-100"
                                            onClick={() => window.open(url, '_blank')}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {hasMore && (
                <button
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="w-full mt-4 flex items-center justify-center gap-2 py-3 rounded-2xl border border-gray-200 bg-white text-sm font-semibold text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-60"
                >
                    {loadingMore ? (
                        <>
                            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            Yükleniyor…
                        </>
                    ) : (
                        <>
                            <ChevronDown className="w-4 h-4" />
                            Daha Fazla Gör ({totalCount - reviews.length} yorum daha)
                        </>
                    )}
                </button>
            )}

            {!hasMore && totalCount > PAGE_SIZE && (
                <p className="text-center text-xs text-gray-400 mt-4">Tüm {totalCount} yorum gösteriliyor</p>
            )}

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
