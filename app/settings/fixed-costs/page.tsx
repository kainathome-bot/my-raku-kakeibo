"use client";

import { useState } from 'react';
import { useFixedCosts } from '@/hooks/useFixedCosts';
import { useCategories, usePaymentMethods } from '@/hooks/useMasterData';
import { postFixedCostsForMonth, hasFixedCostsPostedForMonth } from '@/lib/fixedCostPosting';
import { Button } from '@/components/ui/Button';
import { Input, NumericInput } from '@/components/ui/Input';
import { useToast } from '@/components/providers/ToastProvider';
import { ArrowLeft, Plus, Edit2, Trash2, Play } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

const selectClassName = "block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600";

export default function FixedCostsPage() {
    const { fixedCosts, activeFixedCosts, addFixedCost, updateFixedCost, deleteFixedCost } = useFixedCosts();
    const { activeCategories, categories } = useCategories();
    const { activePaymentMethods, paymentMethods } = usePaymentMethods();
    const { showToast } = useToast();

    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isPosting, setIsPosting] = useState(false);

    const [name, setName] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [paymentMethodId, setPaymentMethodId] = useState('');
    const [amount, setAmount] = useState<number | ''>('');

    const resetForm = () => {
        setName('');
        setCategoryId('');
        setPaymentMethodId('');
        setAmount('');
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !categoryId || !paymentMethodId || amount === '') return;

        await addFixedCost({
            name,
            category_id: categoryId,
            payment_method_id: paymentMethodId,
            amount: Number(amount),
            is_active: true
        });
        showToast('追加しました', 'success');
        resetForm();
        setIsAdding(false);
    };

    const handleUpdate = async () => {
        if (!editingId || !name || !categoryId || !paymentMethodId || amount === '') return;

        await updateFixedCost(editingId, {
            name,
            category_id: categoryId,
            payment_method_id: paymentMethodId,
            amount: Number(amount)
        });
        showToast('更新しました', 'success');
        resetForm();
        setEditingId(null);
    };

    const startEdit = (fc: typeof activeFixedCosts[0]) => {
        setEditingId(fc.id);
        setName(fc.name);
        setCategoryId(fc.category_id);
        setPaymentMethodId(fc.payment_method_id);
        setAmount(fc.amount);
    };

    const handleDelete = async (id: string) => {
        if (confirm('削除しますか？')) {
            await deleteFixedCost(id);
            showToast('削除しました', 'info');
        }
    };

    const handleManualPost = async () => {
        setIsPosting(true);
        try {
            const currentMonth = format(new Date(), 'yyyy-MM');
            const alreadyPosted = await hasFixedCostsPostedForMonth(currentMonth);

            if (alreadyPosted) {
                showToast('今月分は既に計上済みです', 'info');
            } else {
                const count = await postFixedCostsForMonth(currentMonth);
                if (count > 0) {
                    showToast(`${count}件の固定費を計上しました`, 'success');
                } else {
                    showToast('計上する固定費がありません', 'info');
                }
            }
        } catch (error) {
            showToast('エラーが発生しました', 'error');
        } finally {
            setIsPosting(false);
        }
    };

    const getCategoryName = (id: string) => {
        const cat = categories?.find(c => c.id === id);
        return cat ? `${cat.major_name}${cat.minor_name ? ` (${cat.minor_name})` : ''}` : '不明';
    };

    const getPaymentMethodName = (id: string) => {
        const pm = paymentMethods?.find(p => p.id === id);
        return pm?.name ?? '不明';
    };

    return (
        <div className="p-4 safe-area-bottom pb-24">
            <div className="flex items-center gap-2 mb-6">
                <Link href="/settings">
                    <ArrowLeft className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                </Link>
                <h1 className="text-xl font-bold dark:text-white">固定費管理</h1>
            </div>

            <div className="mb-6">
                <Button
                    onClick={handleManualPost}
                    isLoading={isPosting}
                    className="w-full"
                    variant="secondary"
                >
                    <Play className="h-4 w-4 mr-2" />
                    今月分の固定費を計上
                </Button>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                    ※ 毎月1日に自動計上されます（重複なし）
                </p>
            </div>

            <div className="space-y-4">
                {(isAdding || editingId) && (
                    <form onSubmit={isAdding ? handleAdd : (e) => { e.preventDefault(); handleUpdate(); }} className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg border border-blue-100 dark:border-blue-800 space-y-3">
                        <Input
                            placeholder="名称（例：家賃）"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            required
                            autoFocus
                        />
                        <select
                            value={categoryId}
                            onChange={e => setCategoryId(e.target.value)}
                            className={selectClassName}
                            required
                        >
                            <option value="">カテゴリを選択</option>
                            {activeCategories.map(cat => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.major_name} {cat.minor_name ? `(${cat.minor_name})` : ''}
                                </option>
                            ))}
                        </select>
                        <select
                            value={paymentMethodId}
                            onChange={e => setPaymentMethodId(e.target.value)}
                            className={selectClassName}
                            required
                        >
                            <option value="">支払い方法を選択</option>
                            {activePaymentMethods.map(pm => (
                                <option key={pm.id} value={pm.id}>
                                    {pm.name}
                                </option>
                            ))}
                        </select>
                        <NumericInput
                            value={amount}
                            onChange={setAmount}
                            placeholder="金額"
                            required
                        />
                        <div className="flex gap-2">
                            <Button type="submit" size="sm" className="flex-1">
                                {isAdding ? '追加' : '更新'}
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => { resetForm(); setIsAdding(false); setEditingId(null); }}
                            >
                                キャンセル
                            </Button>
                        </div>
                    </form>
                )}

                {!isAdding && !editingId && (
                    <Button onClick={() => setIsAdding(true)} className="w-full flex gap-2">
                        <Plus className="h-4 w-4" /> 固定費を追加
                    </Button>
                )}

                <ul className="space-y-2">
                    {activeFixedCosts.map(fc => (
                        <li key={fc.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg border dark:border-gray-700 shadow-sm">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-gray-100">{fc.name}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        {getCategoryName(fc.category_id)} • {getPaymentMethodName(fc.payment_method_id)}
                                    </p>
                                </div>
                                <p className="font-bold text-lg dark:text-white">¥{fc.amount.toLocaleString()}</p>
                            </div>
                            <div className="flex gap-2 mt-3">
                                <button
                                    onClick={() => startEdit(fc)}
                                    className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                                >
                                    <Edit2 className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={() => handleDelete(fc.id)}
                                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>

                {activeFixedCosts.length === 0 && !isAdding && (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-4 text-sm">
                        固定費がまだ登録されていません
                    </p>
                )}
            </div>
        </div>
    );
}
