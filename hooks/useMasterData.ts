import { useLiveQuery } from 'dexie-react-hooks';
import { db, Category, PaymentMethod } from '../lib/db';
import { v4 as uuidv4 } from 'uuid';

export function useCategories() {
    const categories = useLiveQuery(
        () => db.categories.orderBy('sort_order').toArray()
    );

    const activeCategories = categories?.filter(c => c.is_active) ?? [];

    const addCategory = async (major: string, minor: string | null) => {
        const last = await db.categories.orderBy('sort_order').last();
        const sortOrder = (last?.sort_order ?? -1) + 1;
        const now = new Date().toISOString();

        await db.categories.add({
            id: uuidv4(),
            major_name: major,
            minor_name: minor || null,
            sort_order: sortOrder,
            is_active: true,
            created_at: now,
            updated_at: now,
        });
    };

    const updateCategory = async (id: string, updates: Partial<Category>) => {
        await db.categories.update(id, {
            ...updates,
            updated_at: new Date().toISOString()
        });
    };

    const deleteCategory = async (id: string) => {
        const usedCount = await db.expenses.where('category_id').equals(id).count();
        if (usedCount > 0) {
            // Logical delete
            await db.categories.update(id, {
                is_active: false,
                updated_at: new Date().toISOString()
            });
        } else {
            // Physical delete
            await db.categories.delete(id);
        }
    };

    return {
        categories, // All categories (for management)
        activeCategories, // Only active (for selection)
        addCategory,
        updateCategory,
        deleteCategory
    };
}

export function usePaymentMethods() {
    const paymentMethods = useLiveQuery(
        () => db.paymentMethods.orderBy('sort_order').toArray()
    );

    const activePaymentMethods = paymentMethods?.filter(p => p.is_active) ?? [];

    const addPaymentMethod = async (name: string) => {
        const last = await db.paymentMethods.orderBy('sort_order').last();
        const sortOrder = (last?.sort_order ?? -1) + 1;
        const now = new Date().toISOString();

        await db.paymentMethods.add({
            id: uuidv4(),
            name,
            sort_order: sortOrder,
            is_active: true,
            created_at: now,
            updated_at: now,
        });
    };

    const updatePaymentMethod = async (id: string, updates: Partial<PaymentMethod>) => {
        await db.paymentMethods.update(id, {
            ...updates,
            updated_at: new Date().toISOString()
        });
    };

    const deletePaymentMethod = async (id: string) => {
        const usedCount = await db.expenses.where('payment_method_id').equals(id).count();
        if (usedCount > 0) {
            await db.paymentMethods.update(id, {
                is_active: false,
                updated_at: new Date().toISOString()
            });
        } else {
            await db.paymentMethods.delete(id);
        }
    };

    return {
        paymentMethods,
        activePaymentMethods,
        addPaymentMethod,
        updatePaymentMethod,
        deletePaymentMethod
    };
}
