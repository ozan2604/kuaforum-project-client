import api from './axios';
import type { Employee, CreateEmployeeDto, UpdateScheduleDto, ScheduleDto, EmployeeProfile, UpdateEmployeeProfileDto, PublicEmployeeScheduleDto, EmployeeLeaveDate } from '../types/employee';

export const employeeService = {
    // Owner-facing: all require shopId

    getEmployees: async (shopId: string): Promise<Employee[]> => {
        const response = await api.get<Employee[]>(`/employee?shopId=${shopId}`);
        return response.data;
    },

    addEmployee: async (shopId: string, data: CreateEmployeeDto): Promise<{ message: string, isNewUser: boolean }> => {
        const response = await api.post<{ message: string, isNewUser: boolean }>(`/employee?shopId=${shopId}`, data);
        return response.data;
    },

    updateEmployee: async (shopId: string, employeeId: string, data: any): Promise<void> => {
        await api.put(`/employee/${employeeId}?shopId=${shopId}`, data);
    },

    deleteEmployee: async (shopId: string, employeeId: string): Promise<void> => {
        await api.delete(`/employee/${employeeId}?shopId=${shopId}`);
    },

    restoreEmployee: async (shopId: string, employeeId: string): Promise<void> => {
        await api.patch(`/employee/${employeeId}/restore?shopId=${shopId}`);
    },

    assignServices: async (shopId: string, employeeId: string, serviceIds: string[]): Promise<void> => {
        await api.post(`/employee/${employeeId}/services?shopId=${shopId}`, { serviceIds });
    },

    getEmployeeServices: async (shopId: string, employeeId: string): Promise<any[]> => {
        const response = await api.get(`/employee/${employeeId}/services?shopId=${shopId}`);
        return response.data;
    },

    updateSchedule: async (shopId: string, employeeId: string, data: UpdateScheduleDto): Promise<void> => {
        await api.put(`/employee/${employeeId}/schedule?shopId=${shopId}`, data);
    },

    getSchedule: async (shopId: string, employeeId: string): Promise<ScheduleDto[]> => {
        const response = await api.get<ScheduleDto[]>(`/employee/${employeeId}/schedule?shopId=${shopId}`);
        return response.data;
    },

    getLeaveDates: async (shopId: string, employeeId: string): Promise<EmployeeLeaveDate[]> => {
        const res = await api.get<EmployeeLeaveDate[]>(`/employee/${employeeId}/leave-dates?shopId=${shopId}`);
        return res.data;
    },

    addLeaveDate: async (shopId: string, employeeId: string, leaveDate: string, reason?: string): Promise<void> => {
        await api.post(`/employee/${employeeId}/leave-dates?shopId=${shopId}`, { leaveDate, reason });
    },

    removeLeaveDate: async (shopId: string, leaveDateId: string): Promise<void> => {
        await api.delete(`/employee/leave-dates/${leaveDateId}?shopId=${shopId}`);
    },

    // Public endpoints (no shopId required)

    getPublicShopEmployees: async (shopId: string): Promise<Employee[]> => {
        const response = await api.get<Employee[]>(`/employee/public/shop/${shopId}`);
        return response.data;
    },

    getPublicShopSchedules: async (shopId: string): Promise<PublicEmployeeScheduleDto[]> => {
        const response = await api.get<PublicEmployeeScheduleDto[]>(`/employee/public/shop/${shopId}/schedules`);
        return response.data;
    },

    getPublicLeaveDates: async (employeeId: string): Promise<EmployeeLeaveDate[]> => {
        const res = await api.get<EmployeeLeaveDate[]>(`/employee/${employeeId}/leave-dates/public`);
        return res.data;
    },

    // Employee self-service (no shopId required)

    getProfile: async (): Promise<EmployeeProfile> => {
        const response = await api.get<EmployeeProfile>('/employee/me');
        return response.data;
    },

    updateProfile: async (data: UpdateEmployeeProfileDto): Promise<void> => {
        await api.put('/employee/me', data);
    },

    getMySchedule: async (): Promise<ScheduleDto[]> => {
        const response = await api.get<ScheduleDto[]>('/employee/me/schedule');
        return response.data;
    },

    updateMySchedule: async (data: UpdateScheduleDto): Promise<void> => {
        await api.put('/employee/me/schedule', data);
    },

    getMyLeaveDates: async (): Promise<EmployeeLeaveDate[]> => {
        const res = await api.get<EmployeeLeaveDate[]>('/employee/me/leave-dates');
        return res.data;
    },

    addMyLeaveDate: async (leaveDate: string, reason?: string): Promise<void> => {
        await api.post('/employee/me/leave-dates', { leaveDate, reason });
    },

    removeMyLeaveDate: async (leaveDateId: string): Promise<void> => {
        await api.delete(`/employee/me/leave-dates/${leaveDateId}`);
    },
};
