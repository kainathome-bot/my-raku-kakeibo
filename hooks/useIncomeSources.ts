import { useLiveQuery } from 'dexie-react-hooks';
import { db, IncomeSource } from '../lib/db';
import { v4 as uuidv4 } from 'uuid';

export function useIncomeSources() {
    const incomeSources = useLiveQuery(
        () => db.incomeSources.orderBy('sort_order').toArray()
    );

    const activeIncomeSources = incomeSources?.filter(s => s.is_active) ?? [];

    const addIncomeSource = async (name: string) => {
        const maxOrder = await db.incomeSources.orderBy('sort_order').last();
        const now = new Date().toISOString();
        await db.incomeSources.add({
            id: uuidv4(),
            name,
            sort_order: (maxOrder?.sort_order ?? -1) + 1,
            is_active: true,
            created_at: now,
            updated_at: now
        });
    };

    const updateIncomeSource = async (id: string, updates: Partial<Omit<IncomeSource, 'id' | 'created_at'>>) => {
        await db.incomeSources.update(id, {
            ...updates,
            updated_at: new Date().toISOString()
        });
    };

    const deleteIncomeSource = async (id: string) => {
        const usedCount = await db.incomes.where('source_id').equals(id).count();
        if (usedCount > 0) {
            await db.incomeSources.update(id, {
                is_active: false,
                updated_at: new Date().toISOString()
            });
        } else {
            await db.incomeSources.delete(id);
        }
    };

    return {
        incomeSources,
        activeIncomeSources,
        addIncomeSource,
        updateIncomeSource,
        deleteIncomeSource
    };
}
