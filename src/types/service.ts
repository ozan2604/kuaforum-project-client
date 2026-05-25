export interface Service {
    id: string;
    name: string;
    description?: string;
    duration: number; // in minutes
    price: number;
    isActive: boolean;
    isDeleted?: boolean;
    categoryId?: string; // Optional if flattened
    employees?: ServiceEmployeeDto[];
}

export interface ServiceCategoryDto {
    id: string;
    name: string;
    description?: string;
    isActive?: boolean;
    isDeleted?: boolean;
    services: Service[];
}

export interface CreateServiceDto {
    name: string;
    description?: string;
    price: number;
    duration: number;
    categoryId: string;
}

export interface CreateCategoryDto {
    name: string;
    description?: string;
}

export interface UpdateServiceCategoryDto {
    name: string;
    description?: string;
    isActive?: boolean;
}

export interface UpdateShopServiceDto {
    name: string;
    description?: string;
    price: number;
    duration: number;
    isActive: boolean;
}

export interface ServiceEmployeeDto {
    id: string;
    firstName: string;
    lastName: string;
    title: string;
    imageUrl?: string;
    averageRating: number;
    reviewCount: number;
}

export interface ShopServiceDto {
    id: string;
    name: string;
    description?: string;
    price: number;
    duration: number;
    isActive: boolean;
    isDeleted?: boolean;
    employees?: ServiceEmployeeDto[];
}
