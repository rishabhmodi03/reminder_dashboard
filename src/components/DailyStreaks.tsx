"use client";

import { useState } from 'react';
import { useFirebaseData, Streak } from '@/hooks/useFirebaseData';
import { getTodayStr, addDaysToStr } from '@/lib/dateUtils';
import { Plus, Trash2, Flame, Zap, Check } from 'lucide-react';
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

    // Generate last 7 days including today
    const last7Days = Array.from({ length: 7 }, (_, i) => addDaysToStr(today, -(6 - i)));

    return (
        <section className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-gray-900 p-6 rounded-[2rem] border border-gray-200 dark:border-gray-800 shadow-[0_0_50px_-15px_rgba(99,102,241,0.1)] relative">
                <div className="absolute -inset-0.5 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 blur-xl z-[-1] rounded-[2rem]"></div>
                <div>
                    <h2 className="text-3xl font-black text-gray-900 dark:text-white flex items-center space-x-3">
                        <Flame className="w-8 h-8 text-orange-500 drop-shadow-[0_0_15px_rgba(249,115,22,0.6)]" />
                        <span>Daily Streaks</span>
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 mt-1 font-medium">Build momentum. Never miss twice.</p>
                </div>
                <div className="flex gap-2 relative z-10 w-full sm:w-auto">
                    <input
                        type="text"
                        value={newStreakName}
                        onChange={(e) => setNewStreakName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddStreak()}
                        placeholder="Add new habit..."
                        className="bg-gray-100 dark:bg-gray-950/50 border border-gray-300 dark:border-gray-700 focus-within:border-orange-500 focus-within:ring-1 focus-within:ring-orange-500 rounded-xl px-5 py-3 text-sm outline-none w-full sm:w-64 transition-all flex-1"
                    />
                    <button onClick={handleAddStreak} className="flex-shrink-0 bg-gradient-to-br from-orange-400 to-orange-600 text-white p-3 rounded-xl hover:from-orange-500 hover:to-orange-700 transition-all shadow-[0_0_20px_rgba(249,115,22,0.4)] hover:shadow-[0_0_30px_rgba(249,115,22,0.6)] hover:-translate-y-0.5">
                        <Plus className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {streaks.filter(s => !s.archived).map((streak, index) => {
                    const currentStreakCount = calculateCurrentStreak(streak.completedDates);
                    // Cycle through some nice gradients based on index
                    const gradients = [
                        "from-[#8A5CF6] via-[#A855F7] to-[#D946EF]",
                        "from-blue-500 via-indigo-500 to-violet-500",
                        "from-emerald-400 via-teal-500 to-cyan-500",
                        "from-orange-400 via-red-500 to-rose-500",
                    ];
                    const bgGradient = gradients[index % gradients.length];

                    return (
                        <div key={streak.id} className={`relative overflow-hidden bg-gradient-to-br ${bgGradient} p-6 sm:p-8 rounded-[2rem] text-white shadow-xl shadow-indigo-500/20 group hover:-translate-y-1 transition-all duration-300`}>
                            {/* Glass overlay shine */}
                            <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-white/20 to-transparent mix-blend-overlay"></div>

                            {/* Delete Button */}
                            <button
                                onClick={() => deleteStreak(streak.id)}
                                className="absolute top-5 right-5 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors backdrop-blur-md opacity-0 group-hover:opacity-100"
                            >
                                <Trash2 className="w-4 h-4 text-white/90" />
                            </button>

                            {/* Center Icon */}
                            <div className="flex justify-center mb-6 mt-4 relative">
                                <div className="absolute inset-0 bg-white/30 blur-2xl rounded-full scale-[2] pointer-events-none"></div>
                                <Zap className="w-16 h-16 text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.8)] relative z-10" fill="currentColor" />
                            </div>

                            {/* Titles */}
                            <div className="text-center mb-8 relative z-10">
                                <h3 className="text-sm font-bold uppercase tracking-widest text-white/80 mb-2">{streak.name}</h3>
                                <div className="text-4xl font-black tracking-tight mb-3 drop-shadow-md">
                                    {currentStreakCount} {currentStreakCount === 1 ? 'Day' : 'Days'} Streak
                                </div>
                                <p className="text-sm font-medium text-white/90">
                                    {currentStreakCount > 3 ? "You're on fire! Keep it going!" : "Great start! Don't break the chain."}
                                </p>
                            </div>

                            {/* Timeline Glass Card */}
                            <div className="relative z-10 bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-4 sm:p-5 w-full shadow-inner">
                                <div className="flex items-center justify-between px-1 relative">
                                    {/* Connecting Line (Base) */}
                                    <div className="absolute top-1/2 -translate-y-4 sm:-translate-y-[18px] inset-x-4 h-[3px] bg-white/10 rounded-full -z-10"></div>

                                    {/* Connecting Line (Active) */}
                                    <div className="absolute top-1/2 -translate-y-4 sm:-translate-y-[18px] left-4 h-[3px] bg-white/80 rounded-full -z-10 transition-all duration-500 shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                                        style={{
                                            width: `${Math.min(100, (calculateCurrentStreak(streak.completedDates) / 7) * 100)}%`,
                                        }}></div>

                                    {last7Days.map((dateStr) => {
                                        const isCompleted = streak.completedDates.includes(dateStr);
                                        const isToday = dateStr === today;
                                        const dayName = format(parseISO(dateStr), 'EEE'); // Mon, Tue...

                                        return (
                                            <div key={dateStr} className="flex flex-col items-center gap-2 sm:gap-3">
                                                <button
                                                    onClick={() => {
                                                        if (isCompleted) {
                                                            updateStreak(streak.id, { completedDates: streak.completedDates.filter(d => d !== dateStr) });
                                                        } else {
                                                            updateStreak(streak.id, { completedDates: [...streak.completedDates, dateStr] });
                                                        }
                                                    }}
                                                    className={`relative w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all duration-300 border-2 ${isCompleted
                                                            ? 'bg-blue-400 border-transparent shadow-[0_0_15px_rgba(255,255,255,0.8)] scale-110 z-10 text-white'
                                                            : isToday
                                                                ? 'bg-gradient-to-b from-orange-300 to-orange-500 border-transparent shadow-[0_0_15px_rgba(251,146,60,0.8)] scale-125 z-20 text-white'
                                                                : 'bg-transparent text-white/50 border-white/30 hover:border-white/60 hover:bg-white/10 hover:scale-110'
                                                        }`}
                                                >
                                                    {isCompleted ? (
                                                        <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white font-bold drop-shadow-md" strokeWidth={3} />
                                                    ) : isToday ? (
                                                        <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white drop-shadow-md" fill="currentColor" />
                                                    ) : null}
                                                </button>
                                                <span className={`text-[9px] sm:text-xs font-bold leading-none ${isToday ? 'text-white' : 'text-white/60'}`}>
                                                    {dayName}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    );
                })}
                {streaks.filter(s => !s.archived).length === 0 && (
                    <div className="col-span-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 border-dashed rounded-[2rem] p-16 text-center shadow-sm">
                        <Flame className="w-16 h-16 mx-auto mb-6 text-gray-300 dark:text-gray-700" />
                        <h3 className="text-2xl font-bold text-gray-700 dark:text-gray-300 mb-3">No Active Streaks</h3>
                        <p className="text-gray-500">Add a habit above to start building your streak and unlock beautiful achievements.</p>
                    </div>
                )}
            </div>
        </section>
    );
}
