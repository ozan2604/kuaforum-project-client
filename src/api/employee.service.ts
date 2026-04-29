import api from './axios';
import type { Employee, CreateEmployeeDto, UpdateScheduleDto, ScheduleDto, EmployeeProfile, UpdateEmployeeProfileDto, PublicEmployeeScheduleDto } from '../types/employee';

export const employeeService = {
    // Get all employees for the logged-in salon owner's shop
    getEmployees: async (): Promise<Employee[]> => {
        const response = await api.get<Employee[]>('/employee');
        return response.data;
    },

    // Add a new employee
    addEmployee: async (data: CreateEmployeeDto): Promise<{ message: string, temporaryPassword?: string, isNewUser: boolean }> => {
        const response = await api.post<{ message: string, temporaryPassword?: string, isNewUser: boolean }>('/employee', data);
        return response.data;
    },

    updateEmployee: async (employeeId: string, data: any): Promise<void> => {
        await api.put(`/employee/${employeeId}`, data);
    },

    deleteEmployee: async (employeeId: string): Promise<void> => {
        await api.delete(`/employee/${employeeId}`);
    },

    restoreEmployee: async (employeeId: string): Promise<void> => {
        await api.patch(`/employee/${employeeId}/restore`);
    },

    getPublicShopEmployees: async (shopId: string): Promise<Employee[]> => {
        const response = await api.get<Employee[]>(`/employee/public/shop/${shopId}`);
        return response.data;
    },

    getPublicShopSchedules: async (shopId: string): Promise<PublicEmployeeScheduleDto[]> => {
        const response = await api.get<PublicEmployeeScheduleDto[]>(`/employee/public/shop/${shopId}/schedules`);
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
    },

    // Employee Profile
    getProfile: async (): Promise<EmployeeProfile> => {
        const response = await api.get<EmployeeProfile>('/employee/me');
        return response.data;
    },

    updateProfile: async (data: UpdateEmployeeProfileDto): Promise<void> => {
        await api.put('/employee/me', data);
    }
};
