"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

interface Toast {
    id: string;
    message: string;
    type?: 'success' | 'error' | 'info';
}

interface ToastContextType {
    showToast: (message: string, type?: Toast['type']) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, type: Toast['type'] = 'info') => {
        const id = Math.random().toString(36).substring(7);
        setToasts((prev) => [...prev, { id, message, type }]);

        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 3000);
    }, []);

    const removeToast = (id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="fixed bottom-20 left-0 right-0 z-[100] flex flex-col items-center gap-2 pointer-events-none px-4">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={cn(
                            "pointer-events-auto flex items-center justify-between rounded-md px-4 py-2 text-sm text-white shadow-lg transition-all animate-in slide-in-from-bottom-5 fade-in w-full max-w-sm",
                            toast.type === 'success' ? "bg-green-600" :
                                toast.type === 'error' ? "bg-red-600" : "bg-gray-800"
                        )}
                    >
                        <span>{toast.message}</span>
                        <button onClick={() => removeToast(toast.id)} className="ml-2 text-white/80 hover:text-white">
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}
