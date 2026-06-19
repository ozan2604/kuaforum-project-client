import React, { useCallback, useEffect, useState } from 'react';
import { SalonContext } from './SalonContext';
import { shopService } from '../api/shop.service';
import type { Shop } from '../types/shop';

export const AdminSalonProvider: React.FC<{ shopId: string; children: React.ReactNode }> = ({ shopId, children }) => {
    const [shop, setShop] = useState<Shop | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const load = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await shopService.getPublicShopById(shopId);
            setShop(data);
        } catch {
            setShop(null);
        } finally {
            setIsLoading(false);
        }
    }, [shopId]);

    useEffect(() => { load(); }, [load]);

    return (
        <SalonContext.Provider value={{
            currentShop: shop,
            allShops: shop ? [shop] : [],
            isLoading,
            switchShop: () => {},
            refresh: load,
        }}>
            {children}
        </SalonContext.Provider>
    );
};
