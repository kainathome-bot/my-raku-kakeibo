"use client";

import { useCategories } from '@/hooks/useMasterData';
import { Expense } from '@/lib/db';

interface TodaysListProps {
    expenses: Expense[] | undefined;
    onEdit: (id: string) => void;
    dateTitle: string;
}

export function TodaysList({ expenses, onEdit, dateTitle }: TodaysListProps) {
    const { categories } = useCategories();

    if (!expenses || expenses.length === 0) {
        return (
            <div className="text-center text-gray-500 py-4 text-sm">
                この日の支出はまだありません
            </div>
        );
    }

    const getCategoryName = (catId: string) => {
        const cat = categories?.find(c => c.id === catId);
        if (!cat) return '不明';
        return cat.minor_name ? `${cat.major_name} (${cat.minor_name})` : cat.major_name;
    };

    const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);

    return (
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 border-b flex justify-between items-center">
                <h3 className="text-sm font-medium text-gray-700">{dateTitle}</h3>
                <span className="text-sm font-bold text-gray-900">¥{totalAmount.toLocaleString()}</span>
            </div>
            <ul className="divide-y divide-gray-100">
                {expenses.map((expense) => (
                    <li
                        key={expense.id}
                        onClick={() => onEdit(expense.id)}
                        className="flex justify-between items-center p-4 hover:bg-gray-50 active:bg-gray-100 cursor-pointer transition-colors"
                    >
                        <div className="flex flex-col gap-0.5">
                            <span className="text-sm font-medium text-gray-900">
                                {getCategoryName(expense.category_id)}
                            </span>
                            {expense.description && (
                                <span className="text-xs text-gray-500 truncate max-w-[200px]">
                                    {expense.description}
                                </span>
                            )}
                        </div>
                        <span className="text-base font-bold text-gray-900">
                            ¥{expense.amount.toLocaleString()}
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    );
}
