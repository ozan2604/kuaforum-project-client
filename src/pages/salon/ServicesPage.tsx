import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { serviceManagementService } from '../../api/service.service';
import type { ServiceCategoryDto, CreateServiceDto, CreateCategoryDto } from '../../types/service';
import { toast } from 'react-hot-toast';
import { Plus, Scissors, Tag, Clock, DollarSign, Edit, Trash2 } from 'lucide-react';
import type { UpdateServiceCategoryDto, UpdateShopServiceDto } from '../../types/service';

export const ServicesPage: React.FC = () => {
    const [categories, setCategories] = useState<ServiceCategoryDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');

    // Update/Delete States
    const [isEditCategoryModalOpen, setIsEditCategoryModalOpen] = useState(false);
    const [isDeleteCategoryModalOpen, setIsDeleteCategoryModalOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<ServiceCategoryDto | null>(null);

    const [isEditServiceModalOpen, setIsEditServiceModalOpen] = useState(false);
    const [isDeleteServiceModalOpen, setIsDeleteServiceModalOpen] = useState(false);
    const [selectedService, setSelectedService] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<'active' | 'deleted'>('active');

    const loadServices = async () => {
        setLoading(true);
        try {
            const data = await serviceManagementService.getShopServices();
            setCategories(data);
        } catch (error) {
            console.error('Hizmetler yüklenemedi:', error);
            toast.error('Hizmetler yüklenemedi');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadServices();
    }, []);

    const CategoryForm = () => {
        const { register, handleSubmit, reset } = useForm<CreateCategoryDto>();
        const [isSubmitting, setIsSubmitting] = useState(false);

        const onSubmit = async (data: CreateCategoryDto) => {
            setIsSubmitting(true);
            try {
                await serviceManagementService.createCategory(data);
                toast.success('Kategori oluşturuldu');
                setIsCategoryModalOpen(false);
                reset();
                loadServices();
            } catch (error) {
                toast.error('Kategori oluşturulamadı');
            } finally {
                setIsSubmitting(false);
            }
        };

        return (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input label="Kategori Adı" {...register('name', { required: true })} placeholder="Örn: Saç Kesimi" />
                <Input label="Açıklama" {...register('description')} placeholder="İsteğe bağlı açıklama" />
                <div className="flex justify-end space-x-2 mt-4">
                    <Button variant="outline" onClick={() => setIsCategoryModalOpen(false)} type="button">İptal</Button>
                    <Button isLoading={isSubmitting} type="submit">Kategori Oluştur</Button>
                </div>
            </form>
        );
    };

    const UpdateCategoryForm = () => {
        const { register, handleSubmit } = useForm<UpdateServiceCategoryDto>({
            defaultValues: {
                name: selectedCategory?.name || '',
                description: selectedCategory?.description || '',
                isActive: selectedCategory?.isActive !== undefined ? selectedCategory.isActive : true
            }
        });
        const [isSubmitting, setIsSubmitting] = useState(false);

        const onSubmit = async (data: UpdateServiceCategoryDto) => {
            if (!selectedCategory) return;
            setIsSubmitting(true);
            try {
                await serviceManagementService.updateCategory(selectedCategory.id, data);
                toast.success('Kategori güncellendi');
                setIsEditCategoryModalOpen(false);
                loadServices();
            } catch (error) {
                toast.error('Kategori güncellenemedi');
            } finally {
                setIsSubmitting(false);
            }
        };

        return (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input label="Kategori Adı" {...register('name', { required: true })} />
                <Input label="Açıklama" {...register('description')} />

                <div className="flex items-center space-x-2 mt-2">
                    <input
                        type="checkbox"
                        {...register('isActive')}
                        id="isActiveCategoryCheckbox"
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label htmlFor="isActiveCategoryCheckbox" className="text-sm font-medium text-gray-700">Aktif Kategori</label>
                </div>

                <div className="flex justify-end space-x-2 mt-4">
                    <Button variant="outline" onClick={() => setIsEditCategoryModalOpen(false)} type="button">İptal</Button>
                    <Button isLoading={isSubmitting} type="submit">Kategori Güncelle</Button>
                </div>
            </form>
        );
    };

    const handleDeleteCategory = async () => {
        if (!selectedCategory) return;
        try {
            await serviceManagementService.deleteCategory(selectedCategory.id);
            toast.success('Kategori başarıyla silindi');
            setIsDeleteCategoryModalOpen(false);
            loadServices();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Kategori silinemedi (Önce içindeki hizmetleri silmelisiniz)');
        }
    };

    const ServiceForm = () => {
        const { register, handleSubmit, reset } = useForm<CreateServiceDto>();
        const [isSubmitting, setIsSubmitting] = useState(false);

        const onSubmit = async (data: CreateServiceDto) => {
            setIsSubmitting(true);
            try {
                await serviceManagementService.createService({
                    ...data,
                    categoryId: selectedCategoryId
                });
                toast.success('Hizmet oluşturuldu');
                setIsServiceModalOpen(false);
                reset();
                loadServices();
            } catch (error) {
                toast.error('Hizmet oluşturulamadı');
            } finally {
                setIsSubmitting(false);
            }
        };

        return (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input label="Hizmet Adı" {...register('name', { required: true })} placeholder="Örn: Erkek Kesimi" />
                <Input
                    label="Fiyat"
                    type="number"
                    {...register('price', { required: true, min: 0 })}
                    icon={<DollarSign className="h-4 w-4" />}
                />
                <Input
                    label="Süre (dakika)"
                    type="number"
                    {...register('duration', { required: true, min: 5 })}
                    icon={<Clock className="h-4 w-4" />}
                />

                <div className="flex justify-end space-x-2 mt-4">
                    <Button variant="outline" onClick={() => setIsServiceModalOpen(false)} type="button">İptal</Button>
                    <Button isLoading={isSubmitting} type="submit">Hizmet Oluştur</Button>
                </div>
            </form>
        );
    };

    const UpdateServiceForm = () => {
        const { register, handleSubmit } = useForm<UpdateShopServiceDto>({
            defaultValues: {
                name: selectedService?.name || '',
                price: selectedService?.price || 0,
                duration: selectedService?.duration || 0,
                isActive: selectedService?.isActive !== undefined ? selectedService.isActive : true
            }
        });
        const [isSubmitting, setIsSubmitting] = useState(false);

        const onSubmit = async (data: UpdateShopServiceDto) => {
            if (!selectedService) return;
            setIsSubmitting(true);
            try {
                await serviceManagementService.updateService(selectedService.id, data);
                toast.success('Hizmet güncellendi');
                setIsEditServiceModalOpen(false);
                loadServices();
            } catch (error) {
                toast.error('Hizmet güncellenemedi');
            } finally {
                setIsSubmitting(false);
            }
        };

        return (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input label="Hizmet Adı" {...register('name', { required: true })} />
                <Input
                    label="Fiyat"
                    type="number"
                    {...register('price', { required: true, min: 0 })}
                    icon={<DollarSign className="h-4 w-4" />}
                />
                <Input
                    label="Süre (dakika)"
                    type="number"
                    {...register('duration', { required: true, min: 5 })}
                    icon={<Clock className="h-4 w-4" />}
                />

                <div className="flex items-center space-x-2 mt-2">
                    <input
                        type="checkbox"
                        {...register('isActive')}
                        id="isActiveServiceCheckbox"
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label htmlFor="isActiveServiceCheckbox" className="text-sm font-medium text-gray-700">Aktif Hizmet (Pasife almak için tiki kaldırın)</label>
                </div>

                <div className="flex justify-end space-x-2 mt-4">
                    <Button variant="outline" onClick={() => setIsEditServiceModalOpen(false)} type="button">İptal</Button>
                    <Button isLoading={isSubmitting} type="submit">Hizmet Güncelle</Button>
                </div>
            </form>
        );
    };

    const handleDeleteService = async () => {
        if (!selectedService) return;
        try {
            await serviceManagementService.deleteService(selectedService.id);
            toast.success('Hizmet başarıyla silindi');
            setIsDeleteServiceModalOpen(false);
            loadServices();
        } catch (error) {
            toast.error('Hizmet silinemedi');
        }
    };

    if (loading) return <div>Yükleniyor...</div>;

    const getSafeArray = (arr: any) => {
        if (Array.isArray(arr)) return arr;
        if (arr && Array.isArray(arr.$values)) return arr.$values;
        if (arr && Array.isArray(arr.data)) return arr.data;
        return [];
    };

    const categoryList = getSafeArray(categories);

    const activeCategories = categoryList.filter((c: any) => c && !c.isDeleted).map((c: any) => ({
        ...c,
        services: getSafeArray(c.services).filter((s: any) => s && !s.isDeleted)
    }));

    const deletedCategories = categoryList.filter((c: any) => c && c.isDeleted).map((c: any) => ({
        ...c,
        services: getSafeArray(c.services)
    }));

    // Also extract deleted services from active categories
    const deletedServicesInActiveCategories = categoryList.filter((c: any) => c && !c.isDeleted).flatMap((c: any) => 
        getSafeArray(c.services).filter((s: any) => s && s.isDeleted).map((s: any) => ({ ...s, categoryName: c.name }))
    );

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl font-bold text-gray-800 flex items-center">
                    <Scissors className="mr-3 h-8 w-8 text-primary-600" />
                    Hizmetler ve Kategoriler
                </h1>
                <Button onClick={() => setIsCategoryModalOpen(true)} className="flex items-center shadow-md">
                    <Plus className="h-4 w-4 mr-2" />
                    Yeni Kategori
                </Button>
            </div>

            <div className="flex space-x-4 border-b border-gray-200">
                <button
                    onClick={() => setActiveTab('active')}
                    className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === 'active' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    Mevcut Hizmetler ({activeCategories.length} Kategori)
                </button>
                <button
                    onClick={() => setActiveTab('deleted')}
                    className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === 'deleted' ? 'border-red-600 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    Silinenler ({deletedCategories.length + deletedServicesInActiveCategories.length})
                </button>
            </div>

            <div className="grid gap-6">
                {activeTab === 'active' ? (
                    activeCategories.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                            <p className="text-gray-500 mb-4">Henüz hizmet bulunmuyor. Bir kategori oluşturarak başlayın.</p>
                            <Button onClick={() => setIsCategoryModalOpen(true)}>Kategori Oluştur</Button>
                        </div>
                    ) : (
                        activeCategories.map((category) => (
                            <div key={category.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div>
                                            <h3 className="font-bold text-gray-900">{category.name}</h3>
                                            {category.description && <p className="text-sm text-gray-500">{category.description}</p>}
                                        </div>
                                        {!category.isActive && <span className="px-2 py-0.5 bg-gray-200 text-gray-700 text-xs rounded-full font-medium border border-gray-300">Pasif</span>}
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <button
                                            onClick={() => { setSelectedCategory(category); setIsEditCategoryModalOpen(true); }}
                                            className="p-1.5 text-gray-400 hover:text-primary-600 transition-colors"
                                            title="Kategoriyi Düzenle"
                                        >
                                            <Edit className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => { setSelectedCategory(category); setIsDeleteCategoryModalOpen(true); }}
                                            className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                                            title="Kategoriyi Sil"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="ml-2"
                                            onClick={() => {
                                                setSelectedCategoryId(category.id);
                                                setIsServiceModalOpen(true);
                                            }}
                                        >
                                            <Plus className="h-3 w-3 mr-1" />
                                            Hizmet Ekle
                                        </Button>
                                    </div>
                                </div>
                                <div className="divide-y divide-gray-100">
                                    {category.services.length === 0 ? (
                                        <div className="p-4 text-center text-sm text-gray-400">Bu kategoride hizmet bulunmuyor</div>
                                    ) : (
                                        category.services.map((service) => (
                                            <div key={service.id} className="p-4 flex justify-between items-center hover:bg-gray-50 transition-colors">
                                                <div className="flex items-center">
                                                    <Tag className="h-4 w-4 text-primary-400 mr-3" />
                                                    <div>
                                                        <p className={`font-medium ${service.isActive ? 'text-gray-900' : 'text-gray-400 line-through'}`}>{service.name}</p>
                                                        <div className="flex items-center text-xs text-gray-500 mt-1 space-x-3">
                                                            <span className="flex items-center"><Clock className="h-3 w-3 mr-1" /> {service.duration} dk</span>
                                                            <span className={`flex items-center font-semibold ${service.isActive ? 'text-green-600' : 'text-gray-400'}`}><DollarSign className="h-3 w-3" /> {service.price}</span>
                                                            {!service.isActive && <span className="text-gray-500 font-semibold">(Pasif)</span>}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex space-x-1">
                                                    <button
                                                        onClick={() => { setSelectedService(service); setIsEditServiceModalOpen(true); }}
                                                        className="p-1.5 text-gray-400 hover:text-primary-600 transition-colors"
                                                        title="Hizmeti Düzenle"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => { setSelectedService(service); setIsDeleteServiceModalOpen(true); }}
                                                        className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                                                        title="Hizmeti Sil"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        ))
                    )
                ) : (
                    <div className="space-y-6">
                        {deletedCategories.length > 0 && (
                            <div className="bg-white rounded-xl shadow-sm border border-red-100 overflow-hidden">
                                <div className="px-6 py-4 bg-red-50 border-b border-red-100 flex justify-between items-center">
                                    <h3 className="font-bold text-red-900">Silinen Kategoriler</h3>
                                </div>
                                <div className="divide-y divide-red-50">
                                    {deletedCategories.map((category) => (
                                        <div key={category.id} className="p-4 bg-red-50/30">
                                            <div className="flex justify-between items-center mb-2">
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-bold text-gray-800 line-through">{category.name}</h4>
                                                    <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full font-medium">Kategori Silindi</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {deletedServicesInActiveCategories.length > 0 && (
                            <div className="bg-white rounded-xl shadow-sm border border-orange-100 overflow-hidden">
                                <div className="px-6 py-4 bg-orange-50 border-b border-orange-100 flex justify-between items-center">
                                    <h3 className="font-bold text-orange-900">Silinen Hizmetler (Aktif Kategoriler İçinde)</h3>
                                </div>
                                <div className="divide-y divide-orange-50">
                                    {deletedServicesInActiveCategories.map((service) => (
                                        <div key={service.id} className="p-4 flex justify-between items-center hover:bg-orange-50/50 transition-colors">
                                            <div className="flex items-center">
                                                <Tag className="h-4 w-4 text-orange-400 mr-3" />
                                                <div>
                                                    <p className="font-medium text-gray-500 line-through">{service.name}</p>
                                                    <div className="flex items-center text-xs text-gray-500 mt-1 space-x-3">
                                                        <span>Kategori: {service.categoryName}</span>
                                                        <span className="flex items-center"><Clock className="h-3 w-3 mr-1" /> {service.duration} dk</span>
                                                        <span className="flex items-center"><DollarSign className="h-3 w-3" /> {service.price}</span>
                                                        <span className="text-red-500 font-semibold">(Silindi)</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {deletedCategories.length === 0 && deletedServicesInActiveCategories.length === 0 && (
                            <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-200">
                                <p className="text-gray-500">Silinmiş kategori veya hizmet bulunmuyor.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Modals */}
            {isCategoryModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">Kategori Ekle</h2>
                        <CategoryForm />
                    </div>
                </div>
            )}

            {isEditCategoryModalOpen && selectedCategory && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">Kategori Düzenle</h2>
                        <UpdateCategoryForm />
                    </div>
                </div>
            )}

            {isDeleteCategoryModalOpen && selectedCategory && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-sm">
                        <h2 className="text-xl font-bold mb-4 text-gray-900">Kategoriyi Sil</h2>
                        <p className="text-gray-600 mb-6">
                            <span className="font-semibold">{selectedCategory.name}</span> isimli kategoriyi silmek istediğinize emin misiniz? (Önce içindeki hizmetleri silmelisiniz)
                        </p>
                        <div className="flex justify-end space-x-2">
                            <Button variant="outline" onClick={() => setIsDeleteCategoryModalOpen(false)}>İptal</Button>
                            <Button onClick={handleDeleteCategory} className="bg-red-600 hover:bg-red-700 text-white border-transparent">
                                Evet, Sil
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {isServiceModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">Hizmet Ekle</h2>
                        <ServiceForm />
                    </div>
                </div>
            )}

            {isEditServiceModalOpen && selectedService && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">Hizmet Düzenle</h2>
                        <UpdateServiceForm />
                    </div>
                </div>
            )}

            {isDeleteServiceModalOpen && selectedService && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-sm">
                        <h2 className="text-xl font-bold mb-4 text-gray-900">Hizmeti Sil</h2>
                        <p className="text-gray-600 mb-6">
                            <span className="font-semibold">{selectedService.name}</span> isimli hizmeti silmek istediğinize emin misiniz?
                        </p>
                        <div className="flex justify-end space-x-2">
                            <Button variant="outline" onClick={() => setIsDeleteServiceModalOpen(false)}>İptal</Button>
                            <Button onClick={handleDeleteService} className="bg-red-600 hover:bg-red-700 text-white border-transparent">
                                Evet, Sil
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
