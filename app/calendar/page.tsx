"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    format,
    addMonths,
    subMonths,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay
} from 'date-fns';
import { usePeriodExpenses } from '@/hooks/useExpenses';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { Expense } from '@/lib/db';

export default function CalendarPage() {
    const router = useRouter();
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const queryStart = format(startDate, 'yyyy-MM-dd');
    const queryEnd = format(endDate, 'yyyy-MM-dd');

    const expenses = usePeriodExpenses(queryStart, queryEnd);

    const days = eachDayOfInterval({ start: startDate, end: endDate });

    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

    const handleDateClick = (date: Date) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        router.push(`/?date=${dateStr}`);
    };

    const getDailyTotal = (date: Date) => {
        if (!expenses) return 0;
        const dateStr = format(date, 'yyyy-MM-dd');
        return expenses
            .filter((e: Expense) => e.date === dateStr)
            .reduce((sum: number, e: Expense) => sum + e.amount, 0);
    };

    const weekDays = ['日', '月', '火', '水', '木', '金', '土'];

    const monthlyTotal = expenses
        ?.filter((e: Expense) => isSameMonth(new Date(e.date), currentMonth))
        .reduce((s: number, e: Expense) => s + e.amount, 0) ?? 0;

    if (!expenses) {
        return <div className="flex justify-center py-20"><Loader2 className="animate-spin" /></div>;
    }

    return (
        <div className="p-4 safe-area-bottom pb-20">
            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-4">
                <Button variant="ghost" onClick={prevMonth} className="px-2">
                    <ChevronLeft className="h-6 w-6" />
                </Button>
                <h2 className="text-lg font-bold dark:text-white">
                    {format(currentMonth, 'yyyy年 MM月')}
                </h2>
                <Button variant="ghost" onClick={nextMonth} className="px-2">
                    <ChevronRight className="h-6 w-6" />
                </Button>
            </div>

            {/* Week Day Headers */}
            <div className="grid grid-cols-7 gap-1 text-center mb-1">
                {weekDays.map((d, i) => (
                    <div key={d} className={cn(
                        "text-xs font-bold py-1",
                        i === 0 ? "text-red-500" : i === 6 ? "text-blue-500" : "text-gray-500 dark:text-gray-400"
                    )}>
                        {d}
                    </div>
                ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
                {days.map((day) => {
                    const isCurrentMonth = isSameMonth(day, monthStart);
                    const isToday = isSameDay(day, new Date());
                    const total = getDailyTotal(day);
                    const dateStr = format(day, 'yyyy-MM-dd');
                    const dayOfWeek = day.getDay();

                    return (
                        <div
                            key={dateStr}
                            onClick={() => handleDateClick(day)}
                            className={cn(
                                "h-14 sm:h-16 border rounded-md p-1 flex flex-col justify-between cursor-pointer transition-colors",
                                "dark:border-gray-700 dark:bg-gray-800",
                                !isCurrentMonth && "bg-gray-100 dark:bg-gray-900 opacity-50",
                                isToday && "bg-blue-100 dark:bg-blue-900/50 border-blue-300 dark:border-blue-700",
                                "hover:bg-gray-100 dark:hover:bg-gray-700",
                                "active:bg-gray-200 dark:active:bg-gray-600"
                            )}
                        >
                            {/* Date Number */}
                            <span className={cn(
                                "text-xs font-semibold",
                                dayOfWeek === 0 && "text-red-500",
                                dayOfWeek === 6 && "text-blue-500",
                                dayOfWeek !== 0 && dayOfWeek !== 6 && "text-gray-800 dark:text-gray-200",
                                !isCurrentMonth && "opacity-50"
                            )}>
                                {format(day, 'd')}
                            </span>

                            {/* Daily Total - Improved Visibility */}
                            {total > 0 && (
                                <span className={cn(
                                    "text-[11px] sm:text-xs font-bold truncate w-full text-right",
                                    "text-orange-600 dark:text-orange-400"
                                )}>
                                    ¥{total >= 10000 ? `${Math.floor(total / 1000)}k` : total.toLocaleString()}
                                </span>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Monthly Summary - Improved Contrast */}
            <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-600 shadow-sm">
                <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        今月の合計
                    </span>
                    <span className="text-xl font-bold text-red-600 dark:text-red-400">
                        ¥{monthlyTotal.toLocaleString()}
                    </span>
                </div>
            </div>
        </div>
    );
}
