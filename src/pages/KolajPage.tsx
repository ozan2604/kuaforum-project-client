import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Play, ArrowRight, Volume2, VolumeX, Heart, Send, Check } from 'lucide-react';
import { shopService } from '../api/shop.service';
import { mediaLikeService } from '../api/mediaLike.service';
import type { MediaHighlight } from '../types/shop';
import { useAuth } from '../context/AuthContext';

const ITEM_HEIGHT = 'calc(100dvh - 56px - 56px)';

const HEART_STYLE = `
@keyframes heartPopBig {
    0%   { transform: scale(0);   opacity: 0.95; }
    40%  { transform: scale(1.3); opacity: 1;    }
    65%  { transform: scale(1.05); opacity: 1;   }
    80%  { transform: scale(1);   opacity: 1;    }
    100% { transform: scale(1);   opacity: 0;    }
}
.heart-pop-big { animation: heartPopBig 0.75s ease-out forwards; }
`;

interface ReelItemProps {
    item: MediaHighlight;
    index: number;
    isMuted: boolean;
    isMutedRef: React.RefObject<boolean>;
    onToggleMute: () => void;
    isAuthenticated: boolean;
}

const ReelItem: React.FC<ReelItemProps> = ({ item, index, isMuted, isMutedRef, onToggleMute, isAuthenticated }) => {
    const navigate       = useNavigate();
    const videoRef       = useRef<HTMLVideoElement | null>(null);
    const containerRef   = useRef<HTMLDivElement | null>(null);
    const holdTimerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isHoldRef      = useRef(false);
    const lastPtrRef     = useRef(0);
    const didDblRef      = useRef(false);

    const [liked, setLiked]         = useState(item.isLikedByCurrentUser);
    const [count, setCount]         = useState(item.likeCount);
    const [showHeart, setShowHeart] = useState(false);
    const [shareState, setShareState] = useState<'idle' | 'loading' | 'copied'>('idle');

    useEffect(() => {
        if (videoRef.current) videoRef.current.muted = isMuted;
    }, [isMuted]);

    useEffect(() => {
        const vid = videoRef.current;
        const container = containerRef.current;
        if (!vid || !container) return;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    vid.muted = isMutedRef.current;
                    vid.play().catch(() => {});
                } else {
                    vid.pause();
                }
            },
            { threshold: 0.6 },
        );
        observer.observe(container);
        return () => observer.disconnect();
    }, []);

    const handleLike = async () => {
        if (!isAuthenticated) return;
        const newLiked = !liked;
        setLiked(newLiked);
        setCount(prev => prev + (newLiked ? 1 : -1));
        if (newLiked) {
            setShowHeart(true);
            setTimeout(() => setShowHeart(false), 800);
        }
        try {
            await mediaLikeService.toggle(item.id, item.type);
        } catch {
            setLiked(!newLiked);
            setCount(item.likeCount);
        }
    };

    const handleShare = async () => {
        if (shareState === 'loading') return;
        const shopUrl  = `${window.location.origin}/shop/${item.shopId}`;
        const shareText = [
            item.shopName,
            item.tags.length > 0 ? item.tags.map(t => `#${t}`).join(' ') : '',
            shopUrl,
        ].filter(Boolean).join('\n');

        setShareState('loading');
        let shared = false;
        try {
            /* Medya dosyasını çek → Instagram Story için gerekli */
            if (typeof navigator.canShare === 'function') {
                const ctrl    = new AbortController();
                const timeout = setTimeout(() => ctrl.abort(), 10_000);
                try {
                    const resp = await fetch(item.url, { signal: ctrl.signal, mode: 'cors' });
                    clearTimeout(timeout);
                    const blob = await resp.blob();
                    const ext  = item.type === 'video' ? 'mp4' : 'jpg';
                    const file = new File([blob], `salonbir.${ext}`, { type: blob.type });
                    if (navigator.canShare({ files: [file] })) {
                        await navigator.share({ files: [file], title: item.shopName, text: shareText });
                        shared = true;
                    }
                } catch { clearTimeout(timeout); }
            }
            if (!shared && navigator.share) {
                await navigator.share({ title: item.shopName, text: shareText, url: shopUrl });
                shared = true;
            }
        } catch (err) {
            if ((err as Error).name === 'AbortError') shared = true; /* kullanıcı iptal etti */
        }
        if (!shared) {
            await navigator.clipboard.writeText(shopUrl).catch(() => {});
            setShareState('copied');
            setTimeout(() => setShareState('idle'), 2000);
            return;
        }
        setShareState('idle');
    };

    const handlePointerDown = () => {
        const now = Date.now();
        const since = now - lastPtrRef.current;

        if (since < 320 && since > 0) {
            didDblRef.current = true;
            lastPtrRef.current = 0;
            if (!liked) {
                handleLike();
            } else {
                setShowHeart(true);
                setTimeout(() => setShowHeart(false), 800);
            }
            return;
        }
        lastPtrRef.current = now;
        didDblRef.current  = false;
        isHoldRef.current  = false;

        if (item.type === 'video') {
            holdTimerRef.current = setTimeout(() => {
                isHoldRef.current = true;
                videoRef.current?.pause();
            }, 200);
        }
    };

    const handlePointerUp = () => {
        if (holdTimerRef.current) { clearTimeout(holdTimerRef.current); holdTimerRef.current = null; }
        if (isHoldRef.current) {
            isHoldRef.current = false;
            videoRef.current?.play().catch(() => {});
        }
    };

    return (
        <div
            ref={containerRef}
            className="relative w-full shrink-0 snap-start snap-always overflow-hidden bg-black select-none"
            style={{ height: ITEM_HEIGHT }}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
        >
            {item.type === 'image' ? (
                <img src={item.url} alt={item.shopName} className="w-full h-full object-cover" loading={index < 3 ? 'eager' : 'lazy'} draggable={false} />
            ) : (
                <video
                    ref={videoRef}
                    src={item.url}
                    className="w-full h-full object-cover"
                    muted loop playsInline
                    preload={index < 2 ? 'auto' : 'metadata'}
                    onLoadedMetadata={e => { e.currentTarget.currentTime = 0.1; }}
                />
            )}

            {showHeart && (
                <div className="heart-pop-big absolute inset-0 flex items-center justify-center pointer-events-none z-30">
                    <Heart className="w-28 h-28 text-white fill-white drop-shadow-2xl" />
                </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent pointer-events-none" />

            {item.tags.length > 0 && (
                <div className="absolute top-4 left-4 flex flex-wrap gap-1 pointer-events-none">
                    {item.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="text-[11px] font-semibold text-white bg-white/20 backdrop-blur-sm px-2.5 py-0.5 rounded-full border border-white/30">{tag}</span>
                    ))}
                </div>
            )}

            {/* Ses butonu — sağ üst köşe, sadece videolarda */}
            {item.type === 'video' && (
                <button
                    onPointerDown={e => e.stopPropagation()}
                    onClick={() => {
                        if (videoRef.current) {
                            videoRef.current.muted = !videoRef.current.muted;
                        }
                        onToggleMute();
                    }}
                    className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white border border-white/20 shadow-lg active:scale-90 transition-transform z-20"
                    aria-label={isMuted ? 'Sesi aç' : 'Sesi kapat'}
                >
                    {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
            )}

            {/* Alt bilgi + beğeni */}
            <div className="absolute bottom-4 left-4 right-4 pb-2">
                <p className="text-white font-bold text-xl leading-snug mb-3 drop-shadow-sm">{item.shopName}</p>
                {/* Salona Git + Beğeni yan yana */}
                <div className="flex items-center justify-between">
                    <button
                        onPointerDown={e => e.stopPropagation()}
                        onClick={() => navigate(`/shop/${item.shopId}`)}
                        className="inline-flex items-center gap-1.5 bg-white text-gray-900 text-sm font-bold px-4 py-2.5 rounded-2xl shadow-lg active:scale-95 transition-transform"
                    >
                        Salona Git <ArrowRight className="w-4 h-4" />
                    </button>

                    <div className="flex items-end gap-3">
                        {/* Paylaş */}
                        <button
                            onPointerDown={e => e.stopPropagation()}
                            onClick={handleShare}
                            disabled={shareState === 'loading'}
                            className="flex flex-col items-center gap-0.5 active:scale-90 transition-transform disabled:opacity-60"
                        >
                            <div className="w-11 h-11 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center border border-white/20 shadow-lg">
                                {shareState === 'copied'  ? <Check className="w-5 h-5 text-green-400" /> :
                                 shareState === 'loading' ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> :
                                                            <Send className="w-5 h-5 text-white" />}
                            </div>
                            <span className="text-white text-[11px] font-bold drop-shadow">
                                {shareState === 'copied' ? 'Kopyalandı' : 'Paylaş'}
                            </span>
                        </button>

                        {/* Beğeni */}
                        {isAuthenticated ? (
                            <button
                                onPointerDown={e => e.stopPropagation()}
                                onClick={handleLike}
                                className="flex flex-col items-center gap-0.5 active:scale-90 transition-transform"
                            >
                                <div className="w-11 h-11 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center border border-white/20 shadow-lg">
                                    <Heart className={`w-5 h-5 transition-colors ${liked ? 'text-red-500 fill-red-500' : 'text-white'}`} />
                                </div>
                                <span className="text-white text-[11px] font-bold drop-shadow">{count}</span>
                            </button>
                        ) : (
                            <div className="flex flex-col items-center gap-0.5">
                                <div className="w-11 h-11 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center border border-white/20">
                                    <Heart className="w-5 h-5 text-white/40" />
                                </div>
                                <span className="text-white/40 text-[11px] font-bold">{count}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export const KolajPage: React.FC = () => {
    const { isAuthenticated } = useAuth();
    const location            = useLocation();
    const [items, setItems]   = useState<MediaHighlight[]>([]);
    const [loading, setLoading] = useState(true);
    const [isMuted, setIsMuted] = useState(true);
    const isMutedRef  = useRef(true);
    const scrollRef   = useRef<HTMLDivElement>(null);

    const toggleMute = () => setIsMuted(prev => {
        isMutedRef.current = !prev;
        return !prev;
    });

    useEffect(() => {
        shopService.getMediaHighlights(undefined, undefined, undefined, 100)
            .then(data => setItems(data)).catch(() => {}).finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (!items.length || !scrollRef.current) return;
        const targetId = new URLSearchParams(location.search).get('id');
        if (!targetId) return;
        const index = items.findIndex(i => String(i.id) === targetId);
        if (index > 0) {
            scrollRef.current.scrollTop = index * scrollRef.current.clientHeight;
        }
    }, [items, location.search]);

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
        <>
            <style dangerouslySetInnerHTML={{ __html: HEART_STYLE }} />
            <div ref={scrollRef} className="overflow-y-scroll snap-y snap-mandatory" style={{ height: ITEM_HEIGHT }}>
                {items.map((item, index) => (
                    <ReelItem
                        key={`${item.shopId}-${index}`}
                        item={item}
                        index={index}
                        isMuted={isMuted}
                        isMutedRef={isMutedRef}
                        onToggleMute={toggleMute}
                        isAuthenticated={isAuthenticated}
                    />
                ))}
            </div>
        </>
    );
};
