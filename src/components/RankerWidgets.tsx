"use client";

import { useFirebaseData } from "@/hooks/useFirebaseData";
import { useState } from "react";
import { Plus, Target, AlertCircle, Edit3, Circle, CheckCircle2, Trash2, Flame } from "lucide-react";

const SUBJECTS = ["FR", "AFM", "Audit", "DT", "IDT"];

export function WrittenAnswersWidget() {
    const { writtenAnswers, addWrittenAnswer, loading } = useFirebaseData();
    const [submitting, setSubmitting] = useState(false);

    if (loading) return null;

    const now = new Date();
    const day = now.getDay() || 7;
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - day + 1);
    startOfWeek.setHours(0, 0, 0, 0);

    const writtenThisWeek = writtenAnswers.filter(w => new Date(w.createdAt) >= startOfWeek).length;
    const isPassing = writtenThisWeek >= 15;

    return (
        <div className="bg-[#1C1C1E] border border-white/10 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden group mb-8">
            <div className={`absolute top-0 left-0 w-2 h-full ${isPassing ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                    <h2 className="text-gray-400 font-bold tracking-widest uppercase text-sm mb-2 flex items-center gap-2">
                        <Edit3 className="w-4 h-4" /> Written Answers This Week
                    </h2>
                    <div className="flex items-end gap-3">
                        <span className={`text-6xl font-black ${isPassing ? 'text-green-400' : 'text-red-400'}`}>{writtenThisWeek}</span>
                        <span className="text-gray-500 font-medium pb-2">/ 20 Target</span>
                    </div>
                    {!isPassing && <p className="text-red-400/80 text-sm mt-2 font-medium">CA Final is won on paper. Get writing.</p>}
                </div>
                <div className="flex gap-2">
                    {SUBJECTS.map(sub => (
                        <button
                            key={sub}
                            disabled={submitting}
                            onClick={async () => {
                                setSubmitting(true);
                                await addWrittenAnswer({ subject: sub, createdAt: new Date().toISOString() });
                                setSubmitting(false);
                            }}
                            className="bg-[#2A2A2E] hover:bg-[#3A3A3E] border border-white/5 px-4 py-3 rounded-xl text-white font-bold transition-all hover:scale-105 hover:-translate-y-1 shadow-lg active:scale-95"
                        >
                            +1 {sub}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

export function MistakeLogWidget() {
    const { mistakes, addMistake, deleteMistake } = useFirebaseData();
    const [subject, setSubject] = useState("FR");
    const [reason, setReason] = useState("");

    const handleAdd = () => {
        if (!reason.trim()) return;
        addMistake({ subject, reason, createdAt: new Date().toISOString() });
        setReason("");
    }

    return (
        <div className="bg-[#1C1C1E] border border-white/10 rounded-[2rem] p-8 shadow-xl relative overflow-hidden mb-8">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-[80px] pointer-events-none"></div>
            <h2 className="text-xl font-black text-white flex items-center space-x-3 mb-6">
                <AlertCircle className="w-6 h-6 text-red-500" />
                <span>Mistake Log (Fast Entry)</span>
            </h2>

            <div className="flex gap-3 mb-6 relative z-10">
                <select
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    className="bg-[#2C2C2E] border border-white/10 text-white rounded-xl px-4 py-3 outline-none focus:border-red-500 font-bold"
                >
                    {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <input
                    type="text"
                    placeholder="Why did you miss it? (Be brutal)"
                    className="flex-1 bg-[#2C2C2E] border border-white/10 p-3 rounded-xl text-white outline-none focus:border-red-500 placeholder:text-gray-500 font-medium"
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAdd()}
                />
                <button
                    onClick={handleAdd}
                    className="bg-red-600 hover:bg-red-500 text-white p-3 rounded-xl transition-all shadow-[0_4px_14px_0_rgba(220,38,38,0.39)]"
                >
                    <Plus className="w-5 h-5" />
                </button>
            </div>

            <div className="space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar pr-2">
                {mistakes.slice(0, 10).map(m => (
                    <div key={m.id} className="group flex items-center justify-between p-3 rounded-xl bg-[#2C2C2E]/50 border border-white/5">
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] font-black uppercase text-red-400 bg-red-500/10 px-2 py-1 rounded">{m.subject}</span>
                            <span className="text-gray-300 text-sm font-medium">{m.reason}</span>
                        </div>
                        <button onClick={() => deleteMistake(m.id)} className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}

export function PendingVaultWidget() {
    const { todos, addTodo, updateTodo, deleteTodo } = useFirebaseData();
    const [text, setText] = useState("");
    const [subject, setSubject] = useState("FR");
    const [priority, setPriority] = useState<"Must" | "Should" | "Someday">("Must");

    const vaultTodos = todos.filter(t => t.type === 'pending');

    const handleAdd = () => {
        if (!text.trim()) return;
        addTodo({ text, type: 'pending', completed: false, subject, priority, createdAt: new Date().toISOString() });
        setText("");
    }

    return (
        <div className="bg-[#1C1C1E] rounded-[2rem] p-8 shadow-xl border border-white/10 relative overflow-hidden h-full">
            <h2 className="text-xl font-black text-white flex items-center space-x-3 mb-6">
                <Flame className="w-6 h-6 text-orange-500" />
                <span>Pending Vault (No Deadlines)</span>
            </h2>

            <div className="flex flex-col gap-3 mb-6">
                <div className="flex gap-2">
                    <select value={subject} onChange={e => setSubject(e.target.value)} className="bg-[#2C2C2E] border border-white/10 text-white rounded-xl px-3 py-2 outline-none text-sm font-bold">
                        {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <select value={priority} onChange={e => setPriority(e.target.value as any)} className="bg-[#2C2C2E] border border-white/10 text-white rounded-xl px-3 py-2 outline-none text-sm font-bold">
                        <option value="Must">Must</option>
                        <option value="Should">Should</option>
                        <option value="Someday">Someday</option>
                    </select>
                </div>
                <div className="flex gap-2">
                    <input type="text" placeholder="Concept gap, Mock Q3, etc." className="flex-1 bg-[#2C2C2E] border border-white/10 p-3 rounded-xl text-white outline-none focus:border-orange-500 text-sm" value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAdd()} />
                    <button onClick={handleAdd} className="bg-orange-600 hover:bg-orange-500 text-white px-4 rounded-xl transition-all"><Plus className="w-5 h-5" /></button>
                </div>
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                {vaultTodos.map(todo => (
                    <div key={todo.id} className={`group flex items-center justify-between p-3 rounded-xl border transition-all ${todo.completed ? 'bg-orange-500/10 border-orange-500/20 opacity-50' : 'bg-[#2C2C2E]/80 border-white/5 hover:border-orange-500/50'}`}>
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                            <button onClick={() => updateTodo(todo.id, { completed: !todo.completed })} className={`${todo.completed ? 'text-orange-400' : 'text-gray-500 hover:text-orange-400'}`}>
                                {todo.completed ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                            </button>
                            <div className="flex flex-col min-w-0">
                                <span className={`font-medium text-sm truncate ${todo.completed ? 'line-through text-gray-500' : 'text-gray-200'}`}>{todo.text}</span>
                                <div className="flex gap-2 mt-0.5">
                                    <span className="text-[9px] font-bold uppercase text-orange-400 tracking-wider">{todo.subject}</span>
                                    <span className="text-[9px] font-bold uppercase text-gray-500 tracking-wider">• {todo.priority}</span>
                                </div>
                            </div>
                        </div>
                        <button onClick={() => deleteTodo(todo.id)} className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 p-2"><Trash2 className="w-4 h-4" /></button>
                    </div>
                ))}
            </div>
        </div>
    );
}

export function WeeklyGridWidget() {
    const { todos, addTodo, updateTodo, deleteTodo } = useFirebaseData();
    const weeklyTodos = todos.filter(t => t.type === 'weekly');

    // Instead of a true 7x5 matrix which is bulky, we organize by Big Rocks and Subjects.
    const bigRocks = weeklyTodos.filter(t => t.isBigRock);
    const standard = weeklyTodos.filter(t => !t.isBigRock);

    const [newRock, setNewRock] = useState("");
    const [newTask, setNewTask] = useState("");
    const [subject, setSubject] = useState("FR");

    return (
        <div className="bg-[#1C1C1E] border border-white/10 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden h-full">
            <h2 className="text-xl font-black text-white flex items-center space-x-3 mb-6">
                <Target className="w-6 h-6 text-indigo-500" />
                <span>Weekly Battle Plan (Units, Not Hours)</span>
            </h2>

            {/* BIG ROCKS (Non-Negotiables) */}
            <div className="mb-8">
                <h3 className="text-xs font-bold text-red-500 uppercase tracking-widest mb-3">🔥 3 Big Rocks (Non-Negotiable)</h3>
                <div className="space-y-2 mb-3">
                    {bigRocks.map(todo => (
                        <div key={todo.id} className={`flex items-center gap-3 p-3 rounded-xl border ${todo.completed ? 'bg-indigo-500/10 border-indigo-500/20' : 'bg-[#2C2C2E] border-red-500/30'}`}>
                            <button onClick={() => updateTodo(todo.id, { completed: !todo.completed })} className={todo.completed ? 'text-indigo-400' : 'text-red-400'}>
                                {todo.completed ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                            </button>
                            <span className={`font-bold text-sm ${todo.completed ? 'line-through text-gray-500' : 'text-white'}`}>{todo.text}</span>
                            <button onClick={() => deleteTodo(todo.id)} className="ml-auto text-gray-600 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                        </div>
                    ))}
                </div>
                {bigRocks.length < 3 && (
                    <div className="flex gap-2">
                        <input type="text" placeholder="A must-do target..." className="flex-1 bg-[#2C2C2E]/50 border border-white/10 p-2.5 rounded-xl text-white outline-none text-sm" value={newRock} onChange={e => setNewRock(e.target.value)} onKeyDown={e => {
                            if (e.key === 'Enter' && newRock) { addTodo({ text: newRock, type: 'weekly', completed: false, isBigRock: true, createdAt: new Date().toISOString() }); setNewRock(""); }
                        }} />
                        <button onClick={() => { if (newRock) { addTodo({ text: newRock, type: 'weekly', completed: false, isBigRock: true, createdAt: new Date().toISOString() }); setNewRock(""); } }} className="bg-red-500/20 text-red-400 px-3 rounded-xl"><Plus className="w-5 h-5" /></button>
                    </div>
                )}
            </div>

            {/* SUBJECT TARGETS */}
            <div>
                <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-3">Output Targets (Questions, Chapters, Tests)</h3>
                <div className="flex gap-2 mb-4">
                    <select value={subject} onChange={e => setSubject(e.target.value)} className="bg-[#2C2C2E] border border-white/10 text-white rounded-xl px-2 text-sm font-bold outline-none">
                        {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <input type="text" placeholder="E.g. 25 QB + 1 chapter recall" className="flex-1 bg-[#2C2C2E] border border-white/10 p-2.5 rounded-xl text-white outline-none text-sm" value={newTask} onChange={e => setNewTask(e.target.value)} onKeyDown={e => {
                        if (e.key === 'Enter' && newTask) { addTodo({ text: newTask, type: 'weekly', completed: false, subject, isBigRock: false, createdAt: new Date().toISOString() }); setNewTask(""); }
                    }} />
                    <button onClick={() => { if (newTask) { addTodo({ text: newTask, type: 'weekly', completed: false, subject, isBigRock: false, createdAt: new Date().toISOString() }); setNewTask(""); } }} className="bg-indigo-600 text-white px-3 rounded-xl"><Plus className="w-4 h-4" /></button>
                </div>

                <div className="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar">
                    {SUBJECTS.map(sub => {
                        const subTasks = standard.filter(t => t.subject === sub);
                        if (subTasks.length === 0) return null;
                        return (
                            <div key={sub} className="bg-[#2C2C2E]/30 rounded-xl p-3 border border-white/5">
                                <h4 className="text-[10px] font-black text-gray-500 mb-2 uppercase">{sub}</h4>
                                <div className="space-y-2">
                                    {subTasks.map(todo => (
                                        <div key={todo.id} className="group flex items-center justify-between">
                                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                                <button onClick={() => updateTodo(todo.id, { completed: !todo.completed })} className={todo.completed ? 'text-indigo-400' : 'text-gray-500'}>
                                                    {todo.completed ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                                                </button>
                                                <span className={`text-sm truncate ${todo.completed ? 'line-through text-gray-500' : 'text-gray-200'}`}>{todo.text}</span>
                                            </div>
                                            <button onClick={() => deleteTodo(todo.id)} className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400"><Trash2 className="w-3 h-3" /></button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    );
}
