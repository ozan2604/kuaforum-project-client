import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../api/auth.service';
import { getApiError } from '../utils/storage';

type Step = 'phone' | 'register_info' | 'otp';

export const LoginPage: React.FC = () => {
    const { completeAuth } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const successMessage = (location.state as any)?.message;

    const [step, setStep] = useState<Step>('phone');
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    
    // Register Info
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [kvkkAccepted, setKvkkAccepted] = useState(false);
    
    const [isLoginMode, setIsLoginMode] = useState(true);

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [otpExpiry, setOtpExpiry] = useState(0);

    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const phoneRegex = /^05\d{9}$/;
        if (!phoneRegex.test(phone)) {
            setError('Geçerli bir telefon numarası giriniz. (Örn: 05321234567)');
            return;
        }

        setLoading(true);
        try {
            const res = await authService.sendLoginOtp({ phoneNumber: phone });
            setOtpExpiry(res.expiresInSeconds);
            setIsLoginMode(true);
            setStep('otp');
        } catch (err: any) {
            // Eğer "hesap bulunamadı" hatası gelirse, register_info adımına geç
            if (err.response?.status === 401 || getApiError(err, '').toLowerCase().includes('bulunamadı')) {
                setIsLoginMode(false);
                setStep('register_info');
            } else {
                setError(getApiError(err, 'Bu telefon numarasına kayıtlı hesap bulunamadı.'));
            }
        } finally {
            setLoading(false);
        }
    };

    const handleRegisterInfoSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!firstName.trim()) { setError('Ad alanı zorunludur.'); return; }
        if (!lastName.trim()) { setError('Soyad alanı zorunludur.'); return; }
        if (!kvkkAccepted) { setError('Devam etmek için KVKK Aydınlatma Metnini onaylamalısınız.'); return; }

        setLoading(true);
        try {
            const res = await authService.sendRegisterOtp({
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                phoneNumber: phone
            });
            setOtpExpiry(res.expiresInSeconds);
            setIsLoginMode(false);
            setStep('otp');
        } catch (err) {
            setError(getApiError(err, 'Kod gönderilemedi. Lütfen bilgilerinizi kontrol edin.'));
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (otp.length !== 6) {
            setError('Lütfen 6 haneli kodu giriniz.');
            return;
        }

        setLoading(true);
        try {
            let response;
            if (isLoginMode) {
                response = await authService.verifyLoginOtp({ phoneNumber: phone, otpCode: otp });
            } else {
                response = await authService.verifyRegisterOtp({
                    firstName: firstName.trim(),
                    lastName: lastName.trim(),
                    phoneNumber: phone,
                    otpCode: otp
                });
            }
            const role = completeAuth(response);
            const roles = Array.isArray(role) ? role : [role];
            if (roles.includes('Admin')) navigate('/admin');
            else if (roles.includes('SalonOwner')) navigate('/salon-panel/appointments');
            else if (roles.includes('Employee')) navigate('/employee-panel/appointments');
            else navigate('/');
        } catch (err) {
            setError(getApiError(err, 'Kod hatalı veya süresi dolmuş.'));
        } finally {
            setLoading(false);
        }
    };

    const handleResendOtp = async () => {
        setError('');
        setOtp('');
        setLoading(true);
        try {
            let res;
            if (isLoginMode) {
                res = await authService.sendLoginOtp({ phoneNumber: phone });
            } else {
                res = await authService.sendRegisterOtp({
                    firstName: firstName.trim(),
                    lastName: lastName.trim(),
                    phoneNumber: phone
                });
            }
            setOtpExpiry(res.expiresInSeconds);
        } catch (err) {
            setError(getApiError(err, 'Kod gönderilemedi.'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-2xl mb-4 shadow-lg">
                        <svg className="w-9 h-9 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        {step === 'phone' ? 'Giriş / Kayıt' : step === 'register_info' ? 'Kayıt Ol' : 'Doğrulama Kodu'}
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        {step === 'phone'
                            ? 'Telefon numaranızı girin'
                            : step === 'register_info'
                                ? 'Kayıt olmak için bilgilerinizi tamamlayın'
                                : `${phone} numarasına gönderilen kodu girin`}
                    </p>
                </div>

                <div className="bg-white rounded-2xl shadow-xl p-8">
                    {successMessage && (
                        <div className="flex items-start gap-3 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl mb-6 text-sm">
                            <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span>{successMessage}</span>
                        </div>
                    )}
                    {error && (
                        <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm">
                            <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            <span>{error}</span>
                        </div>
                    )}

                    {step === 'phone' && (
                        <form onSubmit={handleSendOtp} className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Telefon Numarası</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                        <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                        </svg>
                                    </div>
                                    <input
                                        type="tel"
                                        value={phone}
                                        onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                                        placeholder="05XXXXXXXXX"
                                        maxLength={11}
                                        required
                                        autoFocus
                                        className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                                    />
                                </div>
                            </div>

                            <button type="submit" disabled={loading}
                                className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-md">
                                {loading ? (
                                    <>
                                        <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                        Doğrulanıyor…
                                    </>
                                ) : 'Devam Et'}
                            </button>
                        </form>
                    )}

                    {step === 'register_info' && (
                        <form onSubmit={handleRegisterInfoSubmit} className="space-y-5">
                            <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-700">
                                Bu telefon numarası sistemde kayıtlı değil. Lütfen bilgilerinizi tamamlayın.
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Ad</label>
                                    <input
                                        type="text"
                                        value={firstName}
                                        onChange={e => setFirstName(e.target.value)}
                                        placeholder="Adınız"
                                        required
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Soyad</label>
                                    <input
                                        type="text"
                                        value={lastName}
                                        onChange={e => setLastName(e.target.value)}
                                        placeholder="Soyadınız"
                                        required
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                                    />
                                </div>
                            </div>

                            <label className="flex items-start gap-3 cursor-pointer p-3 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
                                <input
                                    type="checkbox"
                                    checked={kvkkAccepted}
                                    onChange={e => setKvkkAccepted(e.target.checked)}
                                    className="mt-1 w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                                />
                                <span className="text-sm text-gray-600 leading-snug">
                                    <a href="#" className="text-primary-600 hover:underline" onClick={e => { e.preventDefault(); e.stopPropagation(); }}>
                                        KVKK Aydınlatma Metnini
                                    </a> okudum ve kabul ediyorum.
                                </span>
                            </label>

                            <button type="submit" disabled={loading}
                                className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-md">
                                {loading ? 'İşleniyor...' : 'Kayıt Ol ve Kod Gönder'}
                            </button>

                            <button type="button" onClick={() => { setStep('phone'); setError(''); }}
                                className="w-full text-center text-sm text-gray-500 hover:text-gray-700 mt-2">
                                ← Geri dön
                            </button>
                        </form>
                    )}

                    {step === 'otp' && (
                        <form onSubmit={handleVerifyOtp} className="space-y-5">
                            <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-700">
                                {phone} numarasına {otpExpiry} saniyelik doğrulama kodu gönderildi.
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Doğrulama Kodu</label>
                                <input
                                    type="text"
                                    value={otp}
                                    onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    placeholder="_ _ _ _ _ _"
                                    maxLength={6}
                                    required
                                    autoFocus
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 text-center text-2xl tracking-[0.5em] placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                                />
                            </div>

                            <button type="submit" disabled={loading || otp.length !== 6}
                                className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-md">
                                {loading ? (
                                    <>
                                        <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                        Doğrulanıyor…
                                    </>
                                ) : 'Doğrula'}
                            </button>

                            <div className="flex items-center justify-between text-sm">
                                <button type="button" onClick={() => { setStep('phone'); setOtp(''); setError(''); }}
                                    className="text-gray-500 hover:text-gray-700">
                                    ← Geri dön
                                </button>
                                <button type="button" onClick={handleResendOtp} disabled={loading}
                                    className="text-primary-600 hover:text-primary-700 font-medium disabled:opacity-50">
                                    Tekrar gönder
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};
