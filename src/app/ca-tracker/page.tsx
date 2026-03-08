"use client";

import { useState } from "react";
import { useCATracker, CASubject, Revision, TestScore } from "@/hooks/useCATracker";
import { format, differenceInDays } from "date-fns";
import { BookOpen, Calendar, CheckCircle2, Circle, Clock, LineChart, Plus, Target, GraduationCap, BrainCircuit, LibraryBig, PenTool, BellRing } from "lucide-react";
import { getSpacedRepetitionSchedule } from "@/lib/retentionUtils";

const STUDY_MATERIALS = [
    { id: 'sm', name: 'ICAI Study Mat' },
    { id: 'rtp', name: 'Latest RTP' },
    { id: 'mtp1', name: 'MTP Series 1' },
    { id: 'mtp2', name: 'MTP Series 2' },
    { id: 'pyq', name: 'Past Year Papers' }
];

export default function CATracker() {
    const { subjects, loading, updateSubject } = useCATracker();
    const EXAM_DATE = new Date(2026, 9, 1); // changed to spe 30,May 1, 2027
    const daysLeft = differenceInDays(EXAM_DATE, new Date());

    const [editingSubjId, setEditingSubjId] = useState<string | null>(null);
    const [newRev, setNewRev] = useState({ title: '', targetDays: 7 });
    const [newTest, setNewTest] = useState({ name: '', type: 'Mock', score: 0, totalScore: 100, date: getTodayStr() });
    const [newReminder, setNewReminder] = useState({ text: '', dueDate: getTodayStr() });
    const [reminderTemplate, setReminderTemplate] = useState('');
    const [showArchivedRevs, setShowArchivedRevs] = useState<Record<string, boolean>>({});
    const [showArchivedRems, setShowArchivedRems] = useState<Record<string, boolean>>({});

    function getTodayStr() {
        return format(new Date(), 'yyyy-MM-dd');
    }

    if (loading) return <div className="animate-pulse bg-gray-100 dark:bg-gray-800 h-96 rounded-3xl p-10 mt-10 w-full flex items-center justify-center text-gray-500 dark:text-gray-400 dark:text-gray-400">Loading CA Tracker...</div>;

    const handleUpdateLectures = (subjectId: string, completed: number, total: number) => {
        updateSubject(subjectId, { lecturesCompleted: completed, lecturesTotal: total });
    };

    const handleUpdatePractice = (subjectId: string, fieldPrefix: 'qb' | 'mcq', completed: number, total: number) => {
        updateSubject(subjectId, { [`${fieldPrefix}Completed`]: completed, [`${fieldPrefix}Total`]: total });
    };

    const handleToggleMaterial = (subject: CASubject, matId: string) => {
        const currentMats = subject.materials || [];
        const updatedMats = currentMats.includes(matId)
            ? currentMats.filter(id => id !== matId)
            : [...currentMats, matId];
        updateSubject(subject.id, { materials: updatedMats });
    };

    const handleToggleConfidence = (subject: CASubject) => {
        const order: ('Low' | 'Medium' | 'High')[] = ['Low', 'Medium', 'High'];
        const currentIndex = order.indexOf(subject.confidence || 'Low');
        const nextIndex = (currentIndex + 1) % order.length;
        updateSubject(subject.id, { confidence: order[nextIndex] });
    };

    const handleAddRevision = (subject: CASubject) => {
        if (!newRev.title) return;
        const newRevision: Revision = {
            id: Date.now().toString(),
            title: newRev.title,
            targetDays: newRev.targetDays,
            startDate: getTodayStr(),
            completed: false
        };
        updateSubject(subject.id, { revisions: [...subject.revisions, newRevision] });
        setNewRev({ title: '', targetDays: 7 });
        setEditingSubjId(null);
    };

    const handleToggleRevision = (subject: CASubject, revId: string) => {
        const updatedRevisions = subject.revisions.map(r => r.id === revId ? { ...r, completed: !r.completed } : r);
        updateSubject(subject.id, { revisions: updatedRevisions });
    };

    const handleAddTest = (subject: CASubject) => {
        const nTest: TestScore = {
            id: Date.now().toString(),
            name: newTest.name || newTest.type,
            date: newTest.date,
            type: newTest.type,
            score: Number(newTest.score),
            totalScore: Number(newTest.totalScore)
        };
        updateSubject(subject.id, { tests: [...subject.tests, nTest] });
        setNewTest({ name: '', type: 'Mock', score: 0, totalScore: 100, date: getTodayStr() });
        setEditingSubjId(null);
    };

    const handleAddReminder = (subject: CASubject) => {
        if (!newReminder.text && !reminderTemplate) return;
        let reminderText = newReminder.text;
        if (reminderTemplate === 'Spaced Repetition') {
            reminderText = getSpacedRepetitionSchedule();
        }
        const nReminder = {
            id: Date.now().toString(),
            text: reminderText,
            dueDate: newReminder.dueDate,
            completed: false
        };
        updateSubject(subject.id, { reminders: [...(subject.reminders || []), nReminder] });
        setNewReminder({ text: '', dueDate: getTodayStr() });
        setReminderTemplate('');
        setEditingSubjId(null);
    };

    const handleToggleReminder = (subject: CASubject, remId: string) => {
        const updatedReminders = (subject.reminders || []).map(r => r.id === remId ? { ...r, completed: !r.completed } : r);
        updateSubject(subject.id, { reminders: updatedReminders });
    };

    const handleEditReminderText = (subject: CASubject, remId: string, currentText: string) => {
        const newText = prompt("Edit Context/Title for this reminder:", currentText);
        if (newText && newText.trim() !== "") {
            const updatedReminders = (subject.reminders || []).map(r => r.id === remId ? { ...r, text: newText.trim() } : r);
            updateSubject(subject.id, { reminders: updatedReminders });
        }
    };

    return (
        <div className="space-y-12 pb-24">
            <header className="relative overflow-hidden rounded-[3rem] bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-950 border border-indigo-500/30 p-12 shadow-2xl flex flex-col md:flex-row justify-between items-center group">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>

                <div className="relative z-10 flex flex-col text-center md:text-left gap-4">
                    <h1 className="text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-100 to-indigo-200">
                        CA Final May 2027
                    </h1>
                    <p className="text-xl text-indigo-200 font-medium">Your Ultimate Study Command Center</p>
                </div>

                <div className="relative z-10 mt-8 md:mt-0 glassmorphism bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-8 flex flex-col items-center justify-center shadow-2xl transition-transform hover:scale-105 duration-300">
                    <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-indigo-300 to-white drop-shadow-sm">
                        {daysLeft}
                    </div>
                    <div className="text-sm font-bold tracking-widest uppercase text-indigo-300 mt-2">Days Remaining</div>
                </div>
            </header>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {subjects.map(subject => (
                    <div key={subject.id} className="group relative bg-white dark:bg-gray-900/40 border border-gray-200 dark:border-gray-800 hover:border-indigo-500/50 rounded-[2.5rem] p-8 shadow-xl transition-all duration-500 hover:shadow-indigo-500/10 hover:-translate-y-1 flex flex-col overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-600 to-purple-600 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>

                        <div className="flex justify-between items-center mb-8 pb-6 border-b border-gray-200 dark:border-gray-800">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                                <BookOpen className="w-6 h-6 text-indigo-400 group-hover:animate-bounce" />
                                {subject.name}
                            </h2>
                            <button
                                onClick={() => handleToggleConfidence(subject)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${subject.confidence === 'High' ? 'bg-green-900/30 text-green-400 border-green-700/50 hover:bg-green-900/50' :
                                    subject.confidence === 'Medium' ? 'bg-yellow-900/30 text-yellow-400 border-yellow-700/50 hover:bg-yellow-900/50' :
                                        'bg-red-900/30 text-red-400 border-red-700/50 hover:bg-red-900/50'
                                    }`}
                                title="Click to toggle confidence level"
                            >
                                <BrainCircuit className="w-3.5 h-3.5" />
                                {subject.confidence || 'Low'}
                            </button>
                        </div>

                        {/* Contents */}
                        <div className="space-y-8 flex-1">

                            {/* Lectures Section */}
                            <div>
                                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-4 flex items-center gap-2">
                                    <GraduationCap className="w-4 h-4" /> Lectures Progress
                                </h3>
                                <div className="flex items-center gap-6">
                                    <div className="flex-1">
                                        <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden shadow-inner">
                                            <div
                                                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-1000 relative"
                                                style={{ width: `${Math.min(100, Math.max(0, (subject.lecturesCompleted / (subject.lecturesTotal || 1)) * 100))}%` }}
                                            >
                                                <div className="absolute inset-0 bg-white/20 w-full animate-[shimmer_2s_infinite]"></div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right whitespace-nowrap">
                                        <span className="text-2xl font-black text-gray-900 dark:text-white">{subject.lecturesCompleted}</span>
                                        <span className="text-gray-500 dark:text-gray-400 font-medium"> / {subject.lecturesTotal}</span>
                                    </div>
                                </div>
                                <div className="mt-3 flex gap-2 w-full max-w-xs">
                                    <input
                                        type="number" className="w-[80px] bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg p-2 text-gray-900 dark:text-white text-sm focus:border-indigo-500 outline-none"
                                        defaultValue={subject.lecturesCompleted}
                                        onBlur={(e) => handleUpdateLectures(subject.id, Number(e.target.value), subject.lecturesTotal)}
                                    />
                                    <input
                                        type="number" className="w-[80px] bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg p-2 text-gray-900 dark:text-white text-sm focus:border-indigo-500 outline-none"
                                        defaultValue={subject.lecturesTotal}
                                        onBlur={(e) => handleUpdateLectures(subject.id, subject.lecturesCompleted, Number(e.target.value))}
                                    />
                                </div>
                            </div>

                            {/* Practice Section */}
                            <div>
                                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-4 flex items-center gap-2">
                                    <PenTool className="w-4 h-4" /> Practice Metrics
                                </h3>
                                <div className="space-y-4">
                                    {/* Question Bank */}
                                    <div className="flex items-center gap-6">
                                        <div className="w-16 text-xs text-gray-500 dark:text-gray-400 dark:text-gray-400 font-bold uppercase tracking-widest text-right">QB</div>
                                        <div className="flex-1">
                                            <div className="h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden shadow-inner">
                                                <div
                                                    className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full transition-all duration-1000"
                                                    style={{ width: `${Math.min(100, Math.max(0, ((subject.qbCompleted || 0) / (subject.qbTotal || 1)) * 100))}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                        <div className="flex gap-1">
                                            <input
                                                type="number" className="w-[50px] bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-md p-1.5 text-gray-900 dark:text-white text-xs text-center focus:border-teal-500 outline-none"
                                                defaultValue={subject.qbCompleted || 0}
                                                onBlur={(e) => handleUpdatePractice(subject.id, 'qb', Number(e.target.value), subject.qbTotal || 100)}
                                            />
                                            <span className="text-gray-600 self-center font-bold">/</span>
                                            <input
                                                type="number" className="w-[50px] bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-md p-1.5 text-gray-900 dark:text-white text-xs text-center focus:border-teal-500 outline-none"
                                                defaultValue={subject.qbTotal || 100}
                                                onBlur={(e) => handleUpdatePractice(subject.id, 'qb', subject.qbCompleted || 0, Number(e.target.value))}
                                            />
                                        </div>
                                    </div>

                                    {/* MCQs */}
                                    <div className="flex items-center gap-6">
                                        <div className="w-16 text-xs text-gray-500 dark:text-gray-400 dark:text-gray-400 font-bold uppercase tracking-widest text-right">MCQ</div>
                                        <div className="flex-1">
                                            <div className="h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden shadow-inner">
                                                <div
                                                    className="h-full bg-gradient-to-r from-orange-400 to-pink-500 rounded-full transition-all duration-1000"
                                                    style={{ width: `${Math.min(100, Math.max(0, ((subject.mcqCompleted || 0) / (subject.mcqTotal || 1)) * 100))}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                        <div className="flex gap-1">
                                            <input
                                                type="number" className="w-[50px] bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-md p-1.5 text-gray-900 dark:text-white text-xs text-center focus:border-orange-500 outline-none"
                                                defaultValue={subject.mcqCompleted || 0}
                                                onBlur={(e) => handleUpdatePractice(subject.id, 'mcq', Number(e.target.value), subject.mcqTotal || 100)}
                                            />
                                            <span className="text-gray-600 self-center font-bold">/</span>
                                            <input
                                                type="number" className="w-[50px] bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-md p-1.5 text-gray-900 dark:text-white text-xs text-center focus:border-orange-500 outline-none"
                                                defaultValue={subject.mcqTotal || 100}
                                                onBlur={(e) => handleUpdatePractice(subject.id, 'mcq', subject.mcqCompleted || 0, Number(e.target.value))}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Materials Section */}
                            <div>
                                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-4 flex items-center gap-2">
                                    <LibraryBig className="w-4 h-4" /> Study Materials
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {STUDY_MATERIALS.map(mat => {
                                        const isCompleted = (subject.materials || []).includes(mat.id);
                                        return (
                                            <button
                                                key={mat.id}
                                                onClick={() => handleToggleMaterial(subject, mat.id)}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border flex items-center gap-1.5 ${isCompleted
                                                    ? 'bg-indigo-900/40 border-indigo-500/50 text-indigo-300'
                                                    : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:bg-gray-800'
                                                    }`}
                                            >
                                                {isCompleted && <CheckCircle2 className="w-3 h-3 text-indigo-400" />}
                                                {mat.name}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Revisions Section */}
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                        <Target className="w-4 h-4" /> Revisions
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setShowArchivedRevs({ ...showArchivedRevs, [subject.id]: !showArchivedRevs[subject.id] })}
                                            className={`text-xs px-3 py-1.5 rounded-full font-bold transition-colors ${showArchivedRevs[subject.id] ? 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300' : 'bg-transparent text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:bg-gray-800'}`}
                                        >
                                            {showArchivedRevs[subject.id] ? 'Hide Done' : 'Show Done'}
                                        </button>
                                        <button
                                            onClick={() => setEditingSubjId(editingSubjId === `rev-${subject.id}` ? null : `rev-${subject.id}`)}
                                            className="text-xs bg-indigo-900/50 hover:bg-indigo-600 text-indigo-300 hover:text-gray-900 dark:text-white px-3 py-1.5 rounded-full font-bold transition-colors flex items-center gap-1"
                                        >
                                            <Plus className="w-3 h-3" /> Add Target
                                        </button>
                                    </div>
                                </div>

                                {editingSubjId === `rev-${subject.id}` && (
                                    <div className="bg-gray-50 dark:bg-gray-950 p-4 rounded-2xl mb-4 border border-indigo-900/50 flex flex-col gap-3">
                                        <input
                                            placeholder="e.g. Complete Chapter 1-5"
                                            value={newRev.title} onChange={e => setNewRev({ ...newRev, title: e.target.value })}
                                            className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-2.5 rounded-xl text-gray-900 dark:text-white outline-none focus:border-indigo-500"
                                        />
                                        <div className="flex gap-3">
                                            <div className="flex items-center bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden text-sm w-1/2">
                                                <span className="px-3 text-gray-500 dark:text-gray-400">Days:</span>
                                                <input
                                                    type="number" value={newRev.targetDays} onChange={e => setNewRev({ ...newRev, targetDays: Number(e.target.value) })}
                                                    className="w-full bg-transparent p-2.5 text-gray-900 dark:text-white outline-none"
                                                />
                                            </div>
                                            <button onClick={() => handleAddRevision(subject)} className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-gray-900 dark:text-white font-bold rounded-xl transition-colors">Add</button>
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-3">
                                    {(() => {
                                        const visibleRevisions = subject.revisions.filter(r => showArchivedRevs[subject.id] || !r.completed);

                                        if (subject.revisions.length === 0) return <div className="text-gray-600 italic text-sm py-2">No active revision targets. Set one!</div>;
                                        if (visibleRevisions.length === 0) return <div className="text-gray-600 italic text-sm py-2">All revisions completed!</div>;

                                        return visibleRevisions.map(rev => {
                                            const daysPassed = differenceInDays(new Date(), new Date(rev.startDate));
                                            const isOverdue = daysPassed > rev.targetDays;

                                            return (
                                                <div key={rev.id} onClick={() => handleToggleRevision(subject, rev.id)} className={`relative overflow-hidden group/item cursor-pointer flex items-center p-4 rounded-2xl border transition-all duration-300 ${rev.completed ? 'bg-green-900/10 border-green-900/30 text-gray-500 dark:text-gray-400' : 'bg-gray-100 dark:bg-gray-800/40 border-gray-300 dark:border-gray-700/50 hover:bg-gray-100 dark:bg-gray-800/80'}`}>
                                                    <div className="mr-4 text-indigo-400">
                                                        {rev.completed ? <CheckCircle2 className="w-6 h-6 text-green-500" /> : <Circle className="w-6 h-6 group-hover/item:text-indigo-300" />}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className={`font-semibold truncate ${rev.completed ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-700 dark:text-gray-200'}`}>{rev.title}</div>
                                                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-3">
                                                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {rev.startDate}</span>
                                                            <span className={`px-2 py-0.5 rounded-md ${isOverdue && !rev.completed ? 'bg-red-900/50 text-red-400 font-bold' : 'bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400 dark:text-gray-400'}`}>
                                                                {rev.completed ? 'Done' : `Day ${daysPassed} of ${rev.targetDays}`}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        });
                                    })()}
                                </div>
                            </div>

                            {/* Tests Section */}
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                        <LineChart className="w-4 h-4" /> Tests & Mocks
                                    </h3>
                                    <button
                                        onClick={() => setEditingSubjId(editingSubjId === `test-${subject.id}` ? null : `test-${subject.id}`)}
                                        className="text-xs bg-blue-900/50 hover:bg-blue-600 text-blue-300 hover:text-gray-900 dark:text-white px-3 py-1.5 rounded-full font-bold transition-colors flex items-center gap-1"
                                    >
                                        <Plus className="w-3 h-3" /> Add Score
                                    </button>
                                </div>

                                {editingSubjId === `test-${subject.id}` && (
                                    <div className="bg-gray-50 dark:bg-gray-950 p-4 rounded-2xl mb-4 border border-blue-900/50 flex flex-col gap-3">
                                        <input
                                            placeholder="Test Name (e.g. Chapter 3 Mock)"
                                            value={newTest.name} onChange={e => setNewTest({ ...newTest, name: e.target.value })}
                                            className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-2.5 rounded-xl text-gray-900 dark:text-white outline-none focus:border-blue-500"
                                        />
                                        <div className="flex gap-3">
                                            <select
                                                value={newTest.type} onChange={e => setNewTest({ ...newTest, type: e.target.value })}
                                                className="w-1/2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-2.5 rounded-xl text-gray-900 dark:text-white outline-none focus:border-blue-500"
                                            >
                                                <option value="Mock">Full Mock</option>
                                                <option value="Chapter">Chapter Test</option>
                                                <option value="MCQ">MCQ Test</option>
                                            </select>
                                            <input
                                                type="date" value={newTest.date} onChange={e => setNewTest({ ...newTest, date: e.target.value })}
                                                className="w-1/2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-2.5 rounded-xl text-gray-900 dark:text-white outline-none focus:border-blue-500"
                                            />
                                        </div>
                                        <div className="flex gap-3 items-center">
                                            <div className="flex-1 flex gap-2 items-center bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden text-sm">
                                                <input
                                                    type="number" placeholder="Score" value={newTest.score} onChange={e => setNewTest({ ...newTest, score: Number(e.target.value) })}
                                                    className="w-full bg-transparent p-2.5 text-gray-900 dark:text-white outline-none text-center"
                                                />
                                                <span className="text-gray-600 font-bold">/</span>
                                                <input
                                                    type="number" placeholder="Total" value={newTest.totalScore} onChange={e => setNewTest({ ...newTest, totalScore: Number(e.target.value) })}
                                                    className="w-full bg-transparent p-2.5 text-gray-900 dark:text-white outline-none text-center"
                                                />
                                            </div>
                                            <button onClick={() => handleAddTest(subject)} className="bg-blue-600 hover:bg-blue-500 text-gray-900 dark:text-white font-bold px-6 py-2.5 rounded-xl transition-colors">Add</button>
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-3">
                                    {subject.tests.length === 0 ? (
                                        <div className="text-gray-600 italic text-sm py-2">No tests recorded yet.</div>
                                    ) : (
                                        <div className="flex gap-3 overflow-x-auto pb-4 snap-x snap-mandatory hide-scrollbar">
                                            {subject.tests.slice().reverse().map(test => {
                                                const percentage = Math.round((test.score / test.totalScore) * 100);
                                                let colorClass = 'text-green-400 bg-green-400/10 border-green-500/20';
                                                if (percentage < 60) colorClass = 'text-yellow-400 bg-yellow-400/10 border-yellow-500/20';
                                                if (percentage < 40) colorClass = 'text-red-400 bg-red-400/10 border-red-500/20';

                                                return (
                                                    <div key={test.id} className="snap-start shrink-0 w-40 bg-gray-100 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-700/50 rounded-2xl p-4 flex flex-col items-center justify-center text-center hover:bg-gray-200 dark:bg-gray-700/50 transition-colors">
                                                        <div className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-1">{test.type}</div>
                                                        <div className="text-xs font-semibold text-gray-800 dark:text-gray-200 mb-2 truncate w-full" title={test.name}>{test.name}</div>
                                                        <div className={`text-2xl font-black mb-1 ${colorClass.split(' ')[0]}`}>{percentage}%</div>
                                                        <div className="text-gray-500 dark:text-gray-400 text-xs font-medium bg-white dark:bg-gray-900/80 px-2 py-1 rounded-md">{test.score} / {test.totalScore}</div>
                                                        <div className="text-[10px] text-gray-600 mt-3 font-medium uppercase tracking-widest">{format(new Date(test.date), "MMM d")}</div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Reminders Section */}
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                        <BellRing className="w-4 h-4" /> Reminders & Deadlines
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setShowArchivedRems({ ...showArchivedRems, [subject.id]: !showArchivedRems[subject.id] })}
                                            className={`text-xs px-3 py-1.5 rounded-full font-bold transition-colors ${showArchivedRems[subject.id] ? 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300' : 'bg-transparent text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:bg-gray-800'}`}
                                        >
                                            {showArchivedRems[subject.id] ? 'Hide Done' : 'Show Done'}
                                        </button>
                                        <button
                                            onClick={() => setEditingSubjId(editingSubjId === `rem-${subject.id}` ? null : `rem-${subject.id}`)}
                                            className="text-xs bg-pink-900/50 hover:bg-pink-600 text-pink-300 hover:text-gray-900 dark:text-white px-3 py-1.5 rounded-full font-bold transition-colors flex items-center gap-1"
                                        >
                                            <Plus className="w-3 h-3" /> Add Reminder
                                        </button>
                                    </div>
                                </div>

                                {editingSubjId === `rem-${subject.id}` && (
                                    <div className="bg-gray-50 dark:bg-gray-950 p-4 rounded-2xl mb-4 border border-pink-900/50 flex flex-col gap-3">
                                        <input placeholder="What do you need to do?" value={newReminder.text} onChange={e => setNewReminder({ ...newReminder, text: e.target.value })} className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-2.5 rounded-xl text-gray-900 dark:text-white outline-none focus:border-pink-500" />
                                        <select value={reminderTemplate} onChange={e => setReminderTemplate(e.target.value)} className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-2.5 rounded-xl text-gray-900 dark:text-white outline-none focus:border-pink-500 mt-2">
                                            <option value="">No Template</option>
                                            <option value="Spaced Repetition">Spaced Repetition Schedule</option>
                                        </select>
                                        <div className="flex gap-3 mt-2">
                                            <input type="date" value={newReminder.dueDate} onChange={e => setNewReminder({ ...newReminder, dueDate: e.target.value })} className="w-1/2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-2.5 rounded-xl text-gray-900 dark:text-white outline-none focus:border-pink-500" />
                                            <button onClick={() => handleAddReminder(subject)} className="flex-1 bg-pink-600 hover:bg-pink-500 text-gray-900 dark:text-white font-bold rounded-xl transition-colors">Add</button>
                                        </div>                                        </div>
                                )}

                                <div className="space-y-3">
                                    {(() => {
                                        const reminders = subject.reminders || [];
                                        const visibleReminders = reminders.filter(r => showArchivedRems[subject.id] || !r.completed);

                                        if (reminders.length === 0) return <div className="text-gray-600 italic text-sm py-2">No pending reminders.</div>;
                                        if (visibleReminders.length === 0) return <div className="text-gray-600 italic text-sm py-2">All reminders done!</div>;

                                        return visibleReminders.map(rem => {
                                            const now = new Date();
                                            // set to midnight to effectively compare dates
                                            now.setHours(0, 0, 0, 0);
                                            const dueDate = new Date(rem.dueDate);
                                            dueDate.setHours(0, 0, 0, 0);
                                            const daysPassed = differenceInDays(now, dueDate);
                                            const isOverdue = daysPassed > 0;

                                            let deadlineLabel = '';
                                            if (daysPassed === 0) deadlineLabel = 'Today';
                                            else if (daysPassed === -1) deadlineLabel = 'Tomorrow';
                                            else if (daysPassed < 0) deadlineLabel = `In ${Math.abs(daysPassed)} days`;
                                            else deadlineLabel = `${daysPassed} days overdue`;

                                            return (
                                                <div key={rem.id} className={`relative overflow-hidden group/item flex items-center p-4 rounded-2xl border transition-all duration-300 ${rem.completed ? 'bg-green-900/10 border-green-900/30 text-gray-500 dark:text-gray-400' : 'bg-gray-100 dark:bg-gray-800/40 border-gray-300 dark:border-gray-700/50 hover:bg-gray-100 dark:bg-gray-800/80'}`}>
                                                    <div className="mr-4 cursor-pointer text-pink-400" onClick={() => handleToggleReminder(subject, rem.id)}>
                                                        {rem.completed ? <CheckCircle2 className="w-6 h-6 text-green-500" /> : <Circle className="w-6 h-6 hover:text-pink-300" />}
                                                    </div>
                                                    <div className="flex-1 min-w-0" onDoubleClick={() => handleEditReminderText(subject, rem.id, rem.text)}>
                                                        <div className={`font-semibold cursor-pointer truncate ${rem.completed ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-700 dark:text-gray-200'}`} title="Double click to edit">{rem.text}</div>
                                                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-3">
                                                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Due {rem.dueDate}</span>
                                                            <span className={`px-2 py-0.5 rounded-md ${isOverdue && !rem.completed ? 'bg-red-900/50 text-red-400 font-bold' : (!rem.completed && daysPassed === 0) ? 'bg-yellow-900/50 text-yellow-400 font-bold' : 'bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400 dark:text-gray-400'}`}>
                                                                {rem.completed ? 'Done' : deadlineLabel}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        });
                                    })()}
                                </div>
                            </div>

                        </div>
                    </div>
                ))}
            </div>

            <style jsx>{`
                .hide-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .hide-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </div>
    );
}

