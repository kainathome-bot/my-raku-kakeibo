import { useLiveQuery } from 'dexie-react-hooks';
import { db, Income } from '../lib/db';
import { v4 as uuidv4 } from 'uuid';

export function useIncomes() {
    const addIncome = async (income: Omit<Income, 'id' | 'created_at' | 'updated_at' | 'deleted'>) => {
        const now = new Date().toISOString();
        await db.incomes.add({
            ...income,
            id: uuidv4(),
            created_at: now,
            updated_at: now,
            deleted: false
        });
    };

    const updateIncome = async (id: string, updates: Partial<Omit<Income, 'id' | 'created_at'>>) => {
        await db.incomes.update(id, {
            ...updates,
            updated_at: new Date().toISOString()
        });
    };

    const deleteIncome = async (id: string) => {
        await db.incomes.update(id, {
            deleted: true,
            updated_at: new Date().toISOString()
        });
    };

    return {
        addIncome,
        updateIncome,
        deleteIncome
    };
}

export function useDailyIncomes(date: string) {
    return useLiveQuery(
        async () => {
            const incomes = await db.incomes
                .where('date')
                .equals(date)
                .toArray();
            return incomes
                .filter(i => !i.deleted)
                .sort((a, b) => b.created_at.localeCompare(a.created_at));
        },
        [date]
    );
}

export function usePeriodIncomes(startDate: string | undefined, endDate: string | undefined) {
    return useLiveQuery(
        async () => {
            if (!startDate || !endDate) return [];
            const incomes = await db.incomes
                .where('date')
                .between(startDate, endDate, true, true)
                .toArray();
            return incomes.filter(i => !i.deleted);
        },
        [startDate, endDate]
    );
}
