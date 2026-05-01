import axios from 'axios';
import { getToken, getRefreshToken, setToken, setRefreshToken, clearAuth } from '../utils/storage';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'https://localhost:7022/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Token refresh state — birden fazla eş zamanlı 401'i önler
let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (error: unknown) => void }> = [];

const processQueue = (error: unknown, token: string | null = null) => {
    failedQueue.forEach(p => error ? p.reject(error) : p.resolve(token!));
    failedQueue = [];
};

api.interceptors.request.use(
    (config) => {
        const token = getToken();
        if (token) config.headers['Authorization'] = `Bearer ${token}`;
        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status !== 401 || originalRequest._retry) {
            return Promise.reject(error);
        }

        // Refresh isteğinin kendisi 401 döndürdüyse → oturum tamamen bitti
        if (originalRequest.url?.includes('/auth/refresh')) {
            clearAuth();
            window.location.href = '/login';
            return Promise.reject(error);
        }

        // Refresh zaten devam ediyorsa → bu isteği kuyruğa al
        if (isRefreshing) {
            return new Promise<string>((resolve, reject) => {
                failedQueue.push({ resolve, reject });
            }).then(token => {
                originalRequest.headers['Authorization'] = `Bearer ${token}`;
                return api(originalRequest);
            });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        const refreshToken = getRefreshToken();
        if (!refreshToken) {
            clearAuth();
            window.location.href = '/login';
            return Promise.reject(error);
        }

        try {
            const { data } = await api.post('/auth/refresh', { refreshToken });
            setToken(data.token);
            setRefreshToken(data.refreshToken);
            api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
            originalRequest.headers['Authorization'] = `Bearer ${data.token}`;
            processQueue(null, data.token);
            return api(originalRequest);
        } catch (refreshError) {
            processQueue(refreshError, null);
            clearAuth();
            window.location.href = '/login';
            return Promise.reject(refreshError);
        } finally {
            isRefreshing = false;
        }
    }
);

export default api;
