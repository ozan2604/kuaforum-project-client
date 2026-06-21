import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ArrowRight, X, Volume2, VolumeX, Heart } from 'lucide-react';
import type { MediaHighlight } from '../types/shop';
import { mediaLikeService } from '../api/mediaLike.service';
import { useAuth } from '../context/AuthContext';

/* ── Kalp pop animasyonu ── */
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
    isMuted: boolean;
    isMutedRef: React.RefObject<boolean>;
    onToggleMute: (e: React.MouseEvent | React.PointerEvent) => void;
    onOpenModal: (item: MediaHighlight) => void;
    isAuthenticated: boolean;
}

const MediaCard: React.FC<MediaCardProps> = ({
    item, index, scrollRoot, isMuted, isMutedRef, onToggleMute, onOpenModal, isAuthenticated,
}) => {
    const navigate = useNavigate();
    const videoRef    = useRef<HTMLVideoElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isHoldRef    = useRef(false);
    const lastPtrRef   = useRef(0);
    const didDblRef    = useRef(false);

    const [liked, setLiked]       = useState(item.isLikedByCurrentUser);
    const [count, setCount]       = useState(item.likeCount);
    const [showHeart, setShowHeart] = useState(false);

    /* Ses durumu değişince video elementine uygula */
    useEffect(() => {
        if (videoRef.current) videoRef.current.muted = isMuted;
    }, [isMuted]);

    /* Yatay scroll'da görünürlüğe göre oynat/durdur */
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
            setCount(prev => {
                const expected = serverLiked ? item.likeCount + 1 : item.likeCount;
                return expected;
            });
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
            className="relative shrink-0 w-40 h-56 sm:w-48 sm:h-64 rounded-2xl overflow-hidden cursor-pointer group/card select-none"
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            onClick={handleClick}
        >
            {item.type === 'image' ? (
                <img
                    src={item.url}
                    alt={item.shopName}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-105"
                    loading={index < 4 ? 'eager' : 'lazy'}
                    draggable={false}
                />
            ) : (
                <video
                    ref={videoRef}
                    src={item.url}
                    className="w-full h-full object-cover"
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    onLoadedMetadata={e => { e.currentTarget.currentTime = 0.1; }}
                />
            )}

            {showHeart && (
                <div className="heart-pop absolute inset-0 flex items-center justify-center pointer-events-none z-30">
                    <Heart className="w-16 h-16 text-white fill-white drop-shadow-xl" />
                </div>
            )}

            {item.tags.length > 0 && (
                <div className="absolute top-0 left-0 right-0 pt-2.5 px-2.5 bg-gradient-to-b from-black/50 to-transparent pointer-events-none">
                    <div className="flex flex-wrap gap-1">
                        {item.tags.slice(0, 2).map(tag => (
                            <span key={tag} className="text-[10px] font-semibold text-white bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded-full border border-white/30">
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Ses butonu — sadece videolarda */}
            {item.type === 'video' && (
                <button
                    onPointerDown={e => e.stopPropagation()}
                    onClick={onToggleMute}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/55 backdrop-blur-sm flex items-center justify-center text-white border border-white/20 z-10 active:scale-90 transition-transform"
                >
                    {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                </button>
            )}

            {/* Alt bilgi + beğeni */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent pt-8 pb-2.5 px-3">
                <p className="text-white text-xs font-bold leading-tight line-clamp-1 mb-1.5">{item.shopName}</p>
                <div className="flex items-center justify-between">
                    <div className={`flex items-center gap-1 text-white/80 text-[11px] font-semibold transition-all duration-200 ${item.type === 'image' ? 'opacity-0 group-hover/card:opacity-100' : 'opacity-70'}`}>
                        <span>{item.type === 'video' ? 'Videoyu İzle' : 'Salona Git'}</span>
                        <ArrowRight className="w-3 h-3" />
                    </div>
                    {isAuthenticated && (
                        <button
                            onPointerDown={e => e.stopPropagation()}
                            onClick={e => { e.stopPropagation(); handleLike(); }}
                            className="flex items-center gap-1 active:scale-90 transition-transform"
                        >
                            <Heart className={`w-3.5 h-3.5 transition-colors ${liked ? 'text-red-500 fill-red-500' : 'text-white/80'}`} />
                            <span className="text-[11px] text-white/80 font-semibold">{count}</span>
                        </button>
                    )}
                    {!isAuthenticated && (
                        <div className="flex items-center gap-1">
                            <Heart className="w-3.5 h-3.5 text-white/50" />
                            <span className="text-[11px] text-white/50 font-semibold">{count}</span>
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
    const [videoModal, setVideoModal]     = useState<MediaHighlight | null>(null);
    const [canScrollLeft, setCanScrollLeft]   = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);
    const [isMuted, setIsMuted] = useState(true);
    const isMutedRef = useRef(true);
    const navigate = useNavigate();

    const toggleMute = (e: React.MouseEvent | React.PointerEvent) => {
        e.stopPropagation();
        setIsMuted(prev => {
            isMutedRef.current = !prev;
            return !prev;
        });
    };

    const updateScrollState = () => {
        const el = scrollRef.current;
        if (!el) return;
        setCanScrollLeft(el.scrollLeft > 5);
        setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 5);
    };

    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        updateScrollState();
        el.addEventListener('scroll', updateScrollState, { passive: true });
        return () => el.removeEventListener('scroll', updateScrollState);
    }, [items]);

    if (items.length === 0) return null;

    const scroll = (dir: 'left' | 'right') => {
        scrollRef.current?.scrollBy({ left: dir === 'left' ? -340 : 340, behavior: 'smooth' });
    };

    return (
        <>
            <style dangerouslySetInnerHTML={{ __html: HEART_STYLE }} />

            <div className="flex items-center justify-between mt-2 sm:mt-6 mb-2 px-0.5">
                <p className="text-[11px] font-semibold text-gray-400 tracking-wide uppercase">Salonlardan kolaj</p>
                <button onClick={() => scroll('right')} className="flex items-center gap-1 text-[11px] font-semibold text-gray-400 hover:text-gray-600 transition-colors">
                    Sağa kaydır <ChevronRight className="w-3.5 h-3.5" />
                </button>
            </div>

            <div className="relative mb-6">
                {canScrollLeft && (
                    <button onClick={() => scroll('left')} className="absolute left-1 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white shadow-md border border-gray-200 hidden sm:flex items-center justify-center hover:shadow-lg transition-all">
                        <ChevronLeft className="w-4 h-4 text-gray-700" />
                    </button>
                )}
                {canScrollRight && (
                    <button onClick={() => scroll('right')} className="absolute right-1 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white shadow-md border border-gray-200 hidden sm:flex items-center justify-center hover:shadow-lg transition-all">
                        <ChevronRight className="w-4 h-4 text-gray-700" />
                    </button>
                )}
                <div ref={scrollRef} className="flex gap-3 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] pb-1">
                    {items.map((item, index) => (
                        <MediaCard
                            key={`${item.shopId}-${index}`}
                            item={item}
                            index={index}
                            scrollRoot={scrollRef.current}
                            isMuted={isMuted}
                            isMutedRef={isMutedRef}
                            onToggleMute={toggleMute}
                            onOpenModal={setVideoModal}
                            isAuthenticated={isAuthenticated}
                        />
                    ))}
                </div>
            </div>

            {/* Video Modal */}
            {videoModal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setVideoModal(null)}>
                    <div className="relative w-full max-w-lg rounded-2xl overflow-hidden bg-black shadow-2xl" onClick={e => e.stopPropagation()}>
                        <video src={videoModal.url} className="w-full max-h-[70vh] object-contain" controls autoPlay playsInline />
                        <div className="flex items-center justify-between px-4 py-3 bg-gray-900">
                            <p className="text-white font-bold text-sm">{videoModal.shopName}</p>
                            <div className="flex items-center gap-3">
                                <button onClick={() => { setVideoModal(null); navigate(`/shop/${videoModal.shopId}`); }} className="flex items-center gap-1.5 bg-white text-gray-900 text-xs font-bold px-4 py-2 rounded-xl hover:bg-gray-100 transition-colors">
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
