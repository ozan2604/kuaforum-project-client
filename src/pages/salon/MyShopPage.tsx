import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { shopService } from '../../api/shop.service';
import { toast } from 'react-hot-toast';
import { MapPin, Phone, Building2, Trash2 } from 'lucide-react';

interface ShopFormData {
    name: string;
    description: string;
    address: string;
    city: string;
    district: string;
    phoneNumber: string;
    latitude?: number;
    longitude?: number;
    coverImagePath?: string;
    imageUrls?: string[];
}

export const MyShopPage: React.FC = () => {

    const { register, handleSubmit, formState: { errors }, reset, setValue, watch, getValues } = useForm<ShopFormData>();
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [shopId, setShopId] = useState<string | null>(null);
    const [refreshImages, setRefreshImages] = useState(0);

    // Watch address fields for geocoding
    const addressFields = watch(['address', 'city', 'district']);

    useEffect(() => {
        const fetchShop = async () => {
            try {
                const shop = await shopService.getMyShop();
                setShopId(shop.id);
                reset({
                    name: shop.name,
                    description: shop.description,
                    address: shop.address,
                    city: shop.city,
                    district: shop.district,
                    phoneNumber: shop.phoneNumber,
                    latitude: shop.latitude,
                    longitude: shop.longitude,
                    coverImagePath: shop.coverImagePath,
                    imageUrls: shop.imageUrls || []
                });
            } catch (error) {
                console.error('Error fetching shop:', error);
                toast.error('Failed to load shop details');
            } finally {
                setInitialLoading(false);
            }
        };

        fetchShop();
    }, [reset, refreshImages]);

    const handleGeocode = async () => {
        const { address, city, district } = getValues();
        if (!city || !district) {
            toast.error('Please enter City and District first.');
            return;
        }

        const query = `${address} ${district} ${city}`;
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
            const data = await response.json();
            if (data && data.length > 0) {
                setValue('latitude', parseFloat(data[0].lat));
                setValue('longitude', parseFloat(data[0].lon));
                toast.success('Location found!');
            } else {
                toast.error('Location not found. Please check your address.');
            }
        } catch (error) {
            console.error('Geocoding error:', error);
            toast.error('Error fetching location.');
        }
    };

    const handleCoverImageUpload = async (file: File) => {
        if (!shopId) return;
        try {
            const toastId = toast.loading('Uploading cover image...');
            await shopService.uploadCoverImage(shopId, file);
            toast.dismiss(toastId);
            toast.success('Cover image updated');
            setRefreshImages(prev => prev + 1);
        } catch (error) {
            console.error('Upload failed', error);
            toast.error('Failed to upload cover image');
        }
    };

    const handleGalleryUpload = async (files: FileList) => {
        if (!shopId) return;
        try {
            const toastId = toast.loading(`Uploading ${files.length} images...`);
            const fileArray = Array.from(files);
            await shopService.uploadGalleryImages(shopId, fileArray);
            toast.dismiss(toastId);
            toast.success('Gallery images uploaded');
            setRefreshImages(prev => prev + 1);
        } catch (error) {
            console.error('Upload failed', error);
            toast.error('Failed to upload gallery images');
        }
    };

    const handleDeleteGalleryImage = async (imageUrl: string) => {
        // Need valid ID implementation later
        toast.error('Deletion not implemented yet (Backend DTO update needed)');
    };

    // Helper to render images with full URL
    const getImageUrl = (path: string) => {
        if (!path) return '';
        if (path.startsWith('http')) return path;
        return `http://localhost:5000${path}`;
    };

    const onSubmit = async (data: ShopFormData) => {
        setLoading(true);
        try {
            await shopService.update(data);
            toast.success('Shop details updated successfully');
        } catch (error: any) {
            console.error('Error updating shop:', error);
            toast.error(error.response?.data?.message || 'Failed to update shop');
        } finally {
            setLoading(false);
        }
    };

    if (initialLoading) {
        return <div className="p-8 text-center">Loading shop details...</div>;
    }

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                <Building2 className="mr-3 h-8 w-8 text-primary-600" />
                My Shop Profile
            </h1>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <form onSubmit={handleSubmit(onSubmit)} className="p-6 md:p-8 space-y-8">
                    {/* Cover Image Section */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Salon Görselleri</h3>

                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">Kapak Fotoğrafı</label>
                            <div className="flex items-center gap-6">
                                <div className="relative w-40 h-24 bg-gray-100 rounded-lg overflow-hidden border border-gray-200 group">
                                    {getValues('coverImagePath') ? (
                                        <img
                                            src={getImageUrl(getValues('coverImagePath') || '')}
                                            alt="Kapak"
                                            className="w-full h-full object-cover"
                                            onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150'; }}
                                        />
                                    ) : (
                                        <div className="flex items-center justify-center w-full h-full text-gray-400">
                                            <span className="text-xs">No Image</span>
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <input
                                        type="file"
                                        id="coverImageInput"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={(e) => {
                                            if (e.target.files && e.target.files[0]) {
                                                handleCoverImageUpload(e.target.files[0]);
                                            }
                                        }}
                                    />
                                    <Button type="button" variant="outline" size="sm" onClick={() => document.getElementById('coverImageInput')?.click()}>
                                        Fotoğraf Değiştir
                                    </Button>
                                    <p className="text-xs text-gray-500 mt-1">Önerilen boyut: 1200x400px</p>
                                </div>
                            </div>
                        </div>

                        {/* Gallery Section */}
                        <div className="space-y-4 pt-4">
                            <div className="flex justify-between items-center">
                                <label className="block text-sm font-medium text-gray-700">Galeri</label>
                                <input
                                    type="file"
                                    id="galleryInput"
                                    className="hidden"
                                    multiple
                                    accept="image/*"
                                    onChange={(e) => {
                                        if (e.target.files && e.target.files.length > 0) {
                                            handleGalleryUpload(e.target.files);
                                        }
                                    }}
                                />
                                <Button type="button" variant="outline" size="sm" onClick={() => document.getElementById('galleryInput')?.click()}>
                                    + Fotoğraf Ekle
                                </Button>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {(getValues('imageUrls') || []).map((url, index) => (
                                    <div key={index} className="relative group aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                                        <img
                                            src={getImageUrl(url)}
                                            alt={`Gallery ${index}`}
                                            className="w-full h-full object-cover"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => handleDeleteGalleryImage(url)}
                                            className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                            title="Sil"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                ))}
                                {(getValues('imageUrls') || []).length === 0 && (
                                    <div className="col-span-2 md:col-span-4 p-8 bg-gray-50 rounded border border-dashed text-center text-gray-400 text-sm">
                                        Henüz fotoğraf yüklenmemiş.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t">
                        <Input
                            label="Shop Name"
                            {...register('name', { required: 'Shop Name is required' })}
                            error={errors.name?.message}
                            placeholder="e.g. Elite Hair Studio"
                        />


                        <Input
                            label="Phone Number"
                            {...register('phoneNumber', { required: 'Phone Number is required' })}
                            error={errors.phoneNumber?.message}
                            placeholder="e.g. 555-0123"
                            icon={<Phone className="h-4 w-4 text-gray-400" />}
                        />

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <textarea
                                {...register('description', { required: 'Description is required' })}
                                rows={4}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                                placeholder="Tell customers about your salon..."
                            />
                            {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description.message}</p>}
                        </div>

                        <div className="md:col-span-2 border-t pt-4">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                                    <MapPin className="mr-2 h-5 w-5 text-gray-500" />
                                    Location Details
                                </h3>
                                <Button type="button" variant="outline" onClick={handleGeocode} size="sm">
                                    Find Automatic Location
                                </Button>
                            </div>
                        </div>

                        <Input
                            label="City"
                            {...register('city', { required: 'City is required' })}
                            error={errors.city?.message}
                        />

                        <Input
                            label="District"
                            {...register('district', { required: 'District is required' })}
                            error={errors.district?.message}
                        />

                        <div className="md:col-span-2">
                            <Input
                                label="Full Address"
                                {...register('address', { required: 'Address is required' })}
                                error={errors.address?.message}
                            />
                        </div>

                        <Input
                            label="Latitude"
                            type="number"
                            step="any"
                            {...register('latitude', { valueAsNumber: true })}
                            placeholder="e.g. 41.0082"
                        />

                        <Input
                            label="Longitude"
                            type="number"
                            step="any"
                            {...register('longitude', { valueAsNumber: true })}
                            placeholder="e.g. 28.9784"
                        />
                    </div>

                    <div className="pt-4 border-t border-gray-100 flex justify-end">
                        <Button type="submit" isLoading={loading} size="lg">
                            Save Changes
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};
