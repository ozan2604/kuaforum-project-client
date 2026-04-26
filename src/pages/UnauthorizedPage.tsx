import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldOff, ArrowLeft, Lock } from 'lucide-react';

export const UnauthorizedPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-[70vh] flex items-center justify-center px-4">
            <div className="max-w-md w-full text-center">

                {/* Icon Stack */}
                <div className="relative inline-flex items-center justify-center mb-8">
                    <div className="w-28 h-28 rounded-full bg-red-50 flex items-center justify-center">
                        <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center">
                            <ShieldOff className="w-10 h-10 text-red-500" />
                        </div>
                    </div>
                    <div className="absolute -top-1 -right-1 w-9 h-9 rounded-full bg-white shadow-md flex items-center justify-center border border-gray-100">
                        <Lock className="w-4 h-4 text-gray-500" />
                    </div>
                </div>

                {/* Text */}
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    Bu Sayfaya Erişim Yetkiniz Yok
                </h1>
                <p className="text-gray-500 text-sm leading-relaxed mb-8">
                    Bu bölüm yalnızca <span className="font-semibold text-gray-700">Salon Sahiplerine</span> özeldir.
                    Daha fazla bilgi için salon sahibinizle iletişime geçebilirsiniz.
                </p>

                {/* Divider with badge */}
                <div className="flex items-center gap-3 mb-8">
                    <div className="flex-1 h-px bg-gray-200" />
                    <span className="text-xs text-gray-400 font-medium uppercase tracking-widest px-2">
                        Yetkisiz Erişim
                    </span>
                    <div className="flex-1 h-px bg-gray-200" />
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                        onClick={() => navigate(-1)}
                        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Geri Dön
                    </button>
                    <button
                        onClick={() => navigate('/salon-panel/employee-appointments')}
                        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-primary-600 rounded-xl hover:bg-primary-700 transition-all shadow-sm"
                    >
                        Randevularıma Git
                    </button>
                </div>
            </div>
        </div>
    );
};
