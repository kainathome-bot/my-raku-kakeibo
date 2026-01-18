"use client";

import { useEffect, useState } from 'react';
import { useCategories, usePaymentMethods } from '@/hooks/useMasterData';
import { useExpenses } from '@/hooks/useExpenses';
import { Button } from '@/components/ui/Button';
import { Input, NumericInput } from '@/components/ui/Input';
import { useToast } from '@/components/providers/ToastProvider';
import { db } from '@/lib/db';
import { format } from 'date-fns';

interface EntryFormProps {
    editingId: string | null;
    onSuccess: () => void;
    onCancelEdit: () => void;
    selectedDate: string;
    onDateChange: (date: string) => void;
}

export function EntryForm({
    editingId,
    onSuccess,
    onCancelEdit,
    selectedDate,
    onDateChange
}: EntryFormProps) {
    const { activeCategories } = useCategories();
    const { activePaymentMethods } = usePaymentMethods();
    const { addExpense, updateExpense, deleteExpense } = useExpenses();
    const { showToast } = useToast();

    const [categoryId, setCategoryId] = useState('');
    const [amount, setAmount] = useState<number | ''>('');
    const [description, setDescription] = useState('');
    const [rating, setRating] = useState<'○' | '△' | '✖' | null>(null);
    const [paymentMethodId, setPaymentMethodId] = useState('');
    const [memo, setMemo] = useState('');

    const [isLoading, setIsLoading] = useState(false);

    // Load editing data
    useEffect(() => {
        if (editingId) {
            db.expenses.get(editingId).then((exp) => {
                if (exp) {
                    onDateChange(exp.date);
                    setCategoryId(exp.category_id);
                    setAmount(exp.amount);
                    setDescription(exp.description);
                    setRating(exp.rating);
                    setPaymentMethodId(exp.payment_method_id);
                    setMemo(exp.memo);
                }
            });
        }
    }, [editingId, onDateChange]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedDate || !categoryId || amount === '' || !paymentMethodId) {
            showToast('必須項目を入力してください', 'error');
            return;
        }

        setIsLoading(true);
        try {
            const expenseData = {
                date: selectedDate,
                category_id: categoryId,
                payment_method_id: paymentMethodId,
                amount: Number(amount),
                description,
                rating,
                memo
            };

            if (editingId) {
                await updateExpense(editingId, expenseData);
                showToast('更新しました', 'success');
                onSuccess();
            } else {
                await addExpense(expenseData);
                showToast('登録しました', 'success');
                setAmount('');
                setDescription('');
                setRating(null);
                setMemo('');
                setCategoryId('');
                setPaymentMethodId('');
                onSuccess();
            }
        } catch (error) {
            console.error(error);
            showToast('エラーが発生しました', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!editingId) return;
        if (confirm('この支出を削除しますか？')) {
            setIsLoading(true);
            await deleteExpense(editingId);
            showToast('削除しました', 'info');
            onSuccess();
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 bg-white p-4 rounded-lg shadow-sm border">
            {/* Date */}
            <div>
                <label className="block text-sm font-medium text-gray-700">日付</label>
                <Input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => onDateChange(e.target.value)}
                    required
                    className="mt-1"
                />
            </div>

            {/* Category */}
            <div>
                <label className="block text-sm font-medium text-gray-700">支出区分</label>
                <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                    required
                >
                    <option value="">支出区分を選択</option>
                    {activeCategories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                            {cat.major_name} {cat.minor_name ? `(${cat.minor_name})` : ''}
                        </option>
                    ))}
                </select>
            </div>

            {/* Amount */}
            <div>
                <label className="block text-sm font-medium text-gray-700">金額</label>
                <NumericInput
                    value={amount}
                    onChange={setAmount}
                    placeholder="0"
                    className="mt-1 text-2xl font-bold"
                    required
                />
            </div>

            {/* Description */}
            <div>
                <label className="block text-sm font-medium text-gray-700">内容</label>
                <Input
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="コンビニ、スーパーなど"
                    className="mt-1"
                />
            </div>

            {/* Rating */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">評価</label>
                <div className="flex gap-2">
                    {(['○', '△', '✖'] as const).map((r) => (
                        <button
                            key={r}
                            type="button"
                            onClick={() => setRating(rating === r ? null : r)}
                            className={`flex-1 py-2 border rounded-md text-lg font-bold transition-colors ${rating === r
                                ? (r === '○' ? 'bg-green-100 border-green-500 text-green-700' :
                                    r === '△' ? 'bg-yellow-100 border-yellow-500 text-yellow-700' :
                                        'bg-red-100 border-red-500 text-red-700')
                                : 'bg-gray-50 border-gray-200 text-gray-400 hover:bg-gray-100'
                                }`}
                        >
                            {r}
                        </button>
                    ))}
                </div>
            </div>

            {/* Payment Method */}
            <div>
                <label className="block text-sm font-medium text-gray-700">支払い方法</label>
                <select
                    value={paymentMethodId}
                    onChange={(e) => setPaymentMethodId(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                    required
                >
                    <option value="">支払い方法を選択</option>
                    {activePaymentMethods.map((pm) => (
                        <option key={pm.id} value={pm.id}>
                            {pm.name}
                        </option>
                    ))}
                </select>
            </div>

            {/* Memo */}
            <div>
                <label className="block text-sm font-medium text-gray-700">メモ</label>
                <textarea
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 min-h-[60px]"
                    placeholder="備考..."
                />
            </div>

            {/* Buttons */}
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
