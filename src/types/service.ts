export interface Service {
    id: string;
    name: string;
    description?: string;
    duration: number; // in minutes
    price: number;
    isActive: boolean;
    categoryId?: string; // Optional if flattened
}

export interface ServiceCategoryDto {
    id: string;
    name: string;
    description: string;
    services: Service[];
}

export interface CreateServiceDto {
    name: string;
    price: number;
    duration: number;
    categoryId: string;
}

export interface CreateCategoryDto {
    name: string;
    description: string;
}

export interface ShopServiceDto {
    id: string;
    name: string;
    price: number;
    duration: number;
    isActive: boolean;
}
