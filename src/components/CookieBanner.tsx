
import React, { useState, useEffect } from 'react';
import { X, Cookie, ShieldCheck } from 'lucide-react';
import { Button } from './Button';
import { LEGAL_TEXTS } from '../constants/legal';
import { LegalModal } from './LegalModal';

export const CookieBanner: React.FC = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [legalModal, setLegalModal] = useState<{ title: string; content: string } | null>(null);

    useEffect(() => {
        const consent = localStorage.getItem('cookie-consent');
        if (!consent) {
            const timer = setTimeout(() => setIsVisible(true), 1500);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleAccept = () => {
        localStorage.setItem('cookie-consent', 'accepted');
        setIsVisible(false);
    };

    const handleDecline = () => {
        localStorage.setItem('cookie-consent', 'declined');
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <>
            <div className="fixed bottom-4 left-4 right-4 z-[9998] animate-in fade-in slide-in-from-bottom-10 duration-700">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-white/90 backdrop-blur-md border border-gray-200 shadow-2xl rounded-2xl p-4 sm:p-6 flex flex-col md:flex-row items-center gap-4 sm:gap-6 relative overflow-hidden">
                        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-primary-500/5 rounded-full blur-3xl pointer-events-none" />

                        <div className="flex-shrink-0 bg-primary-50 p-3 rounded-xl">
                            <Cookie className="h-8 w-8 text-primary-600" />
                        </div>

                        <div className="flex-1 text-center md:text-left">
                            <h3 className="font-bold text-gray-900 flex items-center justify-center md:justify-start gap-2">
                                Çerezler ve Gizlilik
                                <ShieldCheck className="h-4 w-4 text-green-600" />
                            </h3>
                            <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                                {LEGAL_TEXTS.COOKIE_SUMMARY} Daha fazla bilgi için{' '}
                                <button
                                    onClick={() => setLegalModal({ title: 'KVKK Aydınlatma Metni', content: LEGAL_TEXTS.KVKK_DETAILS })}
                                    className="text-primary-600 hover:underline font-medium"
                                >
                                    KVKK Aydınlatma Metni
                                </button>{' '}
                                ve{' '}
                                <button
                                    onClick={() => setLegalModal({ title: 'Çerez Politikası', content: LEGAL_TEXTS.COOKIE_POLICY })}
                                    className="text-primary-600 hover:underline font-medium"
                                >
                                    Çerez Politikamızı
                                </button>{' '}
                                inceleyebilirsiniz.
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                            <button
                                onClick={handleDecline}
                                className="text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors px-4 py-2"
                            >
                                Yalnızca Gerekli
                            </button>
                            <Button
                                variant="primary"
                                onClick={handleAccept}
                                className="w-full sm:w-auto shadow-lg shadow-primary-500/20 px-8"
                            >
                                Kabul Et
                            </Button>
                        </div>

                        <button
                            onClick={() => setIsVisible(false)}
                            className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                            title="Kapat"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>

            {legalModal && (
                <LegalModal
                    isOpen={true}
                    onClose={() => setLegalModal(null)}
                    title={legalModal.title}
                    content={legalModal.content}
                />
            )}
        </>
    );
};
