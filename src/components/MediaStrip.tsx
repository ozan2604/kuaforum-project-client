import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Play, ArrowRight } from 'lucide-react';
import type { MediaHighlight } from '../types/shop';

interface MediaStripProps {
    items: MediaHighlight[];
}

export const MediaStrip: React.FC<MediaStripProps> = ({ items }) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const videoRefs = useRef<Record<number, HTMLVideoElement | null>>({});
    const navigate = useNavigate();

    if (items.length === 0) return null;

    const scroll = (dir: 'left' | 'right') => {
        if (!scrollRef.current) return;
        scrollRef.current.scrollBy({ left: dir === 'left' ? -340 : 340, behavior: 'smooth' });
    };

    const handleMouseEnter = (index: number) => {
        setHoveredIndex(index);
        const vid = videoRefs.current[index];
        if (vid) {
            vid.currentTime = 0;
            vid.play().catch(() => {});
        }
    };

    const handleMouseLeave = (index: number) => {
        setHoveredIndex(null);
        const vid = videoRefs.current[index];
        if (vid) vid.pause();
    };

    return (
        <div className="relative group/strip my-6">
            {/* Sol ok */}
            <button
                onClick={() => scroll('left')}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white shadow-lg border border-gray-200 hidden sm:flex items-center justify-center opacity-0 group-hover/strip:opacity-100 transition-all hover:shadow-xl -translate-x-1"
            >
                <ChevronLeft className="w-5 h-5 text-gray-700" />
            </button>

            {/* Sağ ok */}
            <button
                onClick={() => scroll('right')}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white shadow-lg border border-gray-200 hidden sm:flex items-center justify-center opacity-0 group-hover/strip:opacity-100 transition-all hover:shadow-xl translate-x-1"
            >
                <ChevronRight className="w-5 h-5 text-gray-700" />
            </button>

            {/* Scroll container */}
            <div
                ref={scrollRef}
                className="flex gap-3 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] pb-1"
            >
                {items.map((item, index) => (
                    <div
                        key={`${item.shopId}-${index}`}
                        className="relative shrink-0 w-40 h-56 sm:w-48 sm:h-64 rounded-2xl overflow-hidden cursor-pointer group/card"
                        onMouseEnter={() => handleMouseEnter(index)}
                        onMouseLeave={() => handleMouseLeave(index)}
                        onClick={() => navigate(`/shop/${item.shopId}`)}
                    >
                        {/* Media */}
                        {item.type === 'image' ? (
                            <img
                                src={item.url}
                                alt={item.shopName}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-105"
                            />
                        ) : (
                            <>
                                <video
                                    ref={el => { videoRefs.current[index] = el; }}
                                    src={item.url}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-105"
                                    muted
                                    loop
                                    playsInline
                                    preload="metadata"
                                />
                                {/* Video play ikonu — hover'da kaybolur */}
                                <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-200 ${hoveredIndex === index ? 'opacity-0' : 'opacity-100'}`}>
                                    <div className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-lg">
                                        <Play className="w-4 h-4 text-gray-900 fill-gray-900 ml-0.5" />
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Üst gradient + etiketler */}
                        {item.tags.length > 0 && (
                            <div className="absolute top-0 left-0 right-0 pt-2.5 px-2.5 bg-gradient-to-b from-black/50 to-transparent">
                                <div className="flex flex-wrap gap-1">
                                    {item.tags.slice(0, 2).map((tag) => (
                                        <span
                                            key={tag}
                                            className="text-[10px] font-semibold text-white bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded-full border border-white/30"
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Alt gradient + salon adı + git butonu */}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent pt-8 pb-3 px-3">
                            <p className="text-white text-xs font-bold leading-tight line-clamp-1 mb-2">
                                {item.shopName}
                            </p>
                            <div className={`flex items-center gap-1 text-white/80 text-[11px] font-semibold transition-all duration-200 ${hoveredIndex === index ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'}`}>
                                <span>Salona Git</span>
                                <ArrowRight className="w-3 h-3" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
