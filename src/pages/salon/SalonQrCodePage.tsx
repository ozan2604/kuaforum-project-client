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
  .page { width: 200mm; height: 278mm; background: #c8e6e1; display: flex; flex-direction: column; align-items: center; padding: 12mm 14mm 8mm; overflow: hidden; }
  .heading { text-align: center; margin-bottom: 5mm; }
  .line { font-size: 46pt; font-weight: 900; color: #111111; display: block; letter-spacing: -1pt; line-height: 1.0; }
  .highlight-wrap { display: flex; justify-content: center; margin: 1mm 0; }
  .highlight { display: inline-block; background: #f5b8c8; border-radius: 10pt; padding: 0 10pt; font-size: 46pt; font-weight: 900; color: #111111; letter-spacing: -1pt; line-height: 1.15; }
  .shop-name { font-size: 11pt; font-weight: 700; color: #2d7a6e; margin-bottom: 5mm; text-align: center; }
  .qr-outer { background: #f5b8c8; border-radius: 16pt; padding: 7pt; margin-bottom: 6mm; }
  .qr-inner { background: white; border-radius: 12pt; padding: 8pt; }
  .qr-inner img { width: 64mm; height: 64mm; display: block; }
  .steps-container { width: 100%; border: 1.5pt solid #8fbfba; border-radius: 8pt; overflow: hidden; display: flex; margin-bottom: 6mm; flex-shrink: 0; }
  .step { flex: 1; display: flex; flex-direction: column; align-items: center; padding: 3mm 1.5mm; border-right: 1.5pt solid #8fbfba; text-align: center; gap: 2mm; }
  .step:last-child { border-right: none; }
  .step-num { width: 8mm; height: 8mm; border-radius: 50%; background: #f5b8c8; display: flex; align-items: center; justify-content: center; font-size: 10pt; font-weight: 900; color: #111; flex-shrink: 0; }
  .step-text { font-size: 7pt; font-weight: 700; color: #1a1a1a; line-height: 1.3; font-family: Arial, sans-serif; }
  .divider { width: 100%; height: 0.5mm; background: #8fbfba; margin-bottom: 4mm; flex-shrink: 0; }
  .footer { width: 100%; display: flex; justify-content: space-between; align-items: center; flex-shrink: 0; }
  .footer-item { font-size: 8pt; color: #2d7a6e; font-weight: 700; font-family: Arial, sans-serif; display: flex; align-items: center; gap: 2mm; white-space: nowrap; }
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
    width: 200mm; height: 278mm; overflow: hidden;
    background: linear-gradient(135deg, #1a00b4 0%, #2e2edd 45%, #1a00b4 100%);
    display: flex; flex-direction: column; align-items: center; position: relative;
  }
  .s { position: absolute; background: rgba(255,255,255,0.10); }
  .s1 { top: -25mm; right: -15mm; width: 95mm; height: 16mm; transform: rotate(45deg); }
  .s2 { top: -10mm; right: -15mm; width: 65mm; height: 10mm; transform: rotate(45deg); }
  .s3 { top: 5mm; right: -15mm; width: 48mm; height: 7mm; transform: rotate(45deg); }
  .s4 { bottom: 42mm; left: -25mm; width: 95mm; height: 16mm; transform: rotate(45deg); }
  .s5 { bottom: 52mm; left: -25mm; width: 65mm; height: 10mm; transform: rotate(45deg); }
  .content { position: relative; z-index: 1; display: flex; flex-direction: column; align-items: center; padding: 8mm 12mm 0; flex: 1; width: 100%; min-height: 0; }
  .logo { font-size: 9pt; font-weight: 700; color: rgba(255,255,255,0.85); letter-spacing: 3pt; margin-bottom: 3mm; }
  .heading { text-align: center; margin-bottom: 4mm; }
  .h-line { font-size: 50pt; font-weight: 900; color: white; display: block; letter-spacing: -2pt; line-height: 0.92; }
  .shop-name { font-size: 10pt; font-weight: 700; color: rgba(255,255,255,0.8); margin-bottom: 5mm; letter-spacing: 1pt; text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
  .qr-outer { border: 4pt solid #7ec8f0; padding: 5pt; background: white; margin-bottom: 5mm; flex-shrink: 0; }
  .qr-outer img { width: 68mm; height: 68mm; display: block; }
  .scan-bar { display: flex; align-items: center; gap: 4mm; }
  .arrows { font-size: 16pt; font-weight: 900; color: white; }
  .scan-text { font-size: 18pt; font-weight: 900; color: white; letter-spacing: 3pt; }
  .footer { width: 100%; background: rgba(0,0,40,0.55); padding: 4mm 8mm; display: flex; justify-content: space-between; align-items: center; flex-shrink: 0; margin-top: auto; }
  .fi { display: flex; align-items: center; gap: 2mm; font-size: 8pt; color: white; font-weight: 600; font-family: Arial, sans-serif; white-space: nowrap; }
</style></head><body>
<div class="page">
  <div class="s s1"></div><div class="s s2"></div><div class="s s3"></div>
  <div class="s s4"></div><div class="s s5"></div>
  <div class="content">
    <div class="logo">&#9670; SALONBIR &#9670;</div>
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

    /* ─── PNG download — PDF HTML'ini iframe'de render edip yakalar ─── */
    const handleDownloadPng = async () => {
        if (!canvasRef.current || !shop) return;
        setPngLoading(true);
        const toastId = toast.loading('PNG oluşturuluyor...');
        try {
            const qrDataUrl = canvasRef.current.toDataURL('image/png');
            const rawHtml = activeTab === 'classic'
                ? buildClassicHtml(qrDataUrl)
                : activeTab === 'modern'
                    ? buildModernHtml(qrDataUrl)
                    : buildBlueHtml(qrDataUrl);
            // Script etiketlerini kaldır (yazdırma scripti çalışmasın)
            const screenHtml = rawHtml.replace(/<script[\s\S]*?<\/script>/gi, '');

            const iframe = document.createElement('iframe');
            iframe.style.cssText = 'position:fixed;left:-9999px;top:0;width:794px;height:1123px;border:none;visibility:hidden;';
            document.body.appendChild(iframe);
            const iDoc = iframe.contentDocument!;
            iDoc.open();
            iDoc.write(screenHtml);
            iDoc.close();

            // Resimlerin ve layout'un yüklenmesi için bekle
            await new Promise<void>(resolve => {
                if (iDoc.readyState === 'complete') setTimeout(resolve, 500);
                else iframe.addEventListener('load', () => setTimeout(resolve, 500), { once: true });
            });

            const canvas = await html2canvas(iDoc.body, {
                scale: 2,
                useCORS: true,
                allowTaint: true,
                backgroundColor: null,
                logging: false,
                width: 794,
                height: 1123,
                windowWidth: 794,
                windowHeight: 1123,
            });

            document.body.removeChild(iframe);
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
                                <div className="bg-[#eef0f3] p-2 rounded-3xl">
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

                            {/* MODERN — tüm stiller inline (html2canvas uyumluluğu için) */}
                            {activeTab === 'modern' && (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', borderRadius: '24px', background: '#c8e6e1', padding: '28px 20px 20px' }}>
                                    {/* Başlık */}
                                    <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                                        <div style={{ fontWeight: 900, color: '#111111', fontSize: '36px', lineHeight: 1 }}>BU KODU</div>
                                        <div style={{ display: 'flex', justifyContent: 'center', margin: '6px 0' }}>
                                            <span style={{ fontWeight: 900, color: '#111111', background: '#f5b8c8', fontSize: '36px', lineHeight: 1.15, borderRadius: '10px', padding: '0 14px' }}>OKUTARAK</span>
                                        </div>
                                        <div style={{ fontWeight: 900, color: '#111111', fontSize: '36px', lineHeight: 1 }}>RANDEVU AL</div>
                                    </div>
                                    {/* Salon adı */}
                                    <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '20px', textAlign: 'center', color: '#2d7a6e' }}>{shop.name}</div>
                                    {/* QR */}
                                    <div style={{ background: '#f5b8c8', borderRadius: '16px', padding: '8px', marginBottom: '20px', boxShadow: '0 8px 20px rgba(0,0,0,0.1)' }}>
                                        <div style={{ background: 'white', borderRadius: '12px', padding: '10px' }}>
                                            <QRCodeCanvas value={shopUrl} size={140} fgColor="#0f172a" bgColor="#ffffff" level="H" marginSize={1} />
                                        </div>
                                    </div>
                                    {/* Adımlar */}
                                    <div style={{ width: '100%', display: 'flex', borderRadius: '12px', overflow: 'hidden', marginBottom: '20px', border: '1.5px solid #8fbfba' }}>
                                        {STEPS.map((step, i) => (
                                            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 4px', textAlign: 'center', gap: '8px', borderRight: i < 3 ? '1.5px solid #8fbfba' : 'none' }}>
                                                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#f5b8c8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 900, color: '#111111', flexShrink: 0 }}>{step.n}</div>
                                                <div style={{ fontSize: '10px', fontWeight: 700, color: '#1a1a1a', lineHeight: 1.3, textAlign: 'center' }}>
                                                    {step.text.split('\n').map((line, j, arr) => (
                                                        <React.Fragment key={j}>{line}{j < arr.length - 1 && <br />}</React.Fragment>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    {/* Divider */}
                                    <div style={{ width: '100%', height: '1px', background: '#8fbfba', marginBottom: '14px', flexShrink: 0 }} />
                                    {/* Footer — flex: 1 1 0% her item için eşit alan */}
                                    <div style={{ width: '100%', display: 'flex', alignItems: 'center' }}>
                                        <span style={{ flex: '1 1 0%', color: '#2d7a6e', fontSize: '10px', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>salonbir.com</span>
                                        <span style={{ flex: '1 1 0%', color: '#2d7a6e', fontSize: '10px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px', overflow: 'hidden' }}>
                                            <MapPin color="#2d7a6e" style={{ width: '12px', height: '12px', flexShrink: 0 }} />
                                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{locationText}</span>
                                        </span>
                                        <span style={{ flex: '1 1 0%', color: '#2d7a6e', fontSize: '10px', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'right' }}>{shop.phoneNumber || ''}</span>
                                    </div>
                                </div>
                            )}

                            {/* BLUE / DİNAMİK — tüm stiller inline (html2canvas uyumluluğu için) */}
                            {activeTab === 'blue' && (
                                <div style={{
                                    display: 'flex', flexDirection: 'column', borderRadius: '24px',
                                    overflow: 'hidden', position: 'relative',
                                    background: 'linear-gradient(135deg, #1a00b4 0%, #2e2edd 50%, #1a00b4 100%)',
                                    minHeight: '520px',
                                }}>
                                    {/* Dekoratif çizgiler */}
                                    <div style={{ position: 'absolute', background: 'rgba(255,255,255,0.12)', top: '-20px', right: '-20px', width: '180px', height: '28px', transform: 'rotate(45deg)' }} />
                                    <div style={{ position: 'absolute', background: 'rgba(255,255,255,0.12)', top: '-5px', right: '-20px', width: '120px', height: '16px', transform: 'rotate(45deg)' }} />
                                    <div style={{ position: 'absolute', background: 'rgba(255,255,255,0.12)', bottom: '80px', left: '-30px', width: '160px', height: '24px', transform: 'rotate(45deg)' }} />
                                    <div style={{ position: 'absolute', background: 'rgba(255,255,255,0.12)', bottom: '96px', left: '-30px', width: '110px', height: '14px', transform: 'rotate(45deg)' }} />

                                    {/* İçerik */}
                                    <div style={{
                                        position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column',
                                        alignItems: 'center', flex: '1 1 auto', paddingTop: '24px',
                                        paddingLeft: '20px', paddingRight: '20px',
                                    }}>
                                        <div style={{ color: 'rgba(255,255,255,0.8)', fontWeight: 700, letterSpacing: '4px', fontSize: '10px', marginBottom: '14px' }}>
                                            ◆ SALONBIR ◆
                                        </div>
                                        <div style={{ textAlign: 'center', marginBottom: '14px' }}>
                                            {['BURADAN', 'RANDEVU', 'ALINIR'].map(w => (
                                                <div key={w} style={{ fontWeight: 900, color: '#ffffff', fontSize: '40px', letterSpacing: '-1px', lineHeight: '0.92', display: 'block' }}>{w}</div>
                                            ))}
                                        </div>
                                        <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: '11px', fontWeight: 700, letterSpacing: '3px', marginBottom: '14px', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%', lineHeight: 1.6 }}>
                                            {shop.name.toUpperCase()}
                                        </div>
                                        <div style={{ padding: '6px', marginBottom: '14px', border: '4px solid #7ec8f0', background: 'white', flexShrink: 0 }}>
                                            <QRCodeCanvas value={shopUrl} size={130} fgColor="#0f172a" bgColor="#ffffff" level="H" marginSize={1} />
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                            <span style={{ color: '#ffffff', fontWeight: 900, fontSize: '18px' }}>&gt;&gt;&gt;</span>
                                            <span style={{ color: '#ffffff', fontWeight: 900, letterSpacing: '4px', fontSize: '16px' }}>TARA</span>
                                            <span style={{ color: '#ffffff', fontWeight: 900, fontSize: '18px' }}>&lt;&lt;&lt;</span>
                                        </div>
                                    </div>

                                    {/* Footer — sol: telefon, sağ: salonbir.com */}
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', background: 'rgba(0,0,40,0.55)', flexShrink: 0 }}>
                                        <span style={{ color: '#ffffff', fontSize: '10px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', overflow: 'hidden', maxWidth: '60%' }}>
                                            <Phone color="#ffffff" style={{ width: '12px', height: '12px', flexShrink: 0 }} />
                                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{shop.phoneNumber || ''}</span>
                                        </span>
                                        <span style={{ color: '#ffffff', fontSize: '10px', fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0 }}>salonbir.com</span>
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
