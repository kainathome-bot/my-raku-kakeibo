"use client";

import { useState } from 'react';
import { useIncomeSources } from '@/hooks/useIncomeSources';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/providers/ToastProvider';
import { ArrowLeft, Plus, Edit2, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import Link from 'next/link';

export default function IncomeSourcesPage() {
    const { incomeSources, activeIncomeSources, addIncomeSource, updateIncomeSource, deleteIncomeSource } = useIncomeSources();
    const { showToast } = useToast();

    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [name, setName] = useState('');

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name) return;
        await addIncomeSource(name);
        showToast('追加しました', 'success');
        setName('');
        setIsAdding(false);
    };

    const handleUpdate = async (id: string, currentName: string) => {
        if (editingId === id) {
            await updateIncomeSource(id, { name });
            showToast('更新しました', 'success');
            setEditingId(null);
            setName('');
        } else {
            setEditingId(id);
            setName(currentName);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('削除（または非表示）にしますか？')) {
            await deleteIncomeSource(id);
            showToast('削除しました', 'info');
        }
    };

    const moveUp = async (index: number) => {
        if (index <= 0) return;
        const current = activeIncomeSources[index];
        const prev = activeIncomeSources[index - 1];
        await updateIncomeSource(current.id, { sort_order: prev.sort_order });
        await updateIncomeSource(prev.id, { sort_order: current.sort_order });
    };

    const moveDown = async (index: number) => {
        if (index >= activeIncomeSources.length - 1) return;
        const current = activeIncomeSources[index];
        const next = activeIncomeSources[index + 1];
        await updateIncomeSource(current.id, { sort_order: next.sort_order });
        await updateIncomeSource(next.id, { sort_order: current.sort_order });
    };

    return (
        <div className="p-4 safe-area-bottom pb-24">
            <div className="flex items-center gap-2 mb-6">
                <Link href="/settings">
                    <ArrowLeft className="h-6 w-6 text-gray-500" />
                </Link>
                <h1 className="text-xl font-bold">収入区分管理</h1>
            </div>

            <div className="space-y-4">
                {isAdding ? (
                    <form onSubmit={handleAdd} className="bg-green-50 p-4 rounded-lg border border-green-100 space-y-3">
                        <Input
                            placeholder="名称（例：給与）"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            required
                            autoFocus
                        />
                        <div className="flex gap-2">
                            <Button type="submit" size="sm" className="flex-1">保存</Button>
                            <Button type="button" variant="ghost" size="sm" onClick={() => setIsAdding(false)}>キャンセル</Button>
                        </div>
                    </form>
                ) : (
                    <Button onClick={() => setIsAdding(true)} className="w-full flex gap-2">
                        <Plus className="h-4 w-4" /> 追加
                    </Button>
                )}

                <ul className="space-y-2">
                    {activeIncomeSources.map((item, index) => {
                        const isEditing = editingId === item.id;
                        return (
                            <li key={item.id} className="bg-white p-3 rounded-lg border shadow-sm flex items-center gap-2">
                                {isEditing ? (
                                    <div className="flex-1">
                                        <Input
                                            value={name}
                                            onChange={e => setName(e.target.value)}
                                            placeholder="名称"
                                        />
                                    </div>
                                ) : (
                                    <div className="flex-1">
                                        <span className="font-medium text-gray-900">{item.name}</span>
                                    </div>
                                )}

                                <div className="flex flex-col gap-1">
                                    <button
                                        onClick={() => moveUp(index)}
                                        disabled={index === 0}
                                        className="text-gray-400 hover:text-blue-600 disabled:opacity-30"
                                    >
                                        <ChevronUp className="h-5 w-5" />
                                    </button>
                                    <button
                                        onClick={() => moveDown(index)}
                                        disabled={index === activeIncomeSources.length - 1}
                                        className="text-gray-400 hover:text-blue-600 disabled:opacity-30"
                                    >
                                        <ChevronDown className="h-5 w-5" />
                                    </button>
                                </div>

                                <div className="flex gap-1 ml-2">
                                    {isEditing ? (
                                        <div className="flex flex-col gap-1">
                                            <Button size="sm" onClick={() => handleUpdate(item.id, '')}>保</Button>
                                            <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>×</Button>
                                        </div>
                                    ) : (
                                        <>
                                            <button
                                                onClick={() => handleUpdate(item.id, item.name)}
                                                className="p-2 text-gray-500 hover:bg-gray-100 rounded"
                                            >
                                                <Edit2 className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(item.id)}
                                                className="p-2 text-red-500 hover:bg-red-50 rounded"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </div>
    );
}
