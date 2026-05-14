import React, { useEffect } from 'react';
import { X, Shield } from 'lucide-react';

interface LegalModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    content: string;
}

export const LegalModal: React.FC<LegalModalProps> = ({ isOpen, onClose, title, content }) => {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        if (isOpen) window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
                <div className="bg-primary-600 px-6 py-5 text-white flex items-center gap-3 flex-shrink-0">
                    <div className="bg-white/20 p-2 rounded-xl">
                        <Shield className="h-5 w-5 text-white" />
                    </div>
                    <h2 className="text-lg font-bold flex-1">{title}</h2>
                    <button
                        onClick={onClose}
                        className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                        aria-label="Kapat"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="overflow-y-auto px-6 py-5 flex-1">
                    <div className="text-gray-600 leading-relaxed space-y-3 text-sm">
                        {content.split('\n\n').map((block, i) => {
                            const trimmed = block.trim();
                            if (trimmed.startsWith('## ')) {
                                return <h3 key={i} className="font-semibold text-gray-900 text-base mt-4 first:mt-0">{trimmed.replace('## ', '')}</h3>;
                            }
                            if (trimmed.startsWith('# ')) {
                                return null;
                            }
                            return <p key={i}>{trimmed}</p>;
                        })}
                    </div>
                </div>

                <div className="border-t border-gray-100 px-6 py-4 flex items-center justify-between flex-shrink-0 bg-gray-50">
                    <p className="text-xs text-gray-400">Son Güncelleme: 01 Mayıs 2026</p>
                    <button
                        onClick={onClose}
                        className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
                    >
                        Kapat
                    </button>
                </div>
            </div>
        </div>
    );
};
