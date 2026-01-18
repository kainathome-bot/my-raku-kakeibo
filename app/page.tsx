"use client";

import { useState, useEffect, Suspense, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useDailyExpenses } from '@/hooks/useExpenses';
import { useDailyIncomes } from '@/hooks/useIncomes';
import { EntryForm } from '@/components/features/entry/EntryForm';
import { IncomeForm } from '@/components/features/entry/IncomeForm';
import { TodaysList } from '@/components/features/entry/TodaysList';
import { IncomeList } from '@/components/features/entry/IncomeList';
import { format, parse } from 'date-fns';
import { ja } from 'date-fns/locale';
import Link from 'next/link';
import { Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

type EntryTab = 'expense' | 'income';

function EntryPageContent() {
  const searchParams = useSearchParams();
  const dateParam = searchParams.get('date');
  const tabParam = searchParams.get('tab') as EntryTab | null;

  const [selectedDate, setSelectedDate] = useState(dateParam || format(new Date(), 'yyyy-MM-dd'));
  const [activeTab, setActiveTab] = useState<EntryTab>(tabParam === 'income' ? 'income' : 'expense');
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [editingIncomeId, setEditingIncomeId] = useState<string | null>(null);

  useEffect(() => {
    if (dateParam) {
      setSelectedDate(dateParam);
    }
  }, [dateParam]);

  const expenses = useDailyExpenses(selectedDate);
  const incomes = useDailyIncomes(selectedDate);

  const handleEditExpense = (id: string) => {
    setEditingExpenseId(id);
    setActiveTab('expense');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEditIncome = (id: string) => {
    setEditingIncomeId(id);
    setActiveTab('income');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleExpenseSuccess = () => {
    setEditingExpenseId(null);
  };

  const handleIncomeSuccess = () => {
    setEditingIncomeId(null);
  };

  const handleDateChange = useCallback((date: string) => {
    setSelectedDate(date);
  }, []);

  const formatDateTitle = (dateStr: string, type: 'expense' | 'income') => {
    try {
      const date = parse(dateStr, 'yyyy-MM-dd', new Date());
      const label = type === 'expense' ? '支出' : '収入';
      return format(date, `yyyy年M月d日の${label}`, { locale: ja });
    } catch {
      return `${dateStr}の${type === 'expense' ? '支出' : '収入'}`;
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 space-y-4 pb-24">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">入力</h1>
        <Link
          href="/settings"
          className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          aria-label="設定"
        >
          <Settings className="h-5 w-5" />
        </Link>
      </div>

      <div className="flex rounded-lg bg-gray-100 dark:bg-gray-800 p-1">
        <button
          onClick={() => { setActiveTab('expense'); setEditingIncomeId(null); }}
          className={cn(
            "flex-1 py-2 text-sm font-medium rounded-md transition-colors",
            activeTab === 'expense'
              ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
          )}
        >
          支出
        </button>
        <button
          onClick={() => { setActiveTab('income'); setEditingExpenseId(null); }}
          className={cn(
            "flex-1 py-2 text-sm font-medium rounded-md transition-colors",
            activeTab === 'income'
              ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
          )}
        >
          収入
        </button>
      </div>

      {activeTab === 'expense' ? (
        <EntryForm
          editingId={editingExpenseId}
          onSuccess={handleExpenseSuccess}
          onCancelEdit={() => setEditingExpenseId(null)}
          selectedDate={selectedDate}
          onDateChange={handleDateChange}
        />
      ) : (
        <IncomeForm
          editingId={editingIncomeId}
          onSuccess={handleIncomeSuccess}
          onCancelEdit={() => setEditingIncomeId(null)}
          selectedDate={selectedDate}
          onDateChange={handleDateChange}
        />
      )}

      <div className="space-y-2">
        {activeTab === 'expense' ? (
          <TodaysList
            expenses={expenses}
            onEdit={handleEditExpense}
            dateTitle={formatDateTitle(selectedDate, 'expense')}
          />
        ) : (
          <IncomeList
            incomes={incomes}
            onEdit={handleEditIncome}
            dateTitle={formatDateTitle(selectedDate, 'income')}
          />
        )}
      </div>
    </div>
  );
}

export default function EntryPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20 dark:text-white">Loading...</div>}>
      <EntryPageContent />
    </Suspense>
  );
}
