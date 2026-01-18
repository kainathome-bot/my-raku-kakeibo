import { useLiveQuery } from 'dexie-react-hooks';
import { db, FixedCost } from '../lib/db';
import { v4 as uuidv4 } from 'uuid';

export function useFixedCosts() {
    const fixedCosts = useLiveQuery(
        () => db.fixedCosts.toArray()
    );

    const activeFixedCosts = fixedCosts?.filter(fc => fc.is_active) ?? [];

    const addFixedCost = async (data: Omit<FixedCost, 'id' | 'created_at' | 'updated_at'>) => {
        const now = new Date().toISOString();
        await db.fixedCosts.add({
            ...data,
            id: uuidv4(),
            created_at: now,
            updated_at: now
        });
    };

    const updateFixedCost = async (id: string, updates: Partial<Omit<FixedCost, 'id' | 'created_at'>>) => {
        await db.fixedCosts.update(id, {
            ...updates,
            updated_at: new Date().toISOString()
        });
    };

    const deleteFixedCost = async (id: string) => {
        // Check if any expenses reference this fixed cost
        const usedCount = await db.expenses.where('fixed_cost_id').equals(id).count();
        if (usedCount > 0) {
            await db.fixedCosts.update(id, {
                is_active: false,
                updated_at: new Date().toISOString()
            });
        } else {
            await db.fixedCosts.delete(id);
        }
    };

    return {
        fixedCosts,
        activeFixedCosts,
        addFixedCost,
        updateFixedCost,
        deleteFixedCost
    };
}
