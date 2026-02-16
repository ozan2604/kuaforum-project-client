export interface Employee {
    id: string;
    userId: string;
    firstName: string;
    lastName: string;
    email: string;
    title: string;
    isActive: boolean;
    averageRating: number;
    reviewCount: number;
}

export interface CreateEmployeeDto {
    firstName: string;
    lastName: string;
    email: string;
    password?: string; // Optional if we auto-generate or use invite flow
    title: string;
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
