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

        const PHONE_SVG_WHITE = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.73 12.9a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.64 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.16 6.16l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`;

        const phoneHtml = shop.phoneNumber
            ? `<div class="phone-btn">
                 ${PHONE_SVG_WHITE}
                 <span>${escHtml(shop.phoneNumber)}</span>
               </div>`
            : '';

        const catsHtml = categoryNames.length > 0
            ? `<div class="cats">${categoryNames.map(c => `<span class="badge">${escHtml(c)}</span>`).join('')}</div>`
            : '';

        /*
         * A4 = 210×297mm. iOS Safari adds ~20mm margins even with @page{margin:0}.
         * Fix: body min-height:297mm (fills page background), card only 258mm.
         * Centering adds (297-258)/2 = 19.5mm on each side — safe from any browser margin.
         * Section heights: cover=76 + info=62 + qr=100 + footer=20 = 258mm ✓
         */
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

  /* Card — 196×258mm, rounded all corners */
  .card {
    width: 196mm; height: 258mm;
    border-radius: 8mm;
    overflow: hidden;
    display: flex; flex-direction: column;
    page-break-inside: avoid;
    page-break-after: avoid;
    box-shadow: 0 0 0 0.4mm #d1d5db;
  }

  /* Cover — 76mm */
  .cover-img { width: 100%; height: 76mm; object-fit: cover; display: block; flex-shrink: 0; }
  .cover-ph {
    width: 100%; height: 76mm; flex-shrink: 0;
    background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
    display: flex; align-items: center; justify-content: center;
  }
  .cover-ph span { font-size: 64pt; font-weight: 900; color: rgba(255,255,255,.08); letter-spacing: 8pt; }

  /* Info — 62mm FIXED */
  .info {
    height: 62mm; flex-shrink: 0;
    padding: 0 9mm;
    background: #ffffff;
    display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3.5mm;
    overflow: hidden;
    border-bottom: 0.3mm solid #e2e8f0;
  }
  .shop-name-btn {
    background: #1e293b; color: #ffffff;
    font-size: 16pt; font-weight: 800;
    padding: 2.5mm 7mm; border-radius: 4mm;
    text-align: center;
    max-width: 100%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .phone-btn {
    background: #1e293b; color: #ffffff;
    font-size: 11pt; font-weight: 700;
    padding: 1.8mm 5mm; border-radius: 3mm;
    display: flex; align-items: center; gap: 2mm;
  }
  .phone-btn svg { stroke: #ffffff; width: 14px; height: 14px; }
  .cats { display: flex; flex-wrap: wrap; justify-content: center; gap: 2mm; }
  .badge { 
    background: #1e293b; color: #ffffff;
    padding: 1.5mm 4mm; border-radius: 3mm; font-size: 8.5pt; font-weight: 700; 
  }

  /* QR section — 100mm FIXED */
  .qr-section {
    height: 100mm; flex-shrink: 0;
    background: #f8fafc;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 4mm;
    padding: 0 9mm;
  }
  .qr-lbl { font-size: 6.5pt; font-weight: 900; letter-spacing: 3pt; text-transform: uppercase; color: #64748b; text-align: center; }
  .qr-frame { padding: 4mm; border: 0.4mm solid #e2e8f0; border-radius: 4.5mm; background: #fff; }
  .qr-frame img { width: 65mm; height: 65mm; display: block; }
  .qr-url { font-size: 5.5pt; color: #94a3b8; font-family: monospace; word-break: break-all; text-align: center; max-width: 95mm; line-height: 1.6; }

  /* Footer — 20mm FIXED */
  .footer { height: 20mm; flex-shrink: 0; background: #1e293b; display: flex; align-items: center; justify-content: center; }
  .footer-text { font-size: 7pt; letter-spacing: 4pt; text-transform: uppercase; color: #64748b; font-weight: 800; }
</style>
</head>
<body>
<div class="card">
  ${coverHtml}
  <div class="info">
    <div class="shop-name-btn">${escHtml(shop.name)}</div>
    ${phoneHtml}
    ${catsHtml}
  </div>
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

                    <div className="relative z-10 w-full max-w-sm flex flex-col max-h-[92dvh]">

                        {/* Close */}
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="absolute -top-3 -right-3 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-white shadow-lg text-gray-600 hover:text-gray-900 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        {/* Flyer preview card — rounded everywhere, scrollable */}
                        <div className="overflow-y-auto rounded-3xl shadow-2xl flex-1 bg-[#eef0f3] p-2">
                            <div className="bg-white rounded-2xl overflow-hidden shadow-sm ring-1 ring-gray-200">

                                {/* Cover — ~30% of card */}
                                {coverUrl ? (
                                    <img src={coverUrl} alt="" className="w-full h-48 object-cover block" />
                                ) : (
                                    <div className="w-full h-48 bg-gradient-to-br from-primary-800 to-primary-700 flex items-center justify-center">
                                        <span className="text-5xl font-black text-white/10 tracking-widest">
                                            {shop.name.slice(0, 2).toUpperCase()}
                                        </span>
                                    </div>
                                )}

                                {/* Info — ~25% of card */}
                                <div className="px-5 py-5 flex flex-col items-center justify-center gap-3 border-b border-gray-100 bg-white">
                                    <div className="bg-[#1e293b] text-white px-5 py-2.5 rounded-2xl max-w-full truncate">
                                        <h3 className="text-[1.3rem] font-bold leading-none">
                                            {shop.name}
                                        </h3>
                                    </div>
                                    {shop.phoneNumber && (
                                        <div className="bg-[#1e293b] text-white px-4 py-2 rounded-xl flex items-center gap-2">
                                            <Phone className="w-4 h-4 text-white" />
                                            <span className="text-[0.95rem] font-bold">{shop.phoneNumber}</span>
                                        </div>
                                    )}
                                    {categoryNames.length > 0 && (
                                        <div className="flex flex-wrap items-center justify-center gap-2 mt-1">
                                            {categoryNames.map(cat => (
                                                <span key={cat} className="px-4 py-1.5 bg-[#1e293b] text-white rounded-xl text-xs font-bold">
                                                    {cat}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* QR section — ~39% of card */}
                                <div className="px-5 py-7 flex flex-col items-center gap-4 bg-[#f8fafc]">
                                    <p className="text-[9px] font-black tracking-[3px] uppercase text-primary-500 text-center">
                                        Rezervasyon İçin QR Kodu Okutun
                                    </p>
                                    <div className="bg-white p-3.5 rounded-2xl border border-primary-200 shadow-sm">
                                        <QRCodeCanvas
                                            ref={canvasRef}
                                            value={shopUrl}
                                            size={196}
                                            fgColor="#0f172a"
                                            bgColor="#ffffff"
                                            level="H"
                                            marginSize={1}
                                        />
                                    </div>
                                    <p className="text-[9px] text-primary-400 font-mono break-all text-center max-w-[260px] leading-relaxed">
                                        {shopUrl}
                                    </p>
                                </div>

                                {/* Footer — ~7% of card */}
                                <div className="bg-primary-800 py-4 text-center">
                                    <span className="text-[9px] font-bold tracking-[4px] uppercase text-primary-500">
                                        www.salonbir.com
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* PDF download button */}
                        <button
                            onClick={handlePrintFlyer}
                            className="mt-3 w-full flex items-center justify-center gap-2 py-3.5 bg-primary-800 hover:bg-primary-900 text-white font-bold text-sm rounded-xl shadow-lg shadow-primary-700/25 transition-all duration-200 active:scale-[0.98] shrink-0"
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
