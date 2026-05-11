import React, { useEffect, useState } from 'react';
import { employeeService } from '../../api/employee.service';
import { type EmployeeProfile } from '../../types/employee';
import { Button } from '../../components/Button';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { toast } from 'react-hot-toast';
import { getApiError } from '../../utils/storage';
import { User, Star, Scissors, Store } from 'lucide-react';

export const EmployeeProfilePage: React.FC = () => {
    const [profile, setProfile] = useState<EmployeeProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({ firstName: '', lastName: '', title: '' });

    useEffect(() => {
        const load = async () => {
            try {
                const data = await employeeService.getProfile();
                setProfile(data);
                setForm({ firstName: data.firstName, lastName: data.lastName, title: data.title });
            } catch (err) {
                toast.error(getApiError(err, 'Profil yüklenemedi'));
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            await employeeService.updateProfile(form);
            setProfile(prev => prev ? { ...prev, ...form } : prev);
            toast.success('Profil güncellendi');
        } catch (err) {
            toast.error(getApiError(err, 'Profil güncellenemedi'));
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <LoadingSpinner />;
    if (!profile) return null;

    const ratingStars = Math.round(profile.averageRating);

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                    <User className="h-7 w-7 text-indigo-600" />
                    Profilim
                </h1>
                <p className="text-sm text-gray-500 mt-1">Kişisel bilgilerinizi güncelleyebilirsiniz.</p>
            </div>

            {/* Rating card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-5">
                <div className="h-16 w-16 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-2xl shrink-0">
                    {profile.firstName.charAt(0)}
                </div>
                <div className="flex-1">
                    <p className="text-lg font-bold text-gray-900">{profile.firstName} {profile.lastName}</p>
                    <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-0.5">
                        <Scissors className="h-3.5 w-3.5" /> {profile.title || 'Başlık belirtilmemiş'}
                    </p>
                    <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-0.5">
                        <Store className="h-3.5 w-3.5" /> {profile.shopName}
                    </p>
                </div>
                <div className="text-right shrink-0">
                    <div className="flex items-center gap-1 justify-end">
                        {[1, 2, 3, 4, 5].map(i => (
                            <Star
                                key={i}
                                className={`h-4 w-4 ${i <= ratingStars ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'}`}
                            />
                        ))}
                    </div>
                    <p className="text-sm font-bold text-gray-900 mt-0.5">
                        {profile.averageRating ? profile.averageRating.toFixed(1) : '—'}
                    </p>
                    <p className="text-xs text-gray-400">{profile.reviewCount} değerlendirme</p>
                </div>
            </div>

            {/* Edit form */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
                <h2 className="font-semibold text-gray-800">Bilgileri Düzenle</h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Ad</label>
                        <input
                            type="text"
                            value={form.firstName}
                            onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Soyad</label>
                        <input
                            type="text"
                            value={form.lastName}
                            onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ünvan / Uzmanlık</label>
                    <input
                        type="text"
                        value={form.title}
                        onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                        placeholder="örn: Saç Tasarımcısı, Bayan Kuaförü..."
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    />
                </div>

                <div className="flex justify-end pt-1">
                    <Button onClick={handleSave} isLoading={saving}>
                        Kaydet
                    </Button>
                </div>
            </div>

            {/* Account info (read-only) */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
                <h2 className="font-semibold text-gray-800">Hesap Bilgileri</h2>
                <div className="flex items-center justify-between py-2 border-b border-gray-50 text-sm">
                    <span className="text-gray-500">E-posta</span>
                    <span className="font-medium text-gray-900">{profile.email}</span>
                </div>
                <div className="flex items-center justify-between py-2 text-sm">
                    <span className="text-gray-500">Çalıştığı Salon</span>
                    <span className="font-medium text-gray-900">{profile.shopName}</span>
                </div>
            </div>
        </div>
    );
};
