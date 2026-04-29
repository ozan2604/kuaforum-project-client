export const TargetGender = {
    Kadin: 1,
    Erkek: 2,
    Unisex: 3
} as const;

export type TargetGender = typeof TargetGender[keyof typeof TargetGender];

export const TargetGenderLabels: { [key in TargetGender]: string } = {
    [TargetGender.Kadin]: "Kadın",
    [TargetGender.Erkek]: "Erkek",
    [TargetGender.Unisex]: "Unisex (Her İkisi)"
};

export const ShopCategory = {
    Berber: 1,
    Kuafor: 2,
    GuzellikMerkezi: 3,
    SpaMerkezi: 4,
    DovmeStudyosu: 5,
    PiercingStudyosu: 6,
    NailArt: 7,
    CiltBakimMerkezi: 8,
    LazerEpilasyon: 9,
    MasajSalonu: 10,
    Solaryum: 11,
    MakyajStudyosu: 12,
    KasKirpikStudyosu: 13,
    Diger: 99
} as const;

export type ShopCategory = typeof ShopCategory[keyof typeof ShopCategory];

export const ShopCategoryLabels: { [key in ShopCategory]: string } = {
    [ShopCategory.Berber]: "Berber",
    [ShopCategory.Kuafor]: "Kadın Kuaför",
    [ShopCategory.GuzellikMerkezi]: "Güzellik Merkezi",
    [ShopCategory.SpaMerkezi]: "Spa Merkezi",
    [ShopCategory.DovmeStudyosu]: "Dövme Stüdyosu",
    [ShopCategory.PiercingStudyosu]: "Piercing Stüdyosu",
    [ShopCategory.NailArt]: "Nail Art / Tırnak Salonu",
    [ShopCategory.CiltBakimMerkezi]: "Cilt Bakım Merkezi",
    [ShopCategory.LazerEpilasyon]: "Lazer Epilasyon Merkezi",
    [ShopCategory.MasajSalonu]: "Masaj Salonu",
    [ShopCategory.Solaryum]: "Solaryum",
    [ShopCategory.MakyajStudyosu]: "Makyaj Stüdyosu",
    [ShopCategory.KasKirpikStudyosu]: "Kaş & Kirpik Stüdyosu",
    [ShopCategory.Diger]: "Diğer"
};

export interface ShopClosureDateDto {
    id: string;
    closureDate: string;
    reason?: string;
}

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
    categories: number[];
    genderPreference: TargetGender;
    isAutoProcessEnabled: boolean;
    bookingDaysAhead?: number;
    openTime?: string;
    closeTime?: string;
    closureDates?: ShopClosureDateDto[];
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
    categoryIds: number[];
    genderPreference: TargetGender;
    openTime?: string;
    closeTime?: string;
    bookingDaysAhead?: number;
}
