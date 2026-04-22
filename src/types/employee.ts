export interface Employee {
    id: string;
    userId: string;
    firstName: string;
    lastName: string;
    email: string;
    title: string;
    isActive: boolean;
    isDeleted: boolean;
    averageRating: number;
    reviewCount: number;
    serviceIds?: string[];
}

export interface CreateEmployeeDto {
    firstName: string;
    lastName: string;
    phoneNumber: string;
    title: string;
}

export interface UpdateEmployeeOwnerDto {
    firstName: string;
    lastName: string;
    title: string;
    isActive: boolean;
}

export interface AssignServicesDto {
    serviceIds: string[];
}

export interface UpdateScheduleDto {
    schedules: EmployeeSchedule[];
}

export interface EmployeeSchedule {
    dayOfWeek: number;
    isWorking: boolean;
    startTime?: string;
    endTime?: string;
    breakStartTime?: string;
    breakEndTime?: string;
}

export interface ScheduleDto {
    dayOfWeek: number;
    isWorking: boolean;
    startTime: string;
    endTime: string;
    breakStartTime?: string;
    breakEndTime?: string;
}

export interface EmployeeProfile {
    id: string;
    userId: string;
    shopId: string;
    shopName: string;
    firstName: string;
    lastName: string;
    email: string;
    title: string;
    averageRating: number;
    reviewCount: number;
    isActive: boolean;
}

export interface UpdateEmployeeProfileDto {
    firstName: string;
    lastName: string;
    title: string;
}
