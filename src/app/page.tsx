"use client";

import { useState } from 'react';
import { useFirebaseData, Topic } from "@/hooks/useFirebaseData";
import { getTodayStr, isDateToday, isDatePast, addDaysToStr } from "@/lib/dateUtils";
import { useCATracker } from "@/hooks/useCATracker";
import { CheckCircle2, Circle, Clock, AlertTriangle, CalendarDays, ExternalLink, Calendar as CalendarIcon, BrainCircuit, Target, ListTodo, Plus, Trash2 } from "lucide-react";
import Link from 'next/link';
import { format, differenceInDays } from "date-fns";
import { DashboardCalendar } from "@/components/DashboardCalendar";
import { DailyStreaks } from "@/components/DailyStreaks";
import { getSpacedRepetitionGuide } from "@/lib/retentionUtils";
import { WrittenAnswersWidget, MistakeLogWidget, PendingVaultWidget, WeeklyGridWidget } from "@/components/RankerWidgets";

export default function Dashboard() {
  const { topics, intervals, todos, addTodo, updateTodo, deleteTodo, loading: fbLoading, updateTopic } = useFirebaseData();
  const { subjects, loading: caLoading, updateSubject } = useCATracker();
  const [selectedDateStr, setSelectedDateStr] = useState(getTodayStr());
  const [showAllReminders, setShowAllReminders] = useState(true);
  const loading = fbLoading || caLoading;

  if (loading) {
    return <div className="animate-pulse space-y-6">
      <div className="h-8 w-64 bg-gray-100 dark:bg-gray-800 rounded"></div>
      <div className="h-40 bg-gray-100 dark:bg-gray-800/50 rounded-2xl"></div>
    </div>;
  }

  const today = getTodayStr();
  const tomorrow = addDaysToStr(today, 1);

  // Data Containers
  const itemsMap: Record<string, { revisionCount: number; reminderCount: number }> = {};

  const selectedDateRevisions: { topic: Topic; revision: number; dueDate: string; totalRevs: number; isCARevision?: boolean; subjectId?: string; revisionId?: string; completed?: boolean; label?: string }[] = [];
  const selectedDateReminders: { id: string; name?: string; topic?: Topic; dueDate: string; isCAReminder?: boolean; subjectId?: string; reminderId?: string; daysAway: number; completed?: boolean }[] = [];

  const upcomingRevisions: { name?: string; topic?: Topic; revision: number; dueDate: string; totalRevs: number; isCARevision?: boolean; subjectId?: string; revisionId?: string; daysAway: number; label?: string }[] = [];
  const allReminders: { id: string; name?: string; topic?: Topic; dueDate: string; isCAReminder?: boolean; subjectId?: string; reminderId?: string; daysAway: number; completed?: boolean }[] = [];
  const overdueItems: { name?: string; topic?: Topic; revision?: number; dueDate: string; isReminder: boolean; isCAReminder?: boolean; isCARevision?: boolean; subjectId?: string; reminderId?: string; revisionId?: string; label?: string }[] = [];

  const getDaysAway = (dueDate: string) => {
    if (dueDate === today) return 0;
    if (dueDate === tomorrow) return 1;
    return differenceInDays(new Date(dueDate), new Date(today));
  };

  topics.filter(t => !t.archived).forEach(topic => {
    if (topic.type === 'spaced' && topic.intervalId) {
      const interval = intervals.find(i => i.id === topic.intervalId);
      if (interval) {
        interval.days.forEach((dayOffset, index) => {
          const dueDate = addDaysToStr(topic.startDate, dayOffset);
          const isCompletedForDate = topic.completedDates.includes(dueDate);

          if (!isCompletedForDate) {
            if (!itemsMap[dueDate]) itemsMap[dueDate] = { revisionCount: 0, reminderCount: 0 };
            itemsMap[dueDate].revisionCount++;

            if (isDatePast(dueDate)) {
              overdueItems.push({ topic, revision: index + 1, dueDate, isReminder: false, label: interval.labels?.[index] });
            }

            // Keep upcomings for future only
            if (dueDate !== today && !isDatePast(dueDate)) {
              upcomingRevisions.push({ topic, revision: index + 1, dueDate, totalRevs: interval.days.length, daysAway: getDaysAway(dueDate), label: interval.labels?.[index] });
            }
          }

          if (dueDate === selectedDateStr) {
            selectedDateRevisions.push({ topic, revision: index + 1, dueDate, totalRevs: interval.days.length, completed: isCompletedForDate, label: interval.labels?.[index] });
          }
        });
      }
    } else if (topic.type === 'reminder' && topic.reminderDate) {
      const isCompleted = topic.completedDates.includes(topic.reminderDate);
      if (!isCompleted) {
        if (!itemsMap[topic.reminderDate]) itemsMap[topic.reminderDate] = { revisionCount: 0, reminderCount: 0 };
        itemsMap[topic.reminderDate].reminderCount++;

        if (isDatePast(topic.reminderDate)) {
          overdueItems.push({ topic, dueDate: topic.reminderDate, isReminder: true });
        } else {
          allReminders.push({ id: topic.id, topic, dueDate: topic.reminderDate, daysAway: getDaysAway(topic.reminderDate), completed: false });
        }
      }

      if (topic.reminderDate === selectedDateStr) {
        selectedDateReminders.push({ id: topic.id, topic, dueDate: topic.reminderDate, daysAway: getDaysAway(topic.reminderDate), completed: isCompleted });
      }
    }
  });

  // Extract CA Revisions & Reminders
  subjects.forEach(subj => {
    // Revisions
    (subj.revisions || []).forEach((rev, idx) => {
      const dueDateObj = new Date(rev.startDate);
      dueDateObj.setDate(dueDateObj.getDate() + rev.targetDays);
      const dueDateStr = format(dueDateObj, 'yyyy-MM-dd');

      if (!rev.completed) {
        if (!itemsMap[dueDateStr]) itemsMap[dueDateStr] = { revisionCount: 0, reminderCount: 0 };
        itemsMap[dueDateStr].revisionCount++;

        if (isDatePast(dueDateStr)) {
          overdueItems.push({ name: subj.name, dueDate: dueDateStr, isReminder: false, isCARevision: true, subjectId: subj.id, revisionId: rev.id, revision: idx + 1 });
        }

        if (dueDateStr !== today && !isDatePast(dueDateStr)) {
          upcomingRevisions.push({ name: subj.name, dueDate: dueDateStr, isCARevision: true, subjectId: subj.id, revisionId: rev.id, revision: idx + 1, totalRevs: subj.revisions.length, daysAway: differenceInDays(dueDateObj, new Date(today)) });
        }
      }

      if (dueDateStr === selectedDateStr) {
        selectedDateRevisions.push({ topic: { id: rev.id, name: subj.name, type: 'spaced', intervalId: '', createdAt: '', startDate: '', reminderDate: '', completedDates: [], archived: false } as Topic, revision: idx + 1, dueDate: dueDateStr, totalRevs: subj.revisions.length, isCARevision: true, subjectId: subj.id, revisionId: rev.id, completed: rev.completed });
      }
    });

    // Reminders
    (subj.reminders || []).forEach(rem => {
      if (!rem.completed) {
        if (!itemsMap[rem.dueDate]) itemsMap[rem.dueDate] = { revisionCount: 0, reminderCount: 0 };
        itemsMap[rem.dueDate].reminderCount++;

        if (isDatePast(rem.dueDate)) {
          overdueItems.push({ name: `${subj.name}: ${rem.text}`, dueDate: rem.dueDate, isReminder: true, isCAReminder: true, subjectId: subj.id, reminderId: rem.id });
        } else {
          allReminders.push({ id: rem.id, name: `${subj.name}: ${rem.text}`, dueDate: rem.dueDate, isCAReminder: true, subjectId: subj.id, reminderId: rem.id, daysAway: getDaysAway(rem.dueDate), completed: false });
        }
      }

      if (rem.dueDate === selectedDateStr) {
        selectedDateReminders.push({ id: rem.id, name: `${subj.name}: ${rem.text}`, dueDate: rem.dueDate, isCAReminder: true, subjectId: subj.id, reminderId: rem.id, daysAway: getDaysAway(rem.dueDate), completed: rem.completed });
      }
    });
  });

  upcomingRevisions.sort((a, b) => a.daysAway - b.daysAway);
  allReminders.sort((a, b) => a.daysAway - b.daysAway);

  const groupedReminders = {
    today: allReminders.filter(r => r.daysAway === 0),
    tomorrow: allReminders.filter(r => r.daysAway === 1),
    future: allReminders.filter(r => r.daysAway > 1)
  };

  const handleComplete = (topic: Topic, dateToComplete: string) => {
    updateTopic(topic.id, {
      completedDates: [...topic.completedDates, dateToComplete]
    });
  };

  const handleCompleteCARevision = (subjectId: string, revisionId: string) => {
    const subj = subjects.find(s => s.id === subjectId);
    if (!subj) return;
    const updatedRevs = (subj.revisions || []).map(r => r.id === revisionId ? { ...r, completed: true } : r);
    updateSubject(subjectId, { revisions: updatedRevs });
  };

  const handleCompleteCAReminder = (subjectId: string, reminderId: string) => {
    const subj = subjects.find(s => s.id === subjectId);
    if (!subj) return;
    const updatedRems = (subj.reminders || []).map(r => r.id === reminderId ? { ...r, completed: true } : r);
    updateSubject(subjectId, { reminders: updatedRems });
  };

  const EXAM_DATE = new Date(2026, 9, 1);
  const daysLeft = differenceInDays(EXAM_DATE, new Date());
  const QUOTES = [
    { q: "The exam doesn't know how hard you tried. It only cares what you can reproduce under pressure.", a: "CA Final Reality" },
    { q: "Think like a topper. Write like a topper. You become what you repeatedly do.", a: "Ranker Mindset" },
    { q: "Every question you skip today is a question you'll panic about in the hall.", a: "Hard Truth" },
    { q: "Revision without writing is an illusion of preparation.", a: "Output > Input" },
    { q: "If you can't write it in 3 hours, you don't know it yet.", a: "Exam First Principle" },
  ];
  const quote = QUOTES[new Date().getDate() % QUOTES.length];

  return (
    <div className="space-y-8">
      {/* RANKER HEADER */}
      <header className="relative rounded-[2rem] bg-[#18181b] border border-white/5 p-8 overflow-hidden flex flex-col md:flex-row gap-6 md:items-center justify-between shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="relative z-10">
          <div className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-2">CA Final · Command Center</div>
          <h1 className="text-4xl font-black text-white tracking-tight leading-none">Today's Battle</h1>
          <p className="text-gray-500 text-sm mt-2">{format(new Date(), 'EEEE, d MMMM yyyy')}</p>
        </div>
        <div className="flex gap-4 flex-wrap relative z-10">
          <div className="bg-[#101012] border border-white/5 rounded-2xl p-5 text-center min-w-[90px]">
            <div className={`text-3xl font-black ${daysLeft < 50 ? 'text-red-400' : daysLeft < 100 ? 'text-orange-400' : 'text-white'}`}>{daysLeft}</div>
            <div className="text-[9px] text-gray-600 font-black uppercase tracking-widest mt-0.5">Days Left</div>
          </div>
          <div className="bg-[#101012] border border-white/5 rounded-2xl p-5 text-center min-w-[90px]">
            <div className={`text-3xl font-black ${overdueItems.length > 0 ? 'text-red-400 animate-pulse' : 'text-green-400'}`}>{overdueItems.length}</div>
            <div className="text-[9px] text-gray-600 font-black uppercase tracking-widest mt-0.5">Overdue</div>
          </div>
          <div className="bg-[#101012] border border-white/5 rounded-2xl p-5 text-center min-w-[90px]">
            <div className="text-3xl font-black text-indigo-400">{selectedDateRevisions.filter(r => !r.completed).length}</div>
            <div className="text-[9px] text-gray-600 font-black uppercase tracking-widest mt-0.5">Due Today</div>
          </div>
        </div>
      </header>

      {/* QUOTE */}
      <div className="bg-gradient-to-r from-indigo-900/50 to-purple-900/30 border border-indigo-500/20 rounded-2xl p-6 flex gap-4 items-start">
        <span className="text-xl mt-0.5">💀</span>
        <div>
          <div className="text-white font-bold italic leading-snug">"{quote.q}"</div>
          <div className="text-indigo-400 text-xs font-black mt-2 uppercase tracking-widest">— {quote.a}</div>
        </div>
      </div>

      {/* Overdue Section */}
      {overdueItems.length > 0 && (
        <section className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 shadow-sm shadow-red-900/20">
          <div className="flex items-center space-x-2 text-red-400 mb-4 pb-2 border-b border-red-500/10">
            <AlertTriangle className="w-6 h-6" />
            <h2 className="text-xl font-bold">Overdue</h2>
          </div>
          <div className="space-y-3">
            {overdueItems.map((item, idx) => (
              <div key={`overdue-${idx}`} className="flex items-center justify-between text-red-200 bg-red-950/30 p-4 rounded-xl">
                <div>
                  <h3 className="font-medium text-lg flex items-center gap-2">
                    {item.isCAReminder || item.isCARevision ? item.name : item.topic?.name}
                    {(item.isCAReminder || item.isCARevision) && (
                      <Link href="/ca-tracker" className="text-red-400 hover:text-red-300" title="Go to CA Tracker">
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    )}
                  </h3>
                  <p className="text-sm opacity-80 mt-1">
                    {item.isReminder ? "Reminder" : `Revision ${item.revision}${item.label ? ` - ${item.label}` : ''}`}
                    <span className="mx-2">•</span>
                    Due: {item.dueDate}
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (item.isCAReminder && item.subjectId && item.reminderId) handleCompleteCAReminder(item.subjectId, item.reminderId);
                    else if (item.isCARevision && item.subjectId && item.revisionId) handleCompleteCARevision(item.subjectId, item.revisionId);
                    else if (item.topic) handleComplete(item.topic, item.dueDate);
                  }}
                  className="flex items-center space-x-2 bg-red-600/20 hover:bg-red-500/30 text-red-400 py-2 px-4 rounded-xl transition-all"
                >
                  <Circle className="w-5 h-5" />
                  <span>Mark Done</span>
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* TOP SECTION: TASKS & REMINDERS */}
      <div className="space-y-6 mb-8">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            Tasks for {selectedDateStr === today ? "Today" : format(new Date(selectedDateStr), "MMMM d, yyyy")}
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Revisions Column */}
          <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-8 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center space-x-3">
                <CalendarDays className="w-5 h-5 text-blue-400" />
                <span>Revisions</span>
              </h2>
              <span className="bg-blue-500/10 text-blue-400 text-sm font-bold px-3 py-1 rounded-full">{selectedDateRevisions.length} Tasks</span>
            </div>

            <div className="space-y-4">
              {selectedDateRevisions.length === 0 ? (
                <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>No revisions scheduled!</p>
                </div>
              ) : (
                selectedDateRevisions.map((rev, idx) => (
                  <div key={`rev-${idx}`} className="group/item flex items-center justify-between bg-gray-100 dark:bg-gray-800/50 hover:bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700/50 hover:border-gray-400 dark:border-gray-600 p-5 rounded-2xl transition-all duration-300">
                    <div>
                      <h3 className={`text-lg font-semibold flex items-center gap-2 ${rev.completed ? 'text-gray-400 dark:text-gray-500 line-through' : 'text-gray-800 dark:text-gray-100'}`}>
                        {rev.topic?.name}
                        {rev.isCARevision && (
                          <Link href="/ca-tracker" className={`${rev.completed ? 'text-gray-400 dark:text-gray-500' : 'text-blue-400 hover:text-blue-300'}`} title="Go to CA Tracker">
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                        )}
                      </h3>
                      <p className="text-sm text-blue-400 mt-1 font-medium bg-blue-500/10 inline-block px-2 py-0.5 rounded-lg">
                        Rev {rev.revision} of {rev.totalRevs}
                      </p>
                      {!rev.isCARevision && (
                        <p className="text-[11px] text-blue-500/80 dark:text-blue-400/80 mt-1.5 flex items-center gap-1 font-medium bg-white dark:bg-gray-800 p-1.5 rounded-md border border-blue-500/10 shadow-sm leading-tight">
                          {rev.label ? `Day ${rev.revision}: ${rev.label}` : getSpacedRepetitionGuide(rev.revision)}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        if (!rev.completed) {
                          if (rev.isCARevision && rev.subjectId && rev.revisionId) handleCompleteCARevision(rev.subjectId, rev.revisionId);
                          else handleComplete(rev.topic, rev.dueDate);
                        }
                      }}
                      className={`transition-colors ${rev.completed ? 'text-green-500 cursor-default' : 'text-gray-500 dark:text-gray-400 hover:text-green-400 focus:text-green-500'}`}
                      disabled={rev.completed}
                    >
                      {rev.completed ? <CheckCircle2 className="w-7 h-7" /> : <Circle className="w-7 h-7 group-hover/item:scale-110 transition-transform" />}
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Reminders Column */}
          <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-8 relative overflow-hidden flex flex-col">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-pink-500"></div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center space-x-3">
                <Clock className="w-5 h-5 text-purple-400" />
                <span>Reminders</span>
              </h2>

              <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1 shrink-0">
                <button
                  onClick={() => setShowAllReminders(true)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${showAllReminders ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                >
                  All
                </button>
                <button
                  onClick={() => setShowAllReminders(false)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${!showAllReminders ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                >
                  Selected
                </button>
              </div>
            </div>

            <div className="flex-1 space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {showAllReminders ? (
                allReminders.length === 0 ? (
                  <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                    <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>No active reminders!</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Today */}
                    {groupedReminders.today.length > 0 && (
                      <div className="space-y-3">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)]"></span>
                          Today
                        </h3>
                        {groupedReminders.today.map(topic => (
                          <div key={topic.id} className="group/rem flex items-center justify-between bg-gray-100 dark:bg-gray-800/80 hover:bg-gray-100 dark:bg-gray-800 border border-purple-900/30 hover:border-purple-500/30 p-4 rounded-2xl transition-all duration-300">
                            <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                              {topic.name || topic.topic?.name}
                              {topic.isCAReminder && (
                                <Link href="/ca-tracker" className="text-pink-400 hover:text-pink-300" title="Go to CA Tracker">
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </Link>
                              )}
                            </h3>
                            <button
                              onClick={() => {
                                if (topic.isCAReminder && topic.subjectId && topic.reminderId) handleCompleteCAReminder(topic.subjectId, topic.reminderId);
                                else if (topic.topic) handleComplete(topic.topic, topic.topic.reminderDate!);
                              }}
                              className="text-gray-500 dark:text-gray-400 hover:text-green-400 transition-colors"
                            >
                              <Circle className="w-6 h-6 hover:scale-110 transition-transform" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Tomorrow */}
                    {groupedReminders.tomorrow.length > 0 && (
                      <div className="space-y-3">
                        <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest flex items-center gap-2 pt-2 border-t border-gray-200 dark:border-gray-800/50">
                          Tomorrow
                        </h3>
                        {groupedReminders.tomorrow.map(topic => (
                          <div key={topic.id} className="flex items-center justify-between bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800/80 p-4 rounded-2xl">
                            <div className="flex flex-col">
                              <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300 flex items-center gap-2">
                                {topic.name || topic.topic?.name}
                                {topic.isCAReminder && (
                                  <Link href="/ca-tracker" className="text-pink-400/80 hover:text-pink-300" title="Go to CA Tracker">
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </Link>
                                )}
                              </h3>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Upcoming */}
                    {groupedReminders.future.length > 0 && (
                      <div className="space-y-3">
                        <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest flex items-center gap-2 pt-2 border-t border-gray-200 dark:border-gray-800/50">
                          Upcoming
                        </h3>
                        {groupedReminders.future.map(topic => (
                          <div key={topic.id} className="flex items-center justify-between bg-white dark:bg-gray-900/30 border border-gray-200 dark:border-gray-800/50 p-4 rounded-xl">
                            <div className="flex flex-col">
                              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                {topic.name || topic.topic?.name}
                                {topic.isCAReminder && (
                                  <Link href="/ca-tracker" className="text-pink-400/60 hover:text-pink-300" title="Go to CA Tracker">
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </Link>
                                )}
                              </h3>
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2">
                                <span>{format(new Date(topic.dueDate), 'MMM d, yyyy')}</span>
                                <span className="text-gray-700">•</span>
                                <span className="text-gray-600">In {topic.daysAway} days</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              ) : (
                selectedDateReminders.length === 0 ? (
                  <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                    <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>No reminders!</p>
                  </div>
                ) : (
                  selectedDateReminders.map(topic => (
                    <div key={topic.id} className="group/rem flex items-center justify-between bg-gray-100 dark:bg-gray-800/80 border border-purple-900/30 hover:border-purple-500/30 p-4 rounded-2xl transition-all duration-300">
                      <h3 className={`text-base font-semibold flex items-center gap-2 ${topic.completed ? 'text-gray-400 dark:text-gray-500 line-through' : 'text-gray-800 dark:text-gray-100'}`}>
                        {topic.name || topic.topic?.name}
                        {topic.isCAReminder && (
                          <Link href="/ca-tracker" className={`${topic.completed ? 'text-gray-400' : 'text-pink-400 hover:text-pink-300'}`} title="Go to CA Tracker">
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                        )}
                      </h3>
                      <button
                        onClick={() => {
                          if (!topic.completed) {
                            if (topic.isCAReminder && topic.subjectId && topic.reminderId) handleCompleteCAReminder(topic.subjectId, topic.reminderId);
                            else if (topic.topic) handleComplete(topic.topic, topic.topic.reminderDate!);
                          }
                        }}
                        className={`transition-colors ${topic.completed ? 'text-green-500 cursor-default' : 'text-gray-500 dark:text-gray-400 hover:text-green-400'}`}
                        disabled={topic.completed}
                      >
                        {topic.completed ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6 group-hover/item:scale-110 transition-transform" />}
                      </button>
                    </div>
                  ))
                )
              )}
            </div>
          </section>
        </div>
      </div>

      {/* WRITTEN ANSWERS WIDGET */}
      <WrittenAnswersWidget />

      {/* WEEKLY BATTLE PLAN & PENDING VAULT */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <WeeklyGridWidget />
        <PendingVaultWidget />
      </div>

      {/* MISTAKE LOG (VOICE-NOTE FAST) */}
      <MistakeLogWidget />

      {/* STREAKS SECTION */}
      <div className="mb-8">
        <DailyStreaks />
      </div>

      {/* BOTTOM SECTION: CALENDAR, UPCOMING, STATS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <div className="col-span-1">
          <DashboardCalendar
            onSelectDate={(date) => {
              setSelectedDateStr(date);
              setShowAllReminders(false);
            }}
            selectedDate={selectedDateStr}
            itemsMap={itemsMap}
          />
        </div>

        <div className="col-span-1 space-y-8">
          {/* Upcoming Revisions (Compact) */}
          {upcomingRevisions.length > 0 && (
            <section className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800/80 rounded-3xl p-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-blue-500/30"></div>
              <h2 className="text-lg font-bold text-gray-600 dark:text-gray-300 mb-4 flex items-center justify-between">
                <span className="flex items-center space-x-2">
                  <CalendarDays className="w-5 h-5 text-blue-400/70" />
                  <span>Upcoming Revisions</span>
                </span>
                <span className="bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-xs px-2 py-0.5 rounded-full">{upcomingRevisions.length}</span>
              </h2>

              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {upcomingRevisions.map((rev, idx) => (
                  <div key={`upc-rev-${idx}`} className="flex items-center justify-between bg-gray-100 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-800/60 p-4 rounded-xl">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300 flex items-center gap-2">
                        {rev.name || rev.topic?.name}
                        {rev.isCARevision && (
                          <Link href="/ca-tracker" className="text-blue-400/80 hover:text-blue-300" title="Go to CA Tracker">
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                        )}
                      </h3>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 flex items-center gap-2">
                        <span className="font-medium text-blue-400/80 bg-blue-500/10 px-1.5 py-0.5 rounded">
                          Rev {rev.revision} of {rev.totalRevs}{rev.label ? ` - ${rev.label}` : ''}
                        </span>
                        <span className="text-gray-700">•</span>
                        <span className={`font-medium ${rev.daysAway === 1 ? 'text-indigo-400' : 'text-gray-500 dark:text-gray-400'}`}>
                          {rev.daysAway === 1 ? 'Tomorrow' : `In ${rev.daysAway} days (${format(new Date(rev.dueDate), 'MMM d')})`}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        <div className="col-span-1">
          {/* Retention Stats Box */}
          <section className="bg-gradient-to-br from-indigo-50 dark:from-indigo-900/20 to-purple-50 dark:to-purple-900/20 border border-indigo-100 dark:border-indigo-800/50 rounded-3xl p-6 relative overflow-hidden">
            <h3 className="text-sm font-bold text-indigo-900 dark:text-indigo-300 uppercase tracking-widest mb-3 flex items-center gap-2">
              <BrainCircuit className="w-5 h-5 text-indigo-500" /> Wait, I Forget?
            </h3>
            <p className="text-xs text-indigo-700 dark:text-indigo-400 font-medium mb-3">After learning something NEW (with NO revision):</p>
            <ul className="text-xs space-y-2 text-indigo-800/80 dark:text-indigo-200/80 font-medium">
              <li className="flex justify-between items-center bg-white/50 dark:bg-black/20 px-3 py-1.5 rounded-lg border border-indigo-100 dark:border-indigo-500/10"><span>Hour 1:</span> <span className="font-bold text-indigo-600 dark:text-indigo-300">~100%</span></li>
              <li className="flex justify-between items-center bg-white/50 dark:bg-black/20 px-3 py-1.5 rounded-lg border border-indigo-100 dark:border-indigo-500/10"><span>Hour 24:</span> <span className="font-bold text-indigo-600 dark:text-indigo-300">~35-40%</span></li>
              <li className="flex justify-between items-center bg-white/50 dark:bg-black/20 px-3 py-1.5 rounded-lg border border-indigo-100 dark:border-indigo-500/10"><span>Day 3:</span> <span className="font-bold text-indigo-600 dark:text-indigo-300">~25%</span></li>
              <li className="flex justify-between items-center bg-white/50 dark:bg-black/20 px-3 py-1.5 rounded-lg border border-indigo-100 dark:border-indigo-500/10"><span>Day 7:</span> <span className="font-bold text-indigo-600 dark:text-indigo-300">~20%</span></li>
              <li className="flex justify-between items-center bg-white/50 dark:bg-black/20 px-3 py-1.5 rounded-lg border border-indigo-100 dark:border-indigo-500/10"><span>Day 14:</span> <span className="font-bold text-indigo-600 dark:text-indigo-300">~15%</span></li>
              <li className="flex justify-between items-center bg-white/50 dark:bg-black/20 px-3 py-1.5 rounded-lg border border-indigo-100 dark:border-indigo-500/10"><span>Day 30:</span> <span className="font-bold text-indigo-600 dark:text-indigo-300">~10%</span></li>
              <li className="flex justify-between items-center bg-white/50 dark:bg-black/20 px-3 py-1.5 rounded-lg border border-indigo-100 dark:border-indigo-500/10"><span>Day 60:</span> <span className="font-bold text-indigo-600 dark:text-indigo-300">~5%</span></li>
            </ul>
            <p className="text-[10px] mt-4 text-indigo-600/60 dark:text-indigo-300/60 font-semibold uppercase tracking-wider text-center">Revise to reset the curve!</p>
          </section>
        </div>
      </div>
    </div>
  );
}
