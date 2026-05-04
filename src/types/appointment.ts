export const AppointmentStatus = {
    Pending: 0,
    Confirmed: 1,
    Completed: 2,
    Cancelled: 3,
    Rejected: 4
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
    userId: string;
    customerName: string;
    customerPhone?: string;
    startTime: string;
    endTime: string;
    status: AppointmentStatus;
    note?: string;
    groupId?: string;
    hasReview: boolean;
    cancellationReason?: string;
    shopCancellationHours: number;
}

// Alias for backward compatibility if needed, or just use AppointmentDto
export type Appointment = AppointmentDto;

export interface CreateAppointmentDto {
    shopId: string;
    serviceIds: string[];
    shopEmployeeId: string;
    startTime: string;
    note?: string;
}

export interface UpdateAppointmentStatusDto {
    status: AppointmentStatus;
    reason?: string;
}

export interface TimeSlotDto {
    startTime: string;
    endTime: string;
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
