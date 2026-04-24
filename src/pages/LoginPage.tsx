import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Link, useNavigate } from 'react-router-dom';

export const LoginPage: React.FC = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [phoneNumber, setPhoneNumber] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const phoneRegex = /^05\d{9}$/;
        if (!phoneRegex.test(phoneNumber)) {
            setError('Geçerli bir telefon numarası giriniz. (Örn: 05321234567)');
            return;
        }

        setLoading(true);

        try {
            const role = await login({ identifier: phoneNumber, password });
            const roles = Array.isArray(role) ? role : [role];
            if (roles.includes('Admin')) navigate('/admin');
            else if (roles.includes('SalonOwner')) navigate('/salon-panel');
            else if (roles.includes('Employee')) navigate('/employee-panel/appointments');
            else navigate('/');
        } catch (err: any) {
            if (err.response && err.response.data && err.response.data.message) {
                setError(err.response.data.message);
            } else {
                setError('Giriş yapılırken bir hata oluştu. Lütfen bilgilerinizi kontrol edin.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h2 className="text-2xl font-bold text-center mb-6">Giriş Yap</h2>
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">
                    {error}
                </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                    label="Telefon Numarası"
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                    placeholder="05XXXXXXXXX"
                    maxLength={11}
                    required
                />
                <Input
                    label="Şifre"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />

                <div className="flex items-center justify-between">
                    <div className="text-sm">
                        <a href="#" className="font-medium text-primary-600 hover:text-primary-500">
                            Şifremi unuttum?
                        </a>
                    </div>
                </div>

                <Button type="submit" className="w-full" isLoading={loading}>
                    Giriş Yap
                </Button>
            </form>

            <div className="mt-6 text-center text-sm">
                <span className="text-gray-600">Hesabınız yok mu?</span>{' '}
                <Link to="/register" className="font-medium text-primary-600 hover:text-primary-500">
                    Kayıt Olun
                </Link>
            </div>
        </div>
    );
};
