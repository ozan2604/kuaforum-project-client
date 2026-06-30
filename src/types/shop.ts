export const ShopType = {
    Fixed: 0,
    Mobile: 1
} as const;

export type ShopType = typeof ShopType[keyof typeof ShopType];

export interface ServiceAreaDto {
    city: string;
    district: string;
    neighborhood?: string;
}

export const TargetGender = {
    Kadin: 1,
    Erkek: 2,
    Unisex: 3,
    Pet: 4
} as const;

export type TargetGender = typeof TargetGender[keyof typeof TargetGender];

export const TargetGenderLabels: { [key in TargetGender]: string } = {
    [TargetGender.Kadin]: "Kadın",
    [TargetGender.Erkek]: "Erkek",
    [TargetGender.Unisex]: "Unisex (Her İkisi)",
    [TargetGender.Pet]: "Pet (Evcil Hayvan)"
};

export const ShopCategory = {
    ErkekKuafor: 1,
    Kuafor: 2,
    GuzellikMerkezi: 3,
    KuaforTag: 4,
    DovmePiercingStudyosu: 5,
    TirnakSalonu: 7,
    CiltBakimMerkezi: 8,
    LazerEpilasyon: 9,
    PetKuafor: 10,
    SacKaynakProtez: 11,
    MakyajKasKirpikStudyosu: 12,
    Diger: 99
} as const;

export type ShopCategory = typeof ShopCategory[keyof typeof ShopCategory];

export const ShopCategoryLabels: { [key in ShopCategory]: string } = {
    [ShopCategory.ErkekKuafor]: "Erkek Kuaför",
    [ShopCategory.Kuafor]: "Kadın Kuaför",
    [ShopCategory.GuzellikMerkezi]: "Güzellik Merkezi",
    [ShopCategory.KuaforTag]: "Kuaför Tag",
    [ShopCategory.DovmePiercingStudyosu]: "Dövme & Piercing",
    [ShopCategory.TirnakSalonu]: "Tırnak Salonu",
    [ShopCategory.CiltBakimMerkezi]: "Cilt Bakım Merkezi",
    [ShopCategory.LazerEpilasyon]: "Lazer Epilasyon",
    [ShopCategory.PetKuafor]: "Pet Kuaför",
    [ShopCategory.SacKaynakProtez]: "Saç Kaynak & Protez",
    [ShopCategory.MakyajKasKirpikStudyosu]: "Makyaj & Kaş/Kirpik",
    [ShopCategory.Diger]: "Diğer"
};

export interface ShopClosureDateDto {
    id: string;
    closureDate: string;
    reason?: string;
}

export interface ShopVideo {
    id: string;
    url: string;
    displayOrder: number;
    createdAt: string;
    viewCount: number;
    likeCount?: number;
    isLikedByCurrentUser?: boolean;
    tags?: { id: string; name: string }[];
}

export interface MediaHighlight {
    id: string;
    type: 'image' | 'video';
    url: string;
    shopId: string;
    shopName: string;
    tags: string[];
    likeCount: number;
    isLikedByCurrentUser: boolean;
    viewCount: number;
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
    promoVideoUrl?: string;   // Legacy alan
    videos?: ShopVideo[];     // Yeni çok-video mimarisi
    images?: { id: string; url: string; tags: { id: string; name: string }[]; likeCount: number; isLikedByCurrentUser: boolean }[];
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
    shopType?: ShopType;
    serviceAreas?: ServiceAreaDto[];
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
    shopType?: ShopType;
    serviceAreas?: ServiceAreaDto[];
}

export interface ShopCustomerDto {
    userId?: string;
    name: string;
    phone?: string;
    totalAppointments?: number;
    lastAppointmentDate?: string;
}
