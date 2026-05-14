import React, { useEffect, useRef, useState } from 'react';
import { shopService } from '../../api/shop.service';
import { QRCodeCanvas } from 'qrcode.react';
import { QrCode, X, Loader2, Printer } from 'lucide-react';
import { ShopCategoryLabels } from '../../types/shop';
import type { Shop } from '../../types/shop';
import { toast } from 'react-hot-toast';

const SHOP_BASE_URL = 'https://www.salonbir.com/shop';

const escHtml = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const getAbsImageUrl = (path: string | null | undefined): string | null => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `http://localhost:5000${path}`;
};

export const SalonQrCodePage: React.FC = () => {
    const [shop, setShop] = useState<Shop | null>(null);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        shopService.getMyShop()
            .then(setShop)
            .catch(() => toast.error('Salon bilgileri yüklenemedi.'))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        document.body.style.overflow = isModalOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [isModalOpen]);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsModalOpen(false); };
        if (isModalOpen) window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [isModalOpen]);

    if (loading) return (
        <div className="flex items-center justify-center py-32">
            <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        </div>
    );

    if (!shop) return (
        <div className="flex flex-col items-center justify-center py-32 text-gray-500">
            <QrCode className="w-12 h-12 mb-3 text-gray-300" />
            <p>Salon bilgisi bulunamadı.</p>
        </div>
    );

    const shopUrl = `${SHOP_BASE_URL}/${shop.id}`;
    const coverUrl = getAbsImageUrl(shop.coverImagePath);
    const categoryNames = (shop.categories ?? [])
        .map((c: any) => ShopCategoryLabels[c as keyof typeof ShopCategoryLabels])
        .filter(Boolean);

    const handlePrintFlyer = () => {
        if (!canvasRef.current) return;
        const qrDataUrl = canvasRef.current.toDataURL('image/png');

        const coverHtml = coverUrl
            ? `<img class="cover-img" src="${escHtml(coverUrl)}" alt="">`
            : `<div class="cover-ph"><span>${escHtml(shop.name.slice(0, 2).toUpperCase())}</span></div>`;

        const phoneHtml = shop.phoneNumber
            ? `<div class="detail">
                 <span class="lbl">Tel</span>
                 <span class="val">${escHtml(shop.phoneNumber)}</span>
               </div>`
            : '';

        const catsHtml = categoryNames.length > 0
            ? `<div class="detail cats-row">
                 <span class="lbl">Hizmet</span>
                 <div class="cats">${categoryNames.map(c => `<span class="badge">${escHtml(c)}</span>`).join('')}</div>
               </div>`
            : '';

        const html = `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8">
<title>${escHtml(shop.name)}</title>
<style>
  @page{size:A4 portrait;margin:0}
  *{box-sizing:border-box;margin:0;padding:0}
  html,body{width:210mm;height:297mm;overflow:hidden;background:#fff;font-family:'Segoe UI',Arial,sans-serif}
  .page{width:210mm;height:297mm;display:flex;flex-direction:column;overflow:hidden}

  /* Cover */
  .cover-img{width:100%;height:85mm;object-fit:cover;display:block;flex-shrink:0}
  .cover-ph{width:100%;height:85mm;flex-shrink:0;background:linear-gradient(135deg,#1e293b 0%,#334155 100%);display:flex;align-items:center;justify-content:center}
  .cover-ph span{font-size:72pt;font-weight:900;color:rgba(255,255,255,.08);letter-spacing:8pt}

  /* Brand bar */
  .brand-bar{background:#0f172a;padding:3.5mm 9mm;flex-shrink:0}
  .brand-name{font-size:6.5pt;letter-spacing:4pt;text-transform:uppercase;color:#475569;font-weight:800}

  /* Info */
  .info{padding:7mm 9mm 5mm;flex:1;display:flex;flex-direction:column;justify-content:center;gap:3.5mm;overflow:hidden}
  .shop-name{font-size:21pt;font-weight:900;color:#0f172a;line-height:1.15;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
  .detail{display:flex;align-items:flex-start;gap:3mm}
  .lbl{font-size:6.5pt;font-weight:800;text-transform:uppercase;letter-spacing:1.5pt;color:#94a3b8;min-width:13mm;padding-top:1.5mm;flex-shrink:0}
  .val{font-size:11pt;color:#334155;font-weight:700}
  .cats-row{align-items:flex-start}
  .cats{display:flex;flex-wrap:wrap;gap:1.5mm}
  .badge{padding:1mm 3.5mm;background:#f1f5f9;border-radius:10pt;font-size:7.5pt;font-weight:800;color:#334155}

  /* Divider */
  .divider{height:0.3mm;background:#e2e8f0;margin:0 9mm;flex-shrink:0}

  /* QR */
  .qr-section{padding:5mm 9mm 4mm;display:flex;flex-direction:column;align-items:center;gap:3mm;flex-shrink:0}
  .qr-lbl{font-size:6.5pt;font-weight:900;letter-spacing:3pt;text-transform:uppercase;color:#64748b;text-align:center}
  .qr-frame{padding:3.5mm;border:0.4mm solid #e2e8f0;border-radius:3mm;background:#fff}
  .qr-frame img{width:52mm;height:52mm;display:block}
  .qr-url{font-size:5.5pt;color:#94a3b8;font-family:monospace;word-break:break-all;text-align:center;max-width:100mm;line-height:1.6}

  /* Footer */
  .footer{background:#0f172a;padding:3.5mm;text-align:center;flex-shrink:0}
  .footer-text{font-size:6.5pt;letter-spacing:3.5pt;text-transform:uppercase;color:#334155;font-weight:800}
</style>
</head>
<body>
<div class="page">
  ${coverHtml}
  <div class="brand-bar"><div class="brand-name">SalonBir</div></div>
  <div class="info">
    <div class="shop-name">${escHtml(shop.name)}</div>
    ${phoneHtml}
    ${catsHtml}
  </div>
  <div class="divider"></div>
  <div class="qr-section">
    <div class="qr-lbl">Rezervasyon İçin QR Kodu Okutun</div>
    <div class="qr-frame"><img src="${qrDataUrl}" alt="QR"></div>
    <div class="qr-url">${escHtml(shopUrl)}</div>
  </div>
  <div class="footer"><div class="footer-text">www.salonbir.com</div></div>
</div>
<script>
  var imgs = document.querySelectorAll('img');
  var count = 0, total = imgs.length;
  function tryPrint(){ if(++count >= total){ setTimeout(function(){ window.print(); setTimeout(function(){ window.close(); }, 1200); }, 150); } }
  if(total===0){ setTimeout(function(){ window.print(); setTimeout(function(){ window.close(); }, 1200); }, 150); }
  else { imgs.forEach(function(img){ if(img.complete){ tryPrint(); } else { img.addEventListener('load', tryPrint); img.addEventListener('error', tryPrint); } }); }
</script>
</body>
</html>`;

        const pw = window.open('', '_blank', 'width=600,height=850');
        if (!pw) { toast.error('Popup engelleyici aktif — lütfen izin verin.'); return; }
        pw.document.open();
        pw.document.write(html);
        pw.document.close();
    };

    return (
        <div className="max-w-2xl mx-auto px-4 py-10">
            {/* Page header */}
            <div className="mb-8">
                <h1 className="text-2xl font-black text-primary-800 flex items-center gap-2">
                    <QrCode className="w-6 h-6" />
                    QR Kod Üretici
                </h1>
                <p className="text-gray-500 mt-1 text-sm">
                    Müşterilerinizin kolayca randevu alabilmesi için salon afişinizi oluşturun ve PDF olarak indirin.
                </p>
            </div>

            {/* Info card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center shrink-0">
                        <QrCode className="w-6 h-6 text-primary-600" />
                    </div>
                    <div>
                        <h2 className="font-bold text-gray-800 mb-1">Afiş nasıl çalışır?</h2>
                        <p className="text-sm text-gray-500 leading-relaxed">
                            İndirilen PDF afiş; salon fotoğrafı, ad, telefon, kategoriler ve QR kodunu tek sayfada içerir.
                            Müşteri QR kodu tarayınca doğrudan randevu sayfanıza yönlenir.
                        </p>
                        <p className="text-xs text-primary-500 font-medium mt-2 font-mono break-all">{shopUrl}</p>
                    </div>
                </div>
            </div>

            {/* Generate button */}
            <button
                onClick={() => setIsModalOpen(true)}
                className="w-full flex items-center justify-center gap-3 py-4 bg-primary-700 hover:bg-primary-800 text-white font-bold text-base rounded-2xl shadow-lg shadow-primary-700/20 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
            >
                <QrCode className="w-5 h-5" />
                Afişi Önizle ve İndir
            </button>

            {/* Modal */}
            {isModalOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
                    onClick={(e) => { if (e.target === e.currentTarget) setIsModalOpen(false); }}
                >
                    <div className="absolute inset-0 bg-black/65 backdrop-blur-sm" />

                    <div className="relative z-10 w-full max-w-sm flex flex-col max-h-[92dvh]">

                        {/* Close */}
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="absolute -top-3 -right-3 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-white shadow-lg text-gray-600 hover:text-gray-900 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        {/* Flyer preview card — scrollable */}
                        <div className="overflow-y-auto rounded-2xl shadow-2xl flex-1">
                            <div className="bg-white overflow-hidden">

                                {/* Cover image */}
                                {coverUrl ? (
                                    <img src={coverUrl} alt="" className="w-full h-44 object-cover block" />
                                ) : (
                                    <div className="w-full h-44 bg-gradient-to-br from-primary-800 to-primary-950 flex items-center justify-center">
                                        <span className="text-5xl font-black text-white/10 tracking-widest">
                                            {shop.name.slice(0, 2).toUpperCase()}
                                        </span>
                                    </div>
                                )}

                                {/* Brand bar */}
                                <div className="bg-primary-900 px-5 py-1.5">
                                    <p className="text-[9px] font-bold tracking-[4px] uppercase text-primary-500">SalonBir</p>
                                </div>

                                {/* Info */}
                                <div className="px-5 py-4 space-y-2.5 border-b border-gray-100">
                                    <h3 className="text-xl font-black text-gray-900 leading-tight">{shop.name}</h3>
                                    {shop.phoneNumber && (
                                        <div className="flex items-center gap-2">
                                            <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400 min-w-[36px]">Tel</span>
                                            <span className="text-sm font-bold text-gray-700">{shop.phoneNumber}</span>
                                        </div>
                                    )}
                                    {categoryNames.length > 0 && (
                                        <div className="flex items-start gap-2">
                                            <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400 min-w-[36px] mt-1">Hizmet</span>
                                            <div className="flex flex-wrap gap-1.5">
                                                {categoryNames.map(cat => (
                                                    <span key={cat} className="px-2.5 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs font-bold">
                                                        {cat}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* QR section */}
                                <div className="px-5 py-5 flex flex-col items-center gap-3 bg-gray-50">
                                    <p className="text-[9px] font-bold tracking-[3px] uppercase text-gray-400 text-center">
                                        Rezervasyon İçin QR Kodu Okutun
                                    </p>
                                    <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
                                        <QRCodeCanvas
                                            ref={canvasRef}
                                            value={shopUrl}
                                            size={170}
                                            fgColor="#0f172a"
                                            bgColor="#ffffff"
                                            level="H"
                                            marginSize={1}
                                        />
                                    </div>
                                    <p className="text-[9px] text-gray-400 font-mono break-all text-center max-w-[260px] leading-relaxed">
                                        {shopUrl}
                                    </p>
                                </div>

                                {/* Footer */}
                                <div className="bg-primary-900 py-2.5 text-center">
                                    <span className="text-[9px] font-bold tracking-[4px] uppercase text-primary-600">
                                        www.salonbir.com
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* PDF download button — outside scroll area */}
                        <button
                            onClick={handlePrintFlyer}
                            className="mt-3 w-full flex items-center justify-center gap-2 py-3.5 bg-primary-700 hover:bg-primary-800 text-white font-bold text-sm rounded-xl shadow-lg shadow-primary-700/25 transition-all duration-200 active:scale-[0.98] shrink-0"
                        >
                            <Printer className="w-4 h-4" />
                            PDF Olarak İndir
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
