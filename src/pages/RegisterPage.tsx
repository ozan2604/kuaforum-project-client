import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Link, useNavigate } from 'react-router-dom';

export const RegisterPage: React.FC = () => {
    const { register } = useAuth();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '', // Added phoneNumber initialization
        userName: '',
        password: '',
        confirmPassword: ''
    });

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('Şifreler eşleşmiyor.');
            return;
        }

        // Phone number validation
        const phoneRegex = /^05\d{9}$/;
        if (!phoneRegex.test(formData.phoneNumber)) {
            setError('Telefon numarası 05 ile başlamalı ve toplam 11 haneli olmalıdır. (Örn: 05321234567)');
            return;
        }

        setLoading(true);

        try {
            await register({
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                phoneNumber: formData.phoneNumber, // Added phoneNumber
                userName: formData.userName,
                password: formData.password
            });
            navigate('/');
        } catch (err: any) {
            if (err.response && err.response.data && err.response.data.message) {
                setError(err.response.data.message); // Backend error message
            } else {
                setError('Kayıt olurken bir hata oluştu.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h2 className="text-2xl font-bold text-center mb-6">Yeni Hesap Oluştur</h2>
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">
                    {error}
                </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <Input
                        label="Ad"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        required
                    />
                    <Input
                        label="Soyad"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        required
                    />
                </div>
                <Input
                    label="Kullanıcı Adı"
                    name="userName"
                    value={formData.userName}
                    onChange={handleChange}
                    required
                />
                <Input
                    label="E-posta Adresi"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                />
                <Input
                    label="Telefon Numarası"
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber || ''}
                    onChange={(e) => {
                        // Only allow numbers
                        const val = e.target.value.replace(/\D/g, '');
                        setFormData({ ...formData, phoneNumber: val });
                    }}
                    required
                    placeholder="05XXXXXXXXX"
                    maxLength={11}
                />
                <p className="text-xs text-gray-500 mt-1">Başında 0 olacak şekilde giriniz (Örn: 0532...)</p>
                <Input
                    label="Şifre"
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                />
                <Input
                    label="Şifre Tekrar"
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                />

                <Button type="submit" className="w-full" isLoading={loading}>
                    Kayıt Ol
                </Button>
            </form>

            <div className="mt-6 text-center text-sm">
                <span className="text-gray-600">Zaten hesabınız var mı?</span>{' '}
                <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
                    Giriş Yapın
                </Link>
            </div>
        </div>
    );
};
