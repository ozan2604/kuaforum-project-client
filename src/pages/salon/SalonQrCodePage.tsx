import React, { useEffect, useRef, useState } from 'react';
import { shopService } from '../../api/shop.service';
import { QRCodeCanvas, QRCodeSVG } from 'qrcode.react';
import { QrCode, X, Phone, Tag, Loader2, ImageDown, FileCode2 } from 'lucide-react';
import { ShopCategoryLabels } from '../../types/shop';
import type { Shop } from '../../types/shop';
import { toast } from 'react-hot-toast';

const SHOP_BASE_URL = 'https://www.salonbir.com/shop';

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
        const serializer = new XMLSerializer();
        const svgStr = serializer.serializeToString(svgEl);
        const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${shop?.name ?? 'salon'}-qr.svg`;
        a.click();
        URL.revokeObjectURL(url);
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
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

                    {/* Modal card */}
                    <div className="relative z-10 w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden">

                        {/* Close button */}
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

                            {/* Shop info */}
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
                                                <span
                                                    key={cat}
                                                    className="inline-block px-2.5 py-0.5 bg-white/20 rounded-full text-xs font-semibold text-white"
                                                >
                                                    {cat}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* QR Code area */}
                        <div className="bg-gray-50 flex flex-col items-center py-8 px-6">
                            {/* Visible QR: Canvas (for PNG download) */}
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

                            {/* Hidden SVG for SVG download */}
                            <div className="hidden" ref={svgWrapRef} aria-hidden>
                                <QRCodeSVG
                                    value={shopUrl}
                                    size={512}
                                    fgColor="#334155"
                                    bgColor="#ffffff"
                                    level="H"
                                    marginSize={1}
                                />
                            </div>

                            <p className="mt-3 text-xs text-gray-400 text-center font-mono break-all px-4 max-w-xs">{shopUrl}</p>
                        </div>

                        {/* Download buttons */}
                        <div className="bg-white px-6 pb-6 pt-2">
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 text-center">İndir</p>
                            <div className="flex gap-3">
                                <button
                                    onClick={handleDownloadPng}
                                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary-700 hover:bg-primary-800 text-white font-bold text-sm rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-sm shadow-primary-700/20"
                                >
                                    <ImageDown className="w-4 h-4" />
                                    PNG İndir
                                </button>
                                <button
                                    onClick={handleDownloadSvg}
                                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-white hover:bg-gray-50 text-primary-700 font-bold text-sm rounded-xl border-2 border-primary-200 hover:border-primary-400 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    <FileCode2 className="w-4 h-4" />
                                    SVG İndir
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
