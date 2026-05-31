import React from 'react';
import { X, LogIn, UserPlus, ArrowRight, UserCheck } from 'lucide-react';

interface PreBookingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onLogin: () => void;
    onRegister: () => void;
    onGuestContinue: () => void;
}

export const PreBookingModal: React.FC<PreBookingModalProps> = ({
    isOpen,
    onClose,
    onLogin,
    onRegister,
    onGuestContinue,
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
            <div className="bg-white w-full sm:rounded-2xl sm:max-w-sm rounded-t-2xl shadow-2xl">

                {/* Header */}
                <div className="flex justify-between items-center px-5 py-4 border-b border-gray-100">
                    <h2 className="text-lg font-bold text-gray-900">Randevu Almak İçin</h2>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-5 space-y-3">

                    {/* Misafir — üstte */}
                    <button
                        onClick={onGuestContinue}
                        className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl border-2 border-primary-500 bg-primary-50 hover:bg-primary-100 transition-colors text-left"
                    >
                        <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center shrink-0">
                            <UserCheck className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-bold text-primary-900 text-sm">Hızlı Devam Et</p>
                            <p className="text-xs text-primary-600 mt-0.5">Ad ve telefon numaranla SMS ile doğrula</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-primary-500 shrink-0" />
                    </button>

                    {/* Ayırıcı */}
                    <div className="flex items-center gap-3 py-1">
                        <div className="flex-1 h-px bg-gray-200" />
                        <span className="text-xs text-gray-400 font-medium">veya hesabınla giriş yap</span>
                        <div className="flex-1 h-px bg-gray-200" />
                    </div>

                    {/* Giriş Yap */}
                    <button
                        onClick={onLogin}
                        className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl border-2 border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 transition-colors text-left"
                    >
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                            <LogIn className="w-5 h-5 text-gray-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-bold text-gray-900 text-sm">Giriş Yap</p>
                            <p className="text-xs text-gray-500 mt-0.5">Mevcut hesabınla devam et</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-400 shrink-0" />
                    </button>

                    {/* Kayıt Ol */}
                    <button
                        onClick={onRegister}
                        className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl border-2 border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 transition-colors text-left"
                    >
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                            <UserPlus className="w-5 h-5 text-gray-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-bold text-gray-900 text-sm">Kayıt Ol</p>
                            <p className="text-xs text-gray-500 mt-0.5">Yeni hesap oluştur</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-400 shrink-0" />
                    </button>

                </div>
            </div>
        </div>
    );
};
