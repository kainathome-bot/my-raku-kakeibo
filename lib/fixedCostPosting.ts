import { db } from './db';
import { v4 as uuidv4 } from 'uuid';
import { format, startOfMonth } from 'date-fns';

/**
 * Posts fixed costs for a given month in an idempotent way.
 * Returns the number of records created (0 if already posted).
 */
export async function postFixedCostsForMonth(yearMonth: string): Promise<number> {
    // yearMonth format: 'YYYY-MM'
    const firstOfMonth = `${yearMonth}-01`;

    // Check if any fixed cost expenses exist for this month
    const existingFixedExpenses = await db.expenses
        .where('date')
        .startsWith(yearMonth)
        .filter(e => e.is_fixed === true && !e.deleted)
        .count();

    if (existingFixedExpenses > 0) {
        // Already posted for this month
        return 0;
    }

    // Get all active fixed costs
    const activeFixedCosts = await db.fixedCosts
        .filter(fc => fc.is_active)
        .toArray();

    if (activeFixedCosts.length === 0) {
        return 0;
    }

    const now = new Date().toISOString();
    const expensesToAdd = activeFixedCosts.map(fc => ({
        id: uuidv4(),
        date: firstOfMonth,
        category_id: fc.category_id,
        payment_method_id: fc.payment_method_id,
        amount: fc.amount,
        description: fc.name,
        rating: null as '○' | '△' | '✖' | null,
        memo: '固定費自動計上',
        created_at: now,
        updated_at: now,
        deleted: false,
        is_fixed: true,
        fixed_cost_id: fc.id
    }));

    await db.expenses.bulkAdd(expensesToAdd);
    return expensesToAdd.length;
}

/**
 * Auto-post fixed costs for the current month (to be called on app init)
 */
export async function autoPostCurrentMonthFixedCosts(): Promise<{ posted: number; alreadyPosted: boolean }> {
    const currentMonth = format(new Date(), 'yyyy-MM');
    const posted = await postFixedCostsForMonth(currentMonth);
    return {
        posted,
        alreadyPosted: posted === 0
    };
}

/**
 * Check if fixed costs have been posted for the current month
 */
export async function hasFixedCostsPostedForMonth(yearMonth: string): Promise<boolean> {
    const count = await db.expenses
        .where('date')
        .startsWith(yearMonth)
        .filter(e => e.is_fixed === true && !e.deleted)
        .count();
    return count > 0;
}
