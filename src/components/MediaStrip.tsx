import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ArrowRight, X, Heart, Send, Check, Clapperboard } from 'lucide-react';
import type { MediaHighlight } from '../types/shop';
import { mediaLikeService } from '../api/mediaLike.service';
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
    scrollRoot: HTMLDivElement | null;
    onOpenModal: (item: MediaHighlight) => void;
    isAuthenticated: boolean;
}

const MediaCard: React.FC<MediaCardProps> = ({ item, index, scrollRoot, onOpenModal, isAuthenticated }) => {
    const navigate      = useNavigate();
    const videoRef      = useRef<HTMLVideoElement | null>(null);
    const containerRef  = useRef<HTMLDivElement | null>(null);
    const holdTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isHoldRef     = useRef(false);
    const lastPtrRef    = useRef(0);
    const didDblRef     = useRef(false);

    const [liked, setLiked]         = useState(item.isLikedByCurrentUser);
    const [count, setCount]         = useState(item.likeCount);
    const [showHeart, setShowHeart] = useState(false);
    const [copied, setCopied]       = useState(false);

    const handleShare = async (e: React.PointerEvent) => {
        e.stopPropagation();
        const url = `${window.location.origin}/kolaj?id=${item.id}`;
        if (navigator.share) {
            try { await navigator.share({ title: item.shopName, url }); } catch { /* iptal */ }
        } else {
            await navigator.clipboard.writeText(url).catch(() => {});
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    useEffect(() => {
        const vid = videoRef.current;
        const container = containerRef.current;
        if (!vid || !container) return;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    vid.muted = true;
                    vid.play().catch(() => {});
                } else {
                    vid.pause();
                }
            },
            { root: scrollRoot, threshold: 0.4 },
        );
        observer.observe(container);
        return () => observer.disconnect();
    }, [scrollRoot]);

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
            videoRef.current?.play().catch(() => {});
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
            ref={containerRef}
            className="relative shrink-0 w-[88px] h-40 rounded-xl overflow-hidden cursor-pointer select-none"
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
                    <Heart className="w-10 h-10 text-white fill-white drop-shadow-xl" />
                </div>
            )}

            {item.type === 'video' && (
                <div className="absolute top-1.5 right-1.5 pointer-events-none z-10">
                    <div className="w-4 h-4 rounded-full bg-black/60 flex items-center justify-center">
                        <ArrowRight className="w-2 h-2 text-white" />
                    </div>
                </div>
            )}

            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent pt-5 pb-1.5 px-1.5">
                <p className="text-white text-[9px] font-bold leading-tight line-clamp-1 mb-1">{item.shopName}</p>
                <div className="flex items-center justify-between">
                    <button onPointerDown={handleShare} className="active:scale-90 transition-transform">
                        {copied
                            ? <Check className="w-3 h-3 text-green-400" />
                            : <Send className="w-3 h-3 text-white/70" />}
                    </button>
                    {isAuthenticated ? (
                        <button
                            onPointerDown={e => e.stopPropagation()}
                            onClick={e => { e.stopPropagation(); handleLike(); }}
                            className="flex items-center gap-0.5 active:scale-90 transition-transform"
                        >
                            <Heart className={`w-3 h-3 transition-colors ${liked ? 'text-red-500 fill-red-500' : 'text-white/70'}`} />
                            <span className="text-[9px] text-white/70 font-semibold">{count}</span>
                        </button>
                    ) : (
                        <div className="flex items-center gap-0.5">
                            <Heart className="w-3 h-3 text-white/40" />
                            <span className="text-[9px] text-white/40 font-semibold">{count}</span>
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
    const scrollRef  = useRef<HTMLDivElement>(null);
    const navigate   = useNavigate();
    const [videoModal, setVideoModal] = useState<MediaHighlight | null>(null);

    if (items.length === 0) return null;

    const scroll = () => {
        scrollRef.current?.scrollBy({ left: 260, behavior: 'smooth' });
    };

    return (
        <>
            <style dangerouslySetInnerHTML={{ __html: HEART_STYLE }} />

            {/* Dark reels modülü */}
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
                            scrollRoot={scrollRef.current}
                            onOpenModal={setVideoModal}
                            isAuthenticated={isAuthenticated}
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
