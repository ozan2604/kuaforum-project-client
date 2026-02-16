export const ShopCategory = {
    Berber: 1,
    Kuafor: 2,
    GuzellikMerkezi: 3,
    SpaMerkezi: 4,
    DovmeStudyosu: 5,
    Diger: 99
} as const;

export type ShopCategory = typeof ShopCategory[keyof typeof ShopCategory];

export const ShopCategoryLabels: { [key in ShopCategory]: string } = {
    [ShopCategory.Berber]: "Berber",
    [ShopCategory.Kuafor]: "Kuaför",
    [ShopCategory.GuzellikMerkezi]: "Güzellik Merkezi",
    [ShopCategory.SpaMerkezi]: "Spa Merkezi",
    [ShopCategory.DovmeStudyosu]: "Dövme Stüdyosu",
    [ShopCategory.Diger]: "Diğer"
};

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
    images?: { id: string; url: string }[];
    averageRating: number;
    reviewCount: number;
    createdAt?: string;
    latitude?: number;
    longitude?: number;
    saturdayClosingTime?: string;
    weeklySchedule?: ShopSchedule[];
    category: ShopCategory;
}

export interface ShopSchedule {
    day: string;
    dayOfWeek: number;
    openingTime: string | null;
    closingTime: string | null;
    isClosed: boolean;
}

export interface CreateShopDto {
    name: string;
    description: string;
    address: string;
    city: string;
    district: string;
    phoneNumber: string;
    latitude?: number;
    longitude?: number;
    category: ShopCategory;
}
