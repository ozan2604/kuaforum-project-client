import axios from 'axios';
import { getToken } from '../utils/storage';

const api = axios.create({
    baseURL: 'https://localhost:7022/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(
    (config) => {
        const token = getToken();
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Handle global errors like 401 Unauthorized
        if (error.response && error.response.status === 401) {
            // potentially logout user
        }
        return Promise.reject(error);
    }
);

export default api;
