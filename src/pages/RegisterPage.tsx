import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../api/auth.service';
import { getApiError } from '../utils/storage';

type Step = 'form' | 'otp';

interface FormData {
    firstName: string;
    lastName: string;
    phoneNumber: string;
}

export const RegisterPage: React.FC = () => {
    const { completeAuth } = useAuth();
    const navigate = useNavigate();

    const [step, setStep] = useState<Step>('form');
    const [form, setForm] = useState<FormData>({
        firstName: '',
        lastName: '',
        phoneNumber: ''
    });
    const [otp, setOtp] = useState('');
    const [kvkkAccepted, setKvkkAccepted] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [otpExpiry, setOtpExpiry] = useState(0);

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        if (name === 'phoneNumber') {
            setForm(f => ({ ...f, phoneNumber: value.replace(/\D/g, '').slice(0, 11) }));
        } else {
            setForm(f => ({ ...f, [name]: value }));
        }
    };

    const handleSendOtp = async (e: React.SyntheticEvent) => {
        e.preventDefault();
        setError('');

        if (!form.firstName.trim()) { setError('Ad alanı zorunludur.'); return; }
        if (!form.lastName.trim()) { setError('Soyad alanı zorunludur.'); return; }

        const phoneRegex = /^05\d{9}$/;
        if (!phoneRegex.test(form.phoneNumber)) {
            setError('Telefon numarası 05 ile başlamalı ve 11 haneli olmalıdır. (Örn: 05321234567)');
            return;
        }
        if (!kvkkAccepted) {
            setError('Devam etmek için KVKK Aydınlatma Metnini onaylamalısınız.');
            return;
        }

        setLoading(true);
        try {
            const res = await authService.sendRegisterOtp({
                firstName: form.firstName.trim(),
                lastName: form.lastName.trim(),
                phoneNumber: form.phoneNumber
            });
            setOtpExpiry(res.expiresInSeconds);
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
            const response = await authService.verifyRegisterOtp({
                firstName: form.firstName.trim(),
                lastName: form.lastName.trim(),
                phoneNumber: form.phoneNumber,
                otpCode: otp
            });
            completeAuth(response);
            navigate('/');
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
            const res = await authService.sendRegisterOtp({
                firstName: form.firstName.trim(),
                lastName: form.lastName.trim(),
                phoneNumber: form.phoneNumber
            });
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
                                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        {step === 'form' ? 'Hesap Oluşturun' : 'Doğrulama Kodu'}
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        {step === 'form'
                            ? 'Birkaç adımda ücretsiz hesabınızı açın'
                            : `${form.phoneNumber} numarasına gönderilen kodu girin`}
                    </p>
                </div>

                <div className="bg-white rounded-2xl shadow-xl p-8">
                    {error && (
                        <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-5 text-sm">
                            <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            <span>{error}</span>
                        </div>
                    )}

                    {step === 'form' ? (
                        <form onSubmit={handleSendOtp} className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Ad</label>
                                    <input type="text" name="firstName" value={form.firstName} onChange={handleFormChange}
                                        placeholder="Ahmet" required
                                        className="w-full px-3.5 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Soyad</label>
                                    <input type="text" name="lastName" value={form.lastName} onChange={handleFormChange}
                                        placeholder="Yılmaz" required
                                        className="w-full px-3.5 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Telefon Numarası</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                        <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                        </svg>
                                    </div>
                                    <input type="tel" name="phoneNumber" value={form.phoneNumber} onChange={handleFormChange}
                                        placeholder="05XXXXXXXXX" maxLength={11} required
                                        className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all" />
                                </div>
                            </div>

                            <div className="flex items-start gap-3 pt-1">
                                <input type="checkbox" id="kvkk" checked={kvkkAccepted}
                                    onChange={e => setKvkkAccepted(e.target.checked)}
                                    className="mt-0.5 h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 cursor-pointer flex-shrink-0" />
                                <label htmlFor="kvkk" className="text-sm text-gray-600 cursor-pointer leading-relaxed">
                                    <Link to="/kvkk" target="_blank" className="text-primary-600 font-medium hover:underline">
                                        KVKK Aydınlatma Metni
                                    </Link>
                                    'ni okudum ve kişisel verilerimin işlenmesini kabul ediyorum.
                                </label>
                            </div>

                            <button type="submit" disabled={loading}
                                className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-md mt-2">
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
                        <form onSubmit={handleVerifyOtp} className="space-y-5">
                            <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-700">
                                {form.phoneNumber} numarasına {otpExpiry} saniyelik doğrulama kodu gönderildi.
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
                                        Hesap Oluşturuluyor…
                                    </>
                                ) : 'Hesabı Onayla'}
                            </button>

                            <div className="flex items-center justify-between text-sm">
                                <button type="button" onClick={() => { setStep('form'); setOtp(''); setError(''); }}
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

                <p className="text-center text-sm text-gray-600 mt-6">
                    Zaten hesabınız var mı?{' '}
                    <Link to="/login" className="font-semibold text-primary-600 hover:text-primary-700">
                        Giriş Yapın
                    </Link>
                </p>
            </div>
        </div>
    );
};
