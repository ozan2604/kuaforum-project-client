import React, { useState, useEffect, useRef } from 'react';
import { ExternalLink, Info, Volume2, VolumeX } from 'lucide-react';
import type { AdApplication } from '../services/ads.service';
import { useNavigate } from 'react-router-dom';

interface DynamicAdBannerProps {
    ad: AdApplication;
    variant?: 'full' | 'compact';
    isMuted?: boolean;
    onToggleMute?: () => void;
}

export const DynamicAdBanner: React.FC<DynamicAdBannerProps> = ({ ad, variant = 'full', isMuted: externalIsMuted, onToggleMute }) => {
    const isCompact = variant === 'compact';
    const navigate = useNavigate();
    const [localIsMuted, setLocalIsMuted] = useState(true);
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const isMuted = externalIsMuted !== undefined ? externalIsMuted : localIsMuted;

    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.muted = isMuted;
        }
    }, [isMuted]);

    useEffect(() => {
        const vid = videoRef.current;
        const container = containerRef.current;
        if (!vid || !container) return;

        const handleVisibilityChange = () => {
            if (document.hidden) {
                vid.pause();
            } else if (container.getBoundingClientRect().top >= 0) { // simple check
                // let IntersectionObserver handle the play if it's intersecting
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    vid.muted = isMuted;
                    vid.play().catch(() => {});
                } else {
                    vid.pause();
                }
            },
            { threshold: 0.5 }
        );

        observer.observe(container);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            observer.disconnect();
        };
    }, [isMuted]);

    const handleToggleMute = (e: React.MouseEvent | React.PointerEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (onToggleMute) {
            onToggleMute();
        } else {
            setLocalIsMuted(!localIsMuted);
        }
    };

    return (
        <div ref={containerRef} className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden">
            {/* Background Media */}
            <div className="absolute inset-0 z-0 bg-black flex items-center justify-center">
                {ad.mediaType === 'video' ? (
                    <video 
                        ref={videoRef}
                        src={ad.mediaUrl} 
                        muted={isMuted}
                        loop 
                        playsInline
                        className="w-full h-full object-cover sm:object-contain opacity-80" 
                    />
                ) : (
                    <div 
                        className="w-full h-full bg-cover sm:bg-contain bg-center bg-no-repeat opacity-80"
                        style={{ backgroundImage: `url(${ad.mediaUrl})` }}
                    />
                )}
            </div>
            
            {/* Dark Overlay for Text Readability */}
            <div className={`absolute inset-0 z-10 bg-gradient-to-t ${isCompact ? 'from-black/90 via-black/50 to-black/30' : 'from-black/90 via-black/40 to-black/20'}`} />

            {/* Mute Toggle */}
            {ad.mediaType === 'video' && (
                <div className={`absolute z-30 ${isCompact ? 'top-2 right-2' : 'top-4 right-4'}`}>
                    <button
                        onPointerDown={e => e.stopPropagation()}
                        onClick={handleToggleMute}
                        className={`rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white border border-white/20 shadow-lg active:scale-90 transition-transform cursor-pointer ${isCompact ? 'w-7 h-7' : 'w-10 h-10'}`}
                    >
                        {isMuted 
                            ? <VolumeX className={isCompact ? 'w-3.5 h-3.5' : 'w-5 h-5'} /> 
                            : <Volume2 className={isCompact ? 'w-3.5 h-3.5' : 'w-5 h-5'} />
                        }
                    </button>
                </div>
            )}

            {/* Ad Content */}
            <div className={`absolute z-20 flex flex-col items-start w-full ${isCompact ? 'bottom-3 px-3' : 'bottom-16 px-6'}`}>
                <div className="flex justify-between items-center w-full mb-2">
                    <span className={`bg-white/20 backdrop-blur-md text-white font-bold rounded uppercase tracking-wider border border-white/30 ${isCompact ? 'text-[7px] px-1 py-px' : 'text-[9px] px-1.5 py-0.5'}`}>
                        Sponsorlu
                    </span>
                    {ad.price && (
                        <span className={`bg-primary-600 text-white font-bold rounded shadow-lg ${isCompact ? 'text-[9px] px-1.5 py-0.5' : 'text-xs px-2 py-0.5'}`}>
                            {ad.price} TL
                        </span>
                    )}
                </div>
                
                <p className={`text-white/95 drop-shadow-md font-medium ${isCompact ? 'text-[10px] leading-snug mb-3 line-clamp-2' : 'text-base mb-6 max-w-[90%]'}`}>
                    {ad.description}
                </p>

                {ad.externalLink ? (
                    <a 
                        href={ad.externalLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`w-full bg-white text-gray-900 font-bold rounded-lg shadow-xl active:scale-95 transition-transform flex items-center justify-center gap-1.5 group ${isCompact ? 'py-1.5 text-[10px]' : 'py-3.5 text-base rounded-xl'}`}
                    >
                        Ürüne Git <ExternalLink className={`${isCompact ? 'w-3 h-3' : 'w-4 h-4'} group-hover:translate-x-1 transition-transform`} />
                    </a>
                ) : (
                    <a 
                        href={`tel:${ad.phoneNumber}`}
                        className={`w-full bg-white text-gray-900 font-bold rounded-lg shadow-xl active:scale-95 transition-transform flex items-center justify-center gap-1.5 group ${isCompact ? 'py-1.5 text-[10px]' : 'py-3.5 text-base rounded-xl'}`}
                    >
                        İletişime Geç <ExternalLink className={`${isCompact ? 'w-3 h-3' : 'w-4 h-4'} group-hover:translate-x-1 transition-transform`} />
                    </a>
                )}
            </div>
            
            {/* Top info prompt (optional) */}
            <div className={`absolute top-4 left-0 w-full flex justify-center z-20 ${isCompact ? 'scale-75 origin-top' : ''}`}>
                <button 
                    onClick={() => navigate('/reklam-ver')}
                    className="flex items-center gap-2 bg-black/40 backdrop-blur-md border border-white/20 text-white/90 text-xs px-4 py-2 rounded-full shadow-lg hover:bg-black/60 transition-colors"
                >
                    <Info className="w-3 h-3" />
                    Reklam Ver
                </button>
            </div>
        </div>
    );
};
