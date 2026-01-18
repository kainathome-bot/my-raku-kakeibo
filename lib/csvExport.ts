import { Expense, Category, PaymentMethod } from './db';

interface ExportData {
    expenses: Expense[];
    categories: Category[];
    paymentMethods: PaymentMethod[];
}

export function generateCSV(data: ExportData): string {
    const { expenses, categories, paymentMethods } = data;

    // Header
    const header = [
        'date',
        'major_category',
        'minor_category',
        'amount',
        'description',
        'rating',
        'payment_method',
        'memo'
    ].join(',');

    // Sort by date ASC, then created_at ASC
    const sortedExpenses = [...expenses].sort((a, b) => {
        const dateCompare = a.date.localeCompare(b.date);
        if (dateCompare !== 0) return dateCompare;
        return a.created_at.localeCompare(b.created_at);
    });

    // Rows
    const rows = sortedExpenses.map(e => {
        const cat = categories.find(c => c.id === e.category_id);
        const pm = paymentMethods.find(p => p.id === e.payment_method_id);

        const cols = [
            e.date,
            quote(cat?.major_name ?? ''),
            quote(cat?.minor_name ?? ''),
            e.amount.toString(),
            quote(e.description),
            quote(e.rating ?? ''),
            quote(pm?.name ?? ''),
            quote(e.memo)
        ];
        return cols.join(',');
    });

    // UTF-8 with NO BOM
    return [header, ...rows].join('\n');
}

function quote(str: string): string {
    if (!str) return '';
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
}

export function downloadCSV(content: string, startDate: string, endDate: string) {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    // Filename: kakeibo_YYYY-MM-DD_YYYY-MM-DD.csv
    link.setAttribute('href', url);
    link.setAttribute('download', `kakeibo_${startDate}_${endDate}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
