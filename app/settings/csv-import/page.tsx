"use client";

import { useState, useRef } from 'react';
import { parseCSV, getCategoryMappings, saveCategoryMapping, importExpenses } from '@/lib/csvImport';
import { useCategories, usePaymentMethods } from '@/hooks/useMasterData';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/providers/ToastProvider';
import { ArrowLeft, Upload, Check, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { v4 as uuidv4 } from 'uuid';
import { db } from '@/lib/db';

type ImportStep = 'upload' | 'mapping' | 'confirm' | 'done';

interface ParsedData {
    rows: ReturnType<typeof parseCSV>['rows'];
    uniqueCategories: string[];
}

export default function CSVImportPage() {
    const { categories, activeCategories, addCategory } = useCategories();
    const { paymentMethods, activePaymentMethods } = usePaymentMethods();
    const { showToast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [step, setStep] = useState<ImportStep>('upload');
    const [parsedData, setParsedData] = useState<ParsedData | null>(null);
    const [categoryMap, setCategoryMap] = useState<Map<string, string>>(new Map());
    const [skipDuplicates, setSkipDuplicates] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [importResult, setImportResult] = useState<{ imported: number; skipped: number } | null>(null);

    const defaultPaymentMethod = activePaymentMethods.find(pm => pm.name === '現金')
        || activePaymentMethods.find(pm => pm.name === '未設定')
        || activePaymentMethods[0];

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsProcessing(true);
        try {
            const content = await file.text();
            const parsed = parseCSV(content);

            if (parsed.rows.length === 0) {
                showToast('インポートできるデータがありません', 'error');
                return;
            }

            setParsedData(parsed);

            // Load existing mappings
            const existingMappings = await getCategoryMappings();
            const newMap = new Map<string, string>();

            for (const csvCat of parsed.uniqueCategories) {
                const mapping = existingMappings.find(m => m.csv_category === csvCat);
                if (mapping) {
                    newMap.set(csvCat, mapping.category_id);
                }
            }

            setCategoryMap(newMap);
            setStep('mapping');
        } catch (error) {
            showToast('ファイルの読み込みに失敗しました', 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleMappingChange = async (csvCategory: string, categoryId: string) => {
        const newMap = new Map(categoryMap);
        newMap.set(csvCategory, categoryId);
        setCategoryMap(newMap);

        // Save mapping for future imports
        await saveCategoryMapping(csvCategory, categoryId);
    };

    const handleCreateCategory = async (csvCategory: string) => {
        const now = new Date().toISOString();
        const maxOrder = await db.categories.orderBy('sort_order').last();
        const newId = uuidv4();

        await db.categories.add({
            id: newId,
            major_name: csvCategory,
            minor_name: null,
            sort_order: (maxOrder?.sort_order ?? -1) + 1,
            is_active: true,
            created_at: now,
            updated_at: now
        });

        handleMappingChange(csvCategory, newId);
        showToast(`「${csvCategory}」を作成しました`, 'success');
    };

    const allMapped = parsedData?.uniqueCategories.every(cat => categoryMap.has(cat)) ?? false;

    const handleConfirm = async () => {
        if (!parsedData || !defaultPaymentMethod) return;

        setIsProcessing(true);
        try {
            const result = await importExpenses(
                parsedData.rows,
                categoryMap,
                defaultPaymentMethod.id,
                skipDuplicates
            );

            setImportResult(result);
            setStep('done');

            if (result.imported > 0) {
                showToast(`${result.imported}件をインポートしました`, 'success');
            }
        } catch (error) {
            showToast('インポートに失敗しました', 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    const resetImport = () => {
        setStep('upload');
        setParsedData(null);
        setCategoryMap(new Map());
        setImportResult(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="p-4 safe-area-bottom pb-24">
            <div className="flex items-center gap-2 mb-6">
                <Link href="/settings">
                    <ArrowLeft className="h-6 w-6 text-gray-500" />
                </Link>
                <h1 className="text-xl font-bold">CSVインポート</h1>
            </div>

            {/* Step 1: Upload */}
            {step === 'upload' && (
                <div className="space-y-4">
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                        <p className="text-sm text-blue-800 mb-2">
                            家計簿CSVファイルをインポートします。
                        </p>
                        <ul className="text-xs text-blue-700 space-y-1">
                            <li>• 日付: YYYY/MM/DD形式</li>
                            <li>• 金額: ¥やカンマは自動除去</li>
                            <li>• 評価: 〇→○に自動変換</li>
                        </ul>
                    </div>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv"
                        onChange={handleFileSelect}
                        className="hidden"
                    />

                    <Button
                        onClick={() => fileInputRef.current?.click()}
                        isLoading={isProcessing}
                        className="w-full h-32 flex flex-col gap-2"
                    >
                        <Upload className="h-8 w-8" />
                        CSVファイルを選択
                    </Button>
                </div>
            )}

            {/* Step 2: Mapping */}
            {step === 'mapping' && parsedData && (
                <div className="space-y-4">
                    <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm font-medium">{parsedData.rows.length}件のデータを検出</p>
                        <p className="text-xs text-gray-500">{parsedData.uniqueCategories.length}種類のカテゴリ</p>
                    </div>

                    <div className="space-y-3">
                        <h2 className="text-sm font-medium">カテゴリマッピング</h2>
                        {parsedData.uniqueCategories.map(csvCat => (
                            <div key={csvCat} className="bg-white p-3 rounded-lg border">
                                <p className="text-sm font-medium mb-2">「{csvCat}」</p>
                                <div className="flex gap-2">
                                    <select
                                        value={categoryMap.get(csvCat) || ''}
                                        onChange={e => handleMappingChange(csvCat, e.target.value)}
                                        className="flex-1 rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm"
                                    >
                                        <option value="">マッピング先を選択</option>
                                        {activeCategories.map(cat => (
                                            <option key={cat.id} value={cat.id}>
                                                {cat.major_name}{cat.minor_name ? ` (${cat.minor_name})` : ''}
                                            </option>
                                        ))}
                                    </select>
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        onClick={() => handleCreateCategory(csvCat)}
                                    >
                                        新規
                                    </Button>
                                </div>
                                {categoryMap.has(csvCat) && (
                                    <div className="flex items-center gap-1 mt-1 text-green-600">
                                        <Check className="h-3 w-3" />
                                        <span className="text-xs">マッピング済み</span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                        <input
                            type="checkbox"
                            id="skipDuplicates"
                            checked={skipDuplicates}
                            onChange={e => setSkipDuplicates(e.target.checked)}
                            className="rounded"
                        />
                        <label htmlFor="skipDuplicates" className="text-sm">
                            重複データをスキップ
                        </label>
                    </div>

                    <div className="flex gap-2">
                        <Button variant="ghost" onClick={resetImport} className="flex-1">
                            キャンセル
                        </Button>
                        <Button
                            onClick={handleConfirm}
                            disabled={!allMapped}
                            isLoading={isProcessing}
                            className="flex-[2]"
                        >
                            インポート実行
                        </Button>
                    </div>

                    {!allMapped && (
                        <div className="flex items-center gap-2 text-amber-600 text-sm">
                            <AlertCircle className="h-4 w-4" />
                            すべてのカテゴリをマッピングしてください
                        </div>
                    )}
                </div>
            )}

            {/* Step 3: Done */}
            {step === 'done' && importResult && (
                <div className="space-y-4">
                    <div className="bg-green-50 p-6 rounded-lg border border-green-100 text-center">
                        <Check className="h-12 w-12 text-green-600 mx-auto mb-3" />
                        <p className="text-lg font-bold text-green-800">インポート完了</p>
                        <p className="text-sm text-green-700 mt-2">
                            {importResult.imported}件を追加
                            {importResult.skipped > 0 && `（${importResult.skipped}件スキップ）`}
                        </p>
                    </div>

                    <Button onClick={resetImport} className="w-full">
                        別のファイルをインポート
                    </Button>

                    <Link href="/">
                        <Button variant="secondary" className="w-full">
                            入力画面へ戻る
                        </Button>
                    </Link>
                </div>
            )}
        </div>
    );
}
