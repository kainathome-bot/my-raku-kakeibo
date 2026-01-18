"use client";

import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Expense, Income } from '@/lib/db';
import { useCategories, usePaymentMethods } from '@/hooks/useMasterData';
import { useIncomeSources } from '@/hooks/useIncomeSources';
import { generateCSV, downloadCSV } from '@/lib/csvExport';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { Download, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

type RecordType = 'expense' | 'income';
type FixedFilter = 'all' | 'fixed' | 'variable';

const selectClassName = "block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600";

export default function SearchPage() {
    const today = new Date();
    const [startDate, setStartDate] = useState(format(startOfMonth(today), 'yyyy-MM-dd'));
    const [endDate, setEndDate] = useState(format(endOfMonth(today), 'yyyy-MM-dd'));
    const [recordType, setRecordType] = useState<RecordType>('expense');
    const [categoryId, setCategoryId] = useState('');
    const [paymentMethodId, setPaymentMethodId] = useState('');
    const [rating, setRating] = useState<'○' | '△' | '✖' | ''>('');
    const [fixedFilter, setFixedFilter] = useState<FixedFilter>('all');

    const { categories, activeCategories } = useCategories();
    const { paymentMethods, activePaymentMethods } = usePaymentMethods();
    const { incomeSources } = useIncomeSources();
    const [sourceId, setSourceId] = useState('');

    const expenses = useLiveQuery(
        async () => {
            if (recordType !== 'expense') return [];
            let results = await db.expenses
                .where('date')
                .between(startDate, endDate, true, true)
                .filter(e => !e.deleted)
                .toArray();

            if (categoryId) {
                results = results.filter(e => e.category_id === categoryId);
            }
            if (paymentMethodId) {
                results = results.filter(e => e.payment_method_id === paymentMethodId);
            }
            if (rating) {
                results = results.filter(e => e.rating === rating);
            }
            if (fixedFilter === 'fixed') {
                results = results.filter(e => e.is_fixed === true);
            } else if (fixedFilter === 'variable') {
                results = results.filter(e => !e.is_fixed);
            }

            return results.sort((a, b) => b.date.localeCompare(a.date) || b.created_at.localeCompare(a.created_at));
        },
        [startDate, endDate, recordType, categoryId, paymentMethodId, rating, fixedFilter]
    );

    const incomes = useLiveQuery(
        async () => {
            if (recordType !== 'income') return [];
            let results = await db.incomes
                .where('date')
                .between(startDate, endDate, true, true)
                .filter(i => !i.deleted)
                .toArray();

            if (sourceId) {
                results = results.filter(i => i.source_id === sourceId);
            }

            return results.sort((a, b) => b.date.localeCompare(a.date) || b.created_at.localeCompare(a.created_at));
        },
        [startDate, endDate, recordType, sourceId]
    );

    const results = recordType === 'expense' ? expenses : incomes;
    const totalAmount = results?.reduce((sum, r) => sum + r.amount, 0) ?? 0;

    const getCategoryName = (id: string) => {
        const cat = categories?.find(c => c.id === id);
        return cat ? `${cat.major_name}${cat.minor_name ? ` (${cat.minor_name})` : ''}` : '不明';
    };

    const getPaymentMethodName = (id: string) => {
        const pm = paymentMethods?.find(p => p.id === id);
        return pm?.name ?? '不明';
    };

    const getSourceName = (id: string) => {
        const src = incomeSources?.find(s => s.id === id);
        return src?.name ?? '不明';
    };

    const handleExportCSV = () => {
        if (!results || results.length === 0) return;

        if (recordType === 'expense' && categories && paymentMethods) {
            const csvContent = generateCSV({
                expenses: results as Expense[],
                categories,
                paymentMethods
            });
            downloadCSV(csvContent, startDate, endDate);
        } else {
            const header = 'date,source,amount,memo';
            const rows = (results as Income[]).map(i =>
                `${i.date},${getSourceName(i.source_id)},${i.amount},"${i.memo.replace(/"/g, '""')}"`
            );
            const content = [header, ...rows].join('\n');
            const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `income_${startDate}_${endDate}.csv`;
            link.click();
        }
    };

    return (
        <div className="p-4 safe-area-bottom pb-24">
            <div className="flex items-center gap-2 mb-4">
                <Link href="/">
                    <ArrowLeft className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                </Link>
                <h1 className="text-xl font-bold dark:text-white">検索</h1>
            </div>

            <div className="flex rounded-lg bg-gray-100 dark:bg-gray-800 p-1 mb-4">
                <button
                    onClick={() => setRecordType('expense')}
                    className={cn(
                        "flex-1 py-2 text-sm font-medium rounded-md transition-colors",
                        recordType === 'expense' ? "bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white" : "text-gray-600 dark:text-gray-400"
                    )}
                >
                    支出
                </button>
                <button
                    onClick={() => setRecordType('income')}
                    className={cn(
                        "flex-1 py-2 text-sm font-medium rounded-md transition-colors",
                        recordType === 'income' ? "bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white" : "text-gray-600 dark:text-gray-400"
                    )}
                >
                    収入
                </button>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border dark:border-gray-700 mb-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-xs text-gray-500 dark:text-gray-400">開始日</label>
                        <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 dark:text-gray-400">終了日</label>
                        <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
                    </div>
                </div>

                {recordType === 'expense' ? (
                    <>
                        <div>
                            <label className="text-xs text-gray-500 dark:text-gray-400">カテゴリ</label>
                            <select
                                value={categoryId}
                                onChange={e => setCategoryId(e.target.value)}
                                className={selectClassName}
                            >
                                <option value="">すべて</option>
                                {activeCategories.map(cat => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.major_name}{cat.minor_name ? ` (${cat.minor_name})` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="text-xs text-gray-500 dark:text-gray-400">支払い方法</label>
                            <select
                                value={paymentMethodId}
                                onChange={e => setPaymentMethodId(e.target.value)}
                                className={selectClassName}
                            >
                                <option value="">すべて</option>
                                {activePaymentMethods.map(pm => (
                                    <option key={pm.id} value={pm.id}>{pm.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="text-xs text-gray-500 dark:text-gray-400">評価</label>
                            <div className="flex gap-2 mt-1">
                                {['', '○', '△', '✖'].map(r => (
                                    <button
                                        key={r}
                                        type="button"
                                        onClick={() => setRating(r as typeof rating)}
                                        className={cn(
                                            "flex-1 py-1.5 border rounded text-sm",
                                            rating === r ? "bg-blue-100 dark:bg-blue-900/50 border-blue-500 text-blue-700 dark:text-blue-300" : "border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                                        )}
                                    >
                                        {r || 'すべて'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="text-xs text-gray-500 dark:text-gray-400">固定/変動</label>
                            <div className="flex gap-2 mt-1">
                                {(['all', 'fixed', 'variable'] as const).map(f => (
                                    <button
                                        key={f}
                                        type="button"
                                        onClick={() => setFixedFilter(f)}
                                        className={cn(
                                            "flex-1 py-1.5 border rounded text-sm",
                                            fixedFilter === f ? "bg-blue-100 dark:bg-blue-900/50 border-blue-500 text-blue-700 dark:text-blue-300" : "border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                                        )}
                                    >
                                        {f === 'all' ? 'すべて' : f === 'fixed' ? '固定' : '変動'}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </>
                ) : (
                    <div>
                        <label className="text-xs text-gray-500 dark:text-gray-400">収入区分</label>
                        <select
                            value={sourceId}
                            onChange={e => setSourceId(e.target.value)}
                            className={selectClassName}
                        >
                            <option value="">すべて</option>
                            {incomeSources?.filter(s => s.is_active).map(src => (
                                <option key={src.id} value={src.id}>{src.name}</option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg mb-4 flex justify-between items-center border dark:border-gray-700">
                <span className="text-sm text-gray-700 dark:text-gray-300">
                    {results?.length ?? 0}件
                </span>
                <span className={cn("text-lg font-bold", recordType === 'income' ? "text-green-600 dark:text-green-400" : "text-gray-900 dark:text-white")}>
                    {recordType === 'income' ? '+' : ''}¥{totalAmount.toLocaleString()}
                </span>
            </div>

            <Button
                onClick={handleExportCSV}
                variant="secondary"
                disabled={!results || results.length === 0}
                className="w-full mb-4"
            >
                <Download className="h-4 w-4 mr-2" />
                CSVエクスポート
            </Button>

            <ul className="space-y-2">
                {results?.map(r => (
                    <li key={r.id} className="bg-white dark:bg-gray-800 p-3 rounded-lg border dark:border-gray-700">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{r.date}</p>
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                    {recordType === 'expense'
                                        ? getCategoryName((r as Expense).category_id)
                                        : getSourceName((r as Income).source_id)
                                    }
                                </p>
                                {recordType === 'expense' && (r as Expense).is_fixed && (
                                    <span className="text-xs bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 px-1.5 py-0.5 rounded">固定</span>
                                )}
                            </div>
                            <span className={cn("font-bold", recordType === 'income' ? "text-green-600 dark:text-green-400" : "text-gray-900 dark:text-white")}>
                                {recordType === 'income' ? '+' : ''}¥{r.amount.toLocaleString()}
                            </span>
                        </div>
                    </li>
                ))}
            </ul>

            {results?.length === 0 && (
                <p className="text-center text-gray-500 dark:text-gray-400 py-8 text-sm">
                    条件に一致するデータがありません
                </p>
            )}
        </div>
    );
}
