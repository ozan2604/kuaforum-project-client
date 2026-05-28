import api from './axios';

export interface CreateReviewDto {
    appointmentId: string;
    rating: number;
    comment?: string;
    images?: File[];
}

export interface UpdateReviewDto {
    id: string;
    rating: number;
    comment?: string;
    newImages?: File[];
    deletedImageUrls?: string[];
}

export interface Review {
    id: string;
    appointmentId: string;
    userId: string;
    userName: string;
    userProfileImage?: string;
    shopId: string;
    shopEmployeeId: string;
    employeeName: string;
    shopName: string;
    serviceName: string;
    appointmentDate: string;
    rating: number;
    comment?: string;
    createdAt: string;
    imageUrls: string[];
    servicePrice: number;
}

export const reviewService = {
    addReview: async (data: CreateReviewDto) => {
        // Since backend expects JSON for creation but we might support images later via Multipart
        // For now, let's assume JSON for basic data. 
        // If we want images, we need FormData.
        /*************************************************************************
         * BACKEND NOTE: ReviewController.AddReview accepts [FromBody] CreateReviewDto.
         * It does NOT accept FormData currently.
         * To support images, we need to upload them separately or change backend to [FromForm].
         * The Implementation Plan said "Multipart form data for images".
         * But I implemented `CreateReviewDto` with `List<IFormFile>? Images` inside a class.
         * And Controller uses `[FromBody]`. This WILL FAIL for file uploads.
         * Complex objects with Files usually require `[FromForm]`.
         * 
         * DECISION: For this MVP step, I will implement TEXT/RATING only first to ensure flow works.
         * Then I will fix backend to support images if needed, or use separate image upload endpoint.
         * 
         * Let's stick to JSON for now.
         *************************************************************************/
        const formData = new FormData();
        formData.append('appointmentId', data.appointmentId);
        formData.append('rating', data.rating.toString());
        if (data.comment) formData.append('comment', data.comment);

        if (data.images) {
            data.images.forEach(file => {
                formData.append('images', file);
            });
        }

        // Axios instance will not set Content-Type if we pass FormData, 
        // letting the browser set it with the boundary.
        // Explicitly setting it to undefined here ensures axios doesn't override it with application/json
        const response = await api.post<Review>('/Reviews', formData, {
            headers: {
                'Content-Type': undefined
            }
        });
        return response.data;
    },

    updateReview: async (id: string, data: UpdateReviewDto) => {
        const formData = new FormData();
        formData.append('id', data.id);
        formData.append('rating', data.rating.toString());
        if (data.comment) formData.append('comment', data.comment);

        if (data.newImages) {
            data.newImages.forEach(file => {
                formData.append('newImages', file);
            });
        }

        if (data.deletedImageUrls) {
            data.deletedImageUrls.forEach(url => {
                formData.append('deletedImageUrls', url);
            });
        }

        const response = await api.put<Review>(`/Reviews/${id}`, formData, {
            headers: {
                'Content-Type': undefined
            }
        });
        return response.data;
    },

    deleteReview: async (id: string) => {
        const response = await api.delete(`/Reviews/${id}`);
        return response.data;
    },

    getShopReviews: async (shopId: string, pageNumber = 1, pageSize = 10): Promise<{ items: Review[]; totalCount: number; totalPages: number; pageNumber: number }> => {
        const response = await api.get(`/Reviews/shop/${shopId}?pageNumber=${pageNumber}&pageSize=${pageSize}`);
        return response.data;
    },

    getMyReviews: async () => {
        const response = await api.get<Review[]>('/Reviews/my-reviews');
        return response.data;
    },

    getMyShopReviews: async (shopId: string) => {
        const response = await api.get<Review[]>(`/Reviews/my-shop?shopId=${shopId}`);
        return response.data;
    }
};
