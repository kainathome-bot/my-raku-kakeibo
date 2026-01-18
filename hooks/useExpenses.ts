import { useLiveQuery } from 'dexie-react-hooks';
import { db, Expense } from '../lib/db';
import { v4 as uuidv4 } from 'uuid';

export function useExpenses() {
    const addExpense = async (expense: Omit<Expense, 'id' | 'created_at' | 'updated_at' | 'deleted'>) => {
        const now = new Date().toISOString();
        await db.expenses.add({
            ...expense,
            id: uuidv4(),
            created_at: now,
            updated_at: now,
            deleted: false
        });
    };

    const updateExpense = async (id: string, updates: Partial<Omit<Expense, 'id' | 'created_at'>>) => {
        await db.expenses.update(id, {
            ...updates,
            updated_at: new Date().toISOString()
        });
    };

    const deleteExpense = async (id: string) => {
        // Logical deletion
        await db.expenses.update(id, {
            deleted: true,
            updated_at: new Date().toISOString()
        });
    };

    return {
        addExpense,
        updateExpense,
        deleteExpense
    };
}

export function useDailyExpenses(date: string) {
    return useLiveQuery(
        async () => {
            const expenses = await db.expenses
                .where('date')
                .equals(date)
                .toArray();
            return expenses
                .filter(e => !e.deleted)
                .sort((a, b) => b.created_at.localeCompare(a.created_at));
        },
        [date]
    );
}

export function usePeriodExpenses(startDate: string | undefined, endDate: string | undefined) {
    return useLiveQuery(
        async () => {
            if (!startDate || !endDate) return [];
            const expenses = await db.expenses
                .where('date')
                .between(startDate, endDate, true, true) // inclusive
                .toArray();
            return expenses.filter(e => !e.deleted);
        },
        [startDate, endDate]
    );
}
