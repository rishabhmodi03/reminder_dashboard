"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ListTodo, PenSquare, BookOpen, Sun, Moon, StickyNote } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useTheme } from 'next-themes';
import { useState, useEffect } from 'react';
import { useFirebase } from './FirebaseProvider';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const navItems = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'CA Final Tracker', href: '/ca-tracker', icon: BookOpen },
    { name: 'Manage Topics', href: '/topics', icon: ListTodo },
    { name: 'Daily Log', href: '/log', icon: PenSquare },
    { name: 'Notes', href: '/notes', icon: StickyNote },
];

export default function Navigation() {
    const pathname = usePathname();
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const { clearProjectId, projectId } = useFirebase();

    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <nav className="fixed left-0 top-0 h-full w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 text-gray-800 dark:text-gray-100 flex flex-col pt-8 z-50 transition-all duration-300">
            <div className="px-6 mb-10">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">SpacedRep</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-400 mt-1">Focus on what matters</p>
            </div>

            <div className="flex-col flex px-4 space-y-2">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                'flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group',
                                isActive
                                    ? 'bg-blue-600/10 text-blue-400 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] border border-blue-500/20'
                                    : 'text-gray-500 dark:text-gray-400 dark:text-gray-400 hover:bg-gray-100 dark:bg-gray-800 hover:text-gray-700 dark:text-gray-200'
                            )}
                        >
                            <item.icon className={cn("w-5 h-5", isActive ? "text-blue-400" : "text-gray-500 dark:text-gray-400 dark:text-gray-400 group-hover:text-gray-700 dark:text-gray-200")} />
                            <span className="font-medium">{item.name}</span>
                        </Link>
                    );
                })}
            </div>

            <div className="mt-auto p-6 space-y-4">
                {mounted && (
                    <button
                        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                        className="flex items-center justify-center space-x-2 w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                        {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                        <span className="font-medium">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                    </button>
                )}
                {mounted && projectId && (
                    <button
                        onClick={clearProjectId}
                        className="flex items-center justify-center space-x-2 w-full px-4 py-2.5 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors mt-2 text-sm"
                    >
                        <span className="font-medium truncate w-full" title={projectId}>Log out of {projectId}</span>
                    </button>
                )}
                <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-4 border border-gray-300 dark:border-gray-700 mt-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400 text-center">Consistency is the key to mastery.</p>
                </div>
            </div>
        </nav>
    );
}
