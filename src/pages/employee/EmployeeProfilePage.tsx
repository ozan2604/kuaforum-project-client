import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { User, Mail, Briefcase, Star, Store } from 'lucide-react';
import { employeeService } from '../../api/employee.service';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { type EmployeeProfile, type UpdateEmployeeProfileDto } from '../../types/employee';

export const EmployeeProfilePage: React.FC = () => {
    const [profile, setProfile] = useState<EmployeeProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<UpdateEmployeeProfileDto>();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await employeeService.getProfile();
            setProfile(data);
            reset({
                firstName: data.firstName,
                lastName: data.lastName,
                title: data.title
            });
        } catch (error) {
            console.error('Failed to load profile:', error);
            toast.error('Profil bilgileri yüklenemedi.');
        } finally {
            setLoading(false);
        }
    };

    const onSubmit = async (data: UpdateEmployeeProfileDto) => {
        try {
            await employeeService.updateProfile(data);
            toast.success('Profil güncellendi.');
            loadData(); // Refresh data
        } catch (error) {
            console.error('Failed to update profile:', error);
            toast.error('Profil güncellenemedi.');
        }
    };

    if (loading) {
        return (
            <div className="min-h-[400px] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (!profile) {
        return <div className="text-center py-12 text-gray-500">Profil bulunamadı.</div>;
    }

    return (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-8 flex items-center">
                <User className="mr-3 h-8 w-8 text-primary-600" />
                Profilim
            </h1>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Header / Summary */}
                <div className="px-6 py-8 bg-primary-50 border-b border-gray-100 flex flex-col sm:flex-row items-center sm:items-start gap-6">
                    <div className="h-24 w-24 rounded-full bg-white text-primary-600 flex items-center justify-center text-3xl font-bold shadow-sm border-4 border-white">
                        {profile.firstName.charAt(0)}
                    </div>
                    <div className="text-center sm:text-left flex-1">
                        <h2 className="text-xl font-bold text-gray-900">{profile.firstName} {profile.lastName}</h2>
                        <p className="text-gray-600 flex items-center justify-center sm:justify-start mt-1">
                            <Briefcase className="w-4 h-4 mr-1" />
                            {profile.title}
                        </p>
                        <div className="flex items-center justify-center sm:justify-start gap-4 mt-3">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                <Star className="w-3 h-3 mr-1 fill-current" />
                                {profile.averageRating.toFixed(1)} ({profile.reviewCount} Değerlendirme)
                            </span>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                <Store className="w-3 h-3 mr-1" />
                                {profile.shopName}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Edit Form */}
                <div className="p-6 md:p-8">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Input
                                label="Ad"
                                {...register('firstName', { required: 'Ad zorunludur' })}
                                error={errors.firstName?.message}
                            />
                            <Input
                                label="Soyad"
                                {...register('lastName', { required: 'Soyad zorunludur' })}
                                error={errors.lastName?.message}
                            />
                        </div>

                        <Input
                            label="Unvan"
                            {...register('title')}
                            placeholder="Örn: Kıdemli Kuaför"
                            error={errors.title?.message}
                        />

                        <div className="pt-4 border-t border-gray-200">
                            <h3 className="text-sm font-medium text-gray-900 mb-4">İletişim Bilgileri (Değiştirilemez)</h3>
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <div className="flex items-center text-gray-600">
                                    <Mail className="w-5 h-5 mr-3 text-gray-400" />
                                    <span>{profile.email}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end pt-4">
                            <Button
                                type="submit"
                                isLoading={isSubmitting}
                                className="w-full sm:w-auto"
                            >
                                Değişiklikleri Kaydet
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};
