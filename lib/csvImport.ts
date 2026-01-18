import { db, Expense, Category, CategoryMapping } from './db';
import { v4 as uuidv4 } from 'uuid';

interface ParsedCSVRow {
    date: string;
    category: string;
    amount: number;
    description: string;
    rating: '○' | '△' | '✖' | null;
    memo: string;
}

interface ImportResult {
    imported: number;
    skipped: number;
    errors: string[];
}

/**
 * Parse CSV content to extract expense data
 */
export function parseCSV(content: string): { rows: ParsedCSVRow[]; uniqueCategories: string[] } {
    const lines = content.split('\n').filter(line => line.trim() !== '');
    const rows: ParsedCSVRow[] = [];
    const categorySet = new Set<string>();

    // Skip header if present (detect by checking if first row contains non-date in date column)
    let startIndex = 0;
    if (lines.length > 0) {
        const firstLine = lines[0].split(',');
        // If first column looks like a header (not a date pattern)
        if (firstLine[0] && !firstLine[0].match(/^\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}$/)) {
            startIndex = 1;
        }
    }

    for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i];
        const cols = parseCSVLine(line);

        // Handle empty first column by shifting
        let offset = 0;
        if (cols[0] === '' && cols.length > 1) {
            offset = 1;
        }

        const dateRaw = cols[offset] || '';
        const categoryRaw = cols[offset + 1] || '';
        const amountRaw = cols[offset + 2] || '';
        const descriptionRaw = cols[offset + 3] || '';
        const ratingRaw = cols[offset + 4] || '';
        const memoRaw = cols[offset + 5] || '';

        // Normalize date: YYYY/MM/DD -> YYYY-MM-DD
        const date = normalizeDate(dateRaw);
        if (!date) continue; // Skip invalid rows

        // Normalize amount: remove ¥ and commas
        const amount = normalizeAmount(amountRaw);
        if (amount === null) continue;

        // Normalize rating: 〇 -> ○
        const rating = normalizeRating(ratingRaw);

        const category = categoryRaw.trim();
        if (category) {
            categorySet.add(category);
        }

        rows.push({
            date,
            category,
            amount,
            description: descriptionRaw.trim(),
            rating,
            memo: memoRaw.trim()
        });
    }

    return {
        rows,
        uniqueCategories: Array.from(categorySet).sort()
    };
}

/**
 * Parse a single CSV line handling quoted fields
 */
function parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current);

    return result;
}

function normalizeDate(dateStr: string): string | null {
    const trimmed = dateStr.trim();
    // Match various date formats
    const match = trimmed.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
    if (!match) return null;

    const year = match[1];
    const month = match[2].padStart(2, '0');
    const day = match[3].padStart(2, '0');

    return `${year}-${month}-${day}`;
}

function normalizeAmount(amountStr: string): number | null {
    const cleaned = amountStr.replace(/[¥￥,、]/g, '').trim();
    const num = parseInt(cleaned, 10);
    return isNaN(num) ? null : Math.abs(num);
}

function normalizeRating(ratingStr: string): '○' | '△' | '✖' | null {
    const trimmed = ratingStr.trim();
    if (trimmed === '〇' || trimmed === '○') return '○';
    if (trimmed === '△') return '△';
    if (trimmed === '✖' || trimmed === '×' || trimmed === 'x' || trimmed === 'X') return '✖';
    return null;
}

/**
 * Generate a hash for duplicate detection
 */
function generateExpenseHash(date: string, categoryId: string, amount: number, description: string, memo: string): string {
    return `${date}|${categoryId}|${amount}|${description}|${memo}`;
}

/**
 * Get or create category mapping
 */
export async function getCategoryMappings(): Promise<CategoryMapping[]> {
    return db.categoryMappings.toArray();
}

export async function saveCategoryMapping(csvCategory: string, categoryId: string): Promise<void> {
    const existing = await db.categoryMappings.where('csv_category').equals(csvCategory).first();
    if (existing) {
        await db.categoryMappings.update(existing.id, { category_id: categoryId });
    } else {
        await db.categoryMappings.add({
            id: uuidv4(),
            csv_category: csvCategory,
            category_id: categoryId
        });
    }
}

/**
 * Import parsed rows into database
 */
export async function importExpenses(
    rows: ParsedCSVRow[],
    categoryMap: Map<string, string>,
    defaultPaymentMethodId: string,
    skipDuplicates: boolean
): Promise<ImportResult> {
    const result: ImportResult = { imported: 0, skipped: 0, errors: [] };

    // Get existing expense hashes for duplicate detection
    const existingHashes = new Set<string>();
    if (skipDuplicates) {
        const allExpenses = await db.expenses.filter(e => !e.deleted).toArray();
        allExpenses.forEach(e => {
            existingHashes.add(generateExpenseHash(e.date, e.category_id, e.amount, e.description, e.memo));
        });
    }

    const now = new Date().toISOString();
    const expensesToAdd: Expense[] = [];

    for (const row of rows) {
        const categoryId = categoryMap.get(row.category);
        if (!categoryId) {
            result.errors.push(`カテゴリ「${row.category}」のマッピングがありません`);
            continue;
        }

        const hash = generateExpenseHash(row.date, categoryId, row.amount, row.description, row.memo);

        if (skipDuplicates && existingHashes.has(hash)) {
            result.skipped++;
            continue;
        }

        expensesToAdd.push({
            id: uuidv4(),
            date: row.date,
            category_id: categoryId,
            payment_method_id: defaultPaymentMethodId,
            amount: row.amount,
            description: row.description,
            rating: row.rating,
            memo: row.memo,
            created_at: now,
            updated_at: now,
            deleted: false,
            is_fixed: false
        });

        existingHashes.add(hash);
    }

    if (expensesToAdd.length > 0) {
        await db.expenses.bulkAdd(expensesToAdd);
        result.imported = expensesToAdd.length;
    }

    return result;
}
