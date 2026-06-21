import api from './axios';
import type { MediaHighlight } from '../types/shop';

export const mediaLikeService = {
    /** Beğeni ekle/kaldır. { isLiked: boolean } döner. */
    toggle: async (mediaItemId: string, type: 'image' | 'video'): Promise<boolean> => {
        const res = await api.post<{ isLiked: boolean }>(`/medialike/${mediaItemId}?type=${type}`);
        return res.data.isLiked;
    },

    /** Kullanıcının beğendiği medya öğelerini döner (Favoriler sayfası). */
    getMyLikes: async (): Promise<MediaHighlight[]> => {
        const res = await api.get<MediaHighlight[]>('/medialike/my-likes');
        return res.data;
    },
};
