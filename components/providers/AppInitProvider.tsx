"use client";

import { useEffect, useState, createContext, useContext, ReactNode } from 'react';
import { autoPostCurrentMonthFixedCosts } from '@/lib/fixedCostPosting';

interface AppInitContextType {
    isInitialized: boolean;
    fixedCostsPosted: number;
}

const AppInitContext = createContext<AppInitContextType>({
    isInitialized: false,
    fixedCostsPosted: 0
});

export function useAppInit() {
    return useContext(AppInitContext);
}

export function AppInitProvider({ children }: { children: ReactNode }) {
    const [isInitialized, setIsInitialized] = useState(false);
    const [fixedCostsPosted, setFixedCostsPosted] = useState(0);

    useEffect(() => {
        const init = async () => {
            try {
                // Auto-post fixed costs for current month (idempotent)
                const result = await autoPostCurrentMonthFixedCosts();
                setFixedCostsPosted(result.posted);
            } catch (error) {
                console.error('Failed to auto-post fixed costs:', error);
            } finally {
                setIsInitialized(true);
            }
        };

        init();
    }, []);

    return (
        <AppInitContext.Provider value={{ isInitialized, fixedCostsPosted }}>
            {children}
        </AppInitContext.Provider>
    );
}
