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

export const setToken = (token: string) => sessionStorage.setItem(TOKEN_KEY, token);
export const getToken = (): string | null => sessionStorage.getItem(TOKEN_KEY);
export const removeToken = () => sessionStorage.removeItem(TOKEN_KEY);

export const setRefreshToken = (token: string) => sessionStorage.setItem(REFRESH_TOKEN_KEY, token);
export const getRefreshToken = (): string | null => sessionStorage.getItem(REFRESH_TOKEN_KEY);
export const removeRefreshToken = () => sessionStorage.removeItem(REFRESH_TOKEN_KEY);

export const setUser = (user: any) => sessionStorage.setItem(USER_KEY, JSON.stringify(user));
export const getUser = (): any | null => {
    const user = sessionStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
};
export const removeUser = () => sessionStorage.removeItem(USER_KEY);

export const clearAuth = () => {
    removeToken();
    removeRefreshToken();
    removeUser();
};
