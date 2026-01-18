import Dexie, { type Table } from 'dexie';
import { v4 as uuidv4 } from 'uuid';

// ============ EXPENSE ============
export interface Expense {
    id: string;
    date: string; // YYYY-MM-DD
    category_id: string;
    payment_method_id: string;
    amount: number;
    description: string;
    rating: '○' | '△' | '✖' | null;
    memo: string;
    created_at: string;
    updated_at: string;
    deleted: boolean;
    // Fixed cost fields
    is_fixed?: boolean;
    fixed_cost_id?: string;
}

// ============ CATEGORY ============
export interface Category {
    id: string;
    major_name: string;
    minor_name: string | null;
    sort_order: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

// ============ PAYMENT METHOD ============
export interface PaymentMethod {
    id: string;
    name: string;
    sort_order: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

// ============ INCOME ============
export interface Income {
    id: string;
    date: string; // YYYY-MM-DD
    source_id: string;
    amount: number;
    memo: string;
    created_at: string;
    updated_at: string;
    deleted: boolean;
}

// ============ INCOME SOURCE ============
export interface IncomeSource {
    id: string;
    name: string;
    sort_order: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

// ============ FIXED COST ============
export interface FixedCost {
    id: string;
    name: string;
    category_id: string;
    payment_method_id: string;
    amount: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

// ============ CATEGORY MAPPING (for CSV import) ============
export interface CategoryMapping {
    id: string;
    csv_category: string;
    category_id: string;
}

// ============ DATABASE CLASS ============
export class HouseholdExpenseDB extends Dexie {
    expenses!: Table<Expense>;
    categories!: Table<Category>;
    paymentMethods!: Table<PaymentMethod>;
    incomes!: Table<Income>;
    incomeSources!: Table<IncomeSource>;
    fixedCosts!: Table<FixedCost>;
    categoryMappings!: Table<CategoryMapping>;

    constructor() {
        super('HouseholdExpenseDB');

        // Version 1: Original schema
        this.version(1).stores({
            expenses: '&id, date, category_id, payment_method_id, created_at, updated_at, deleted',
            categories: '&id, sort_order, is_active, major_name, minor_name',
            paymentMethods: '&id, sort_order, is_active, name'
        });

        // Version 2: Add Income, IncomeSource, FixedCost, CategoryMapping; extend Expense
        this.version(2).stores({
            expenses: '&id, date, category_id, payment_method_id, created_at, updated_at, deleted, is_fixed, fixed_cost_id',
            categories: '&id, sort_order, is_active, major_name, minor_name',
            paymentMethods: '&id, sort_order, is_active, name',
            incomes: '&id, date, source_id, created_at, deleted',
            incomeSources: '&id, sort_order, is_active, name',
            fixedCosts: '&id, is_active, category_id',
            categoryMappings: '&id, csv_category, category_id'
        }).upgrade(tx => {
            // Migrate existing expenses: set is_fixed to false
            return tx.table('expenses').toCollection().modify(expense => {
                if (expense.is_fixed === undefined) {
                    expense.is_fixed = false;
                }
            });
        });

        this.on('populate', () => {
            this.seedCategories();
            this.seedPaymentMethods();
            this.seedIncomeSources();
        });
    }

    private async seedCategories() {
        const count = await this.categories.count();
        if (count > 0) return;

        const now = new Date().toISOString();
        const initialCategories = [
            { major: '食費', minors: ['外食', 'スーパー', 'コンビニ'] },
            { major: '日用品', minors: ['生活用品'] },
            { major: '交通', minors: ['電車', 'ガソリン'] },
            { major: '娯楽', minors: ['レジャー', 'サブスク'] },
            { major: '医療', minors: ['病院', '薬'] },
            { major: '教育', minors: ['書籍', '習い事'] },
            { major: '住居', minors: ['家賃', '光熱費'] },
            { major: 'その他', minors: [] },
        ];

        let sortOrder = 0;
        const categoriesToAdd: Category[] = [];

        for (const cat of initialCategories) {
            if (cat.minors.length === 0) {
                categoriesToAdd.push({
                    id: uuidv4(),
                    major_name: cat.major,
                    minor_name: null,
                    sort_order: sortOrder++,
                    is_active: true,
                    created_at: now,
                    updated_at: now
                });
            } else {
                for (const minor of cat.minors) {
                    categoriesToAdd.push({
                        id: uuidv4(),
                        major_name: cat.major,
                        minor_name: minor,
                        sort_order: sortOrder++,
                        is_active: true,
                        created_at: now,
                        updated_at: now
                    });
                }
            }
        }
        await this.categories.bulkAdd(categoriesToAdd);
    }

    private async seedPaymentMethods() {
        const count = await this.paymentMethods.count();
        if (count > 0) return;

        const now = new Date().toISOString();
        const methods = ['現金', 'クレジットカード', '電子マネー', 'QR決済', '振込', '未設定'];
        const methodsToAdd: PaymentMethod[] = methods.map((name, index) => ({
            id: uuidv4(),
            name,
            sort_order: index,
            is_active: true,
            created_at: now,
            updated_at: now
        }));
        await this.paymentMethods.bulkAdd(methodsToAdd);
    }

    private async seedIncomeSources() {
        const count = await this.incomeSources.count();
        if (count > 0) return;

        const now = new Date().toISOString();
        const sources = ['給与', '副収入', '臨時収入'];
        const sourcesToAdd: IncomeSource[] = sources.map((name, index) => ({
            id: uuidv4(),
            name,
            sort_order: index,
            is_active: true,
            created_at: now,
            updated_at: now
        }));
        await this.incomeSources.bulkAdd(sourcesToAdd);
    }
}

export const db = new HouseholdExpenseDB();
