import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { shopService } from '../api/shop.service';
import type { Shop } from '../types/shop';

const STORAGE_KEY = 'salonbir_current_shop_id';

interface SalonContextType {
    currentShop: Shop | null;
    allShops: Shop[];
    isLoading: boolean;
    switchShop: (shopId: string) => void;
    refresh: () => Promise<void>;
}

const SalonContext = createContext<SalonContextType | null>(null);

export const SalonProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [allShops, setAllShops] = useState<Shop[]>([]);
    const [currentShop, setCurrentShop] = useState<Shop | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const load = useCallback(async () => {
        setIsLoading(true);
        try {
            const shops = await shopService.getMyShops();
            setAllShops(shops);

            if (shops.length === 0) {
                setCurrentShop(null);
                return;
            }

            if (shops.length === 1) {
                setCurrentShop(shops[0]);
                localStorage.setItem(STORAGE_KEY, shops[0].id);
                return;
            }

            // Multiple shops: try to restore selection from localStorage, fallback to first shop
            const savedId = localStorage.getItem(STORAGE_KEY);
            const saved = savedId ? shops.find(s => s.id === savedId) : null;
            const selected = saved ?? shops[0];
            setCurrentShop(selected);
            localStorage.setItem(STORAGE_KEY, selected.id);
        } catch {
            setAllShops([]);
            setCurrentShop(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const switchShop = useCallback((shopId: string) => {
        const shop = allShops.find(s => s.id === shopId);
        if (shop) {
            setCurrentShop(shop);
            localStorage.setItem(STORAGE_KEY, shopId);
        }
    }, [allShops]);

    const refresh = useCallback(async () => { await load(); }, [load]);

    return (
        <SalonContext.Provider value={{ currentShop, allShops, isLoading, switchShop, refresh }}>
            {children}
        </SalonContext.Provider>
    );
};

export const useSalon = (): SalonContextType => {
    const ctx = useContext(SalonContext);
    if (!ctx) throw new Error('useSalon must be used inside SalonProvider');
    return ctx;
};
