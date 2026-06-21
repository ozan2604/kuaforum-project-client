export const AppointmentStatus = {
    Pending: 0,
    Confirmed: 1,
    Completed: 2,
    Cancelled: 3,
    Rejected: 4,
    NoShow: 5
} as const;

export type AppointmentStatus = typeof AppointmentStatus[keyof typeof AppointmentStatus];

export interface AppointmentDto {
    id: string;
    shopId: string;
    shopName: string;
    shopServiceId: string;
    serviceName: string;
    price: number;
    duration: number;
    shopEmployeeId: string;
    employeeName: string;
    userId?: string;
    customerName: string;
    customerPhone?: string;
    isManual: boolean;
    startTime: string;
    endTime: string;
    status: AppointmentStatus;
    note?: string;
    groupId?: string;
    hasReview: boolean;
    cancellationReason?: string;
    shopCancellationHours: number;
    customerAddress?: string;
}

// Alias for backward compatibility if needed, or just use AppointmentDto
export type Appointment = AppointmentDto;

export interface CreateAppointmentDto {
    shopId: string;
    serviceIds: string[];
    shopEmployeeId: string;
    startTime: string;
    note?: string;
    customerAddress?: string;
}

export interface CreateManualAppointmentDto {
    shopId: string;
    serviceIds: string[];
    shopEmployeeId: string;
    startTime: string;
    note?: string;
    guestCustomerName?: string;
    guestCustomerPhone?: string;
}

export interface UpdateAppointmentStatusDto {
    status: AppointmentStatus;
    reason?: string;
}

export interface TimeSlotDto {
    startTime: string;
    endTime: string;
}

export interface NoShowResultDto {
    noShowCount: number;
    customerId?: string;
    customerName?: string;
}

export interface EmployeeAvailabilityDto {
    isWorking: boolean;
    isShopClosed?: boolean;
    isOnLeave?: boolean;
    workStartTime?: string; // HH:mm:ss
    workEndTime?: string;
    breakStartTime?: string;
    breakEndTime?: string;
    bookedSlots: TimeSlotDto[];
}
