import api from './axios';
import type { Employee, CreateEmployeeDto, UpdateScheduleDto, ScheduleDto } from '../types/employee';

export const employeeService = {
    // Get all employees for the logged-in salon owner's shop
    getEmployees: async (): Promise<Employee[]> => {
        const response = await api.get<Employee[]>('/employee');
        return response.data;
    },

    // Add a new employee
    addEmployee: async (data: CreateEmployeeDto): Promise<void> => {
        await api.post('/employee', data);
    },

    getPublicShopEmployees: async (shopId: string): Promise<Employee[]> => {
        const response = await api.get<Employee[]>(`/employee/public/shop/${shopId}`);
        return response.data;
    },

    // Assign services to an employee
    assignServices: async (employeeId: string, serviceIds: string[]): Promise<void> => {
        await api.post(`/employee/${employeeId}/services`, { serviceIds });
    },

    // Get services assigned to an employee
    // Note: Backend returns ShopServiceDto list
    getEmployeeServices: async (employeeId: string): Promise<any[]> => {
        const response = await api.get(`/employee/${employeeId}/services`);
        return response.data;
    },

    // update schedule
    updateSchedule: async (employeeId: string, data: UpdateScheduleDto): Promise<void> => {
        await api.put(`/employee/${employeeId}/schedule`, data);
    },

    // get schedule
    getSchedule: async (employeeId: string): Promise<ScheduleDto[]> => {
        const response = await api.get<ScheduleDto[]>(`/employee/${employeeId}/schedule`);
        return response.data;
    }
};
