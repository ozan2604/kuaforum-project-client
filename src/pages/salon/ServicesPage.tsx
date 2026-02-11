import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { serviceManagementService } from '../../api/service.service';
import type { ServiceCategoryDto, CreateServiceDto, CreateCategoryDto } from '../../types/service';
import { toast } from 'react-hot-toast';
import { Plus, Scissors, Tag, Clock, DollarSign } from 'lucide-react';

export const ServicesPage: React.FC = () => {
    const [categories, setCategories] = useState<ServiceCategoryDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');

    const loadServices = async () => {
        setLoading(true);
        try {
            const data = await serviceManagementService.getShopServices();
            setCategories(data);
        } catch (error) {
            console.error('Failed to load services:', error);
            toast.error('Failed to load services');
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
                toast.success('Category created');
                setIsCategoryModalOpen(false);
                reset();
                loadServices();
            } catch (error) {
                toast.error('Failed to create category');
            } finally {
                setIsSubmitting(false);
            }
        };

        return (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input label="Category Name" {...register('name', { required: true })} placeholder="e.g. Haircuts" />
                <Input label="Description" {...register('description')} placeholder="Optional description" />
                <div className="flex justify-end space-x-2 mt-4">
                    <Button variant="outline" onClick={() => setIsCategoryModalOpen(false)} type="button">Cancel</Button>
                    <Button isLoading={isSubmitting} type="submit">Create Category</Button>
                </div>
            </form>
        );
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
                toast.success('Service created');
                setIsServiceModalOpen(false);
                reset();
                loadServices();
            } catch (error) {
                toast.error('Failed to create service');
            } finally {
                setIsSubmitting(false);
            }
        };

        return (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input label="Service Name" {...register('name', { required: true })} placeholder="e.g. Men's Cut" />
                <Input
                    label="Price"
                    type="number"
                    {...register('price', { required: true, min: 0 })}
                    icon={<DollarSign className="h-4 w-4" />}
                />
                <Input
                    label="Duration (minutes)"
                    type="number"
                    {...register('duration', { required: true, min: 5 })}
                    icon={<Clock className="h-4 w-4" />}
                />

                <div className="flex justify-end space-x-2 mt-4">
                    <Button variant="outline" onClick={() => setIsServiceModalOpen(false)} type="button">Cancel</Button>
                    <Button isLoading={isSubmitting} type="submit">Create Service</Button>
                </div>
            </form>
        );
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="max-w-5xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800 flex items-center">
                    <Scissors className="mr-3 h-8 w-8 text-primary-600" />
                    Services
                </h1>
                <Button onClick={() => setIsCategoryModalOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    New Category
                </Button>
            </div>

            <div className="grid gap-6">
                {categories.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                        <p className="text-gray-500 mb-4">No services found. Start by creating a category.</p>
                        <Button onClick={() => setIsCategoryModalOpen(true)}>Create Category</Button>
                    </div>
                ) : (
                    categories.map((category) => (
                        <div key={category.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                                <div>
                                    <h3 className="font-bold text-gray-900">{category.name}</h3>
                                    {category.description && <p className="text-sm text-gray-500">{category.description}</p>}
                                </div>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                        setSelectedCategoryId(category.id);
                                        setIsServiceModalOpen(true);
                                    }}
                                >
                                    <Plus className="h-3 w-3 mr-1" />
                                    Add Service
                                </Button>
                            </div>
                            <div className="divide-y divide-gray-100">
                                {category.services.length === 0 ? (
                                    <div className="p-4 text-center text-sm text-gray-400">No services in this category</div>
                                ) : (
                                    category.services.map((service) => (
                                        <div key={service.id} className="p-4 flex justify-between items-center hover:bg-gray-50 transition-colors">
                                            <div className="flex items-center">
                                                <Tag className="h-4 w-4 text-primary-400 mr-3" />
                                                <div>
                                                    <p className="font-medium text-gray-900">{service.name}</p>
                                                    <div className="flex items-center text-xs text-gray-500 mt-1 space-x-3">
                                                        <span className="flex items-center"><Clock className="h-3 w-3 mr-1" /> {service.duration} mins</span>
                                                        <span className="flex items-center font-semibold text-green-600"><DollarSign className="h-3 w-3" /> {service.price}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            {/* Future: Edit/Delete buttons */}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modals */}
            {isCategoryModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">Add Category</h2>
                        <CategoryForm />
                    </div>
                </div>
            )}

            {isServiceModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">Add Service</h2>
                        <ServiceForm />
                    </div>
                </div>
            )}
        </div>
    );
};
