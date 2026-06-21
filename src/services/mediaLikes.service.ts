import type { MediaHighlight } from '../types/shop';

const STORAGE_KEY = 'salonbir_media_likes_v1';

export type LikedMediaItem = MediaHighlight & { likedAt: string };

// URL'den tutarlı bir "taban" beğeni sayısı üretir (6-99)
function seedCount(url: string): number {
    let h = 0;
    for (let i = 0; i < Math.min(url.length, 64); i++) {
        h = (Math.imul(31, h) + url.charCodeAt(i)) | 0;
    }
    return (Math.abs(h) % 94) + 6;
}

function readAll(): LikedMediaItem[] {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
    catch { return []; }
}

function writeAll(items: LikedMediaItem[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export const mediaLikesService = {
    isLiked(url: string): boolean {
        return readAll().some(i => i.url === url);
    },

    // Taban + kullanıcının kendi beğenisi
    getCount(url: string): number {
        return seedCount(url) + (this.isLiked(url) ? 1 : 0);
    },

    // Beğen / beğeniyi kaldır. true dönerse "beğenildi"
    toggle(item: MediaHighlight): boolean {
        const all = readAll();
        const idx = all.findIndex(i => i.url === item.url);
        if (idx >= 0) {
            all.splice(idx, 1);
            writeAll(all);
            return false;
        }
        all.unshift({ ...item, likedAt: new Date().toISOString() });
        writeAll(all);
        return true;
    },

    getAll(): LikedMediaItem[] {
        return readAll();
    },
};
