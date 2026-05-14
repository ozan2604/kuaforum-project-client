import React, { useEffect, useRef, useState } from 'react';
import { shopService } from '../../api/shop.service';
import { QRCodeCanvas } from 'qrcode.react';
import { QrCode, X, Loader2, Printer, Phone } from 'lucide-react';
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

        const PHONE_SVG_WHITE = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.73 12.9a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.64 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.16 6.16l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`;

        const phoneHtml = shop.phoneNumber
            ? `<div class="phone-btn">
                 ${PHONE_SVG_WHITE}
                 <span>${escHtml(shop.phoneNumber)}</span>
               </div>`
            : '';

        const catsHtml = categoryNames.length > 0
            ? `<div class="cats">${categoryNames.map(c => `<span class="badge">${escHtml(c)}</span>`).join('')}</div>`
            : '';

        const html = `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8">
<title>${escHtml(shop.name)}</title>
<style>
  @page { size: A4 portrait; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html {
    width: 210mm;
    background: #eef0f3;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  body {
    width: 210mm;
    min-height: 297mm;
    overflow: hidden;
    background: #eef0f3;
    font-family: 'Segoe UI', Arial, sans-serif;
    display: flex; align-items: center; justify-content: center;
  }

  .card {
    width: 196mm; height: 258mm;
    border-radius: 8mm;
    overflow: hidden;
    display: flex; flex-direction: column;
    box-shadow: 0 0 0 0.4mm #d1d5db;
    background: #ffffff;
    position: relative;
  }
  
  .cover-container {
    position: relative;
    height: 85mm;
    width: 100%;
    flex-shrink: 0;
  }
  .cover-img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .cover-ph {
    width: 100%; height: 100%;
    background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
    display: flex; align-items: center; justify-content: center;
  }
  .cover-ph span { font-size: 72pt; font-weight: 900; color: rgba(255,255,255,.05); letter-spacing: 10pt; }
  .cover-overlay {
    position: absolute; bottom: 0; left: 0; right: 0; height: 30mm;
    background: linear-gradient(to top, rgba(0,0,0,0.4), transparent);
  }

  .content-wrapper {
    position: relative;
    margin-top: -12mm;
    padding: 0 12mm;
    display: flex; flex-direction: column; align-items: center;
    flex: 1;
  }

  .shop-name-card {
    background: #1e293b;
    padding: 5mm 10mm;
    border-radius: 6mm;
    box-shadow: 0 4mm 10mm rgba(30, 41, 59, 0.25);
    width: 92%;
    text-align: center;
    margin-bottom: 8mm;
    border: 1px solid rgba(255,255,255,0.1);
  }
  .shop-name {
    font-size: 22pt; font-weight: 900; color: #ffffff;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    letter-spacing: -0.5pt;
  }

  .buttons-row {
    display: flex; flex-direction: column; align-items: center; gap: 4mm;
    margin-bottom: 8mm;
    width: 100%;
  }
  
  .phone-btn {
    background: #1e293b; color: #ffffff;
    font-size: 13pt; font-weight: 800;
    padding: 3.5mm 8mm; border-radius: 12mm;
    display: inline-flex; align-items: center; gap: 3mm;
    box-shadow: 0 2mm 6mm rgba(30, 41, 59, 0.3);
  }

  .cats { display: flex; flex-wrap: wrap; justify-content: center; gap: 2.5mm; }
  .badge { 
    background: #f8fafc; color: #0f172a;
    border: 1.5px solid #1e293b;
    padding: 2.5mm 5mm; border-radius: 8mm; font-size: 10pt; font-weight: 800; 
  }

  .qr-section {
    width: 100%;
    background: linear-gradient(180deg, #f8fafc 0%, #ffffff 100%);
    border-radius: 8mm;
    padding: 6mm;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    border: 1px solid #f1f5f9;
    flex: 1;
    margin-bottom: 6mm;
  }
  .qr-lbl { 
    font-size: 8pt; font-weight: 900; letter-spacing: 4pt; 
    text-transform: uppercase; color: #475569; text-align: center; 
    margin-bottom: 5mm;
  }
  .qr-frame { 
    padding: 5mm; border-radius: 6mm; background: #fff; 
    box-shadow: 0 4mm 15mm rgba(0,0,0,0.08);
    margin-bottom: 4mm;
  }
  .qr-frame img { width: 75mm; height: 75mm; display: block; }
  .qr-url { font-size: 7.5pt; color: #94a3b8; font-family: monospace; word-break: break-all; text-align: center; max-width: 120mm; }

  .footer { 
    height: 18mm; flex-shrink: 0; background: #0f172a; 
    display: flex; align-items: center; justify-content: center; 
    width: 100%;
  }
  .footer-text { font-size: 8pt; letter-spacing: 6pt; text-transform: uppercase; color: rgba(255,255,255,0.95); font-weight: 800; }
</style>
</head>
<body>
<div class="card">
  <div class="cover-container">
    ${coverHtml}
    <div class="cover-overlay"></div>
  </div>
  
  <div class="content-wrapper">
    <div class="shop-name-card">
      <div class="shop-name">${escHtml(shop.name)}</div>
    </div>
    
    <div class="buttons-row">
      ${phoneHtml}
      ${catsHtml}
    </div>
    
    <div class="qr-section">
      <div class="qr-lbl">Rezervasyon İçin QR Kodu Okutun</div>
      <div class="qr-frame"><img src="${qrDataUrl}" alt="QR"></div>
      <div class="qr-url">${escHtml(shopUrl)}</div>
    </div>
  </div>
  
  <div class="footer"><div class="footer-text">www.salonbir.com</div></div>
</div>
<script>
  var imgs = document.querySelectorAll('img');
  var count = 0, total = imgs.length;
  function tryPrint() {
    if (++count >= total) {
      setTimeout(function () { window.print(); setTimeout(function () { window.close(); }, 1500); }, 250);
    }
  }
  if (total === 0) {
    setTimeout(function () { window.print(); setTimeout(function () { window.close(); }, 1500); }, 250);
  } else {
    imgs.forEach(function (img) {
      if (img.complete) { tryPrint(); }
      else { img.addEventListener('load', tryPrint); img.addEventListener('error', tryPrint); }
    });
  }
</script>
</body>
</html>`;

        const pw = window.open('', '_blank', 'width=640,height=920');
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
                    <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center shrink-0">
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
                className="w-full flex items-center justify-center gap-3 py-4 bg-primary-800 hover:bg-primary-900 text-white font-bold text-base rounded-2xl shadow-lg shadow-primary-700/20 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
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

                    <div className="relative z-10 w-full max-w-md flex flex-col max-h-[92dvh]">
                        {/* Close */}
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="absolute -top-3 -right-3 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-white shadow-lg text-gray-600 hover:text-gray-900 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        {/* Flyer preview card */}
                        <div className="overflow-y-auto rounded-3xl shadow-2xl flex-1 bg-[#eef0f3] p-2">
                            <div className="bg-white rounded-[1.25rem] overflow-hidden shadow-sm ring-1 ring-gray-200 flex flex-col relative pb-4">
                                
                                {/* Cover */}
                                <div className="relative h-44 sm:h-52 shrink-0 w-full">
                                    {coverUrl ? (
                                        <img src={coverUrl} alt="" className="w-full h-full object-cover block" />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-primary-800 to-primary-900 flex items-center justify-center">
                                            <span className="text-6xl font-black text-white/10 tracking-widest">
                                                {shop.name.slice(0, 2).toUpperCase()}
                                            </span>
                                        </div>
                                    )}
                                    <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/40 to-transparent"></div>
                                </div>

                                {/* Content overlaying the cover */}
                                <div className="relative -mt-8 px-4 sm:px-6 flex flex-col items-center flex-1">
                                    
                                    {/* Shop Name Card */}
                                    <div className="bg-primary-900 px-6 py-4 rounded-[1rem] shadow-lg shadow-primary-900/30 border border-primary-800 w-[92%] text-center mb-5">
                                        <h3 className="text-xl sm:text-2xl font-black text-white truncate drop-shadow-sm">
                                            {shop.name}
                                        </h3>
                                    </div>

                                    {/* Buttons */}
                                    <div className="flex flex-col gap-3 w-full items-center mb-6">
                                        {shop.phoneNumber && (
                                            <div className="bg-primary-900 text-white px-6 py-2.5 rounded-full flex items-center gap-2.5 shadow-lg shadow-primary-900/25">
                                                <Phone className="w-4 h-4" />
                                                <span className="text-[15px] font-bold tracking-wide">{shop.phoneNumber}</span>
                                            </div>
                                        )}
                                        {categoryNames.length > 0 && (
                                            <div className="flex flex-wrap items-center justify-center gap-2">
                                                {categoryNames.map(cat => (
                                                    <span key={cat} className="px-4 py-1.5 bg-primary-50 text-primary-950 ring-[1.5px] ring-primary-900 rounded-full text-xs font-bold">
                                                        {cat}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* QR Section */}
                                    <div className="w-full bg-gradient-to-b from-gray-50 to-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col items-center relative overflow-hidden mt-auto mb-6">
                                        <p className="text-[10px] font-black tracking-[3px] uppercase text-gray-500 text-center mb-4 relative z-10">
                                            Rezervasyon İçin QR Kodu Okutun
                                        </p>
                                        
                                        <div className="bg-white p-3.5 rounded-[1rem] shadow-[0_4px_20px_rgb(0,0,0,0.06)] ring-1 ring-gray-100 relative z-10 mb-3">
                                            <QRCodeCanvas
                                                ref={canvasRef}
                                                value={shopUrl}
                                                size={160}
                                                fgColor="#0f172a"
                                                bgColor="#ffffff"
                                                level="H"
                                                marginSize={1}
                                            />
                                        </div>
                                        
                                        <p className="text-[9px] text-gray-400 font-mono break-all text-center max-w-[260px] relative z-10">
                                            {shopUrl}
                                        </p>
                                    </div>
                                </div>
                                
                                {/* Footer inside the white card */}
                                <div className="bg-[#0f172a] py-4 text-center mt-auto w-full shrink-0">
                                    <span className="text-[10px] font-bold tracking-[4px] uppercase text-white/90">
                                        www.salonbir.com
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* PDF download button */}
                        <button
                            onClick={handlePrintFlyer}
                            className="mt-4 w-full flex items-center justify-center gap-2 py-4 bg-primary-800 hover:bg-primary-900 text-white font-bold text-base rounded-2xl shadow-xl shadow-primary-700/25 transition-all duration-200 active:scale-[0.98] shrink-0"
                        >
                            <Printer className="w-5 h-5" />
                            PDF Olarak İndir
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
