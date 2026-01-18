"use client";

import { useState, useMemo } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';
import { Line, Pie, Bar } from 'react-chartjs-2';
import { usePeriodExpenses } from '@/hooks/useExpenses';
import { usePeriodIncomes } from '@/hooks/useIncomes';
import { useCategories } from '@/hooks/useMasterData';
import { startOfMonth, endOfMonth, subMonths, format, eachDayOfInterval } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { Expense, Income } from '@/lib/db';
import { cn } from '@/lib/utils';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
);

type PeriodType = 'thisMonth' | 'lastMonth' | 'last3Months';

export default function GraphPage() {
    const [periodType, setPeriodType] = useState<PeriodType>('thisMonth');

    const { start, end, months } = useMemo(() => {
        const today = new Date();
        switch (periodType) {
            case 'thisMonth':
                return {
                    start: startOfMonth(today),
                    end: endOfMonth(today),
                    months: [format(today, 'yyyy-MM')]
                };
            case 'lastMonth':
                const last = subMonths(today, 1);
                return {
                    start: startOfMonth(last),
                    end: endOfMonth(last),
                    months: [format(last, 'yyyy-MM')]
                };
            case 'last3Months':
                return {
                    start: startOfMonth(subMonths(today, 2)),
                    end: endOfMonth(today),
                    months: [
                        format(subMonths(today, 2), 'yyyy-MM'),
                        format(subMonths(today, 1), 'yyyy-MM'),
                        format(today, 'yyyy-MM')
                    ]
                };
            default:
                return {
                    start: startOfMonth(today),
                    end: endOfMonth(today),
                    months: [format(today, 'yyyy-MM')]
                };
        }
    }, [periodType]);

    const expenses = usePeriodExpenses(format(start, 'yyyy-MM-dd'), format(end, 'yyyy-MM-dd'));
    const incomes = usePeriodIncomes(format(start, 'yyyy-MM-dd'), format(end, 'yyyy-MM-dd'));
    const { categories } = useCategories();

    const data = useMemo(() => {
        if (!expenses || !incomes || !categories) return null;

        // Summary stats
        const totalExpense = expenses.reduce((s, e) => s + e.amount, 0);
        const totalIncome = incomes.reduce((s, i) => s + i.amount, 0);
        const fixedExpense = expenses.filter(e => e.is_fixed).reduce((s, e) => s + e.amount, 0);
        const variableExpense = totalExpense - fixedExpense;

        // Fixed vs Variable Pie
        const fixedVsVariablePie = {
            labels: ['固定費', '変動費'],
            datasets: [{
                data: [fixedExpense, variableExpense],
                backgroundColor: ['#8B5CF6', '#3B82F6'],
            }]
        };

        // Category breakdown
        const categoryTotals: Record<string, number> = {};
        expenses.forEach((e: Expense) => {
            const cat = categories.find(c => c.id === e.category_id);
            const name = cat ? cat.major_name : '不明';
            categoryTotals[name] = (categoryTotals[name] || 0) + e.amount;
        });

        const categoryPie = {
            labels: Object.keys(categoryTotals),
            datasets: [{
                data: Object.values(categoryTotals),
                backgroundColor: [
                    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#C9CBCF', '#E7E9ED'
                ],
            }]
        };

        // Monthly comparison (Income vs Expense) - for multi-month views
        const monthlyData = months.map(month => {
            const monthExpenses = expenses.filter(e => e.date.startsWith(month));
            const monthIncomes = incomes.filter(i => i.date.startsWith(month));
            return {
                month,
                expense: monthExpenses.reduce((s, e) => s + e.amount, 0),
                income: monthIncomes.reduce((s, i) => s + i.amount, 0)
            };
        });

        const comparisonBar = {
            labels: monthlyData.map(m => m.month.slice(5) + '月'),
            datasets: [
                {
                    label: '収入',
                    data: monthlyData.map(m => m.income),
                    backgroundColor: 'rgba(16, 185, 129, 0.7)',
                },
                {
                    label: '支出',
                    data: monthlyData.map(m => m.expense),
                    backgroundColor: 'rgba(239, 68, 68, 0.7)',
                }
            ]
        };

        // Daily trend
        const days = eachDayOfInterval({ start, end });
        const dailyLabels = days.map(d => format(d, 'MM/dd'));
        const dailyExpenseData = days.map(d => {
            const str = format(d, 'yyyy-MM-dd');
            return expenses.filter(e => e.date === str).reduce((sum, e) => sum + e.amount, 0);
        });

        const dailyLine = {
            labels: dailyLabels,
            datasets: [{
                label: '日別支出',
                data: dailyExpenseData,
                borderColor: 'rgb(59, 130, 246)',
                backgroundColor: 'rgba(59, 130, 246, 0.5)',
                tension: 0.1
            }]
        };

        return {
            totalExpense,
            totalIncome,
            fixedExpense,
            variableExpense,
            balance: totalIncome - totalExpense,
            fixedVsVariablePie,
            categoryPie,
            comparisonBar,
            dailyLine
        };
    }, [expenses, incomes, categories, start, end, months]);

    if (!data) {
        return <div className="flex justify-center py-20"><Loader2 className="animate-spin" /></div>;
    }

    return (
        <div className="p-4 safe-area-bottom pb-24 space-y-6">
            {/* Period Filter */}
            <div className="flex gap-2 overflow-x-auto pb-2">
                {(['thisMonth', 'lastMonth', 'last3Months'] as const).map((t) => (
                    <button
                        key={t}
                        onClick={() => setPeriodType(t)}
                        className={cn(
                            "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition-colors",
                            periodType === t
                                ? "bg-blue-600 text-white border-blue-600"
                                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                        )}
                    >
                        {t === 'thisMonth' ? '今月' : t === 'lastMonth' ? '先月' : '直近3ヶ月'}
                    </button>
                ))}
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-3">
                <div className="bg-white p-4 rounded-lg border">
                    <p className="text-xs text-gray-500">収入</p>
                    <p className="text-lg font-bold text-green-600">+¥{data.totalIncome.toLocaleString()}</p>
                </div>
                <div className="bg-white p-4 rounded-lg border">
                    <p className="text-xs text-gray-500">支出</p>
                    <p className="text-lg font-bold text-red-600">-¥{data.totalExpense.toLocaleString()}</p>
                </div>
                <div className="bg-white p-4 rounded-lg border">
                    <p className="text-xs text-gray-500">固定費</p>
                    <p className="text-lg font-bold text-purple-600">¥{data.fixedExpense.toLocaleString()}</p>
                </div>
                <div className="bg-white p-4 rounded-lg border">
                    <p className="text-xs text-gray-500">変動費</p>
                    <p className="text-lg font-bold text-blue-600">¥{data.variableExpense.toLocaleString()}</p>
                </div>
            </div>

            {/* Balance */}
            <div className={cn(
                "p-4 rounded-lg border text-center",
                data.balance >= 0 ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
            )}>
                <p className="text-xs text-gray-500">収支</p>
                <p className={cn(
                    "text-2xl font-bold",
                    data.balance >= 0 ? "text-green-600" : "text-red-600"
                )}>
                    {data.balance >= 0 ? '+' : ''}¥{data.balance.toLocaleString()}
                </p>
            </div>

            {/* Fixed vs Variable Pie */}
            {data.totalExpense > 0 && (
                <div className="bg-white p-4 rounded-lg shadow-sm border">
                    <h3 className="text-sm font-bold mb-2 text-gray-700">固定費 vs 変動費</h3>
                    <div className="h-[200px] w-full flex justify-center">
                        <Pie
                            data={data.fixedVsVariablePie}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: { legend: { position: 'right' as const } }
                            }}
                        />
                    </div>
                </div>
            )}

            {/* Monthly Comparison (for 3 months) */}
            {periodType === 'last3Months' && (
                <div className="bg-white p-4 rounded-lg shadow-sm border">
                    <h3 className="text-sm font-bold mb-2 text-gray-700">月別 収入 vs 支出</h3>
                    <div className="h-[200px] w-full">
                        <Bar
                            data={data.comparisonBar}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                scales: { y: { beginAtZero: true } }
                            }}
                        />
                    </div>
                </div>
            )}

            {/* Category Pie */}
            {data.categoryPie.datasets[0].data.length > 0 && (
                <div className="bg-white p-4 rounded-lg shadow-sm border">
                    <h3 className="text-sm font-bold mb-2 text-gray-700">カテゴリ別</h3>
                    <div className="h-[250px] w-full flex justify-center">
                        <Pie
                            data={data.categoryPie}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: { legend: { position: 'right' as const } }
                            }}
                        />
                    </div>
                </div>
            )}

            {/* Daily Trend */}
            <div className="bg-white p-4 rounded-lg shadow-sm border">
                <h3 className="text-sm font-bold mb-2 text-gray-700">日別推移</h3>
                <div className="h-[200px] w-full">
                    <Line
                        data={data.dailyLine}
                        options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            scales: { y: { beginAtZero: true } }
                        }}
                    />
                </div>
            </div>
        </div>
    );
}
