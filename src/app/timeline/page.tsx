"use client";

import { useFirebaseData } from "@/hooks/useFirebaseData";
import { useState } from "react";
import { format, addDays, startOfWeek, parseISO, differenceInDays, isToday, isPast, isFuture } from "date-fns";
import { getTodayStr, addDaysToStr } from "@/lib/dateUtils";
import { CheckCircle2, Circle, X, Calendar, Clock, AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getWeekStart(d: Date) {
    return startOfWeek(d, { weekStartsOn: 1 }); // Monday
}

interface RevisionEvent {
    dateStr: string;
    topicId: string;
    topicName: string;
    revision: number;
    label?: string;
    totalRevs: number;
    completed: boolean;
    overdue: boolean;
}

// ─── Day Cell ─────────────────────────────────────────────────────────────────

function DayCell({ dateStr, events, onClick }: {
    dateStr: string;
    events: RevisionEvent[];
    onClick: () => void;
}) {
    const dt = parseISO(dateStr);
    const today = isToday(dt);
    const past = isPast(dt) && !today;
    const dayNum = format(dt, 'd');
    const monthLabel = format(dt, 'MMM');

    const completedCount = events.filter(e => e.completed).length;
    const overdueCount = events.filter(e => e.overdue && !e.completed).length;
    const pendingCount = events.filter(e => !e.completed && !e.overdue).length;

    const hasSomething = events.length > 0;

    return (
        <div
            onClick={hasSomething ? onClick : undefined}
            className={`relative min-h-[80px] md:min-h-[100px] rounded-xl border p-2 transition-all
                ${today ? 'border-indigo-500/60 bg-indigo-500/10 shadow-[0_0_20px_rgba(99,102,241,0.15)]' : 'border-white/5 bg-[#18181b]'}
                ${hasSomething ? 'cursor-pointer hover:border-white/20 hover:bg-[#1e1e22]' : 'opacity-60'}
                ${past && !hasSomething ? 'opacity-30' : ''}
            `}
        >
            {/* Day number */}
            <div className="flex items-center justify-between mb-1.5">
                <div>
                    <span className={`text-sm font-black ${today ? 'text-indigo-300' : past ? 'text-gray-600' : 'text-gray-300'}`}>{dayNum}</span>
                    {format(dt, 'd') === '1' && <span className="text-[9px] text-gray-600 ml-1 uppercase">{monthLabel}</span>}
                </div>
                {today && <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest bg-indigo-500/20 px-1.5 py-0.5 rounded-full">today</span>}
            </div>

            {/* Event pills */}
            {hasSomething && (
                <div className="flex flex-col gap-0.5">
                    {overdueCount > 0 && (
                        <div className="bg-red-500/20 border border-red-500/40 text-red-400 text-[9px] font-black px-1.5 py-0.5 rounded-md flex items-center gap-1">
                            <AlertTriangle className="w-2.5 h-2.5 shrink-0" />
                            {overdueCount} overdue
                        </div>
                    )}
                    {pendingCount > 0 && (
                        <div className="bg-blue-500/15 border border-blue-500/30 text-blue-300 text-[9px] font-black px-1.5 py-0.5 rounded-md">
                            {pendingCount} due
                        </div>
                    )}
                    {completedCount > 0 && (
                        <div className="bg-green-500/10 border border-green-500/20 text-green-400 text-[9px] font-black px-1.5 py-0.5 rounded-md">
                            ✓ {completedCount} done
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ─── Day Detail Modal ─────────────────────────────────────────────────────────

function DayModal({ dateStr, events, onClose, onComplete }: {
    dateStr: string;
    events: RevisionEvent[];
    onClose: () => void;
    onComplete: (topicId: string, dateStr: string) => void;
}) {
    const dt = parseISO(dateStr);
    const sortedEvents = [...events].sort((a, b) => (a.completed ? 1 : -1) - (b.completed ? 1 : -1));

    return (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-[#18181b] border border-white/10 rounded-[2rem] p-8 w-full max-w-lg shadow-2xl max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-xl font-black text-white">{format(dt, 'EEEE, d MMMM')}</h3>
                        <p className="text-xs text-gray-500 mt-0.5">{events.length} revision{events.length !== 1 ? 's' : ''} scheduled</p>
                    </div>
                    <button onClick={onClose} className="text-gray-600 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-xl transition-all">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-3 overflow-y-auto flex-1 pr-1">
                    {sortedEvents.map((ev, i) => (
                        <div key={`${ev.topicId}-${ev.revision}-${i}`}
                            className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${ev.completed
                                ? 'bg-green-500/5 border-green-500/20 opacity-60'
                                : ev.overdue
                                    ? 'bg-red-500/10 border-red-500/30'
                                    : 'bg-[#22222a] border-white/5'
                                }`}>
                            <button
                                onClick={() => !ev.completed && onComplete(ev.topicId, dateStr)}
                                className={`shrink-0 transition-all ${ev.completed ? 'text-green-400' : ev.overdue ? 'text-red-400 hover:text-green-400' : 'text-gray-600 hover:text-indigo-400'}`}
                            >
                                {ev.completed ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                            </button>
                            <div className="flex-1 min-w-0">
                                <div className={`font-bold text-sm truncate ${ev.completed ? 'line-through text-gray-500' : 'text-white'}`}>
                                    {ev.topicName}
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                    {ev.label && (
                                        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400 bg-indigo-500/15 px-2 py-0.5 rounded-md">{ev.label}</span>
                                    )}
                                    <span className="text-[10px] text-gray-600 font-mono">Rev {ev.revision}/{ev.totalRevs}</span>
                                    {ev.overdue && !ev.completed && (
                                        <span className="text-[10px] text-red-400 font-black">• OVERDUE</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Timeline() {
    const { topics, intervals, loading, updateTopic } = useFirebaseData();
    const [weekOffset, setWeekOffset] = useState(0);
    const [selectedDay, setSelectedDay] = useState<string | null>(null);

    if (loading) {
        return (
            <div className="bg-[#101012] min-h-screen flex items-center justify-center text-gray-500 font-mono animate-pulse">
                Building revision schedule...
            </div>
        );
    }

    const today = getTodayStr();

    // Build events map: dateStr -> RevisionEvent[]
    const eventsMap: Record<string, RevisionEvent[]> = {};

    topics.filter(t => !t.archived && t.type === 'spaced' && t.intervalId).forEach(topic => {
        const interval = intervals.find(i => i.id === topic.intervalId);
        if (!interval) return;

        interval.days.forEach((dayOffset, index) => {
            const dateStr = addDaysToStr(topic.startDate, dayOffset);
            const completed = topic.completedDates.includes(dateStr);
            const overdue = !completed && isPast(parseISO(dateStr)) && dateStr !== today;

            if (!eventsMap[dateStr]) eventsMap[dateStr] = [];
            eventsMap[dateStr].push({
                dateStr,
                topicId: topic.id,
                topicName: topic.name,
                revision: index + 1,
                label: interval.labels?.[index],
                totalRevs: interval.days.length,
                completed,
                overdue,
            });
        });
    });

    // Stats
    const allEvents = Object.values(eventsMap).flat();
    const totalRevisions = allEvents.length;
    const completedRevisions = allEvents.filter(e => e.completed).length;
    const overdueRevisions = allEvents.filter(e => e.overdue && !e.completed).length;
    const todayRevisions = (eventsMap[today] || []).filter(e => !e.completed).length;

    // Calendar grid — 5 weeks (Mon-Sun)
    const baseWeekStart = getWeekStart(new Date());
    const gridStart = addDays(baseWeekStart, weekOffset * 7 - 14); // start 2 weeks before current offset
    const TOTAL_DAYS = 35; // 5 weeks

    const gridDays = Array.from({ length: TOTAL_DAYS }, (_, i) => ({
        dateStr: format(addDays(gridStart, i), 'yyyy-MM-dd'),
        weekDay: i % 7,
    }));

    const handleComplete = (topicId: string, completeDateStr: string) => {
        const topic = topics.find(t => t.id === topicId);
        if (!topic) return;
        updateTopic(topicId, { completedDates: [...topic.completedDates, completeDateStr] });
    };

    const selectedEvents = selectedDay ? (eventsMap[selectedDay] || []) : [];

    return (
        <div className="bg-[#101012] min-h-screen text-gray-300 p-6 md:p-10 pb-24">
            {selectedDay && selectedEvents.length > 0 && (
                <DayModal
                    dateStr={selectedDay}
                    events={selectedEvents}
                    onClose={() => setSelectedDay(null)}
                    onComplete={handleComplete}
                />
            )}

            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-black text-white tracking-tight">Revision Timeline</h1>
                <p className="text-xs text-gray-500 mt-1.5">Your scheduled spaced-repetition topics — click any day to see what's due.</p>
            </div>

            {/* Stats bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
                {[
                    { label: 'Today Due', value: todayRevisions, color: todayRevisions > 0 ? 'text-indigo-400' : 'text-gray-600', cls: todayRevisions > 0 ? 'border-indigo-500/30' : '' },
                    { label: 'Overdue', value: overdueRevisions, color: overdueRevisions > 0 ? 'text-red-400' : 'text-gray-600', cls: overdueRevisions > 0 ? 'border-red-500/30' : '' },
                    { label: 'Total Completed', value: completedRevisions, color: 'text-green-400', cls: '' },
                    { label: 'Total Scheduled', value: totalRevisions, color: 'text-gray-300', cls: '' },
                ].map(s => (
                    <div key={s.label} className={`bg-[#18181b] border border-white/5 ${s.cls} rounded-2xl p-4`}>
                        <div className="text-[9px] font-black uppercase tracking-widest text-gray-600 mb-1">{s.label}</div>
                        <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
                    </div>
                ))}
            </div>

            {/* Calendar nav */}
            <div className="flex items-center justify-between mb-4">
                <div className="text-sm font-bold text-gray-400">
                    {format(gridStart, 'MMM d')} – {format(addDays(gridStart, TOTAL_DAYS - 1), 'MMM d, yyyy')}
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setWeekOffset(w => w - 1)} className="bg-[#18181b] border border-white/5 hover:border-white/20 text-gray-400 hover:text-white p-2 rounded-xl transition-all">
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button onClick={() => setWeekOffset(0)} className="bg-[#18181b] border border-white/5 hover:border-indigo-500/40 text-gray-400 hover:text-indigo-400 px-4 py-2 rounded-xl text-xs font-bold transition-all">
                        Today
                    </button>
                    <button onClick={() => setWeekOffset(w => w + 1)} className="bg-[#18181b] border border-white/5 hover:border-white/20 text-gray-400 hover:text-white p-2 rounded-xl transition-all">
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-1.5 mb-1.5">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
                    <div key={d} className="text-center text-[10px] font-black text-gray-600 uppercase tracking-widest py-1">{d}</div>
                ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1.5">
                {gridDays.map(({ dateStr }) => (
                    <DayCell
                        key={dateStr}
                        dateStr={dateStr}
                        events={eventsMap[dateStr] || []}
                        onClick={() => setSelectedDay(dateStr)}
                    />
                ))}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 mt-6 border-t border-white/5 pt-6">
                {[
                    { label: 'Due', cls: 'bg-blue-500/15 border border-blue-500/30 text-blue-300' },
                    { label: 'Overdue', cls: 'bg-red-500/15 border border-red-500/30 text-red-400' },
                    { label: 'Done', cls: 'bg-green-500/10 border border-green-500/20 text-green-400' },
                    { label: 'Today', cls: 'bg-indigo-500/15 border border-indigo-500/40 text-indigo-300' },
                ].map(l => (
                    <div key={l.label} className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${l.cls}`}>{l.label}</span>
                    </div>
                ))}
                <div className="ml-auto text-[10px] text-gray-600 flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Click any day to see revisions &amp; mark done
                </div>
            </div>
        </div>
    );
}
