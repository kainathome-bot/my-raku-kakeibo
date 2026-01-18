"use client";

import { useState } from 'react';
import { useCategories, usePaymentMethods } from '@/hooks/useMasterData';
import { usePeriodExpenses } from '@/hooks/useExpenses';
import { generateCSV, downloadCSV } from '@/lib/csvExport';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { ArrowLeft, Download } from 'lucide-react';
import Link from 'next/link';

export default function CSVExportPage() {
    const today = new Date();
    const [startDate, setStartDate] = useState(format(startOfMonth(today), 'yyyy-MM-dd'));
    const [endDate, setEndDate] = useState(format(endOfMonth(today), 'yyyy-MM-dd'));

    const expenses = usePeriodExpenses(startDate, endDate);
    const { categories } = useCategories();
    const { paymentMethods } = usePaymentMethods();

    const handleDownload = () => {
        if (!expenses || !categories || !paymentMethods) return;

        // We need complete lists (including inactive) for CSV export to resolve names correctly
        const csvContent = generateCSV({
            expenses: expenses,
            categories: categories,
            paymentMethods: paymentMethods
        });

        downloadCSV(csvContent, startDate, endDate);
    };

    const count = expenses?.length ?? 0;

    return (
        <div className="p-4 safe-area-bottom pb-24">
            <div className="flex items-center gap-2 mb-6">
                <Link href="/settings">
                    <ArrowLeft className="h-6 w-6 text-gray-500" />
                </Link>
                <h1 className="text-xl font-bold">CSV出力</h1>
            </div>

            <div className="space-y-6">
                <div className="bg-white p-6 rounded-lg border shadow-sm space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">開始日</label>
                        <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">終了日</label>
                        <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
                    </div>
                </div>

                <div className="text-center">
                    <p className="text-sm text-gray-600 mb-4">
                        対象期間の支出データ: <span className="font-bold text-lg">{count}</span> 件
                    </p>

                    <Button
                        onClick={handleDownload}
                        disabled={count === 0}
                        className="w-full h-12 text-base"
                    >
                        <Download className="mr-2 h-5 w-5" /> CSVダウンロード
                    </Button>
                    <p className="text-xs text-gray-400 mt-2">
                        ※ UTF-8形式（ヘッダー付）で出力されます
                    </p>
                </div>
            </div>
        </div>
    );
}
