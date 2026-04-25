export interface SalonApplication {
    id: string;
    applicantId: string;
    shopName: string;
    description: string;
    address: string;
    city: string;
    district: string;
    neighborhood: string;
    street: string;
    buildingNumber: string;
    phoneNumber: string;
    contactEmail: string;
    categoryIds: number[];
    genderPreference: number;
    status: 'Pending' | 'Approved' | 'Rejected';
    createdAt: string;
}

export interface CreateSalonApplicationDto {
    shopName: string;
    description: string;
    address: string;
    city: string;
    district: string;
    neighborhood: string;
    street: string;
    buildingNumber: string;
    phoneNumber: string;
    contactEmail: string;
    categoryIds: number[];
    genderPreference: number;
    latitude?: number | null;
    longitude?: number | null;
}

export interface ContactEmailCheckResult {
    isAvailable: boolean;
    isUsedByShop: boolean;
    isUsedByApplication: boolean;
    isRegisteredUser: boolean;
}
