import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ArrowRight, X, Heart, Send, Check, Clapperboard, Volume2, VolumeX, Eye } from 'lucide-react';
import type { MediaHighlight } from '../types/shop';
import { mediaLikeService } from '../api/mediaLike.service';
import { shopService } from '../api/shop.service';
import { useAuth } from '../context/AuthContext';

const HEART_STYLE = `
@keyframes heartPop {
    0%   { transform: scale(0);   opacity: 0.95; }
    40%  { transform: scale(1.4); opacity: 1;    }
    65%  { transform: scale(1.1); opacity: 1;    }
    80%  { transform: scale(1);   opacity: 1;    }
    100% { transform: scale(1);   opacity: 0;    }
}
.heart-pop { animation: heartPop 0.75s ease-out forwards; }
`;

interface MediaCardProps {
    item: MediaHighlight;
    index: number;
    onOpenModal: (item: MediaHighlight) => void;
    isAuthenticated: boolean;
    isFocused: boolean;
    isMuted: boolean;
    onToggleMute: () => void;
}

const MediaCard: React.FC<MediaCardProps> = ({
    item, index, onOpenModal, isAuthenticated, isFocused, isMuted, onToggleMute,
}) => {
    const navigate      = useNavigate();
    const videoRef      = useRef<HTMLVideoElement | null>(null);
    const holdTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isHoldRef     = useRef(false);
    const lastPtrRef    = useRef(0);
    const didDblRef     = useRef(false);

    const viewRecordedRef = useRef(false);

    const [liked, setLiked]           = useState(item.isLikedByCurrentUser);
    const [count, setCount]           = useState(item.likeCount);
    const [showHeart, setShowHeart]   = useState(false);
    const [shareState, setShareState] = useState<'idle' | 'loading' | 'copied'>('idle');
    const [viewCount, setViewCount]   = useState(item.viewCount ?? 0);

    /* Odak değişince oynat / durdur + view kaydet */
    useEffect(() => {
        const vid = videoRef.current;
        if (!vid) return;
        if (isFocused) {
            vid.muted = isMuted;
            vid.play().catch(() => {});
            if (!viewRecordedRef.current) {
                viewRecordedRef.current = true;
                shopService.recordVideoView(item.id).then(newCount => setViewCount(newCount)).catch(() => {});
            }
        } else {
            vid.pause();
        }
    }, [isFocused]);

    /* Global ses değişince sadece odaktaki videoya uygula */
    useEffect(() => {
        if (videoRef.current && isFocused) {
            videoRef.current.muted = isMuted;
        }
    }, [isMuted]);

    const handleShare = async () => {
        if (shareState === 'loading') return;
        const shopUrl   = `${window.location.origin}/shop/${item.shopId}`;
        const shareText = [
            item.shopName,
            item.tags.length > 0 ? item.tags.map(t => `#${t}`).join(' ') : '',
            shopUrl,
        ].filter(Boolean).join('\n');

        setShareState('loading');
        let shared = false;
        try {
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
            if ((err as Error).name === 'AbortError') shared = true;
        }
        if (!shared) {
            await navigator.clipboard.writeText(shopUrl).catch(() => {});
            setShareState('copied');
            setTimeout(() => setShareState('idle'), 2000);
            return;
        }
        setShareState('idle');
    };

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
            const serverLiked = await mediaLikeService.toggle(item.id, item.type);
            setLiked(serverLiked);
            setCount(serverLiked ? item.likeCount + 1 : item.likeCount);
        } catch {
            setLiked(!newLiked);
            setCount(item.likeCount);
        }
    };

    const handlePointerDown = () => {
        const now = Date.now();
        const since = now - lastPtrRef.current;
        if (since < 320 && since > 0) {
            didDblRef.current = true;
            lastPtrRef.current = 0;
            handleLike();
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
            if (isFocused) videoRef.current?.play().catch(() => {});
        }
    };

    const handleClick = () => {
        if (didDblRef.current) { didDblRef.current = false; return; }
        if (isHoldRef.current) return;
        if (item.type === 'video') onOpenModal(item);
        else navigate(`/shop/${item.shopId}`);
    };

    return (
        <div
            data-media-id={String(item.id)}
            className="relative shrink-0 w-[120px] h-[210px] rounded-xl overflow-hidden cursor-pointer select-none"
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            onClick={handleClick}
        >
            {item.type === 'image' ? (
                <img
                    src={item.url}
                    alt={item.shopName}
                    className="w-full h-full object-cover"
                    loading={index < 4 ? 'eager' : 'lazy'}
                    draggable={false}
                />
            ) : (
                <video
                    ref={videoRef}
                    src={item.url}
                    className="w-full h-full object-cover"
                    muted loop playsInline
                    preload="metadata"
                    onLoadedMetadata={e => { e.currentTarget.currentTime = 0.1; }}
                />
            )}

            {showHeart && (
                <div className="heart-pop absolute inset-0 flex items-center justify-center pointer-events-none z-30">
                    <Heart className="w-12 h-12 text-white fill-white drop-shadow-xl" />
                </div>
            )}

            {/* Salon sahibinin atadığı etiketler — sol üst */}
            {item.tags.length > 0 && (
                <div className="absolute top-2 left-2 z-20 flex flex-col gap-0.5 max-w-[80px]">
                    {item.tags.slice(0, 2).map(tag => (
                        <span key={tag} className="px-1.5 py-0.5 rounded-md bg-black/60 backdrop-blur-sm border border-white/20 text-[9px] font-bold text-white/90 tracking-wide truncate">
                            #{tag}
                        </span>
                    ))}
                </div>
            )}

            {/* Ses butonu — sağ üst, sadece videolarda */}
            {item.type === 'video' && (
                <div className="absolute top-2 right-2 z-20">
                    <button
                        onPointerDown={e => e.stopPropagation()}
                        onClick={e => {
                            e.stopPropagation();
                            onToggleMute();
                        }}
                        className="w-7 h-7 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center border border-white/20 active:scale-90 transition-transform"
                    >
                        {isMuted ? <VolumeX className="w-3.5 h-3.5 text-white" /> : <Volume2 className="w-3.5 h-3.5 text-white" />}
                    </button>
                </div>
            )}

            {/* Odak göstergesi — altta ince çizgi */}
            {item.type === 'video' && isFocused && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/60 z-10" />
            )}

            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent pt-6 pb-2 px-2">
                <p className="text-white text-[10px] font-bold leading-tight line-clamp-1 mb-1.5">{item.shopName}</p>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                        <button
                            onPointerDown={e => e.stopPropagation()}
                            onClick={e => { e.stopPropagation(); handleShare(); }}
                            disabled={shareState === 'loading'}
                            className="active:scale-90 transition-transform"
                        >
                            {shareState === 'copied'  ? <Check className="w-3.5 h-3.5 text-green-400" /> :
                             shareState === 'loading' ? <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" /> :
                                                        <Send className="w-3.5 h-3.5 text-white/70" />}
                        </button>
                        {item.type === 'video' && (
                            <div className="flex items-center gap-0.5">
                                <Eye className="w-3.5 h-3.5 text-white/70" />
                                <span className="text-[10px] text-white/70 font-semibold">
                                    {viewCount >= 1000 ? `${(viewCount / 1000).toFixed(1)}B` : viewCount}
                                </span>
                            </div>
                        )}
                    </div>
                    {isAuthenticated ? (
                        <button
                            onPointerDown={e => e.stopPropagation()}
                            onClick={e => { e.stopPropagation(); handleLike(); }}
                            className="flex items-center gap-0.5 active:scale-90 transition-transform"
                        >
                            <Heart className={`w-3.5 h-3.5 transition-colors ${liked ? 'text-red-500 fill-red-500' : 'text-white/70'}`} />
                            <span className="text-[10px] text-white/70 font-semibold">{count}</span>
                        </button>
                    ) : (
                        <div className="flex items-center gap-0.5">
                            <Heart className="w-3.5 h-3.5 text-white/40" />
                            <span className="text-[10px] text-white/40 font-semibold">{count}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

interface MediaStripProps {
    items: MediaHighlight[];
}

export const MediaStrip: React.FC<MediaStripProps> = ({ items }) => {
    const { isAuthenticated } = useAuth();
    const scrollRef    = useRef<HTMLDivElement>(null);
    const navigate     = useNavigate();
    const [videoModal, setVideoModal] = useState<MediaHighlight | null>(null);
    const [isMuted, setIsMuted]       = useState(true);
    const [focusedId, setFocusedId]   = useState<string | null>(null);
    const focusedIdRef                = useRef<string | null>(null);

    const toggleMute = () => setIsMuted(prev => !prev);

    /* Scroll container'ın ortasına en yakın kartı bul */
    const updateFocus = useCallback(() => {
        const container = scrollRef.current;
        if (!container) return;
        const center = container.scrollLeft + container.clientWidth / 2;

        let closestId: string | null = null;
        let minDist = Infinity;

        container.querySelectorAll<HTMLElement>('[data-media-id]').forEach(el => {
            const elCenter = el.offsetLeft + el.offsetWidth / 2;
            const dist = Math.abs(elCenter - center);
            if (dist < minDist) {
                minDist = dist;
                closestId = el.dataset.mediaId ?? null;
            }
        });

        if (closestId !== focusedIdRef.current) {
            focusedIdRef.current = closestId;
            setFocusedId(closestId);
        }
    }, []);

    useEffect(() => {
        const container = scrollRef.current;
        if (!container) return;
        container.addEventListener('scroll', updateFocus, { passive: true });
        // İlk render'dan sonra odağı hesapla
        const t = setTimeout(updateFocus, 80);
        return () => {
            container.removeEventListener('scroll', updateFocus);
            clearTimeout(t);
        };
    }, [updateFocus, items]);

    if (items.length === 0) return null;

    const scroll = () => {
        scrollRef.current?.scrollBy({ left: 300, behavior: 'smooth' });
    };

    return (
        <>
            <style dangerouslySetInnerHTML={{ __html: HEART_STYLE }} />

            <div className="rounded-2xl bg-gray-950 px-3 pt-3 pb-3 my-4">
                <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-1.5">
                        <Clapperboard className="w-3.5 h-3.5 text-white/50" />
                        <p className="text-[11px] font-semibold text-white/50 tracking-wide uppercase">Salonlardan kolaj</p>
                    </div>
                    <button onClick={scroll} className="flex items-center gap-1 text-[11px] font-semibold text-white/40 hover:text-white/70 transition-colors">
                        Sağa kaydır <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                </div>

                <div
                    ref={scrollRef}
                    className="flex gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                >
                    {items.map((item, index) => (
                        <MediaCard
                            key={`${item.shopId}-${index}`}
                            item={item}
                            index={index}
                            onOpenModal={setVideoModal}
                            isAuthenticated={isAuthenticated}
                            isFocused={focusedId !== null
                                ? focusedId === String(item.id)
                                : index === 0}
                            isMuted={isMuted}
                            onToggleMute={toggleMute}
                        />
                    ))}
                </div>
            </div>

            {videoModal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setVideoModal(null)}>
                    <div className="relative w-full max-w-lg rounded-2xl overflow-hidden bg-black shadow-2xl" onClick={e => e.stopPropagation()}>
                        <video src={videoModal.url} className="w-full max-h-[70vh] object-contain" controls autoPlay playsInline />
                        <div className="flex items-center justify-between px-4 py-3 bg-gray-900">
                            <p className="text-white font-bold text-sm">{videoModal.shopName}</p>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => { setVideoModal(null); navigate(`/shop/${videoModal.shopId}`); }}
                                    className="flex items-center gap-1.5 bg-white text-gray-900 text-xs font-bold px-4 py-2 rounded-xl hover:bg-gray-100 transition-colors"
                                >
                                    Salona Git <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => setVideoModal(null)} className="text-gray-400 hover:text-white transition-colors p-1">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
