const EN_TR: Record<string, string> = {
    // Auth
    'invalid credentials': 'Telefon numarası veya şifre hatalı.',
    'user not found': 'Kullanıcı bulunamadı.',
    'wrong password': 'Şifre hatalı.',
    'invalid password': 'Şifre hatalı.',
    'incorrect password': 'Şifre hatalı.',
    'phone number already': 'Bu telefon numarası zaten kayıtlı.',
    'user already exists': 'Bu kullanıcı zaten kayıtlı.',
    'already registered': 'Bu telefon numarası zaten kayıtlı.',
    'email already': 'Bu e-posta adresi zaten kullanılıyor.',
    // OTP
    'otp expired': 'Doğrulama kodunun süresi dolmuş.',
    'invalid otp': 'Doğrulama kodu hatalı.',
    'otp not found': 'Doğrulama kodu bulunamadı.',
    'expired': 'Kodun süresi dolmuş. Lütfen yeni kod isteyin.',
    // Identity
    'passwords must have at least one': 'Şifre en az bir büyük harf, rakam ve özel karakter içermelidir.',
    'password must': 'Şifre yeterince güçlü değil.',
    'password is': 'Şifre yeterince güçlü değil.',
    'username': 'Geçersiz kullanıcı adı formatı.',
    // Rate limiting
    'too many': 'Çok fazla istek gönderildi. Lütfen bir süre bekleyin.',
    'rate limit': 'Çok fazla istek. Lütfen bekleyin.',
    // Generic
    'unauthorized': 'Bu işlem için yetkiniz yok.',
    'forbidden': 'Bu işlem için yetkiniz yok.',
    'not found': 'İstenen kaynak bulunamadı.',
    'internal server': 'Sunucu hatası oluştu. Lütfen tekrar deneyin.',
    'bad request': 'Geçersiz istek.',
    'network error': 'Bağlantı hatası. İnternet bağlantınızı kontrol edin.',
};

const translateError = (msg: string): string => {
    const lower = msg.toLowerCase();
    for (const [key, tr] of Object.entries(EN_TR)) {
        if (lower.includes(key)) return tr;
    }
    return msg;
};

export const getApiError = (err: unknown, fallback = 'Bir hata oluştu.'): string => {
    if (err && typeof err === 'object' && 'response' in err) {
        const res = (err as any).response;
        const msg: string = res?.data?.message || res?.data?.Message || '';
        if (!msg) return fallback;
        return translateError(msg);
    }
    if (err instanceof Error) return translateError(err.message);
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
