export const getApiError = (err: unknown, fallback = 'Bir hata oluştu.'): string => {
    if (err && typeof err === 'object' && 'response' in err) {
        const res = (err as any).response;
        return res?.data?.message || res?.data?.Message || fallback;
    }
    if (err instanceof Error) return err.message;
    return fallback;
};

const TOKEN_KEY = 'kuaforum_token';
const USER_KEY = 'kuaforum_user';
const REFRESH_TOKEN_KEY = 'kuaforum_refresh_token';

export const setToken = (token: string) => localStorage.setItem(TOKEN_KEY, token);
export const getToken = (): string | null => localStorage.getItem(TOKEN_KEY);
export const removeToken = () => localStorage.removeItem(TOKEN_KEY);

export const setRefreshToken = (token: string) => localStorage.setItem(REFRESH_TOKEN_KEY, token);
export const getRefreshToken = (): string | null => localStorage.getItem(REFRESH_TOKEN_KEY);
export const removeRefreshToken = () => localStorage.removeItem(REFRESH_TOKEN_KEY);

export const setUser = (user: any) => localStorage.setItem(USER_KEY, JSON.stringify(user));
export const getUser = (): any | null => {
    const user = localStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
};
export const removeUser = () => localStorage.removeItem(USER_KEY);

export const clearAuth = () => {
    removeToken();
    removeRefreshToken();
    removeUser();
};
