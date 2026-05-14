import React, { useEffect, useRef, useState } from 'react';
import { shopService } from '../../api/shop.service';
import { QRCodeCanvas } from 'qrcode.react';
import { QrCode, X, Loader2, Printer, Phone, Tag } from 'lucide-react';
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

const PHONE_SVG = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#334155" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.73 12.9a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.64 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.16 6.16l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`;

const TAG_SVG = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#334155" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>`;

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
                 <div class="icon-box">${PHONE_SVG}</div>
                 <span class="val">${escHtml(shop.phoneNumber)}</span>
               </div>`
            : '';

        const catsHtml = categoryNames.length > 0
            ? `<div class="detail" style="align-items:flex-start">
                 <div class="icon-box" style="margin-top:0.8mm">${TAG_SVG}</div>
                 <div class="cats">${categoryNames.map(c => `<span class="badge">${escHtml(c)}</span>`).join('')}</div>
               </div>`
            : '';

        // A4 = 297mm. Fixed heights: cover=88mm, info=72mm, qr=117mm, footer=20mm → total=297mm
        const html = `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8">
<title>${escHtml(shop.name)}</title>
<style>
  @page { size: A4 portrait; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body {
    width: 210mm; height: 297mm;
    overflow: hidden;
    background: #fff;
    font-family: 'Segoe UI', Arial, sans-serif;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .page {
    width: 210mm; height: 297mm;
    display: flex; flex-direction: column;
    overflow: hidden;
    page-break-inside: avoid;
    page-break-after: avoid;
  }

  /* Cover — 88mm */
  .cover-img { width: 100%; height: 88mm; object-fit: cover; display: block; flex-shrink: 0; }
  .cover-ph {
    width: 100%; height: 88mm; flex-shrink: 0;
    background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
    display: flex; align-items: center; justify-content: center;
  }
  .cover-ph span { font-size: 72pt; font-weight: 900; color: rgba(255,255,255,.08); letter-spacing: 8pt; }

  /* Info — 72mm FIXED */
  .info {
    height: 72mm; flex-shrink: 0;
    padding: 0 11mm;
    display: flex; flex-direction: column; justify-content: center; gap: 4.5mm;
    overflow: hidden;
    border-bottom: 0.3mm solid #e2e8f0;
  }
  .shop-name {
    font-size: 22pt; font-weight: 900; color: #0f172a; line-height: 1.15;
    overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
  }
  .detail { display: flex; align-items: center; gap: 3mm; }
  .icon-box {
    width: 7.5mm; height: 7.5mm; min-width: 7.5mm;
    background: #f1f5f9; border-radius: 2mm;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .val { font-size: 11pt; color: #334155; font-weight: 700; }
  .cats { display: flex; flex-wrap: wrap; gap: 1.5mm; }
  .badge { padding: 1mm 3.5mm; background: #e2e8f0; border-radius: 10pt; font-size: 7.5pt; font-weight: 800; color: #334155; }

  /* QR section — 117mm FIXED */
  .qr-section {
    height: 117mm; flex-shrink: 0;
    background: #f8fafc;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 4.5mm;
    padding: 0 11mm;
  }
  .qr-lbl { font-size: 6.5pt; font-weight: 900; letter-spacing: 2.5pt; text-transform: uppercase; color: #64748b; text-align: center; }
  .qr-frame { padding: 4mm; border: 0.4mm solid #e2e8f0; border-radius: 4mm; background: #fff; }
  .qr-frame img { width: 70mm; height: 70mm; display: block; }
  .qr-url { font-size: 5.5pt; color: #94a3b8; font-family: monospace; word-break: break-all; text-align: center; max-width: 100mm; line-height: 1.6; }

  /* Footer — 20mm FIXED */
  .footer { height: 20mm; flex-shrink: 0; background: #1e293b; display: flex; align-items: center; justify-content: center; }
  .footer-text { font-size: 7pt; letter-spacing: 4pt; text-transform: uppercase; color: #64748b; font-weight: 800; }
</style>
</head>
<body>
<div class="page">
  ${coverHtml}
  <div class="info">
    <div class="shop-name">${escHtml(shop.name)}</div>
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
      setTimeout(function () { window.print(); setTimeout(function () { window.close(); }, 1500); }, 200);
    }
  }
  if (total === 0) {
    setTimeout(function () { window.print(); setTimeout(function () { window.close(); }, 1500); }, 200);
  } else {
    imgs.forEach(function (img) {
      if (img.complete) { tryPrint(); }
      else { img.addEventListener('load', tryPrint); img.addEventListener('error', tryPrint); }
    });
  }
</script>
</body>
</html>`;

        const pw = window.open('', '_blank', 'width=620,height=900');
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

                        {/* Flyer preview — scrollable */}
                        <div className="overflow-y-auto rounded-2xl shadow-2xl flex-1">
                            <div className="bg-white overflow-hidden">

                                {/* Cover — proportional to PDF 88/297 ≈ 30% */}
                                {coverUrl ? (
                                    <img src={coverUrl} alt="" className="w-full h-44 object-cover block" />
                                ) : (
                                    <div className="w-full h-44 bg-gradient-to-br from-primary-800 to-primary-700 flex items-center justify-center">
                                        <span className="text-5xl font-black text-white/10 tracking-widest">
                                            {shop.name.slice(0, 2).toUpperCase()}
                                        </span>
                                    </div>
                                )}

                                {/* Info — proportional to PDF 72/297 ≈ 24% */}
                                <div className="px-5 py-5 flex flex-col justify-center gap-3 border-b border-gray-100">
                                    <h3 className="text-2xl font-black text-primary-900 leading-tight line-clamp-2">{shop.name}</h3>
                                    {shop.phoneNumber && (
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center shrink-0">
                                                <Phone className="w-4 h-4 text-primary-700" />
                                            </div>
                                            <span className="text-sm font-bold text-primary-800">{shop.phoneNumber}</span>
                                        </div>
                                    )}
                                    {categoryNames.length > 0 && (
                                        <div className="flex items-start gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center shrink-0 mt-0.5">
                                                <Tag className="w-4 h-4 text-primary-700" />
                                            </div>
                                            <div className="flex flex-wrap gap-1.5 mt-1">
                                                {categoryNames.map(cat => (
                                                    <span key={cat} className="px-2.5 py-1 bg-primary-100 text-primary-800 rounded-full text-xs font-bold">
                                                        {cat}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* QR section — proportional to PDF 117/297 ≈ 39% */}
                                <div className="px-5 py-6 flex flex-col items-center gap-3.5 bg-primary-50">
                                    <p className="text-[9px] font-bold tracking-[3px] uppercase text-primary-500 text-center">
                                        Rezervasyon İçin QR Kodu Okutun
                                    </p>
                                    <div className="bg-white p-3 rounded-xl border border-primary-200 shadow-sm">
                                        <QRCodeCanvas
                                            ref={canvasRef}
                                            value={shopUrl}
                                            size={185}
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

                                {/* Footer */}
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
