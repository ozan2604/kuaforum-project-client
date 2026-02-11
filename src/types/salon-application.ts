export interface SalonApplication {
    id: string;
    applicantId: string;
    shopName: string;
    description: string;
    address: string;
    city: string;
    district: string;
    phoneNumber: string;
    taxNumber: string;
    status: 'Pending' | 'Approved' | 'Rejected';
    createdAt: string;
}

export interface CreateSalonApplicationDto {
    shopName: string;
    description: string;
    address: string;
    city: string;
    district: string;
    phoneNumber: string;
    taxNumber: string;
}
