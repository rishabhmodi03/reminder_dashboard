"use client";

import { useState } from 'react';
import { useFirebaseData, Streak } from '@/hooks/useFirebaseData';
import { getTodayStr, isDatePast, addDaysToStr } from '@/lib/dateUtils';
import { CheckCircle2, Circle, Plus, Trash2, Flame } from 'lucide-react';
import { differenceInDays } from 'date-fns';

export function DailyStreaks() {
    const { streaks, addStreak, updateStreak, deleteStreak, loading } = useFirebaseData();
    const [newStreakName, setNewStreakName] = useState("");
    const today = getTodayStr();

    if (loading) return <div className="animate-pulse h-32 bg-gray-100 dark:bg-gray-800/50 rounded-2xl"></div>;

    const handleAddStreak = () => {
        if (!newStreakName.trim()) return;
        addStreak({
            name: newStreakName.trim(),
            createdAt: new Date().toISOString(),
            completedDates: [],
            archived: false,
        });
        setNewStreakName("");
    };

    const toggleStreak = (streak: Streak) => {
        if (streak.completedDates.includes(today)) {
            // Uncheck
            updateStreak(streak.id, {
                completedDates: streak.completedDates.filter(d => d !== today)
            });
        } else {
            // Check
            updateStreak(streak.id, {
                completedDates: [...streak.completedDates, today]
            });
        }
    };

    const calculateCurrentStreak = (completedDates: string[]) => {
        if (completedDates.length === 0) return 0;

        let currentDate = today;
        let streakCount = 0;
        const sortedDates = [...completedDates].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

        // Check if today is completed
        if (sortedDates.includes(today)) {
            streakCount = 1;
            currentDate = addDaysToStr(today, -1);
        } else if (sortedDates.includes(addDaysToStr(today, -1))) {
            // If today is not completed, check if yesterday was. 
            // If yesterday was, start count from yesterday.
            currentDate = addDaysToStr(today, -1);
        } else {
            // Neither today nor yesterday completed -> streak is 0
            return 0;
        }

        while (true) {
            if (sortedDates.includes(currentDate)) {
                streakCount++;
                currentDate = addDaysToStr(currentDate, -1);
            } else {
                break;
            }
        }
        return streakCount;
    };

    return (
        <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-8 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-red-500"></div>

            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center space-x-3">
                    <Flame className="w-6 h-6 text-orange-500" />
                    <span>Daily Streaks</span>
                </h2>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newStreakName}
                        onChange={(e) => setNewStreakName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddStreak()}
                        placeholder="Add new habit..."
                        className="bg-gray-100 dark:bg-gray-800 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-orange-500/50 outline-none w-48"
                    />
                    <button onClick={handleAddStreak} className="bg-orange-500 text-white p-2 rounded-xl hover:bg-orange-600 transition-colors">
                        <Plus className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {streaks.filter(s => !s.archived).map(streak => {
                    const isCompletedToday = streak.completedDates.includes(today);
                    const currentStreakCount = calculateCurrentStreak(streak.completedDates);

                    return (
                        <div key={streak.id} className="bg-gray-100 dark:bg-gray-800/50 hover:bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 rounded-2xl flex flex-col justify-between transition-all">
                            <div className="flex items-start justify-between mb-2 gap-2">
                                <h3 className="font-semibold text-gray-800 dark:text-gray-100 truncate">{streak.name}</h3>
                                <button onClick={() => deleteStreak(streak.id)} className="text-red-400 hover:text-red-500 opacity-50 hover:opacity-100 flex-shrink-0">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2 text-orange-500 bg-orange-500/10 px-3 py-1.5 rounded-lg border border-orange-500/20">
                                    <Flame className="w-4 h-4" />
                                    <span className="font-bold text-sm">{currentStreakCount} Day{currentStreakCount !== 1 ? 's' : ''}</span>
                                </div>
                                <button
                                    onClick={() => toggleStreak(streak)}
                                    className={`transition-colors p-1 rounded-full ${isCompletedToday ? 'text-orange-500' : 'text-gray-400 hover:text-orange-400'}`}
                                >
                                    {isCompletedToday ? <CheckCircle2 className="w-8 h-8" /> : <Circle className="w-8 h-8" />}
                                </button>
                            </div>
                        </div>
                    );
                })}
                {streaks.filter(s => !s.archived).length === 0 && (
                    <div className="col-span-full text-center py-8 text-gray-500">
                        <Flame className="w-10 h-10 mx-auto mb-2 opacity-20" />
                        <p>No active streaks.</p>
                    </div>
                )}
            </div>
        </section>
    );
}
