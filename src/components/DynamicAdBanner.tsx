import React from 'react';
import { ExternalLink, Info } from 'lucide-react';
import type { AdApplication } from '../services/ads.service';
import { useNavigate } from 'react-router-dom';

interface DynamicAdBannerProps {
    ad: AdApplication;
    variant?: 'full' | 'compact';
}

export const DynamicAdBanner: React.FC<DynamicAdBannerProps> = ({ ad, variant = 'full' }) => {
    const isCompact = variant === 'compact';
    const navigate = useNavigate();

    return (
        <div className="relative w-full h-full bg-black shrink-0 snap-start flex items-center justify-center overflow-hidden">
            {/* Background Media */}
            <div className="absolute inset-0 z-0 bg-black flex items-center justify-center">
                {ad.mediaType === 'video' ? (
                    <video 
                        src={ad.mediaUrl} 
                        autoPlay 
                        muted 
                        loop 
                        playsInline
                        className="w-full h-full object-contain opacity-80" 
                    />
                ) : (
                    <div 
                        className="w-full h-full bg-contain bg-center bg-no-repeat opacity-80"
                        style={{ backgroundImage: `url(${ad.mediaUrl})` }}
                    />
                )}
            </div>
            
            {/* Dark Overlay for Text Readability */}
            <div className={`absolute inset-0 z-10 bg-gradient-to-t ${isCompact ? 'from-black/90 via-black/50 to-black/30' : 'from-black/90 via-black/40 to-black/20'}`} />

            {/* Ad Content */}
            <div className={`absolute z-20 flex flex-col items-start w-full ${isCompact ? 'bottom-3 px-3' : 'bottom-16 px-6'}`}>
                <div className="flex justify-between items-center w-full mb-2">
                    <span className={`bg-white/20 backdrop-blur-md text-white font-bold rounded uppercase tracking-wider border border-white/30 ${isCompact ? 'text-[8px] px-1.5 py-0.5' : 'text-[10px] px-2 py-1'}`}>
                        Sponsorlu
                    </span>
                    {ad.price && (
                        <span className={`bg-primary-600 text-white font-bold rounded shadow-lg ${isCompact ? 'text-[10px] px-1.5 py-0.5' : 'text-sm px-3 py-1'}`}>
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
                    Reklam Verin
                </button>
            </div>
        </div>
    );
};
