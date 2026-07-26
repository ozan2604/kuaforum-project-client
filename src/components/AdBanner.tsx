import React from 'react';
import { ExternalLink } from 'lucide-react';

interface AdBannerProps {
    type: 'cosmetics' | 'equipment';
}

export const AdBanner: React.FC<AdBannerProps> = ({ type }) => {
    const isCosmetics = type === 'cosmetics';
    const bgImage = isCosmetics ? '/ad_cosmetics.png' : '/ad_equipment.png';
    const title = isCosmetics ? "Premium Salon Ürünleri" : "Profesyonel Ekipmanlar";
    const desc = isCosmetics ? "İşletmenizi bir üst seviyeye taşıyacak premium ürünlerimizi keşfedin." : "Salonunuz için en kaliteli ve uzun ömürlü profesyonel ekipmanlar.";

    return (
        <div className="relative w-full h-full bg-black shrink-0 snap-start flex items-center justify-center overflow-hidden">
            {/* Background Image */}
            <div 
                className="absolute inset-0 z-0 bg-cover bg-center opacity-80"
                style={{ backgroundImage: `url(${bgImage})` }}
            />
            
            {/* Dark Overlay for Text Readability */}
            <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/90 via-black/40 to-black/20" />

            {/* Ad Content */}
            <div className="absolute bottom-16 left-6 right-6 z-20 flex flex-col items-start">
                <span className="bg-white/20 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded mb-3 uppercase tracking-wider border border-white/30">
                    Sponsorlu
                </span>
                
                <h2 className="text-white font-black text-3xl leading-tight mb-2 drop-shadow-lg">
                    {title}
                </h2>
                
                <p className="text-white/90 text-sm mb-6 max-w-[85%] drop-shadow-md">
                    {desc}
                </p>

                <button 
                    onClick={() => alert('Reklam modülü çok yakında aktif olacak!')}
                    className="w-full bg-white text-gray-900 font-bold py-3.5 rounded-xl shadow-xl active:scale-95 transition-transform flex items-center justify-center gap-2 group"
                >
                    Hemen Başvur <ExternalLink className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
            </div>
            
            {/* "Reklam Verin" Prompt at top */}
            <div className="absolute top-6 left-0 w-full flex justify-center z-20">
                <div 
                    onClick={() => alert('Reklam vermek için: info@salonbir.com adresinden bize ulaşabilirsiniz.')}
                    className="bg-black/40 backdrop-blur-md border border-white/20 text-white/90 text-xs px-4 py-2 rounded-full shadow-lg text-center cursor-pointer hover:bg-black/60 transition-colors"
                >
                    Burada reklam vermek için <strong>iletişime geçin</strong>
                </div>
            </div>
        </div>
    );
};
