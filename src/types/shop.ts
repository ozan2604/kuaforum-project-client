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
    ErkekKuafor: 1,
    Kuafor: 2,
    GuzellikMerkezi: 3,
    SpaMerkezi: 4,
    DovmePiercingStudyosu: 5,
    TirnakSalonu: 7,
    CiltBakimMerkezi: 8,
    LazerEpilasyon: 9,
    MasajSalonu: 10,
    Solaryum: 11,
    MakyajKasKirpikStudyosu: 12,
    Diger: 99
} as const;

export type ShopCategory = typeof ShopCategory[keyof typeof ShopCategory];

export const ShopCategoryLabels: { [key in ShopCategory]: string } = {
    [ShopCategory.ErkekKuafor]: "Erkek Kuaför",
    [ShopCategory.Kuafor]: "Kadın Kuaför",
    [ShopCategory.GuzellikMerkezi]: "Güzellik Merkezi",
    [ShopCategory.SpaMerkezi]: "Spa Merkezi",
    [ShopCategory.DovmePiercingStudyosu]: "Dövme & Piercing",
    [ShopCategory.TirnakSalonu]: "Tırnak Salonu",
    [ShopCategory.CiltBakimMerkezi]: "Cilt Bakım Merkezi",
    [ShopCategory.LazerEpilasyon]: "Lazer Epilasyon",
    [ShopCategory.MasajSalonu]: "Masaj Salonu",
    [ShopCategory.Solaryum]: "Solaryum",
    [ShopCategory.MakyajKasKirpikStudyosu]: "Makyaj & Kaş/Kirpik",
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
    neighborhood?: string;
    street?: string;
    buildingNumber?: string;
    phoneNumber: string;
    rating: number;
    isOpen: boolean;
    ownerName?: string;
    ownerEmail?: string;
    isActive: boolean;
    coverImagePath?: string;
    images?: { id: string; url: string; tags: { id: string; name: string }[] }[];
    averageRating: number;
    reviewCount: number;
    minServicePrice?: number;
    createdAt?: string;
    latitude?: number;
    longitude?: number;
    saturdayClosingTime?: string;
    weeklySchedule?: ShopSchedule[];
    categories: number[];
    genderPreference: TargetGender;
    isAutoProcessEnabled: boolean;
    bookingDaysAhead?: number;
    cancellationHours?: number;
    openTime?: string;
    closeTime?: string;
    weeklyOffDays?: number[];
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
    cancellationHours?: number;
    weeklyOffDays?: number[];
}
