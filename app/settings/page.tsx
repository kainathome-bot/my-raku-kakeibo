"use client";

import Link from 'next/link';
import { ChevronRight, Tag, CreditCard, FileDown, FileUp, Repeat, DollarSign, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/components/providers/ThemeProvider';
import { cn } from '@/lib/utils';

export default function SettingsPage() {
    const { theme, setTheme } = useTheme();

    const masterDataItems = [
        {
            label: '支出区分管理',
            href: '/settings/categories',
            icon: Tag,
            description: 'カテゴリの追加・編集・削除'
        },
        {
            label: '支払い方法管理',
            href: '/settings/payment-methods',
            icon: CreditCard,
            description: '支払い方法の追加・編集'
        },
        {
            label: '収入区分管理',
            href: '/settings/income-sources',
            icon: DollarSign,
            description: '収入区分の追加・編集'
        },
        {
            label: '固定費管理',
            href: '/settings/fixed-costs',
            icon: Repeat,
            description: '毎月自動計上される固定費'
        },
    ];

    const dataItems = [
        {
            label: 'CSVインポート',
            href: '/settings/csv-import',
            icon: FileUp,
            description: '既存データの取り込み'
        },
        {
            label: 'CSVエクスポート',
            href: '/settings/csv',
            icon: FileDown,
            description: '家計簿データをCSVファイルに出力'
        },
    ];

    return (
        <div className="p-4 safe-area-bottom pb-20">
            <h1 className="text-xl font-bold mb-6 dark:text-white">設定</h1>

            {/* Theme Selection */}
            <section className="mb-6">
                <h2 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 px-1">
                    表示設定
                </h2>
                <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 p-4">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">テーマ</span>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setTheme('light')}
                            className={cn(
                                "flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg border-2 transition-all",
                                theme === 'light'
                                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                                    : "border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-300"
                            )}
                        >
                            <Sun className="h-5 w-5" />
                            <span className="text-sm font-medium">ライト</span>
                        </button>
                        <button
                            onClick={() => setTheme('dark')}
                            className={cn(
                                "flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg border-2 transition-all",
                                theme === 'dark'
                                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                                    : "border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-300"
                            )}
                        >
                            <Moon className="h-5 w-5" />
                            <span className="text-sm font-medium">ダーク</span>
                        </button>
                    </div>
                </div>
            </section>

            <section className="mb-6">
                <h2 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 px-1">
                    マスタデータ管理
                </h2>
                <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 divide-y dark:divide-gray-700">
                    {masterDataItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700 active:bg-gray-100 dark:active:bg-gray-600 transition-colors"
                        >
                            <div className="flex items-center gap-4">
                                <div className="p-2.5 bg-blue-50 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-lg">
                                    <item.icon className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-medium text-gray-900 dark:text-gray-100">{item.label}</h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{item.description}</p>
                                </div>
                            </div>
                            <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
                        </Link>
                    ))}
                </div>
            </section>

            <section className="mb-6">
                <h2 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 px-1">
                    データ管理
                </h2>
                <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 divide-y dark:divide-gray-700">
                    {dataItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700 active:bg-gray-100 dark:active:bg-gray-600 transition-colors"
                        >
                            <div className="flex items-center gap-4">
                                <div className="p-2.5 bg-green-50 dark:bg-green-900/50 text-green-600 dark:text-green-400 rounded-lg">
                                    <item.icon className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-medium text-gray-900 dark:text-gray-100">{item.label}</h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{item.description}</p>
                                </div>
                            </div>
                            <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
                        </Link>
                    ))}
                </div>
            </section>

            <div className="mt-8 text-center bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
                <p className="text-xs text-gray-500 dark:text-gray-400">家計簿アプリ v2.0.0</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">オフライン対応 • ローカルデータのみ使用</p>
            </div>
        </div>
    );
}
