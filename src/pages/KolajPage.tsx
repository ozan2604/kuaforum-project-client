import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, ArrowRight } from 'lucide-react';
import { shopService } from '../api/shop.service';
import type { MediaHighlight } from '../types/shop';

// Navbar height is h-24 = 96px, bottom nav is ~56px on mobile
const ITEM_HEIGHT = 'calc(100dvh - 96px)';

const ReelItem: React.FC<{ item: MediaHighlight; index: number }> = ({ item, index }) => {
    const navigate = useNavigate();
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const vid = videoRef.current;
        const container = containerRef.current;
        if (!vid || !container) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    vid.currentTime = 0;
                    vid.play().catch(() => {});
                } else {
                    vid.pause();
                }
            },
            { threshold: 0.6 }
        );
        observer.observe(container);
        return () => observer.disconnect();
    }, []);

    return (
        <div
            ref={containerRef}
            className="relative w-full shrink-0 snap-start snap-always overflow-hidden bg-black"
            style={{ height: ITEM_HEIGHT }}
        >
            {item.type === 'image' ? (
                <img
                    src={item.url}
                    alt={item.shopName}
                    className="w-full h-full object-cover"
                    loading={index < 3 ? 'eager' : 'lazy'}
                />
            ) : (
                <video
                    ref={videoRef}
                    src={item.url}
                    className="w-full h-full object-cover"
                    muted
                    loop
                    playsInline
                    preload={index < 2 ? 'auto' : 'metadata'}
                    onLoadedMetadata={e => { e.currentTarget.currentTime = 0.1; }}
                />
            )}

            {/* Karartma gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent pointer-events-none" />

            {/* Video ikon */}
            {item.type === 'video' && (
                <div className="absolute top-4 right-4">
                    <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <Play className="w-4 h-4 text-white fill-white ml-0.5" />
                    </div>
                </div>
            )}

            {/* Etiketler */}
            {item.tags.length > 0 && (
                <div className="absolute top-4 left-4 flex flex-wrap gap-1">
                    {item.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="text-[11px] font-semibold text-white bg-white/20 backdrop-blur-sm px-2.5 py-0.5 rounded-full border border-white/30">
                            {tag}
                        </span>
                    ))}
                </div>
            )}

            {/* Alt bilgi — bottom navın üstünde kalacak şekilde */}
            <div className="absolute bottom-16 left-4 right-4 pb-2">
                <p className="text-white font-bold text-xl leading-snug mb-1 drop-shadow-sm">{item.shopName}</p>
                <button
                    onClick={() => navigate(`/shop/${item.shopId}`)}
                    className="mt-2 inline-flex items-center gap-1.5 bg-white text-gray-900 text-sm font-bold px-4 py-2.5 rounded-2xl shadow-lg active:scale-95 transition-transform"
                >
                    Salona Git
                    <ArrowRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

export const KolajPage: React.FC = () => {
    const [items, setItems] = useState<MediaHighlight[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        shopService
            .getMediaHighlights(undefined, undefined, undefined, 100)
            .then(data => setItems(data))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center" style={{ height: ITEM_HEIGHT }}>
                <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center gap-3 text-gray-400" style={{ height: ITEM_HEIGHT }}>
                <Play className="w-12 h-12" />
                <p className="text-sm font-semibold">Henüz içerik yok</p>
            </div>
        );
    }

    return (
        <div
            className="overflow-y-scroll snap-y snap-mandatory"
            style={{ height: ITEM_HEIGHT }}
        >
            {items.map((item, index) => (
                <ReelItem key={`${item.shopId}-${index}`} item={item} index={index} />
            ))}
        </div>
    );
};
