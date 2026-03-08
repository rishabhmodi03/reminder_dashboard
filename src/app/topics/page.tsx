"use client";

import { useState } from "react";
import { useFirebaseData, Interval } from "@/hooks/useFirebaseData";
import { getTodayStr } from "@/lib/dateUtils";
import { Plus, Archive, ArchiveRestore, Clock, Activity, FolderGit2 } from "lucide-react";

export default function ManageTopics() {
    const { topics, intervals, addTopic, updateTopic, addInterval, loading } = useFirebaseData();

    // Topic Form State
    const [name, setName] = useState("");
    const [type, setType] = useState<"spaced" | "reminder">("spaced");
    const [intervalId, setIntervalId] = useState("");
    const [startDate, setStartDate] = useState(getTodayStr());
    const [reminderDate, setReminderDate] = useState(getTodayStr());

    // Interval Form State
    const [intervalName, setIntervalName] = useState("");
    const [intervalDays, setIntervalDays] = useState("");
    const [showIntervalForm, setShowIntervalForm] = useState(false);
    const [showLabelsForm, setShowLabelsForm] = useState(false);
    const [intervalLabels, setIntervalLabels] = useState<Record<number, string>>({});

    const [showArchived, setShowArchived] = useState(false);

    if (loading) return <div className="animate-pulse bg-gray-100 dark:bg-gray-800 h-64 rounded-xl"></div>;

    const handleCreateTopic = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name) return;

        await addTopic({
            name,
            type,
            intervalId: type === "spaced" ? intervalId : null,
            startDate: type === "spaced" ? startDate : "",
            reminderDate: type === "reminder" ? reminderDate : null,
            completedDates: [],
            archived: false,
            createdAt: getTodayStr(),
        });

        setName("");
    };

    const handleCreateInterval = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!intervalName || !intervalDays) return;

        const days = intervalDays.split(',').map(d => parseInt(d.trim())).filter(n => !isNaN(n));
        const labels: string[] = [];
        if (showLabelsForm) {
            for (let i = 0; i < days.length; i++) {
                labels.push(intervalLabels[i] || "");
            }
        }
        await addInterval({ name: intervalName, days, ...(showLabelsForm ? { labels } : {}) });
        setIntervalName("");
        setIntervalDays("");
        setIntervalLabels({});
        setShowLabelsForm(false);
        setShowIntervalForm(false);
    };

    const toggleArchive = (id: string, currentArchived: boolean) => {
        updateTopic(id, { archived: !currentArchived });
    };

    const filteredTopics = topics.filter(t => t.archived === showArchived);

    return (
        <div className="space-y-12">
            <header>
                <h1 className="text-4xl font-black text-gray-900 dark:text-white">Manage Topics</h1>
                <p className="text-gray-500 dark:text-gray-400 dark:text-gray-400 font-medium">Add subjects or specific reminders.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Forms Selection */}
                <div className="space-y-8 lg:col-span-1">
                    {/* Add Topic Card */}
                    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 rounded-3xl shadow-[0_0_40px_-15px_rgba(59,130,246,0.1)]">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <FolderGit2 className="w-5 h-5 text-blue-400" />
                            New Topic
                        </h2>
                        <form onSubmit={handleCreateTopic} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 dark:text-gray-400 mb-1">Name</label>
                                <input
                                    type="text"
                                    autoFocus
                                    required
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-2.5 focus:border-blue-500 focus:ring focus:ring-blue-500/20 outline-none transition-all placeholder-gray-600"
                                    placeholder="e.g. Binary Search"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 dark:text-gray-400 mb-2">Type</label>
                                <div className="flex bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 p-1 rounded-xl">
                                    <button
                                        type="button"
                                        onClick={() => setType("spaced")}
                                        className={`flex-1 py-1.5 rounded-lg text-sm font-semibold transition-all ${type === "spaced" ? "bg-gray-100 dark:bg-gray-800 text-blue-400 shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:text-gray-300"}`}
                                    >
                                        Spaced Repetition
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setType("reminder")}
                                        className={`flex-1 py-1.5 rounded-lg text-sm font-semibold transition-all ${type === "reminder" ? "bg-gray-100 dark:bg-gray-800 text-purple-400 shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:text-gray-300"}`}
                                    >
                                        One-time
                                    </button>
                                </div>
                            </div>

                            {type === "spaced" ? (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 dark:text-gray-400 mb-1">Interval Strategy</label>
                                        <select
                                            value={intervalId}
                                            onChange={e => setIntervalId(e.target.value)}
                                            required
                                            className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-2.5 outline-none focus:border-blue-500"
                                        >
                                            <option value="" disabled>Select an interval</option>
                                            {intervals.map(inv => (
                                                <option key={inv.id} value={inv.id}>{inv.name} ({inv.days.join(', ')})</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 dark:text-gray-400 mb-1">Start Date</label>
                                        <input
                                            type="date"
                                            required
                                            value={startDate}
                                            onChange={e => setStartDate(e.target.value)}
                                            className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-2.5 outline-none focus:border-blue-500"
                                        />
                                    </div>
                                </>
                            ) : (
                                <div>
                                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 dark:text-gray-400 mb-1">Reminder Date</label>
                                    <input
                                        type="date"
                                        required
                                        value={reminderDate}
                                        onChange={e => setReminderDate(e.target.value)}
                                        className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-2.5 outline-none focus:border-purple-500"
                                    />
                                </div>
                            )}

                            <button className={`w-full py-3 rounded-xl font-bold flex items-center justify-center space-x-2 transition-transform hover:scale-[1.02] active:scale-95 text-gray-900 dark:text-white shadow-lg ${type === 'spaced' ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-900/40' : 'bg-purple-600 hover:bg-purple-500 shadow-purple-900/40'}`}>
                                <Plus className="w-5 h-5" />
                                <span>Create Topic</span>
                            </button>
                        </form>
                    </div>

                    {/* Manage Intervals */}
                    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 rounded-3xl">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold flex items-center gap-2">
                                <Activity className="w-5 h-5 text-gray-500 dark:text-gray-400 dark:text-gray-400" />
                                Intervals
                            </h2>
                            <button onClick={() => setShowIntervalForm(!showIntervalForm)} className="text-xs font-semibold px-2 py-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:bg-gray-700 rounded transition-colors text-gray-900 dark:text-white">
                                {showIntervalForm ? 'Cancel' : '+ New'}
                            </button>
                        </div>

                        {showIntervalForm && (
                            <form onSubmit={handleCreateInterval} className="mb-6 space-y-3 bg-gray-50 dark:bg-gray-950 p-4 rounded-2xl border border-gray-200 dark:border-gray-800">
                                <input
                                    type="text" placeholder="Name (e.g. Standard)" required
                                    value={intervalName} onChange={e => setIntervalName(e.target.value)}
                                    className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none"
                                />
                                <input
                                    type="text" placeholder="Days (comma-separated, e.g. 1,3,7)" required
                                    value={intervalDays} onChange={e => setIntervalDays(e.target.value)}
                                    className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none"
                                />

                                <div className="flex items-center">
                                    <button
                                        type="button"
                                        onClick={() => setShowLabelsForm(!showLabelsForm)}
                                        className="text-xs font-semibold px-3 py-1.5 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-700 dark:text-gray-300"
                                    >
                                        {showLabelsForm ? "Hide details" : "Add details for each day"}
                                    </button>
                                </div>

                                {showLabelsForm && (
                                    (() => {
                                        const validDays = intervalDays.split(',').map(d => parseInt(d.trim())).filter(n => !isNaN(n));
                                        if (validDays.length === 0) {
                                            return <div className="text-xs text-orange-500 italic mt-2">Please enter comma-separated days above to add details.</div>;
                                        }
                                        return validDays.map((day, idx) => (
                                            <div key={idx} className="flex gap-2 items-center mt-2">
                                                <span className="w-16 text-xs font-bold text-gray-500 dark:text-gray-400 text-right shrink-0">Day {day}</span>
                                                <input
                                                    type="text"
                                                    placeholder="Label (e.g. Write headings...)"
                                                    value={intervalLabels[idx] || ""}
                                                    onChange={e => setIntervalLabels(prev => ({ ...prev, [idx]: e.target.value }))}
                                                    className="flex-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-1.5 text-sm focus:border-blue-500 outline-none"
                                                />
                                            </div>
                                        ));
                                    })()
                                )}

                                <button className="w-full bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 text-sm py-2 rounded-lg font-bold transition-colors border border-blue-500/10 mt-2">
                                    Save Interval
                                </button>
                            </form>
                        )}

                        <div className="flex flex-wrap gap-2">
                            {intervals.map(inv => (
                                <div key={inv.id} className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 font-mono">
                                    <strong className="font-sans text-gray-700 dark:text-gray-200 block mb-0.5">{inv.name}</strong>
                                    [{inv.days.join(', ')}]
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Topics List Table */}
                <div className="lg:col-span-2">
                    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl overflow-hidden flex flex-col h-full shadow-[inset_0_1px_1px_rgba(255,255,255,0.02)]">
                        <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
                            <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-100 to-gray-400">Your Topics List</h2>

                            <button
                                onClick={() => setShowArchived(!showArchived)}
                                className={`text-sm font-semibold px-4 py-1.5 rounded-xl border flex items-center space-x-1 transition-colors ${showArchived ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 dark:text-gray-400 border-gray-300 dark:border-gray-700 hover:text-gray-900 dark:text-white'}`}
                            >
                                {showArchived ? <ArchiveRestore className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
                                <span>{showArchived ? "Viewing Archived" : "View Archived"}</span>
                            </button>
                        </div>

                        <div className="flex-1 overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 dark:bg-gray-950/50 text-gray-500 dark:text-gray-400 text-sm font-semibold border-b border-gray-200 dark:border-gray-800 uppercase tracking-wider">
                                        <th className="px-6 py-4">Name</th>
                                        <th className="px-6 py-4">Type</th>
                                        <th className="px-6 py-4">Start/Due Data</th>
                                        <th className="px-6 py-4 text-center">Progress / Logs</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800/50">
                                    {filteredTopics.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-12 text-center text-gray-600 font-medium">
                                                No {showArchived ? "archived" : "active"} topics found.
                                            </td>
                                        </tr>
                                    ) : filteredTopics.map(topic => {
                                        const isSpaced = topic.type === "spaced";
                                        const interval = isSpaced ? intervals.find(i => i.id === topic.intervalId) : null;
                                        const totalRevs = interval?.days.length ?? 0;

                                        return (
                                            <tr key={topic.id} className="hover:bg-gray-100 dark:bg-gray-800/30 transition-colors group">
                                                <td className="px-6 py-4 text-gray-800 dark:text-gray-100 font-medium">{topic.name}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center space-x-1 text-xs font-bold px-2 py-1 rounded-full ${isSpaced ? 'bg-blue-500/10 text-blue-400' : 'bg-purple-500/10 text-purple-400'}`}>
                                                        {isSpaced ? <Activity className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                                                        <span>{isSpaced ? "Spaced" : "Reminder"}</span>
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 dark:text-gray-400">
                                                    {isSpaced ? (
                                                        <div className="flex flex-col">
                                                            <span>Starts: {topic.startDate}</span>
                                                            <span className="text-xs opacity-70">Int: {interval?.name || 'Unknown'}</span>
                                                        </div>
                                                    ) : (
                                                        <span>Due: {topic.reminderDate}</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className="text-sm font-mono text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-900 px-2 py-1 rounded-md border border-gray-200 dark:border-gray-800 shadow-inner">
                                                        {topic.completedDates.length} {isSpaced && `/ ${totalRevs}`} done
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button
                                                        onClick={() => toggleArchive(topic.id, topic.archived)}
                                                        className="bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 dark:text-gray-400 hover:text-gray-900 dark:text-white p-2 text-sm rounded-lg transition-colors border border-gray-300 dark:border-gray-700 shadow-sm opacity-0 group-hover:opacity-100 focus:opacity-100"
                                                        title={topic.archived ? "Unarchive" : "Archive"}
                                                    >
                                                        {topic.archived ? <ArchiveRestore className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
