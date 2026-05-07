import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../api/auth.service';
import { getApiError } from '../utils/storage';

type Step = 'phone' | 'otp';

export const ForgotPasswordPage: React.FC = () => {
    const navigate = useNavigate();

    const [step, setStep] = useState<Step>('phone');
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [otpExpiry, setOtpExpiry] = useState(0);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

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
            const res = await authService.sendForgotPasswordOtp({ phoneNumber: phone });
            setOtpExpiry(res.expiresInSeconds);
            setStep('otp');
        } catch (err) {
            setError(getApiError(err, 'Kod gönderilemedi.'));
        } finally {
            setLoading(false);
        }
    };

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (otp.length !== 6) { setError('Lütfen 6 haneli kodu giriniz.'); return; }
        if (newPassword !== confirmPassword) { setError('Şifreler eşleşmiyor.'); return; }
        if (newPassword.length < 6) { setError('Şifre en az 6 karakter olmalıdır.'); return; }

        setLoading(true);
        try {
            await authService.resetPasswordWithOtp({ phoneNumber: phone, otpCode: otp, newPassword });
            navigate('/login', { state: { message: 'Şifreniz başarıyla sıfırlandı. Giriş yapabilirsiniz.' } });
        } catch (err) {
            setError(getApiError(err, 'Şifre sıfırlanamadı.'));
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        setError('');
        setOtp('');
        setLoading(true);
        try {
            const res = await authService.sendForgotPasswordOtp({ phoneNumber: phone });
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
                                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        {step === 'phone' ? 'Şifremi Unuttum' : 'Yeni Şifre Belirle'}
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        {step === 'phone'
                            ? 'Kayıtlı telefon numaranıza doğrulama kodu gönderilecek'
                            : `${phone} numarasına gönderilen kodu ve yeni şifreyi girin`}
                    </p>
                </div>

                <div className="bg-white rounded-2xl shadow-xl p-8">
                    {error && (
                        <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm">
                            <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            <span>{error}</span>
                        </div>
                    )}

                    {step === 'phone' ? (
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
                                    <input type="tel" value={phone}
                                        onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                                        placeholder="05XXXXXXXXX" maxLength={11} required autoFocus
                                        className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all" />
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
                                        Kod Gönderiliyor…
                                    </>
                                ) : 'Doğrulama Kodu Gönder'}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleReset} className="space-y-4">
                            <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-700">
                                {phone} numarasına {otpExpiry} saniyelik kod gönderildi.
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Doğrulama Kodu</label>
                                <input type="text" value={otp}
                                    onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    placeholder="_ _ _ _ _ _" maxLength={6} required autoFocus
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 text-center text-2xl tracking-[0.5em] placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Yeni Şifre</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                        <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                    </div>
                                    <input type={showPassword ? 'text' : 'password'} value={newPassword}
                                        onChange={e => setNewPassword(e.target.value)}
                                        placeholder="En az 6 karakter" required
                                        className="w-full pl-11 pr-12 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all" />
                                    <button type="button" onClick={() => setShowPassword(v => !v)}
                                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            {showPassword
                                                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                                : <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></>
                                            }
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Şifre Tekrar</label>
                                <input type={showPassword ? 'text' : 'password'} value={confirmPassword}
                                    onChange={e => setConfirmPassword(e.target.value)}
                                    placeholder="Şifrenizi tekrar girin" required
                                    className={`w-full px-4 py-3 border rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${confirmPassword && newPassword !== confirmPassword ? 'border-red-300 bg-red-50' : 'border-gray-200'}`} />
                                {confirmPassword && newPassword !== confirmPassword && (
                                    <p className="text-xs text-red-500 mt-1">Şifreler eşleşmiyor</p>
                                )}
                            </div>

                            <button type="submit" disabled={loading || otp.length !== 6}
                                className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-md">
                                {loading ? (
                                    <>
                                        <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                        Şifre Sıfırlanıyor…
                                    </>
                                ) : 'Şifremi Sıfırla'}
                            </button>

                            <div className="flex items-center justify-between text-sm">
                                <button type="button" onClick={() => { setStep('phone'); setOtp(''); setError(''); }}
                                    className="text-gray-500 hover:text-gray-700">← Geri dön</button>
                                <button type="button" onClick={handleResend} disabled={loading}
                                    className="text-primary-600 hover:text-primary-700 font-medium disabled:opacity-50">
                                    Tekrar gönder
                                </button>
                            </div>
                        </form>
                    )}
                </div>

                <p className="text-center text-sm text-gray-600 mt-6">
                    <Link to="/login" className="font-semibold text-primary-600 hover:text-primary-700">
                        ← Giriş sayfasına dön
                    </Link>
                </p>
            </div>
        </div>
    );
};
