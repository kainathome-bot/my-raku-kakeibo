"use client";

import Link from 'next/link';
import { ChevronRight, Tag, CreditCard, FileDown, FileUp, Wallet, Repeat, DollarSign } from 'lucide-react';

export default function SettingsPage() {
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
            <h1 className="text-xl font-bold mb-6">設定</h1>

            <section className="mb-6">
                <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 px-1">マスタデータ管理</h2>
                <div className="bg-white rounded-lg border divide-y">
                    {masterDataItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="flex items-center justify-between p-4 hover:bg-gray-50 active:bg-gray-100 transition-colors"
                        >
                            <div className="flex items-center gap-4">
                                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
                                    <item.icon className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-medium text-gray-900">{item.label}</h3>
                                    <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
                                </div>
                            </div>
                            <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
                        </Link>
                    ))}
                </div>
            </section>

            <section className="mb-6">
                <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 px-1">データ管理</h2>
                <div className="bg-white rounded-lg border divide-y">
                    {dataItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="flex items-center justify-between p-4 hover:bg-gray-50 active:bg-gray-100 transition-colors"
                        >
                            <div className="flex items-center gap-4">
                                <div className="p-2.5 bg-green-50 text-green-600 rounded-lg">
                                    <item.icon className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-medium text-gray-900">{item.label}</h3>
                                    <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
                                </div>
                            </div>
                            <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
                        </Link>
                    ))}
                </div>
            </section>

            <div className="mt-8 text-center bg-gray-50 p-4 rounded-lg">
                <p className="text-xs text-gray-400">家計簿アプリ v2.0.0</p>
                <p className="text-xs text-gray-400 mt-1">オフライン対応 • ローカルデータのみ使用</p>
            </div>
        </div>
    );
}
