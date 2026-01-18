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
// Setup japanese locale for day names if needed, or just hardcode
// import { ja } from 'date-fns/locale'; 
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
    const startDate = startOfWeek(monthStart); // Default Sunday start
    const endDate = endOfWeek(monthEnd);

    // Format dates for query
    const queryStart = format(startDate, 'yyyy-MM-dd');
    const queryEnd = format(endDate, 'yyyy-MM-dd');

    // Fetch expenses for the visible range
    const expenses = usePeriodExpenses(queryStart, queryEnd);

    const days = eachDayOfInterval({ start: startDate, end: endDate });

    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

    const handleDateClick = (date: Date) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        router.push(`/?date=${dateStr}`);
    };

    // Aggregation
    const getDailyTotal = (date: Date) => {
        if (!expenses) return 0;
        const dateStr = format(date, 'yyyy-MM-dd');
        return expenses
            .filter((e: Expense) => e.date === dateStr)
            .reduce((sum: number, e: Expense) => sum + e.amount, 0);
    };

    const weekDays = ['日', '月', '火', '水', '木', '金', '土'];

    if (!expenses) {
        return <div className="flex justify-center py-20"><Loader2 className="animate-spin" /></div>;
    }

    return (
        <div className="p-4 safe-area-bottom pb-20">
            <div className="flex items-center justify-between mb-4">
                <Button variant="ghost" onClick={prevMonth} className="px-2">
                    <ChevronLeft className="h-6 w-6" />
                </Button>
                <h2 className="text-lg font-bold">
                    {format(currentMonth, 'yyyy年 MM月')}
                </h2>
                <Button variant="ghost" onClick={nextMonth} className="px-2">
                    <ChevronRight className="h-6 w-6" />
                </Button>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center mb-1">
                {weekDays.map(d => (
                    <div key={d} className="text-xs font-bold text-gray-500 py-1">
                        {d}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
                {days.map((day) => {
                    const isCurrentMonth = isSameMonth(day, monthStart);
                    const isToday = isSameDay(day, new Date());
                    const total = getDailyTotal(day);
                    const dateStr = format(day, 'yyyy-MM-dd');

                    return (
                        <div
                            key={dateStr}
                            onClick={() => handleDateClick(day)}
                            className={cn(
                                "h-16 border rounded-md p-1 flex flex-col justify-between cursor-pointer transition-colors relative",
                                !isCurrentMonth && "bg-gray-50 text-gray-400",
                                isToday && "bg-blue-50 border-blue-200",
                                "hover:bg-gray-100"
                            )}
                        >
                            <span className={cn(
                                "text-xs font-medium self-start",
                                format(day, 'E') === 'Sun' && "text-red-500",
                                format(day, 'E') === 'Sat' && "text-blue-500",
                                !isCurrentMonth && "text-gray-400"
                            )}>
                                {format(day, 'd')}
                            </span>

                            {total > 0 && (
                                <span className="text-[10px] font-bold text-gray-900 truncate w-full text-right leading-tight">
                                    ¥{total.toLocaleString()}
                                </span>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Monthly Summary? */}
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">今月の合計</span>
                    <span className="text-lg font-bold">
                        ¥{expenses.filter((e: Expense) => isSameMonth(new Date(e.date), currentMonth)).reduce((s: number, e: Expense) => s + e.amount, 0).toLocaleString()}
                    </span>
                </div>
            </div>
        </div>
    );
}
