import React, { useEffect, useRef, useState } from 'react';
import { shopService } from '../../api/shop.service';
import { QRCodeCanvas } from 'qrcode.react';
import { QrCode, X, Loader2, Printer, Phone, LayoutTemplate, Sparkles, MapPin, Zap, ImageDown } from 'lucide-react';
import { ShopCategoryLabels } from '../../types/shop';
import type { Shop } from '../../types/shop';
import { toast } from 'react-hot-toast';
import html2canvas from 'html2canvas';

const SHOP_BASE_URL = 'https://www.salonbir.com/shop';

const escHtml = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const getAbsImageUrl = (path: string | null | undefined): string | null => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `http://localhost:5000${path}`;
};

type TabType = 'classic' | 'modern' | 'blue';

const STEPS = [
    { n: 1, text: 'Kameranı\nAç' },
    { n: 2, text: "QR'ı\nTara" },
    { n: 3, text: 'Hizmet &\nUzman Seç' },
    { n: 4, text: 'Randevunu\nOnayla' },
];

const PHONE_SVG_WHITE = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.73 12.9a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.64 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.16 6.16l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`;
const GLOBE_SVG_WHITE = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`;
const PIN_SVG_WHITE = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`;
const PIN_SVG_GREEN = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#2d7a6e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`;

const printScript = `
<script>
  var imgs = document.querySelectorAll('img');
  var count = 0, total = imgs.length;
  function tryPrint() { if (++count >= total) { setTimeout(function () { window.print(); setTimeout(function () { window.close(); }, 1500); }, 300); } }
  if (total === 0) { setTimeout(function () { window.print(); setTimeout(function () { window.close(); }, 1500); }, 300); }
  else { imgs.forEach(function (img) { if (img.complete) { tryPrint(); } else { img.addEventListener('load', tryPrint); img.addEventListener('error', tryPrint); } }); }
<\/script>`;

export const SalonQrCodePage: React.FC = () => {
    const [shop, setShop] = useState<Shop | null>(null);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<TabType>('classic');
    const [pngLoading, setPngLoading] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const previewRef = useRef<HTMLDivElement>(null);

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
    const locationText = [shop.city, shop.district].filter(Boolean).join(' / ');

    /* ─── PDF helpers ─── */
    const openPrintWindow = (html: string) => {
        const pw = window.open('', '_blank', 'width=640,height=920');
        if (!pw) { toast.error('Popup engelleyici aktif — lütfen izin verin.'); return; }
        pw.document.open();
        pw.document.write(html);
        pw.document.close();
    };

    /* ─── Classic PDF ─── */
    const buildClassicHtml = (qrDataUrl: string) => {
        const coverHtml = coverUrl
            ? `<img class="cover-img" src="${escHtml(coverUrl)}" alt="">`
            : `<div class="cover-ph"><span>${escHtml(shop.name.slice(0, 2).toUpperCase())}</span></div>`;
        const phoneHtml = shop.phoneNumber
            ? `<div class="phone-btn">${PHONE_SVG_WHITE}<span>${escHtml(shop.phoneNumber)}</span></div>`
            : '';
        const catsHtml = categoryNames.length > 0
            ? `<div class="cats">${categoryNames.map(c => `<span class="badge">${escHtml(c)}</span>`).join('')}</div>`
            : '';

        return `<!DOCTYPE html><html lang="tr"><head><meta charset="UTF-8"><title>${escHtml(shop.name)}</title>
<style>
  @page { size: A4 portrait; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html { width: 210mm; height: 297mm; overflow: hidden; background: #eef0f3; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { width: 210mm; height: 297mm; overflow: hidden; background: #eef0f3; font-family: 'Segoe UI', Arial, sans-serif; display: flex; align-items: center; justify-content: center; }
  .card { width: 196mm; height: 275mm; border-radius: 8mm; overflow: hidden; display: flex; flex-direction: column; box-shadow: 0 0 0 0.4mm #d1d5db; background: #ffffff; }
  .cover-container { position: relative; height: 85mm; width: 100%; flex-shrink: 0; }
  .cover-img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .cover-ph { width: 100%; height: 100%; background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); display: flex; align-items: center; justify-content: center; }
  .cover-ph span { font-size: 72pt; font-weight: 900; color: rgba(255,255,255,.05); letter-spacing: 10pt; }
  .cover-overlay { position: absolute; bottom: 0; left: 0; right: 0; height: 30mm; background: linear-gradient(to top, rgba(0,0,0,0.4), transparent); }
  .content-wrapper { position: relative; margin-top: -12mm; padding: 0 12mm; display: flex; flex-direction: column; align-items: center; flex: 1; }
  .shop-name-card { background: #1e293b; padding: 5mm 10mm; border-radius: 6mm; box-shadow: 0 4mm 10mm rgba(30,41,59,0.25); width: 92%; text-align: center; margin-bottom: 6mm; border: 1px solid rgba(255,255,255,0.1); }
  .shop-name { font-size: 22pt; font-weight: 900; color: #ffffff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; letter-spacing: -0.5pt; }
  .buttons-row { display: flex; flex-direction: column; align-items: center; gap: 3mm; margin-bottom: 6mm; width: 100%; }
  .phone-btn { background: #1e293b; color: #ffffff; font-size: 13pt; font-weight: 800; padding: 3mm 8mm; border-radius: 12mm; display: inline-flex; align-items: center; gap: 3mm; }
  .cats { display: flex; flex-wrap: wrap; justify-content: center; gap: 2mm; }
  .badge { background: #f8fafc; color: #0f172a; border: 1.5px solid #1e293b; padding: 2mm 4mm; border-radius: 8mm; font-size: 9pt; font-weight: 800; }
  .qr-section { width: 100%; background: linear-gradient(180deg, #f8fafc 0%, #ffffff 100%); border-radius: 8mm; padding: 5mm; display: flex; flex-direction: column; align-items: center; border: 1px solid #f1f5f9; flex: 1; margin-bottom: 5mm; }
  .qr-lbl { font-size: 8pt; font-weight: 900; letter-spacing: 4pt; text-transform: uppercase; color: #475569; text-align: center; margin-bottom: 4mm; }
  .qr-frame { padding: 4mm; border-radius: 6mm; background: #fff; box-shadow: 0 4mm 15mm rgba(0,0,0,0.08); margin-bottom: 3mm; }
  .qr-frame img { width: 70mm; height: 70mm; display: block; }
  .qr-url { font-size: 7pt; color: #94a3b8; font-family: monospace; word-break: break-all; text-align: center; max-width: 120mm; }
  .footer { height: 16mm; flex-shrink: 0; background: #0f172a; display: flex; align-items: center; justify-content: center; width: 100%; }
  .footer-text { font-size: 8pt; letter-spacing: 6pt; text-transform: uppercase; color: rgba(255,255,255,0.95); font-weight: 800; }
</style></head><body>
<div class="card">
  <div class="cover-container">${coverHtml}<div class="cover-overlay"></div></div>
  <div class="content-wrapper">
    <div class="shop-name-card"><div class="shop-name">${escHtml(shop.name)}</div></div>
    <div class="buttons-row">${phoneHtml}${catsHtml}</div>
    <div class="qr-section">
      <div class="qr-lbl">Rezervasyon İçin QR Kodu Okutun</div>
      <div class="qr-frame"><img src="${qrDataUrl}" alt="QR"></div>
      <div class="qr-url">${escHtml(shopUrl)}</div>
    </div>
  </div>
  <div class="footer"><div class="footer-text">www.salonbir.com</div></div>
</div>
${printScript}</body></html>`;
    };

    /* ─── Modern PDF ─── */
    const buildModernHtml = (qrDataUrl: string) => `<!DOCTYPE html><html lang="tr"><head><meta charset="UTF-8">
<title>${escHtml(shop.name)} — QR</title>
<style>
  @page { size: A4 portrait; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { width: 210mm; height: 297mm; overflow: hidden; background: #c8e6e1; -webkit-print-color-adjust: exact; print-color-adjust: exact; font-family: 'Arial Black', Arial, sans-serif; }
  body { display: flex; align-items: center; justify-content: center; }
  .page { width: 210mm; height: 297mm; background: #c8e6e1; display: flex; flex-direction: column; align-items: center; padding: 16mm 16mm 10mm; overflow: hidden; }
  .heading { text-align: center; margin-bottom: 7mm; line-height: 1.0; }
  .heading .line { font-size: 54pt; font-weight: 900; color: #111111; display: block; letter-spacing: -1pt; }
  .highlight-wrap { display: flex; justify-content: center; margin: 1.5mm 0; }
  .highlight { display: inline-block; background: #f5b8c8; border-radius: 14pt; padding: 0pt 14pt; font-size: 54pt; font-weight: 900; color: #111111; letter-spacing: -1pt; line-height: 1.15; }
  .shop-name { font-size: 13pt; font-weight: 700; color: #2d7a6e; margin-bottom: 8mm; text-align: center; }
  .qr-outer { background: #f5b8c8; border-radius: 22pt; padding: 9pt; margin-bottom: 10mm; box-shadow: 0 4mm 16mm rgba(0,0,0,0.08); }
  .qr-inner { background: white; border-radius: 16pt; padding: 10pt; }
  .qr-inner img { width: 78mm; height: 78mm; display: block; }
  .steps-container { width: 100%; border: 1.5pt solid #8fbfba; border-radius: 10pt; overflow: hidden; display: flex; margin-bottom: 10mm; }
  .step { flex: 1; display: flex; flex-direction: column; align-items: center; padding: 4mm 2mm; border-right: 1.5pt solid #8fbfba; text-align: center; gap: 2.5mm; }
  .step:last-child { border-right: none; }
  .step-num { width: 10mm; height: 10mm; border-radius: 50%; background: #f5b8c8; display: flex; align-items: center; justify-content: center; font-size: 12pt; font-weight: 900; color: #111; }
  .step-text { font-size: 8pt; font-weight: 700; color: #1a1a1a; line-height: 1.35; font-family: Arial, sans-serif; }
  .divider { width: 100%; height: 0.5mm; background: #8fbfba; margin-bottom: 5mm; }
  .footer { width: 100%; display: flex; justify-content: space-between; align-items: center; }
  .footer-item { font-size: 9pt; color: #2d7a6e; font-weight: 700; font-family: Arial, sans-serif; display: flex; align-items: center; gap: 2mm; }
</style></head><body>
<div class="page">
  <div class="heading">
    <span class="line">BU KODU</span>
    <div class="highlight-wrap"><span class="highlight">OKUTARAK</span></div>
    <span class="line">RANDEVU AL</span>
  </div>
  <div class="shop-name">${escHtml(shop.name)}</div>
  <div class="qr-outer"><div class="qr-inner"><img src="${qrDataUrl}" alt="QR"></div></div>
  <div class="steps-container">
    <div class="step"><div class="step-num">1</div><div class="step-text">Kameranı<br>Aç</div></div>
    <div class="step"><div class="step-num">2</div><div class="step-text">QR'ı<br>Tara</div></div>
    <div class="step"><div class="step-num">3</div><div class="step-text">Hizmet &amp;<br>Uzman Seç</div></div>
    <div class="step"><div class="step-num">4</div><div class="step-text">Randevunu<br>Onayla</div></div>
  </div>
  <div class="divider"></div>
  <div class="footer">
    <span class="footer-item">salonbir.com</span>
    <span class="footer-item">${PIN_SVG_GREEN} ${escHtml(locationText)}</span>
    <span class="footer-item">${escHtml(shop.phoneNumber || '')}</span>
  </div>
</div>
${printScript}</body></html>`;

    /* ─── Blue / Dinamik PDF ─── */
    const buildBlueHtml = (qrDataUrl: string) => `<!DOCTYPE html><html lang="tr"><head><meta charset="UTF-8">
<title>${escHtml(shop.name)} — QR</title>
<style>
  @page { size: A4 portrait; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { width: 210mm; height: 297mm; overflow: hidden; -webkit-print-color-adjust: exact; print-color-adjust: exact; font-family: 'Arial Black', Arial, sans-serif; }
  body { display: flex; align-items: center; justify-content: center; }
  .page {
    width: 210mm; height: 297mm; overflow: hidden;
    background: linear-gradient(135deg, #1a00b4 0%, #2e2edd 45%, #1a00b4 100%);
    display: flex; flex-direction: column; align-items: center; position: relative;
  }
  /* Diagonal stripes */
  .s { position: absolute; background: rgba(255,255,255,0.10); }
  .s1 { top: -30mm; right: -20mm; width: 120mm; height: 20mm; transform: rotate(45deg); }
  .s2 { top: -15mm; right: -20mm; width: 80mm; height: 12mm; transform: rotate(45deg); }
  .s3 { top: 5mm; right: -20mm; width: 60mm; height: 8mm; transform: rotate(45deg); }
  .s4 { bottom: 50mm; left: -30mm; width: 120mm; height: 20mm; transform: rotate(45deg); }
  .s5 { bottom: 60mm; left: -30mm; width: 80mm; height: 12mm; transform: rotate(45deg); }

  .content { position: relative; z-index: 1; display: flex; flex-direction: column; align-items: center; padding: 10mm 14mm 0; flex: 1; width: 100%; }

  .logo { font-size: 10pt; font-weight: 700; color: rgba(255,255,255,0.85); letter-spacing: 4pt; margin-bottom: 4mm; }

  .heading { text-align: center; margin-bottom: 5mm; line-height: 0.92; }
  .h-line { font-size: 58pt; font-weight: 900; color: white; display: block; letter-spacing: -2pt; }

  .shop-name { font-size: 12pt; font-weight: 700; color: rgba(255,255,255,0.8); margin-bottom: 6mm; letter-spacing: 1pt; text-align: center; }

  .qr-outer { border: 5pt solid #7ec8f0; padding: 6pt; background: white; margin-bottom: 7mm; }
  .qr-outer img { width: 82mm; height: 82mm; display: block; }

  .scan-bar { display: flex; align-items: center; gap: 5mm; margin-bottom: 0; }
  .arrows { font-size: 18pt; font-weight: 900; color: white; }
  .scan-text { font-size: 20pt; font-weight: 900; color: white; letter-spacing: 3pt; }

  .footer { width: 100%; background: rgba(0,0,40,0.55); padding: 5mm 10mm; display: flex; justify-content: space-between; align-items: center; flex-shrink: 0; margin-top: auto; }
  .fi { display: flex; align-items: center; gap: 2mm; font-size: 9pt; color: white; font-weight: 600; font-family: Arial, sans-serif; }
</style></head><body>
<div class="page">
  <div class="s s1"></div><div class="s s2"></div><div class="s s3"></div>
  <div class="s s4"></div><div class="s s5"></div>

  <div class="content">
    <div class="logo">◆ SALONBIR ◆</div>
    <div class="heading">
      <span class="h-line">BURADAN</span>
      <span class="h-line">RANDEVU</span>
      <span class="h-line">ALINIR</span>
    </div>
    <div class="shop-name">${escHtml(shop.name)}</div>
    <div class="qr-outer"><img src="${qrDataUrl}" alt="QR"></div>
    <div class="scan-bar">
      <span class="arrows">&gt;&gt;&gt;</span>
      <span class="scan-text">TARA</span>
      <span class="arrows">&lt;&lt;&lt;</span>
    </div>
  </div>

  <div class="footer">
    <div class="fi">${PHONE_SVG_WHITE} ${escHtml(shop.phoneNumber || '')}</div>
    <div class="fi">${GLOBE_SVG_WHITE} salonbir.com</div>
    <div class="fi">${PIN_SVG_WHITE} ${escHtml(locationText)}</div>
  </div>
</div>
${printScript}</body></html>`;

    /* ─── PDF download ─── */
    const handlePrintFlyer = () => {
        if (!canvasRef.current) return;
        const qrDataUrl = canvasRef.current.toDataURL('image/png');
        if (activeTab === 'classic') openPrintWindow(buildClassicHtml(qrDataUrl));
        else if (activeTab === 'modern') openPrintWindow(buildModernHtml(qrDataUrl));
        else openPrintWindow(buildBlueHtml(qrDataUrl));
    };

    /* ─── PNG download ─── */
    const handleDownloadPng = async () => {
        if (!previewRef.current) return;
        setPngLoading(true);
        const toastId = toast.loading('PNG oluşturuluyor...');
        try {
            const canvas = await html2canvas(previewRef.current, {
                scale: 3,
                useCORS: true,
                allowTaint: true,
                backgroundColor: null,
                logging: false,
            });
            const link = document.createElement('a');
            link.download = `${shop.name}-qr-afis.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
            toast.success('PNG indirildi!', { id: toastId });
        } catch {
            toast.error('PNG oluşturulamadı.', { id: toastId });
        } finally {
            setPngLoading(false);
        }
    };

    const tabLabel = activeTab === 'classic' ? 'Klasik' : activeTab === 'modern' ? 'Modern' : 'Dinamik';

    return (
        <div className="max-w-2xl mx-auto px-4 py-10">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-black text-primary-800 flex items-center gap-2">
                    <QrCode className="w-6 h-6" />
                    QR Kod Üretici
                </h1>
                <p className="text-gray-500 mt-1 text-sm">
                    Müşterilerinizin kolayca randevu alabilmesi için salon afişinizi oluşturun ve indirin.
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
                            Afiş; salon adı, QR kod ve konum bilgilerini içerir. Müşteri QR kodu tarayınca doğrudan randevu sayfanıza yönlenir.
                        </p>
                        <p className="text-xs text-primary-500 font-medium mt-2 font-mono break-all">{shopUrl}</p>
                    </div>
                </div>
            </div>

            {/* Open modal button */}
            <button
                onClick={() => setIsModalOpen(true)}
                className="w-full flex items-center justify-center gap-3 py-4 bg-primary-800 hover:bg-primary-900 text-white font-bold text-base rounded-2xl shadow-lg shadow-primary-700/20 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
            >
                <QrCode className="w-5 h-5" />
                Afişi Önizle ve İndir
            </button>

            {/* ═══════════════ MODAL ═══════════════ */}
            {isModalOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
                    onClick={(e) => { if (e.target === e.currentTarget) setIsModalOpen(false); }}
                >
                    <div className="absolute inset-0 bg-black/65 backdrop-blur-sm" />

                    {/* Hidden canvas for PDF export */}
                    <div style={{ position: 'fixed', top: 0, left: 0, opacity: 0, pointerEvents: 'none', zIndex: -1 }}>
                        <QRCodeCanvas ref={canvasRef} value={shopUrl} size={300} fgColor="#0f172a" bgColor="#ffffff" level="H" marginSize={1} />
                    </div>

                    <div className="relative z-10 w-full max-w-md flex flex-col max-h-[92dvh]">
                        {/* Close */}
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="absolute -top-3 -right-3 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-white shadow-lg text-gray-600 hover:text-gray-900 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        {/* ── 3 Tab ── */}
                        <div className="flex mb-3 bg-white/15 backdrop-blur-sm rounded-2xl p-1 gap-1 shrink-0">
                            {(['classic', 'modern', 'blue'] as TabType[]).map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl font-bold text-xs transition-all duration-200 ${
                                        activeTab === tab ? 'bg-white text-primary-800 shadow-sm' : 'text-white/80 hover:text-white'
                                    }`}
                                >
                                    {tab === 'classic' && <LayoutTemplate className="w-3.5 h-3.5" />}
                                    {tab === 'modern' && <Sparkles className="w-3.5 h-3.5" />}
                                    {tab === 'blue' && <Zap className="w-3.5 h-3.5" />}
                                    {tab === 'classic' ? 'Klasik' : tab === 'modern' ? 'Modern' : 'Dinamik'}
                                </button>
                            ))}
                        </div>

                        {/* ── Preview ── */}
                        <div className="overflow-y-auto rounded-3xl shadow-2xl flex-1">

                            {/* CLASSIC */}
                            {activeTab === 'classic' && (
                                <div ref={previewRef} className="bg-[#eef0f3] p-2 rounded-3xl">
                                    <div className="bg-white rounded-[1.25rem] overflow-hidden shadow-sm ring-1 ring-gray-200 flex flex-col relative pb-4">
                                        <div className="relative h-44 sm:h-52 shrink-0 w-full">
                                            {coverUrl ? (
                                                <img src={coverUrl} alt="" className="w-full h-full object-cover block" />
                                            ) : (
                                                <div className="w-full h-full bg-gradient-to-br from-primary-800 to-primary-900 flex items-center justify-center">
                                                    <span className="text-6xl font-black text-white/10 tracking-widest">{shop.name.slice(0, 2).toUpperCase()}</span>
                                                </div>
                                            )}
                                            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/40 to-transparent" />
                                        </div>
                                        <div className="relative -mt-8 px-4 sm:px-6 flex flex-col items-center flex-1">
                                            <div className="bg-primary-900 px-6 py-4 rounded-[1rem] shadow-lg shadow-primary-900/30 border border-primary-800 w-[92%] text-center mb-5">
                                                <h3 className="text-xl sm:text-2xl font-black text-white truncate">{shop.name}</h3>
                                            </div>
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
                                                            <span key={cat} className="px-4 py-1.5 bg-primary-50 text-primary-950 ring-[1.5px] ring-primary-900 rounded-full text-xs font-bold">{cat}</span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="w-full bg-gradient-to-b from-gray-50 to-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col items-center mb-6">
                                                <p className="text-[10px] font-black tracking-[3px] uppercase text-gray-500 text-center mb-4">Rezervasyon İçin QR Kodu Okutun</p>
                                                <div className="bg-white p-3.5 rounded-[1rem] shadow-[0_4px_20px_rgb(0,0,0,0.06)] ring-1 ring-gray-100 mb-3">
                                                    <QRCodeCanvas value={shopUrl} size={160} fgColor="#0f172a" bgColor="#ffffff" level="H" marginSize={1} />
                                                </div>
                                                <p className="text-[9px] text-gray-400 font-mono break-all text-center max-w-[260px]">{shopUrl}</p>
                                            </div>
                                        </div>
                                        <div className="bg-[#0f172a] py-4 text-center w-full shrink-0">
                                            <span className="text-[10px] font-bold tracking-[4px] uppercase text-white/90">www.salonbir.com</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* MODERN */}
                            {activeTab === 'modern' && (
                                <div ref={previewRef} className="flex flex-col items-center rounded-3xl" style={{ background: '#c8e6e1', padding: '28px 20px 20px' }}>
                                    <div className="text-center mb-5 leading-none">
                                        <div className="font-black text-gray-900" style={{ fontSize: 'clamp(26px, 9vw, 42px)', lineHeight: 1 }}>BU KODU</div>
                                        <div className="flex justify-center my-1.5">
                                            <span className="font-black text-gray-900 px-4 py-0.5 rounded-xl" style={{ background: '#f5b8c8', fontSize: 'clamp(26px, 9vw, 42px)', lineHeight: 1.15 }}>OKUTARAK</span>
                                        </div>
                                        <div className="font-black text-gray-900" style={{ fontSize: 'clamp(26px, 9vw, 42px)', lineHeight: 1 }}>RANDEVU AL</div>
                                    </div>
                                    <div className="text-sm font-bold mb-5 text-center" style={{ color: '#2d7a6e' }}>{shop.name}</div>
                                    <div className="rounded-2xl p-2 mb-5 shadow-lg" style={{ background: '#f5b8c8' }}>
                                        <div className="bg-white rounded-xl p-2.5">
                                            <QRCodeCanvas value={shopUrl} size={140} fgColor="#0f172a" bgColor="#ffffff" level="H" marginSize={1} />
                                        </div>
                                    </div>
                                    <div className="w-full flex rounded-xl overflow-hidden mb-5" style={{ border: '1.5px solid #8fbfba' }}>
                                        {STEPS.map((step, i) => (
                                            <div key={i} className="flex-1 flex flex-col items-center py-3 px-1 text-center gap-2" style={{ borderRight: i < 3 ? '1.5px solid #8fbfba' : 'none' }}>
                                                <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-black text-gray-900 shrink-0" style={{ background: '#f5b8c8' }}>{step.n}</div>
                                                <div className="text-[10px] font-bold text-gray-800 leading-snug whitespace-pre-line">{step.text}</div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="w-full h-px mb-4" style={{ background: '#8fbfba' }} />
                                    <div className="w-full flex justify-between items-center">
                                        <span className="text-xs font-bold" style={{ color: '#2d7a6e' }}>salonbir.com</span>
                                        <span className="text-xs font-bold flex items-center gap-1" style={{ color: '#2d7a6e' }}>
                                            <MapPin className="w-3 h-3" />{locationText}
                                        </span>
                                        <span className="text-xs font-bold" style={{ color: '#2d7a6e' }}>{shop.phoneNumber || ''}</span>
                                    </div>
                                </div>
                            )}

                            {/* BLUE / DİNAMİK */}
                            {activeTab === 'blue' && (
                                <div ref={previewRef} className="flex flex-col rounded-3xl overflow-hidden relative" style={{ background: 'linear-gradient(135deg, #1a00b4 0%, #2e2edd 50%, #1a00b4 100%)', minHeight: '480px' }}>
                                    {/* Stripes */}
                                    {[
                                        { top: '-20px', right: '-20px', width: '180px', height: '28px', rotate: '45deg' },
                                        { top: '-5px', right: '-20px', width: '120px', height: '16px', rotate: '45deg' },
                                        { bottom: '80px', left: '-30px', width: '160px', height: '24px', rotate: '45deg' },
                                        { bottom: '96px', left: '-30px', width: '110px', height: '14px', rotate: '45deg' },
                                    ].map((s, i) => (
                                        <div key={i} className="absolute" style={{ background: 'rgba(255,255,255,0.12)', top: s.top, right: s.right, bottom: s.bottom, left: s.left, width: s.width, height: s.height, transform: `rotate(${s.rotate})` }} />
                                    ))}

                                    {/* Content */}
                                    <div className="relative z-10 flex flex-col items-center flex-1 pt-6 px-5">
                                        <div className="text-white/80 font-bold tracking-[4px] text-[10px] mb-4">◆ SALONBIR ◆</div>
                                        <div className="text-center mb-4" style={{ lineHeight: 0.9 }}>
                                            {['BURADAN', 'RANDEVU', 'ALINIR'].map(w => (
                                                <div key={w} className="font-black text-white" style={{ fontSize: 'clamp(28px, 9vw, 44px)', letterSpacing: '-1px' }}>{w}</div>
                                            ))}
                                        </div>
                                        <div className="text-white/75 text-xs font-bold tracking-widest mb-4">{shop.name.toUpperCase()}</div>
                                        {/* QR */}
                                        <div className="p-1.5 mb-4" style={{ border: '4px solid #7ec8f0', background: 'white' }}>
                                            <QRCodeCanvas value={shopUrl} size={130} fgColor="#0f172a" bgColor="#ffffff" level="H" marginSize={1} />
                                        </div>
                                        {/* Scan bar */}
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="text-white font-black text-lg">&gt;&gt;&gt;</span>
                                            <span className="text-white font-black tracking-[4px] text-base">TARA</span>
                                            <span className="text-white font-black text-lg">&lt;&lt;&lt;</span>
                                        </div>
                                    </div>

                                    {/* Footer */}
                                    <div className="relative z-10 flex justify-between items-center px-4 py-3 mt-auto" style={{ background: 'rgba(0,0,40,0.55)' }}>
                                        <span className="text-white text-[10px] font-bold flex items-center gap-1">
                                            <Phone className="w-3 h-3" />{shop.phoneNumber || ''}
                                        </span>
                                        <span className="text-white text-[10px] font-bold">salonbir.com</span>
                                        <span className="text-white text-[10px] font-bold flex items-center gap-1">
                                            <MapPin className="w-3 h-3" />{locationText}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* ── Buttons ── */}
                        <div className="mt-4 flex gap-2 shrink-0">
                            <button
                                onClick={handlePrintFlyer}
                                className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-primary-800 hover:bg-primary-900 text-white font-bold text-sm rounded-2xl shadow-xl shadow-primary-700/25 transition-all duration-200 active:scale-[0.98]"
                            >
                                <Printer className="w-4 h-4" />
                                {tabLabel} PDF
                            </button>
                            <button
                                onClick={handleDownloadPng}
                                disabled={pngLoading}
                                className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-gray-700 hover:bg-gray-800 text-white font-bold text-sm rounded-2xl shadow-xl shadow-gray-700/25 transition-all duration-200 active:scale-[0.98] disabled:opacity-60"
                            >
                                <ImageDown className="w-4 h-4" />
                                {pngLoading ? 'Oluşturuluyor...' : `${tabLabel} PNG`}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
