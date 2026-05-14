import React, { useEffect, useRef, useState } from 'react';
import { shopService } from '../../api/shop.service';
import { QRCodeCanvas, QRCodeSVG } from 'qrcode.react';
import { QrCode, X, Phone, Tag, Loader2, ImageDown, FileCode2, Printer } from 'lucide-react';
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
    const svgWrapRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        shopService.getMyShop()
            .then(setShop)
            .catch(() => toast.error('Salon bilgileri yüklenemedi.'))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (isModalOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isModalOpen]);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsModalOpen(false); };
        if (isModalOpen) window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [isModalOpen]);

    const shopUrl = shop ? `${SHOP_BASE_URL}/${shop.id}` : '';

    const handleDownloadPng = () => {
        if (!canvasRef.current) return;
        const url = canvasRef.current.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = url;
        a.download = `${shop?.name ?? 'salon'}-qr.png`;
        a.click();
    };

    const handleDownloadSvg = () => {
        const svgEl = svgWrapRef.current?.querySelector('svg');
        if (!svgEl) return;
        const svgStr = new XMLSerializer().serializeToString(svgEl);
        const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${shop?.name ?? 'salon'}-qr.svg`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handlePrintFlyer = () => {
        if (!canvasRef.current || !shop) return;

        const qrDataUrl = canvasRef.current.toDataURL('image/png');
        const coverUrl = getAbsImageUrl(shop.coverImagePath);
        const catNames = (shop.categories ?? [])
            .map((c: any) => ShopCategoryLabels[c as keyof typeof ShopCategoryLabels])
            .filter(Boolean);

        const coverHtml = coverUrl
            ? `<img class="cover" src="${escHtml(coverUrl)}" alt="">`
            : `<div class="cover-placeholder"><span>${escHtml(shop.name.slice(0, 2).toUpperCase())}</span></div>`;

        const phoneHtml = shop.phoneNumber
            ? `<div class="row"><div class="icon">📞</div><span class="val">${escHtml(shop.phoneNumber)}</span></div>`
            : '';

        const catsHtml = catNames.length > 0
            ? `<div class="row cats-row"><div class="icon">✂️</div><div class="cats">${catNames.map(c => `<span class="badge">${escHtml(c)}</span>`).join('')}</div></div>`
            : '';

        const html = `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <title>${escHtml(shop.name)} – Rezervasyon Afişi</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:'Segoe UI',Arial,sans-serif;background:#f1f5f9;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:24px}
    .flyer{width:400px;background:#fff;border-radius:24px;overflow:hidden;box-shadow:0 12px 48px rgba(0,0,0,.18)}
    .cover{width:100%;height:200px;object-fit:cover;display:block}
    .cover-placeholder{width:100%;height:200px;background:linear-gradient(135deg,#334155,#1e293b);display:flex;align-items:center;justify-content:center}
    .cover-placeholder span{font-size:56px;font-weight:900;color:rgba(255,255,255,.18);letter-spacing:6px}
    .info{padding:24px 28px 18px}
    .brand{font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#94a3b8;margin-bottom:10px;font-weight:700}
    .shop-name{font-size:24px;font-weight:900;color:#1e293b;margin-bottom:16px;line-height:1.2}
    .row{display:flex;align-items:flex-start;gap:10px;margin-bottom:10px}
    .icon{width:30px;height:30px;background:#f1f5f9;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0}
    .val{font-size:14px;color:#475569;font-weight:600;padding-top:5px}
    .cats-row{align-items:flex-start}
    .cats{display:flex;flex-wrap:wrap;gap:6px;padding-top:4px}
    .badge{padding:4px 12px;background:#f1f5f9;border-radius:20px;font-size:11px;font-weight:700;color:#334155}
    .divider{margin:0 28px;height:1px;background:#e2e8f0}
    .qr-section{padding:24px 28px 20px;display:flex;flex-direction:column;align-items:center;gap:16px}
    .qr-label{font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:2px;color:#64748b;text-align:center}
    .qr-wrap{background:#fff;padding:16px;border-radius:16px;border:2px solid #e2e8f0}
    .qr-img{width:200px;height:200px;display:block}
    .url{font-size:9px;color:#94a3b8;word-break:break-all;text-align:center;max-width:280px;line-height:1.6}
    .footer{background:#1e293b;padding:14px;text-align:center}
    .footer-text{font-size:11px;color:#475569;font-weight:700;letter-spacing:2px;text-transform:uppercase}
    @media print{
      body{padding:0;background:#fff}
      .flyer{box-shadow:none;border-radius:0;width:100%}
    }
  </style>
</head>
<body>
  <div class="flyer">
    ${coverHtml}
    <div class="info">
      <div class="brand">SalonBir</div>
      <div class="shop-name">${escHtml(shop.name)}</div>
      ${phoneHtml}
      ${catsHtml}
    </div>
    <div class="divider"></div>
    <div class="qr-section">
      <div class="qr-label">Rezervasyon için QR kodu okutun</div>
      <div class="qr-wrap"><img class="qr-img" src="${qrDataUrl}" alt="QR Kod"></div>
      <div class="url">${escHtml(shopUrl)}</div>
    </div>
    <div class="footer"><div class="footer-text">www.salonbir.com</div></div>
  </div>
  <script>
    window.addEventListener('load', function() {
      setTimeout(function() { window.print(); setTimeout(function(){ window.close(); }, 1500); }, 400);
    });
  </script>
</body>
</html>`;

        const pw = window.open('', '_blank', 'width=560,height=820');
        if (!pw) {
            toast.error('Popup engelleyici aktif — lütfen izin verin ve tekrar deneyin.');
            return;
        }
        pw.document.open();
        pw.document.write(html);
        pw.document.close();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-32">
                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
        );
    }

    if (!shop) {
        return (
            <div className="flex flex-col items-center justify-center py-32 text-gray-500">
                <QrCode className="w-12 h-12 mb-3 text-gray-300" />
                <p>Salon bilgisi bulunamadı.</p>
            </div>
        );
    }

    const categoryNames = (shop.categories ?? [])
        .map((c: any) => ShopCategoryLabels[c as keyof typeof ShopCategoryLabels])
        .filter(Boolean);

    return (
        <div className="max-w-2xl mx-auto px-4 py-10">
            {/* Page header */}
            <div className="mb-8">
                <h1 className="text-2xl font-black text-primary-800 flex items-center gap-2">
                    <QrCode className="w-6 h-6" />
                    QR Kod Üretici
                </h1>
                <p className="text-gray-500 mt-1 text-sm">
                    Müşterilerinizin kolayca randevu alabilmesi için salon QR kodunuzu oluşturun ve yazdırın.
                </p>
            </div>

            {/* Info card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center shrink-0">
                        <QrCode className="w-6 h-6 text-primary-600" />
                    </div>
                    <div>
                        <h2 className="font-bold text-gray-800 mb-1">QR Kod nasıl çalışır?</h2>
                        <p className="text-sm text-gray-500 leading-relaxed">
                            Oluşturulan QR kodu, müşterinizin telefonu ile tarayınca doğrudan <strong>{shop.name}</strong> salon sayfanıza yönlendirir.
                            Müşteri oradan randevu alabilir, hizmetlerinizi görebilir.
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
                Yeni QR Kod Üret
            </button>

            {/* QR Modal */}
            {isModalOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    onClick={(e) => { if (e.target === e.currentTarget) setIsModalOpen(false); }}
                >
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

                    <div className="relative z-10 w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden">

                        {/* Close */}
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="absolute top-4 right-4 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        {/* Gradient header */}
                        <div className="bg-gradient-to-br from-primary-700 via-primary-800 to-primary-900 px-6 pt-8 pb-6 text-white">
                            <p className="text-xs font-semibold tracking-widest uppercase text-primary-200 mb-1">SalonBir</p>
                            <h2 className="text-lg font-black leading-tight mb-4">
                                Rezervasyon için bu QR kodu okutun
                            </h2>

                            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 space-y-2.5">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                                        <QrCode className="w-3.5 h-3.5 text-white" />
                                    </div>
                                    <span className="font-bold text-white text-sm">{shop.name}</span>
                                </div>

                                {shop.phoneNumber && (
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                                            <Phone className="w-3.5 h-3.5 text-white" />
                                        </div>
                                        <span className="text-primary-100 text-sm font-medium">{shop.phoneNumber}</span>
                                    </div>
                                )}

                                {categoryNames.length > 0 && (
                                    <div className="flex items-start gap-2.5">
                                        <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center shrink-0 mt-0.5">
                                            <Tag className="w-3.5 h-3.5 text-white" />
                                        </div>
                                        <div className="flex flex-wrap gap-1.5">
                                            {categoryNames.map((cat) => (
                                                <span key={cat} className="inline-block px-2.5 py-0.5 bg-white/20 rounded-full text-xs font-semibold text-white">
                                                    {cat}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* QR Code */}
                        <div className="bg-gray-50 flex flex-col items-center py-8 px-6">
                            <div className="bg-white p-4 rounded-2xl shadow-md ring-1 ring-gray-100">
                                <QRCodeCanvas
                                    ref={canvasRef}
                                    value={shopUrl}
                                    size={220}
                                    fgColor="#334155"
                                    bgColor="#ffffff"
                                    level="H"
                                    marginSize={1}
                                />
                            </div>

                            <div className="hidden" ref={svgWrapRef} aria-hidden>
                                <QRCodeSVG value={shopUrl} size={512} fgColor="#334155" bgColor="#ffffff" level="H" marginSize={1} />
                            </div>

                            <p className="mt-3 text-xs text-gray-400 text-center font-mono break-all px-4 max-w-xs">{shopUrl}</p>
                        </div>

                        {/* Download buttons */}
                        <div className="bg-white px-6 pb-6 pt-2 space-y-3">
                            {/* Flyer / PDF — main CTA */}
                            <button
                                onClick={handlePrintFlyer}
                                className="w-full flex items-center justify-center gap-2 py-3.5 bg-primary-700 hover:bg-primary-800 text-white font-bold text-sm rounded-xl transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] shadow-sm shadow-primary-700/20"
                            >
                                <Printer className="w-4 h-4" />
                                Afişi PDF Olarak İndir
                            </button>

                            {/* QR-only: PNG + SVG */}
                            <div className="flex gap-2">
                                <button
                                    onClick={handleDownloadPng}
                                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-white hover:bg-gray-50 text-primary-700 font-semibold text-xs rounded-xl border border-gray-200 hover:border-primary-300 transition-all duration-200"
                                >
                                    <ImageDown className="w-3.5 h-3.5" />
                                    Sadece QR — PNG
                                </button>
                                <button
                                    onClick={handleDownloadSvg}
                                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-white hover:bg-gray-50 text-primary-700 font-semibold text-xs rounded-xl border border-gray-200 hover:border-primary-300 transition-all duration-200"
                                >
                                    <FileCode2 className="w-3.5 h-3.5" />
                                    Sadece QR — SVG
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
