import React, { useEffect, useRef, useState } from 'react';
import { useSalon } from '../../context/SalonContext';
import { QRCodeCanvas } from 'qrcode.react';
import { QrCode, X, Loader2, Printer, Phone, LayoutTemplate, Sparkles, MapPin, Zap, ImageDown } from 'lucide-react';
import { ShopCategoryLabels } from '../../types/shop';
import { toast } from 'react-hot-toast';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';

const SHOP_BASE_URL = 'https://www.salonbir.com/shop';

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

export const SalonQrCodePage: React.FC = () => {
    const { currentShop } = useSalon();
    const shop = currentShop;
    const loading = !currentShop;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<TabType>('classic');
    const [downloading, setDownloading] = useState(false);
    const previewRef = useRef<HTMLDivElement>(null);

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

    /* ─── Farklı Kaydet dialogu ─── */
    const saveWithPicker = async (blob: Blob, suggestedName: string, ext: 'png' | 'pdf') => {
        const mimeType = ext === 'png' ? 'image/png' : 'application/pdf';
        const description = ext === 'png' ? 'PNG Görsel' : 'PDF Dosyası';
        if ('showSaveFilePicker' in window) {
            const handle = await (window as any).showSaveFilePicker({
                suggestedName,
                types: [{ description, accept: { [mimeType]: [`.${ext}`] } }],
            });
            const writable = await handle.createWritable();
            await writable.write(blob);
            await writable.close();
        } else {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.download = suggestedName;
            link.href = url;
            link.click();
            URL.revokeObjectURL(url);
        }
    };

    /* ─── Download (PNG veya PDF) ─── */
    const handleDownload = async (format: 'pdf' | 'png') => {
        if (!previewRef.current || !shop) return;
        setDownloading(true);
        const label = format === 'pdf' ? 'PDF' : 'PNG';
        const toastId = toast.loading(`${label} oluşturuluyor...`);

        try {
            // html-to-image: scroll/DPR sorunları olmayan SVG foreignObject tabanlı render
            const dataUrl = await toPng(previewRef.current, {
                pixelRatio: 3,
                cacheBust: true,
            });

            const fileName = `${shop.name}-qr-afis`;

            if (format === 'png') {
                const arr = dataUrl.split(',');
                const mime = arr[0].match(/:(.*?);/)![1];
                const bstr = atob(arr[1]);
                const u8arr = new Uint8Array(bstr.length);
                for (let i = 0; i < bstr.length; i++) u8arr[i] = bstr.charCodeAt(i);
                const blob = new Blob([u8arr], { type: mime });
                await saveWithPicker(blob, `${fileName}.png`, 'png');
                toast.success('PNG kaydedildi!', { id: toastId });
            } else {
                const img = new Image();
                await new Promise<void>(r => { img.onload = () => r(); img.src = dataUrl; });
                const cw = img.naturalWidth;
                const ch = img.naturalHeight;
                const a4w = 210, a4h = 297;
                const cAspect = cw / ch;
                const a4Aspect = a4w / a4h;

                let imgW: number, imgH: number, offX: number, offY: number;
                if (cAspect > a4Aspect) {
                    imgW = a4w; imgH = a4w / cAspect;
                    offX = 0; offY = (a4h - imgH) / 2;
                } else {
                    imgH = a4h; imgW = a4h * cAspect;
                    offX = (a4w - imgW) / 2; offY = 0;
                }

                const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
                pdf.addImage(dataUrl, 'PNG', offX, offY, imgW, imgH);
                const blob = pdf.output('blob');
                await saveWithPicker(blob, `${fileName}.pdf`, 'pdf');
                toast.success('PDF kaydedildi!', { id: toastId });
            }
        } catch (err: any) {
            if (err?.name !== 'AbortError') {
                toast.error('İndirme sırasında hata oluştu.', { id: toastId });
            } else {
                toast.dismiss(toastId);
            }
        } finally {
            setDownloading(false);
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
                            <div ref={previewRef}>

                                {/* CLASSIC */}
                                {activeTab === 'classic' && (
                                    <div className="bg-[#eef0f3] p-2 rounded-3xl">
                                        <div className="bg-white rounded-[1.25rem] overflow-hidden shadow-sm ring-1 ring-gray-200 flex flex-col">

                                            {/* ── Üst koyu bölüm: kapak + isim + kategoriler + telefon ── */}
                                            <div className="relative" style={{ minHeight: '210px' }}>
                                                {/* Arka plan */}
                                                {coverUrl ? (
                                                    <div className="absolute inset-0" style={{ backgroundImage: `url(${coverUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                                                ) : (
                                                    <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <span style={{ fontSize: '90px', fontWeight: 900, color: 'rgba(255,255,255,0.07)', letterSpacing: '8px', userSelect: 'none' }}>{shop.name.slice(0, 2).toUpperCase()}</span>
                                                    </div>
                                                )}
                                                {/* Karartma gradient */}
                                                <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, #0f172a 0%, rgba(15,23,42,0.75) 50%, transparent 100%)' }} />
                                                {/* İsim + kategoriler + telefon — altta hizalı */}
                                                <div className="absolute inset-0 flex flex-col items-center justify-end gap-3 px-5 pb-6">
                                                    <h3 className="text-2xl font-black text-white text-center leading-tight">{shop.name}</h3>
                                                    {categoryNames.length > 0 && (
                                                        <div className="flex flex-wrap items-center justify-center gap-2">
                                                            {categoryNames.map(cat => (
                                                                <span key={cat} style={{ padding: '4px 14px', borderRadius: '999px', fontSize: '11px', fontWeight: 700, color: '#ffffff', background: 'rgba(255,255,255,0.14)', border: '1px solid rgba(255,255,255,0.22)' }}>{cat}</span>
                                                            ))}
                                                        </div>
                                                    )}
                                                    {shop.phoneNumber && (
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 20px', borderRadius: '999px', background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', color: '#ffffff' }}>
                                                            <Phone style={{ width: '14px', height: '14px', flexShrink: 0 }} />
                                                            <span style={{ fontSize: '14px', fontWeight: 700, letterSpacing: '0.5px' }}>{shop.phoneNumber}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* ── Alt beyaz bölüm: QR ── */}
                                            <div className="flex flex-col items-center px-5 py-6">
                                                <p className="text-[10px] font-black tracking-[3px] uppercase text-gray-500 text-center mb-4">Rezervasyon İçin QR Kodu Okutun</p>
                                                <div className="bg-white p-3.5 rounded-[1rem] shadow-[0_4px_20px_rgb(0,0,0,0.06)] ring-1 ring-gray-100 mb-3">
                                                    <QRCodeCanvas value={shopUrl} size={160} fgColor="#0f172a" bgColor="#ffffff" level="H" marginSize={1} />
                                                </div>
                                                <p className="text-[9px] text-gray-400 font-mono break-all text-center max-w-[260px]">{shopUrl}</p>
                                            </div>

                                            {/* Footer */}
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
                                        {/* Footer */}
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

                                        {/* Footer */}
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
                        </div>

                        {/* ── Buttons ── */}
                        <div className="mt-4 flex gap-2 shrink-0">
                            <button
                                onClick={() => handleDownload('pdf')}
                                disabled={downloading}
                                className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-primary-800 hover:bg-primary-900 text-white font-bold text-sm rounded-2xl shadow-xl shadow-primary-700/25 transition-all duration-200 active:scale-[0.98] disabled:opacity-60"
                            >
                                <Printer className="w-4 h-4" />
                                {downloading ? 'Oluşturuluyor...' : `${tabLabel} PDF`}
                            </button>
                            <button
                                onClick={() => handleDownload('png')}
                                disabled={downloading}
                                className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-gray-700 hover:bg-gray-800 text-white font-bold text-sm rounded-2xl shadow-xl shadow-gray-700/25 transition-all duration-200 active:scale-[0.98] disabled:opacity-60"
                            >
                                <ImageDown className="w-4 h-4" />
                                {downloading ? 'Oluşturuluyor...' : `${tabLabel} PNG`}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
