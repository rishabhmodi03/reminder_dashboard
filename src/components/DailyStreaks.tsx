"use client";

import { useState } from 'react';
import { useFirebaseData, Streak } from '@/hooks/useFirebaseData';
import { getTodayStr, addDaysToStr } from '@/lib/dateUtils';
import { Plus, Trash2, Flame, CheckCircle2, Circle, Check } from 'lucide-react';
import { format, parseISO } from 'date-fns';

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
            updateStreak(streak.id, {
                completedDates: streak.completedDates.filter(d => d !== today)
            });
        } else {
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

        if (sortedDates.includes(today)) {
            streakCount = 1;
            currentDate = addDaysToStr(today, -1);
        } else if (sortedDates.includes(addDaysToStr(today, -1))) {
            currentDate = addDaysToStr(today, -1);
        } else {
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

    // Generate last 7 days including today
    const last7Days = Array.from({ length: 7 }, (_, i) => addDaysToStr(today, -(6 - i)));

    return (
        <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 md:p-8 relative overflow-hidden group shadow-sm">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-400 via-red-500 to-pink-500"></div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center space-x-3">
                        <Flame className="w-6 h-6 text-orange-500" />
                        <span>Daily Streaks</span>
                    </h2>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <input
                        type="text"
                        value={newStreakName}
                        onChange={(e) => setNewStreakName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddStreak()}
                        placeholder="Add new habit..."
                        className="bg-gray-100 dark:bg-gray-800 border-none rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-orange-500/50 outline-none w-full sm:w-64 transition-all"
                    />
                    <button onClick={handleAddStreak} className="bg-gradient-to-br from-orange-500 to-red-500 text-white p-2.5 rounded-xl hover:shadow-lg hover:-translate-y-0.5 transition-all">
                        <Plus className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="flex flex-col gap-4">
                {streaks.filter(s => !s.archived).map((streak) => {
                    const currentStreakCount = calculateCurrentStreak(streak.completedDates);
                    const isCompletedToday = streak.completedDates.includes(today);

                    return (
                        <div key={streak.id} className="group relative flex flex-col xl:flex-row items-center justify-between gap-6 bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700/60 p-5 rounded-[1.5rem] hover:bg-gray-100 dark:hover:bg-gray-800 transition-all">

                            {/* Left: Info */}
                            <div className="flex items-center w-full xl:w-[25%] gap-4">
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-gray-900 dark:text-gray-100 truncate text-lg">
                                        {streak.name}
                                    </h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <div className="flex items-center text-xs font-bold text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-500/10 px-2.5 py-1 rounded-full border border-orange-200 dark:border-orange-500/20 w-fit">
                                            <Flame className="w-3 h-3 mr-1" />
                                            {currentStreakCount} {currentStreakCount === 1 ? 'Day' : 'Days'}
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => deleteStreak(streak.id)}
                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100 hidden xl:block"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Middle: Timeline */}
                            <div className="w-full xl:w-[60%] flex items-center justify-center pt-2 xl:pt-0">
                                <div className="relative flex justify-between items-center w-full max-w-2xl">
                                    {/* Connecting Line (Base) */}
                                    <div className="absolute top-[14px] sm:top-[18px] inset-x-[5%] h-1 bg-gray-200 dark:bg-gray-700 rounded-full z-0"></div>

                                    {last7Days.map((dateStr, idx) => {
                                        const isCompleted = streak.completedDates.includes(dateStr);
                                        const isToday = dateStr === today;
                                        const dayName = format(parseISO(dateStr), 'EEE');

                                        // Check if this day and the previous day are both completed
                                        const isPreviousCompleted = idx > 0 && streak.completedDates.includes(last7Days[idx - 1]);

                                        return (
                                            <div key={dateStr} className="flex flex-col items-center gap-2 relative z-10 w-full">
                                                {/* Colored line segment linking previous dot to current dot */}
                                                {(idx > 0 && isCompleted && isPreviousCompleted) && (
                                                    <div className="absolute top-[14px] sm:top-[18px] right-1/2 w-[100%] h-1 bg-orange-500 z-0"></div>
                                                )}

                                                <button
                                                    onClick={() => {
                                                        const wasCompleted = streak.completedDates.includes(dateStr);
                                                        if (wasCompleted) {
                                                            updateStreak(streak.id, { completedDates: streak.completedDates.filter(d => d !== dateStr) });
                                                        } else {
                                                            updateStreak(streak.id, { completedDates: [...streak.completedDates, dateStr] });
                                                        }
                                                    }}
                                                    className={`w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all duration-300 border-2 z-10 relative ${isCompleted
                                                            ? 'bg-orange-500 border-orange-500 text-white shadow-[0_0_10px_rgba(249,115,22,0.4)] md:scale-110'
                                                            : isToday
                                                                ? 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-500 md:scale-110'
                                                                : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-300 dark:text-gray-600'
                                                        }`}
                                                >
                                                    {isCompleted ? (
                                                        <Check className="w-4 h-4 font-bold" strokeWidth={3} />
                                                    ) : isToday ? (
                                                        <Circle className="w-4 h-4 text-gray-400" />
                                                    ) : null}
                                                </button>
                                                <span className={`text-[10px] md:text-xs font-bold ${isToday ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400 dark:text-gray-500'}`}>
                                                    {dayName}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Right: Tick Button */}
                            <div className="flex items-center justify-end w-full xl:w-[15%] gap-4">
                                <button
                                    onClick={() => toggleStreak(streak)}
                                    className={`relative z-10 w-full xl:w-auto flex-shrink-0 flex items-center justify-center px-6 py-3 xl:p-4 rounded-xl xl:rounded-full font-bold transition-all duration-300 border-2 ${isCompletedToday
                                            ? 'bg-gradient-to-br from-green-400 to-green-600 border-transparent text-white shadow-[0_0_20px_rgba(74,222,128,0.4)] xl:scale-110'
                                            : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-400 hover:text-green-500 hover:border-green-400'
                                        }`}
                                >
                                    <Check className="w-6 h-6 mr-2 xl:mr-0" strokeWidth={isCompletedToday ? 3 : 2} />
                                    <span className="xl:hidden">{isCompletedToday ? 'Completed!' : 'Mark Done'}</span>
                                </button>
                                <button
                                    onClick={() => deleteStreak(streak.id)}
                                    className="p-3 text-red-500 bg-red-50 dark:bg-red-500/10 rounded-xl transition-all block xl:hidden"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>

                        </div>
                    );
                })}

                {streaks.filter(s => !s.archived).length === 0 && (
                    <div className="bg-gray-50 dark:bg-gray-800/30 border border-gray-200 dark:border-gray-800 border-dashed rounded-3xl p-12 text-center">
                        <Flame className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                        <h3 className="text-xl font-bold text-gray-700 dark:text-gray-300 mb-2">No Active Streaks</h3>
                        <p className="text-gray-500">Add a habit above to start tracking your daily streaks.</p>
                    </div>
                )}
            </div>
        </section>
    );
}
