"use client";

import { useState } from 'react';
import { useCategories } from '@/hooks/useMasterData';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/providers/ToastProvider';
import { ChevronUp, ChevronDown, Trash2, Edit2, Plus, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function CategoriesPage() {
    const { categories, addCategory, updateCategory, deleteCategory } = useCategories();
    const { showToast } = useToast();

    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form states
    const [major, setMajor] = useState('');
    const [minor, setMinor] = useState('');

    // Only show active categories for management? Or all?
    // Use case: restore deleted? Spec says "Active flag.. unused categories can be hidden".
    // So we should see all? Or maybe a toggle to "Show Inactive".
    // For simplicity, let's show all but mark inactive visually, or just show active.
    // Req 4.2.2: "User can add/edit/delete. Sort order. Hide unused."
    // So we probably want to see them to "Unhide" them if needed. 
    // But usually "Delete" means "Hide". 
    // Let's show Active by default, toggle for Inactive.
    // Actually, 'deleteCategory' in my hook handles Logical Delete.
    // Start with Active list.

    // Filter for display
    const activeList = categories?.filter(c => c.is_active) ?? [];

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!major) return;
        try {
            await addCategory(major, minor || null);
            showToast('追加しました', 'success');
            setMajor('');
            setMinor('');
            setIsAdding(false);
        } catch (e) {
            showToast('エラーが発生しました', 'error');
        }
    };

    const handleUpdate = async (id: string, currentMajor: string, currentMinor: string | null) => {
        // If saving
        if (editingId === id) {
            await updateCategory(id, { major_name: major, minor_name: minor || null });
            showToast('更新しました', 'success');
            setEditingId(null);
            setMajor('');
            setMinor('');
        } else {
            // Start editing
            setEditingId(id);
            setMajor(currentMajor);
            setMinor(currentMinor || '');
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('削除（または非表示）にしますか？')) {
            await deleteCategory(id);
            showToast('削除しました', 'info');
        }
    };

    const moveUp = async (index: number) => {
        if (index <= 0) return;
        const current = activeList[index];
        const prev = activeList[index - 1];
        // Swap sort_order
        await updateCategory(current.id, { sort_order: prev.sort_order });
        await updateCategory(prev.id, { sort_order: current.sort_order });
    };

    const moveDown = async (index: number) => {
        if (index >= activeList.length - 1) return;
        const current = activeList[index];
        const next = activeList[index + 1];
        await updateCategory(current.id, { sort_order: next.sort_order });
        await updateCategory(next.id, { sort_order: current.sort_order });
    };

    return (
        <div className="p-4 safe-area-bottom pb-24">
            <div className="flex items-center gap-2 mb-6">
                <Link href="/settings">
                    <ArrowLeft className="h-6 w-6 text-gray-500" />
                </Link>
                <h1 className="text-xl font-bold">支出区分管理</h1>
            </div>

            <div className="space-y-4">
                {/* Add Form */}
                {isAdding ? (
                    <form onSubmit={handleAdd} className="bg-blue-50 p-4 rounded-lg border border-blue-100 space-y-3">
                        <Input
                            placeholder="大項目（必須）"
                            value={major}
                            onChange={e => setMajor(e.target.value)}
                            required
                            autoFocus
                        />
                        <Input
                            placeholder="中項目（任意）"
                            value={minor}
                            onChange={e => setMinor(e.target.value)}
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

                {/* List */}
                <ul className="space-y-2">
                    {activeList.map((item, index) => {
                        const isEditing = editingId === item.id;
                        return (
                            <li key={item.id} className="bg-white p-3 rounded-lg border shadow-sm flex items-center gap-2">
                                {isEditing ? (
                                    <div className="flex-1 space-y-2">
                                        <Input
                                            value={major}
                                            onChange={e => setMajor(e.target.value)}
                                            placeholder="大項目"
                                        />
                                        <Input
                                            value={minor}
                                            onChange={e => setMinor(e.target.value)}
                                            placeholder="中項目"
                                        />
                                    </div>
                                ) : (
                                    <div className="flex-1">
                                        <span className="font-medium text-gray-900">{item.major_name}</span>
                                        {item.minor_name && (
                                            <span className="text-sm text-gray-500 ml-2">({item.minor_name})</span>
                                        )}
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
                                        disabled={index === activeList.length - 1}
                                        className="text-gray-400 hover:text-blue-600 disabled:opacity-30"
                                    >
                                        <ChevronDown className="h-5 w-5" />
                                    </button>
                                </div>

                                <div className="flex gap-1 ml-2">
                                    {isEditing ? (
                                        <div className="flex flex-col gap-1">
                                            <Button size="sm" onClick={() => handleUpdate(item.id, '', '')}>保</Button>
                                            <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>×</Button>
                                        </div>
                                    ) : (
                                        <>
                                            <button
                                                onClick={() => handleUpdate(item.id, item.major_name, item.minor_name)}
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
