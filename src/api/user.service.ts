import api from './axios';

export interface UserDto {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    userName: string;
    roles: string[];
    ownedShops: string[];
    employedShops: string[];
}

export interface PaginatedUserResponse {
    totalCount: number;
    users: UserDto[];
}

export const userService = {
    getAllUsers: async (page: number = 1, pageSize: number = 10, search: string = ''): Promise<PaginatedUserResponse> => {
        const response = await api.get<PaginatedUserResponse>(`/UserManagement/all?page=${page}&pageSize=${pageSize}&search=${encodeURIComponent(search)}`);
        return response.data;
    },

    deleteUserByAdmin: async (id: string): Promise<void> => {
        await api.delete(`/UserManagement/${id}`);
    }
};
