export interface Address {
    id: string;
    title: string;
    city: string;
    district: string;
    openAddress: string;
    latitude?: number;
    longitude?: number;
    isDefault: boolean;
}

export interface CreateAddressRequest {
    title: string;
    city: string;
    district: string;
    openAddress: string;
    latitude?: number;
    longitude?: number;
}

export interface UpdateAddressRequest {
    title: string;
    city: string;
    district: string;
    openAddress: string;
    latitude?: number;
    longitude?: number;
}
