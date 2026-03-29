"use client";

import { useState, useEffect } from "react";
import { useFirebaseData } from "@/hooks/useFirebaseData";
import { getTodayStr } from "@/lib/dateUtils";
import { Save, FileText, CheckCircle2, FilePenLine, Clock, Edit2 } from "lucide-react";
import { format } from "date-fns";

export default function DailyLog() {
    const { logs, saveDailyLog, loading } = useFirebaseData();
    const [editingDate, setEditingDate] = useState(getTodayStr());
    const [logText, setLogText] = useState("");
    const [studyHours, setStudyHours] = useState<number | ''>('');
    const [isSaving, setIsSaving] = useState(false);
    const today = getTodayStr();

    const editingLog = logs.find(l => l.date === editingDate);

    useEffect(() => {
        if (editingLog && !isSaving) {
            setLogText(editingLog.entries.join('\n'));
            setStudyHours(editingLog.studyHours || '');
        } else if (!editingLog && !isSaving) {
            setLogText("");
            setStudyHours("");
        }
    }, [editingDate, loading, logs]); // Depend on editingDate to reload when changed

    const handleSave = async () => {
        setIsSaving(true);
        const currentTime = format(new Date(), 'hh:mm a');

        let currentLines = logText.split('\n');

        // Remove trailing empty lines
        while (currentLines.length > 0 && currentLines[currentLines.length - 1].trim() === '') {
            currentLines.pop();
        }

        const oldLines = editingLog ? editingLog.entries : [];
        let matches = true;
        for (let i = 0; i < oldLines.length; i++) {
            if (currentLines[i] !== oldLines[i]) {
                matches = false;
                break;
            }
        }

        const timeRegex = /^\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)\s*-\s*/i;

        // Auto-append time only if we are editing today's log or if the feature is desired for all
        if (matches && currentLines.length > oldLines.length) {
            // Find the first non-empty line among the newly added ones
            for (let i = oldLines.length; i < currentLines.length; i++) {
                if (currentLines[i].trim() !== '') {
                    // Only add if it doesn't already have a time string
                    if (!timeRegex.test(currentLines[i])) {
                        currentLines[i] = `${currentTime} - ${currentLines[i]}`;
                    }
                    break;
                }
            }
        } else if (!editingLog && currentLines.length > 0) {
            // First log
            for (let i = 0; i < currentLines.length; i++) {
                if (currentLines[i].trim() !== '') {
                    if (!timeRegex.test(currentLines[i])) {
                        currentLines[i] = `${currentTime} - ${currentLines[i]}`;
                    }
                    break;
                }
            }
        }

        setLogText(currentLines.join('\n'));

        await saveDailyLog({
            date: editingDate,
            entries: currentLines,
            studyHours: Number(studyHours) || 0,
        }, editingLog?.id);

        // Provide a small delay for visual feedback of saving
        setTimeout(() => {
            setIsSaving(false);
        }, 500);
    };

    if (loading) return <div className="animate-pulse bg-gray-100 dark:bg-gray-800 h-64 rounded-xl"></div>;

    const sortedLogs = [...logs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const pastLogs = sortedLogs.filter(l => l.date !== editingDate).slice(0, 5);

    return (
        <div className="space-y-12">
            <header>
                <h1 className="text-4xl font-black tracking-tight text-gray-900 dark:text-white flex items-center gap-3">
                    <FilePenLine className="w-10 h-10 text-indigo-400" />
                    Daily Log
                </h1>
                <p className="text-gray-500 dark:text-gray-400 dark:text-gray-400 font-medium">Keep track of your accomplishments day by day.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-8 rounded-[2rem] shadow-[0_0_50px_-15px_rgba(99,102,241,0.1)] h-fit relative">
                    <div className="absolute -inset-0.5 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 blur-xl z-[-1] rounded-[2rem]"></div>
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white bg-clip-text text-transparent bg-gradient-to-r from-gray-100 to-gray-400">
                            {editingDate === today ? "What did you achieve today?" : `Editing log for ${format(new Date(editingDate), 'MMM d, yyyy')}`}
                        </h2>
                        {editingDate !== today && (
                            <button onClick={() => setEditingDate(today)} className="text-sm font-medium text-indigo-500 hover:text-indigo-400 transition-colors bg-indigo-500/10 px-3 py-1.5 rounded-lg">
                                Back to Today
                            </button>
                        )}
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 dark:text-gray-400 mb-2">Daily Study Hours</label>
                        <div className="flex items-center bg-gray-50 dark:bg-gray-950/50 border border-gray-300 dark:border-gray-700 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 rounded-xl px-4 py-3 transition-all">
                            <Clock className="w-5 h-5 text-indigo-400 mr-3" />
                            <input
                                type="number" step="0.5" min="0" max="24"
                                value={studyHours}
                                onChange={e => setStudyHours(Number(e.target.value))}
                                placeholder="0"
                                className="bg-transparent text-gray-700 dark:text-gray-200 outline-none w-full font-bold text-lg"
                            />
                            <span className="text-gray-500 dark:text-gray-400 font-medium">hrs</span>
                        </div>
                    </div>

                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 dark:text-gray-400 mb-2">Achievements Log</label>
                    <textarea
                        value={logText}
                        onChange={e => setLogText(e.target.value)}
                        placeholder="Type your achievements here... (One per line)"
                        className="w-full h-48 bg-gray-50 dark:bg-gray-950/50 border border-gray-300 dark:border-gray-700 rounded-2xl p-5 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none font-sans outline-none leading-relaxed transition-all mb-6 placeholder-gray-600"
                    ></textarea>

                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className={`w-full py-4 rounded-xl font-bold flex justify-center items-center space-x-2 transition-all duration-300 ${isSaving ? 'bg-indigo-800 text-indigo-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-500 shadow-[0_0_20px_rgba(79,70,229,0.4)] hover:shadow-[0_0_30px_rgba(79,70,229,0.6)] hover:-translate-y-0.5 text-gray-900 dark:text-white'}`}
                    >
                        {isSaving ? <CheckCircle2 className="w-5 h-5 animate-pulse" /> : <Save className="w-5 h-5" />}
                        <span>{isSaving ? 'Saved!' : 'Save Progress'}</span>
                    </button>
                </section>

                <section className="pl-0 lg:pl-10 lg:border-l border-gray-200 dark:border-gray-800">
                    <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-200 mb-8 flex items-center space-x-3">
                        <FileText className="w-6 h-6 text-gray-500 dark:text-gray-400 dark:text-gray-400" />
                        <span>Recent History</span>
                    </h2>

                    <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-800 before:to-transparent">
                        {pastLogs.length === 0 ? (
                            <p className="text-gray-500 dark:text-gray-400 text-center italic py-10">No recent entries found. Start logging today!</p>
                        ) : pastLogs.map((log) => (
                            <div key={log.id} className="relative flex items-start justify-between group">
                                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 z-10 text-gray-500 dark:text-gray-400 dark:text-gray-400 group-hover:bg-indigo-900 group-hover:text-indigo-400 group-hover:border-indigo-700 transition-colors shadow-sm ml-0 md:ml-auto md:mr-6 shrink-0">
                                    <div className="w-2.5 h-2.5 rounded-full bg-current"></div>
                                </div>
                                <div className="bg-white dark:bg-gray-900/40 hover:bg-gray-100 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:border-gray-700 p-6 rounded-3xl w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] transition-all ml-4 md:ml-0 shadow-sm backdrop-blur-sm">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full">{log.date}</span>
                                            <button
                                                onClick={() => {
                                                    setEditingDate(log.date);
                                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                                }}
                                                className="text-gray-400 hover:text-indigo-400 p-1 bg-gray-100 dark:bg-gray-800 hover:bg-indigo-500/10 rounded-full transition-all"
                                                title="Edit Log"
                                            >
                                                <Edit2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                        {log.studyHours ? (
                                            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full flex items-center gap-1">
                                                <Clock className="w-3 h-3 text-indigo-400" />
                                                {log.studyHours} hrs
                                            </span>
                                        ) : null}
                                    </div>
                                    <ul className="mt-4 space-y-1.5 text-gray-600 dark:text-gray-300">
                                        {log.entries.length === 0 ? (
                                            <li className="text-gray-600 italic">No entries</li>
                                        ) : log.entries.map((entry, idx) => {
                                            if (entry.trim() === '') return <li key={idx} className="h-2 list-none"></li>;
                                            const timeMatch = entry.match(/^(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)\s*-\s*)(.*)/i);
                                            if (timeMatch) {
                                                return (
                                                    <li key={idx} className="leading-snug flex items-start relative mt-3 list-none">
                                                        <span className="text-indigo-400 font-bold mr-3 whitespace-nowrap text-sm mt-0.5">{timeMatch[1].replace('-', '').trim()}</span>
                                                        <span className="text-gray-700 dark:text-gray-200">{timeMatch[2]}</span>
                                                    </li>
                                                );
                                            }
                                            return (
                                                <li key={idx} className="leading-snug flex items-start list-none">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-gray-600 mt-2 mr-3 ml-2 shrink-0"></div>
                                                    <span className="text-gray-600 dark:text-gray-300">{entry}</span>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
}
