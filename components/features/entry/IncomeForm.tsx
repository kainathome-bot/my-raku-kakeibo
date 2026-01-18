"use client";

import { useEffect, useState } from 'react';
import { useIncomeSources } from '@/hooks/useIncomeSources';
import { useIncomes } from '@/hooks/useIncomes';
import { Button } from '@/components/ui/Button';
import { Input, NumericInput } from '@/components/ui/Input';
import { useToast } from '@/components/providers/ToastProvider';
import { db } from '@/lib/db';

interface IncomeFormProps {
    editingId: string | null;
    onSuccess: () => void;
    onCancelEdit: () => void;
    selectedDate: string;
    onDateChange: (date: string) => void;
}

const selectClassName = "mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600";

const textareaClassName = "mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 min-h-[60px] placeholder:text-gray-500 dark:placeholder:text-gray-400";

export function IncomeForm({
    editingId,
    onSuccess,
    onCancelEdit,
    selectedDate,
    onDateChange
}: IncomeFormProps) {
    const { activeIncomeSources } = useIncomeSources();
    const { addIncome, updateIncome, deleteIncome } = useIncomes();
    const { showToast } = useToast();

    const [sourceId, setSourceId] = useState('');
    const [amount, setAmount] = useState<number | ''>('');
    const [memo, setMemo] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (editingId) {
            db.incomes.get(editingId).then((inc) => {
                if (inc) {
                    onDateChange(inc.date);
                    setSourceId(inc.source_id);
                    setAmount(inc.amount);
                    setMemo(inc.memo);
                }
            });
        }
    }, [editingId, onDateChange]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedDate || !sourceId || amount === '') {
            showToast('必須項目を入力してください', 'error');
            return;
        }

        setIsLoading(true);
        try {
            const incomeData = {
                date: selectedDate,
                source_id: sourceId,
                amount: Number(amount),
                memo
            };

            if (editingId) {
                await updateIncome(editingId, incomeData);
                showToast('更新しました', 'success');
            } else {
                await addIncome(incomeData);
                showToast('登録しました', 'success');
                setAmount('');
                setMemo('');
                setSourceId('');
            }
            onSuccess();
        } catch (error) {
            console.error(error);
            showToast('エラーが発生しました', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!editingId) return;
        if (confirm('この収入を削除しますか？')) {
            setIsLoading(true);
            await deleteIncome(editingId);
            showToast('削除しました', 'info');
            onSuccess();
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border dark:border-gray-700">
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">日付</label>
                <Input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => onDateChange(e.target.value)}
                    required
                    className="mt-1"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">収入区分</label>
                <select
                    value={sourceId}
                    onChange={(e) => setSourceId(e.target.value)}
                    className={selectClassName}
                    required
                >
                    <option value="">収入区分を選択</option>
                    {activeIncomeSources.map((src) => (
                        <option key={src.id} value={src.id}>
                            {src.name}
                        </option>
                    ))}
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">金額</label>
                <NumericInput
                    value={amount}
                    onChange={setAmount}
                    placeholder="0"
                    className="mt-1 text-2xl font-bold"
                    required
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">メモ</label>
                <textarea
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                    className={textareaClassName}
                    placeholder="備考..."
                />
            </div>

            <div className="flex gap-2 pt-2">
                {!editingId ? (
                    <Button type="submit" isLoading={isLoading} className="w-full">
                        登録
                    </Button>
                ) : (
                    <>
                        <Button type="button" variant="danger" onClick={handleDelete} isLoading={isLoading} className="flex-1">
                            削除
                        </Button>
                        <Button type="submit" isLoading={isLoading} className="flex-[2]">
                            更新
                        </Button>
                        <Button type="button" variant="ghost" onClick={onCancelEdit} className="flex-none px-3">
                            キャンセル
                        </Button>
                    </>
                )}
            </div>
        </form>
    );
}
