import React from 'react';
import { ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

interface AdBannerProps {
    type: 'cosmetics' | 'equipment';
    variant?: 'full' | 'compact';
}

export const AdBanner: React.FC<AdBannerProps> = ({ type, variant = 'full' }) => {
    const navigate = useNavigate();
    const isCosmetics = type === 'cosmetics';
    const bgImage = isCosmetics ? '/ad_cosmetics.png' : '/ad_equipment.png';
    const title = isCosmetics ? "Premium Salon Ürünleri" : "Profesyonel Ekipmanlar";
    const desc = isCosmetics ? "İşletmenizi bir üst seviyeye taşıyacak premium ürünlerimizi keşfedin." : "Salonunuz için en kaliteli ve uzun ömürlü profesyonel ekipmanlar.";

    const isCompact = variant === 'compact';

    const handleContact = () => {
        toast("Reklam vermek için:\n0531 778 85 04 nolu telefondan veya salonbir26@gmail.com adresinden bize ulaşabilirsiniz.", {
            icon: '📞',
            duration: 5000
        });
    };

    return (
        <div className="relative w-full h-full bg-black shrink-0 snap-start flex items-center justify-center overflow-hidden">
            {/* Background Image */}
            <div 
                className="absolute inset-0 z-0 bg-cover bg-center opacity-80"
                style={{ backgroundImage: `url(${bgImage})` }}
            />
            
            {/* Dark Overlay for Text Readability */}
            <div className={`absolute inset-0 z-10 bg-gradient-to-t ${isCompact ? 'from-black/90 via-black/50 to-black/30' : 'from-black/90 via-black/40 to-black/20'}`} />

            {/* Ad Content */}
            <div className={`absolute z-20 flex flex-col items-start ${isCompact ? 'bottom-3 left-3 right-3' : 'bottom-16 left-6 right-6'}`}>
                <span className={`bg-white/20 backdrop-blur-md text-white font-bold rounded uppercase tracking-wider border border-white/30 ${isCompact ? 'text-[8px] px-1.5 py-0.5 mb-1.5' : 'text-[10px] px-2 py-1 mb-3'}`}>
                    Sponsorlu
                </span>
                
                <h2 className={`text-white font-black leading-tight drop-shadow-lg ${isCompact ? 'text-[13px] mb-1' : 'text-3xl mb-2'}`}>
                    {title}
                </h2>
                
                <p className={`text-white/90 drop-shadow-md ${isCompact ? 'text-[9px] leading-snug mb-3 line-clamp-2' : 'text-sm mb-6 max-w-[85%]'}`}>
                    {desc}
                </p>

                <button 
                    onClick={() => navigate('/reklam-ver')}
                    className={`w-full bg-white text-gray-900 font-bold rounded-lg shadow-xl active:scale-95 transition-transform flex items-center justify-center gap-1.5 group ${isCompact ? 'py-1.5 text-[10px]' : 'py-3.5 text-base rounded-xl'}`}
                >
                    Hemen Başvur <ExternalLink className={`${isCompact ? 'w-3 h-3' : 'w-4 h-4'} group-hover:translate-x-1 transition-transform`} />
                </button>
            </div>
            
            {/* "Reklam Verin" Prompt at top */}
            {!isCompact && (
                <div className="absolute top-6 left-0 w-full flex justify-center z-20">
                    <div 
                        onClick={handleContact}
                        className="bg-black/40 backdrop-blur-md border border-white/20 text-white/90 text-xs px-4 py-2 rounded-full shadow-lg text-center cursor-pointer hover:bg-black/60 transition-colors"
                    >
                        Burada reklam vermek için <strong>iletişime geçin</strong>
                    </div>
                </div>
            )}
            {isCompact && (
                <div className="absolute top-2 left-0 w-full flex justify-center z-20">
                    <div 
                        onClick={handleContact}
                        className="bg-black/40 backdrop-blur-md border border-white/20 text-white/90 text-[8px] px-2 py-1 rounded-full shadow-lg text-center cursor-pointer hover:bg-black/60 transition-colors"
                    >
                        Reklam ver
                    </div>
                </div>
            )}
        </div>
    );
};
