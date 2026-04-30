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

export const setToken = (token: string) => {
    localStorage.setItem(TOKEN_KEY, token);
};

export const getToken = (): string | null => {
    return localStorage.getItem(TOKEN_KEY);
};

export const removeToken = () => {
    localStorage.removeItem(TOKEN_KEY);
};

export const setUser = (user: any) => {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const getUser = (): any | null => {
    const user = localStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
};

export const removeUser = () => {
    localStorage.removeItem(USER_KEY);
};

export const clearAuth = () => {
    removeToken();
    removeUser();
};
