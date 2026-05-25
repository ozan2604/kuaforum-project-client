import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { serviceManagementService } from '../../api/service.service';
import { employeeService } from '../../api/employee.service';
import type { Service, ServiceCategoryDto, CreateServiceDto, CreateCategoryDto } from '../../types/service';
import type { Employee } from '../../types/employee';
import { toast } from 'react-hot-toast';
import { Plus, Scissors, Tag, Clock, DollarSign, Edit, Trash2, ChevronDown, ChevronUp, Users } from 'lucide-react';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { EmptyState } from '../../components/EmptyState';
import type { UpdateServiceCategoryDto, UpdateShopServiceDto } from '../../types/service';

export const ServicesPage: React.FC<{ embedded?: boolean }> = ({ embedded = false }) => {
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

    // Assign employees to service
    const [isEmployeesModalOpen, setIsEmployeesModalOpen] = useState(false);
    const [employeesLoading, setEmployeesLoading] = useState(false);
    const [availableEmployees, setAvailableEmployees] = useState<Employee[]>([]);
    const [assignedEmployeeIds, setAssignedEmployeeIds] = useState<string[]>([]);
    const [originalEmployeeServiceMap, setOriginalEmployeeServiceMap] = useState<Record<string, string[]>>({});
    const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({});

    const toggleCategory = (id: string) =>
        setOpenCategories(prev => ({ ...prev, [id]: !prev[id] }));

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
        const { register, handleSubmit, reset, watch } = useForm<CreateCategoryDto>();
        const [isSubmitting, setIsSubmitting] = useState(false);
        const descriptionValue = watch('description') || '';
        const nameValue = watch('name') || '';

        const onSubmit = async (data: CreateCategoryDto) => {
            setIsSubmitting(true);
            try {
                await serviceManagementService.createCategory(data);
                toast.success('Kategori oluşturuldu');
                setIsCategoryModalOpen(false);
                reset();
                loadServices();
            } catch (error: any) {
                const errorMessage = error.response?.data?.message || error.response?.data?.Errors?.[0] || 'Kategori oluşturulamadı';
                toast.error(errorMessage);
            } finally {
                setIsSubmitting(false);
            }
        };

        return (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-1">
                    <Input label="Kategori Adı" {...register('name', { required: true, maxLength: 50 })} placeholder="Örn: Saç Kesimi" maxLength={50} />
                    <div className="text-right text-xs text-gray-400">
                        {nameValue.length}/50
                    </div>
                </div>
                <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">Açıklama (İsteğe bağlı)</label>
                    <textarea
                        {...register('description', { maxLength: 250 })}
                        placeholder="Kategori hakkında kısa bir açıklama..."
                        className="w-full rounded-xl border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm resize-none p-3 border outline-none"
                        rows={3}
                        maxLength={250}
                    />
                    <div className="text-right text-xs text-gray-400">
                        {descriptionValue.length}/250
                    </div>
                </div>
                <div className="flex justify-end space-x-2 mt-4">
                    <Button variant="outline" onClick={() => setIsCategoryModalOpen(false)} type="button">İptal</Button>
                    <Button isLoading={isSubmitting} type="submit">Kategori Oluştur</Button>
                </div>
            </form>
        );
    };

    const UpdateCategoryForm = () => {
        const { register, handleSubmit, watch } = useForm<UpdateServiceCategoryDto>({
            defaultValues: {
                name: selectedCategory?.name || '',
                description: selectedCategory?.description || '',
                isActive: selectedCategory?.isActive !== undefined ? selectedCategory.isActive : true
            }
        });
        const [isSubmitting, setIsSubmitting] = useState(false);
        const descriptionValue = watch('description') || '';
        const nameValue = watch('name') || '';

        const onSubmit = async (data: UpdateServiceCategoryDto) => {
            if (!selectedCategory) return;
            setIsSubmitting(true);
            try {
                await serviceManagementService.updateCategory(selectedCategory.id, data);
                toast.success('Kategori güncellendi');
                setIsEditCategoryModalOpen(false);
                loadServices();
            } catch (error: any) {
                const errorMessage = error.response?.data?.message || error.response?.data?.Errors?.[0] || 'Kategori güncellenemedi';
                toast.error(errorMessage);
            } finally {
                setIsSubmitting(false);
            }
        };

        return (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-1">
                    <Input label="Kategori Adı" {...register('name', { required: true, maxLength: 50 })} maxLength={50} />
                    <div className="text-right text-xs text-gray-400">
                        {nameValue.length}/50
                    </div>
                </div>
                <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">Açıklama (İsteğe bağlı)</label>
                    <textarea
                        {...register('description', { maxLength: 250 })}
                        className="w-full rounded-xl border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm resize-none p-3 border outline-none"
                        rows={3}
                        maxLength={250}
                    />
                    <div className="text-right text-xs text-gray-400">
                        {descriptionValue.length}/250
                    </div>
                </div>

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
        const { register, handleSubmit, reset, watch } = useForm<CreateServiceDto>();
        const [isSubmitting, setIsSubmitting] = useState(false);
        const descriptionValue = watch('description') || '';
        const nameValue = watch('name') || '';

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
            } catch (error: any) {
                const errorMessage = error.response?.data?.message || error.response?.data?.Errors?.[0] || 'Hizmet oluşturulamadı';
                toast.error(errorMessage);
            } finally {
                setIsSubmitting(false);
            }
        };

        return (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-1">
                    <Input label="Hizmet Adı" {...register('name', { required: true, maxLength: 100 })} placeholder="Örn: Erkek Kesimi" maxLength={100} />
                    <div className="text-right text-xs text-gray-400">
                        {nameValue.length}/100
                    </div>
                </div>
                <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">Açıklama (İsteğe bağlı)</label>
                    <textarea
                        {...register('description', { maxLength: 250 })}
                        placeholder="Hizmet hakkında detaylı bilgi..."
                        className="w-full rounded-xl border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm resize-none p-3 border outline-none"
                        rows={3}
                        maxLength={250}
                    />
                    <div className="text-right text-xs text-gray-400">
                        {descriptionValue.length}/250
                    </div>
                </div>
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
        const { register, handleSubmit, watch } = useForm<UpdateShopServiceDto>({
            defaultValues: {
                name: selectedService?.name || '',
                description: selectedService?.description || '',
                price: selectedService?.price || 0,
                duration: selectedService?.duration || 0,
                isActive: selectedService?.isActive !== undefined ? selectedService.isActive : true
            }
        });
        const [isSubmitting, setIsSubmitting] = useState(false);
        const descriptionValue = watch('description') || '';
        const nameValue = watch('name') || '';

        const onSubmit = async (data: UpdateShopServiceDto) => {
            if (!selectedService) return;
            setIsSubmitting(true);
            try {
                await serviceManagementService.updateService(selectedService.id, data);
                toast.success('Hizmet güncellendi');
                setIsEditServiceModalOpen(false);
                loadServices();
            } catch (error: any) {
                const errorMessage = error.response?.data?.message || error.response?.data?.Errors?.[0] || 'Hizmet güncellenemedi';
                toast.error(errorMessage);
            } finally {
                setIsSubmitting(false);
            }
        };

        return (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-1">
                    <Input label="Hizmet Adı" {...register('name', { required: true, maxLength: 100 })} maxLength={100} />
                    <div className="text-right text-xs text-gray-400">
                        {nameValue.length}/100
                    </div>
                </div>
                <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">Açıklama (İsteğe bağlı)</label>
                    <textarea
                        {...register('description', { maxLength: 250 })}
                        className="w-full rounded-xl border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm resize-none p-3 border outline-none"
                        rows={3}
                        maxLength={250}
                    />
                    <div className="text-right text-xs text-gray-400">
                        {descriptionValue.length}/250
                    </div>
                </div>
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

    const getSafeArrayIds = (arr: any): string[] => {
        if (Array.isArray(arr)) return arr.map((s: any) => s.id);
        if (arr && Array.isArray(arr.$values)) return arr.$values.map((s: any) => s.id);
        return [];
    };

    const handleOpenEmployeesModal = async (service: any) => {
        setSelectedService(service);
        setIsEmployeesModalOpen(true);
        setEmployeesLoading(true);
        try {
            const allEmployees = await employeeService.getEmployees();
            const activeEmployees = allEmployees.filter((e: Employee) => !e.isDeleted && e.isActive);

            const serviceLists = await Promise.all(
                activeEmployees.map((e: Employee) =>
                    employeeService.getEmployeeServices(e.id).then(services => ({
                        employeeId: e.id,
                        serviceIds: getSafeArrayIds(services),
                    }))
                )
            );

            const serviceMap: Record<string, string[]> = {};
            serviceLists.forEach(({ employeeId, serviceIds }) => {
                serviceMap[employeeId] = serviceIds;
            });

            setAvailableEmployees(activeEmployees);
            setOriginalEmployeeServiceMap(serviceMap);
            setAssignedEmployeeIds(
                activeEmployees
                    .filter((e: Employee) => serviceMap[e.id]?.includes(service.id))
                    .map((e: Employee) => e.id)
            );
        } catch {
            toast.error('Uzman verileri yüklenemedi');
        } finally {
            setEmployeesLoading(false);
        }
    };

    const handleAssignEmployees = async () => {
        if (!selectedService) return;
        try {
            const changedEmployees = availableEmployees.filter(e => {
                const hadService = originalEmployeeServiceMap[e.id]?.includes(selectedService.id) ?? false;
                const hasService = assignedEmployeeIds.includes(e.id);
                return hadService !== hasService;
            });

            await Promise.all(
                changedEmployees.map(e => {
                    const currentServices = originalEmployeeServiceMap[e.id] ?? [];
                    const hasService = assignedEmployeeIds.includes(e.id);
                    const newServices = hasService
                        ? [...currentServices, selectedService.id]
                        : currentServices.filter(id => id !== selectedService.id);
                    return employeeService.assignServices(e.id, newServices);
                })
            );

            toast.success('Uzman atamaları başarıyla güncellendi');
            setIsEmployeesModalOpen(false);
        } catch {
            toast.error('Uzman ataması başarısız oldu');
        }
    };

    const toggleEmployee = (employeeId: string) => {
        setAssignedEmployeeIds(prev =>
            prev.includes(employeeId)
                ? prev.filter(id => id !== employeeId)
                : [...prev, employeeId]
        );
    };

    if (loading) return <LoadingSpinner />;

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
        <div className={embedded ? 'space-y-4' : 'max-w-5xl mx-auto space-y-6'}>
            {!embedded && (
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center">
                        <Scissors className="mr-3 h-8 w-8 text-primary-600" />
                        Hizmetler ve Kategoriler
                    </h1>
                    <Button type="button" onClick={() => setIsCategoryModalOpen(true)} className="flex items-center shadow-md">
                        <Plus className="h-4 w-4 mr-2" />
                        Yeni Kategori
                    </Button>
                </div>
            )}
            {embedded && (
                <div className="flex justify-end">
                    <Button type="button" onClick={() => setIsCategoryModalOpen(true)} className="flex items-center">
                        <Plus className="h-4 w-4 mr-2" />
                        Yeni Kategori
                    </Button>
                </div>
            )}

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
                        <EmptyState
                            message="Henüz hizmet bulunmuyor"
                            description="Bir kategori oluşturarak başlayın."
                            action={<Button type="button" onClick={() => setIsCategoryModalOpen(true)}>Kategori Oluştur</Button>}
                        />
                    ) : (
                        activeCategories.map((category: ServiceCategoryDto) => {
                            const isOpen = !!openCategories[category.id];
                            return (
                                <div key={category.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-200">
                                    {/* Kategori başlığı – tüm satır tıklanabilir, butonlar propagasyonu durdurur */}
                                    <div
                                        onClick={() => toggleCategory(category.id)}
                                        className="px-5 sm:px-6 py-4 flex justify-between items-center cursor-pointer hover:bg-gray-50 transition-colors select-none relative"
                                    >
                                        <div className="flex items-center gap-3 pr-4 flex-1 min-w-0">
                                            <div className="p-2 bg-primary-50 text-primary-600 rounded-xl shrink-0">
                                                <Tag className="h-4 w-4" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <h3 className="font-bold text-gray-900 break-words line-clamp-2">{category.name}</h3>
                                                    {!category.isActive && (
                                                        <span className="px-2 py-0.5 bg-gray-200 text-gray-600 text-xs rounded-full font-medium border border-gray-300">Pasif</span>
                                                    )}
                                                    <span className="text-xs text-gray-400 whitespace-nowrap">
                                                        {category.services.length} hizmet
                                                    </span>
                                                </div>
                                                {category.description && (
                                                    <p className="text-xs text-gray-400 mt-0.5 break-words line-clamp-2">{category.description}</p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1 shrink-0">
                                            <button
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); setSelectedCategory(category); setIsEditCategoryModalOpen(true); }}
                                                className="p-1.5 text-gray-400 hover:text-primary-600 transition-colors rounded-lg hover:bg-primary-50"
                                                title="Kategoriyi Düzenle"
                                            >
                                                <Edit className="h-4 w-4" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); setSelectedCategory(category); setIsDeleteCategoryModalOpen(true); }}
                                                className="p-1.5 text-gray-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50"
                                                title="Kategoriyi Sil"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="outline"
                                                className="ml-1 hidden sm:flex"
                                                onClick={(e) => { e.stopPropagation(); setSelectedCategoryId(category.id); setIsServiceModalOpen(true); }}
                                            >
                                                <Plus className="h-3 w-3 mr-1" />
                                                Hizmet Ekle
                                            </Button>
                                            <div className="ml-2 p-1 bg-gray-100 rounded-full text-gray-400">
                                                {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Mobilde "Hizmet Ekle" butonu – sadece açıkken göster */}
                                    {isOpen && (
                                        <div className="sm:hidden px-5 pb-3 border-b border-gray-100">
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="outline"
                                                className="w-full"
                                                onClick={() => { setSelectedCategoryId(category.id); setIsServiceModalOpen(true); }}
                                            >
                                                <Plus className="h-3 w-3 mr-1" />
                                                Hizmet Ekle
                                            </Button>
                                        </div>
                                    )}

                                    {/* Hizmet listesi */}
                                    {isOpen && (
                                        <div className="divide-y divide-gray-100 border-t border-gray-100 animate-in fade-in slide-in-from-top-2 duration-200">
                                            {category.services.length === 0 ? (
                                                <div className="py-8 text-center text-sm text-gray-400 bg-gray-50/50">
                                                    Bu kategoride henüz hizmet bulunmuyor.
                                                </div>
                                            ) : (
                                                category.services.map((service: Service) => (
                                                    <div key={service.id} className="px-5 sm:px-6 py-3.5 flex justify-between items-center hover:bg-gray-50 transition-colors gap-2">
                                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                                            <div className={`w-2 h-2 rounded-full shrink-0 ${service.isActive ? 'bg-green-400' : 'bg-gray-300'}`} />
                                                            <div className="min-w-0 flex-1">
                                                                <p className={`font-medium text-sm break-words line-clamp-2 ${service.isActive ? 'text-gray-900' : 'text-gray-400 line-through'}`}>
                                                                    {service.name}
                                                                </p>
                                                                {service.description && (
                                                                    <p className="text-xs text-gray-400 mt-0.5 break-words line-clamp-2">{service.description}</p>
                                                                )}
                                                                <div className="flex items-center text-xs text-gray-500 mt-1 gap-3 flex-wrap">
                                                                    <span className="flex items-center gap-1">
                                                                        <Clock className="h-3 w-3" /> {service.duration} dk
                                                                    </span>
                                                                    <span className={`flex items-center gap-0.5 font-semibold ${service.isActive ? 'text-green-600' : 'text-gray-400'}`}>
                                                                        <DollarSign className="h-3 w-3" />{service.price} ₺
                                                                    </span>
                                                                    {!service.isActive && (
                                                                        <span className="text-gray-400">(Pasif)</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-1 shrink-0">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleOpenEmployeesModal(service)}
                                                                className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors rounded-lg hover:bg-blue-50"
                                                                title="Uzman Ata"
                                                            >
                                                                <Users className="h-4 w-4" />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => { setSelectedService(service); setIsEditServiceModalOpen(true); }}
                                                                className="p-1.5 text-gray-400 hover:text-primary-600 transition-colors rounded-lg hover:bg-primary-50"
                                                                title="Hizmeti Düzenle"
                                                            >
                                                                <Edit className="h-4 w-4" />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => { setSelectedService(service); setIsDeleteServiceModalOpen(true); }}
                                                                className="p-1.5 text-gray-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50"
                                                                title="Hizmeti Sil"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )
                ) : (
                    <div className="space-y-6">
                        {deletedCategories.length > 0 && (
                            <div className="bg-white rounded-xl shadow-sm border border-red-100 overflow-hidden">
                                <div className="px-6 py-4 bg-red-50 border-b border-red-100 flex justify-between items-center">
                                    <h3 className="font-bold text-red-900">Silinen Kategoriler</h3>
                                </div>
                                <div className="divide-y divide-red-50">
                                    {deletedCategories.map((category: ServiceCategoryDto) => (
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
                                    {deletedServicesInActiveCategories.map((service: Service & { categoryName: string }) => (
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

            {isEmployeesModalOpen && selectedService && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold mb-1">{selectedService.name} — Uzman Ata</h2>
                        <p className="text-sm text-gray-500 mb-4">Bu hizmeti yapabilecek uzmanları seçin.</p>

                        {employeesLoading ? (
                            <div className="py-8 flex justify-center"><LoadingSpinner size="md" /></div>
                        ) : availableEmployees.length === 0 ? (
                            <div className="py-8 text-center text-sm text-gray-400">
                                Aktif uzman bulunmuyor. Önce uzman ekleyin.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {availableEmployees.map((employee) => {
                                    const isAssigned = assignedEmployeeIds.includes(employee.id);
                                    return (
                                        <div
                                            key={employee.id}
                                            onClick={() => toggleEmployee(employee.id)}
                                            className={`p-3 rounded-lg border-2 cursor-pointer transition-all flex items-center gap-3 ${
                                                isAssigned
                                                    ? 'bg-green-50 border-green-500 shadow-sm'
                                                    : 'border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                                            }`}
                                        >
                                            <div className={`h-9 w-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${isAssigned ? 'bg-green-200 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                                                {employee.firstName[0]}{employee.lastName[0]}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm font-semibold truncate ${isAssigned ? 'text-green-800' : 'text-gray-900'}`}>{employee.firstName} {employee.lastName}</p>
                                                <p className="text-xs text-gray-500 truncate">{employee.title}</p>
                                            </div>
                                            {isAssigned && <div className="h-2.5 w-2.5 rounded-full bg-green-500 shrink-0" />}
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        <div className="flex justify-end space-x-2 mt-6 pt-4 border-t border-gray-100">
                            <Button variant="outline" onClick={() => setIsEmployeesModalOpen(false)}>İptal</Button>
                            <Button onClick={handleAssignEmployees} disabled={employeesLoading}>Atamaları Kaydet</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
