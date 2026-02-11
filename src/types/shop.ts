export interface Shop {
    id: string;
    ownerId: string;
    name: string;
    description: string;
    address: string;
    city: string;
    district: string;
    phoneNumber: string;
    rating: number;
    isOpen: boolean;
    ownerName?: string;
    ownerEmail?: string;
    isActive: boolean;
    coverImagePath?: string;
    imageUrls?: string[];
    createdAt?: string;
    latitude?: number;
    longitude?: number;
}

export interface CreateShopDto {
    name: string;
    description: string;
    address: string;
    city: string;
    district: string;
    phoneNumber: string;
}
