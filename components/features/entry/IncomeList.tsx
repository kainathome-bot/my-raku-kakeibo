"use client";

import { useIncomeSources } from '@/hooks/useIncomeSources';
import { Income } from '@/lib/db';

interface IncomeListProps {
    incomes: Income[] | undefined;
    onEdit: (id: string) => void;
    dateTitle: string;
}

export function IncomeList({ incomes, onEdit, dateTitle }: IncomeListProps) {
    const { incomeSources } = useIncomeSources();

    if (!incomes || incomes.length === 0) {
        return (
            <div className="text-center text-gray-500 py-4 text-sm">
                この日の収入はまだありません
            </div>
        );
    }

    const getSourceName = (sourceId: string) => {
        const src = incomeSources?.find(s => s.id === sourceId);
        return src?.name ?? '不明';
    };

    const totalAmount = incomes.reduce((sum, i) => sum + i.amount, 0);

    return (
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="bg-green-50 px-4 py-2 border-b flex justify-between items-center">
                <h3 className="text-sm font-medium text-green-700">{dateTitle}</h3>
                <span className="text-sm font-bold text-green-700">¥{totalAmount.toLocaleString()}</span>
            </div>
            <ul className="divide-y divide-gray-100">
                {incomes.map((income) => (
                    <li
                        key={income.id}
                        onClick={() => onEdit(income.id)}
                        className="flex justify-between items-center p-4 hover:bg-gray-50 active:bg-gray-100 cursor-pointer transition-colors"
                    >
                        <div className="flex flex-col gap-0.5">
                            <span className="text-sm font-medium text-gray-900">
                                {getSourceName(income.source_id)}
                            </span>
                            {income.memo && (
                                <span className="text-xs text-gray-500 truncate max-w-[200px]">
                                    {income.memo}
                                </span>
                            )}
                        </div>
                        <span className="text-base font-bold text-green-600">
                            +¥{income.amount.toLocaleString()}
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    );
}
