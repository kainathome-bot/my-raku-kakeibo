"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PenLine, Calendar, BarChart3, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
    { href: '/', label: '入力', icon: PenLine },
    { href: '/calendar', label: 'カレンダー', icon: Calendar },
    { href: '/graph', label: 'グラフ', icon: BarChart3 },
    { href: '/search', label: '検索', icon: Search },
];

export function BottomNav() {
    const pathname = usePathname();

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-bottom">
            <div className="flex justify-around items-center h-14 max-w-md mx-auto">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center justify-center flex-1 h-full transition-colors",
                                isActive ? "text-blue-600" : "text-gray-400 hover:text-gray-600"
                            )}
                        >
                            <item.icon className="h-5 w-5" />
                            <span className="text-[10px] mt-0.5 font-medium">{item.label}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
