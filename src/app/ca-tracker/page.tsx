"use client";

import { useState } from "react";
import { useCATracker, CASubject, TestScore, ConceptHole, RevisionRound } from "@/hooks/useCATracker";
import { format, differenceInDays, getISOWeek, getYear } from "date-fns";
import {
    BrainCircuit, Plus, TrendingUp, TrendingDown, Minus,
    Flame, Zap, PenLine, BookMarked, AlertCircle, CheckCircle2, X
} from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────

const EXAM_DATE = new Date(2026, 9, 1); //new Date(2027, 4, 1); // May 2027

const SUBJECT_META: Record<string, { short: string; gradient: string; glow: string; border: string }> = {
    fr: { short: 'FR', gradient: 'from-pink-500 to-rose-600', glow: 'shadow-pink-500/10', border: 'hover:border-pink-500/40' },
    afm: { short: 'AFM', gradient: 'from-orange-400 to-amber-500', glow: 'shadow-orange-400/10', border: 'hover:border-orange-400/40' },
    audit: { short: 'AUD', gradient: 'from-lime-400 to-emerald-500', glow: 'shadow-lime-400/10', border: 'hover:border-lime-400/40' },
    dt: { short: 'DT', gradient: 'from-cyan-400 to-blue-500', glow: 'shadow-cyan-400/10', border: 'hover:border-cyan-400/40' },
    idt: { short: 'IDT', gradient: 'from-violet-500 to-purple-600', glow: 'shadow-violet-500/10', border: 'hover:border-violet-500/40' },
};

const WRITTEN_TARGET = 5; // weekly target

// ─── Helpers ──────────────────────────────────────────────────────────────────

function todayStr() { return format(new Date(), 'yyyy-MM-dd'); }

function currentWeekKey() {
    const d = new Date();
    return `${getYear(d)}-W${String(getISOWeek(d)).padStart(2, '0')}`;
}

function getConfNum(conf: any): number {
    if (conf === 'High') return 5;
    if (conf === 'Medium') return 3;
    if (conf === 'Low') return 1;
    return typeof conf === 'number' ? conf : 1;
}

function calcAvg(tests: TestScore[]): number | null {
    if (!tests.length) return null;
    return Math.round(tests.reduce((s, t) => s + (t.score / t.totalScore) * 100, 0) / tests.length);
}

function getRealityLabel(conf: number, avg: number | null) {
    if (avg === null) return { text: 'Untested', cls: 'text-gray-500 border-gray-700 bg-transparent' };
    if (conf >= 4 && avg < 50) return { text: '🚨 Overconfident', cls: 'text-red-400 border-red-500/50 bg-red-500/10 animate-pulse font-black' };
    if (conf <= 2 && avg >= 60) return { text: '⚡ Underestimating Self', cls: 'text-yellow-400 border-yellow-500/40 bg-yellow-500/10' };
    if (avg >= 60 && conf >= 3) return { text: '✓ Tracking Well', cls: 'text-green-400 border-green-500/40 bg-green-500/10' };
    if (avg < 40) return { text: '🔥 Needs Attention', cls: 'text-red-400 border-red-500/40 bg-red-500/10' };
    return { text: 'Keep Pushing', cls: 'text-indigo-400 border-indigo-500/30 bg-indigo-500/5' };
}

function getWrittenCount(s: CASubject): number {
    if (!s.writtenAnswersWeekOf || s.writtenAnswersWeekOf !== currentWeekKey()) return 0;
    return s.writtenAnswersThisWeek || 0;
}

// ─── Sub-widgets ──────────────────────────────────────────────────────────────

/** Tiny bar sparkline for score history */
function SparkBar({ tests }: { tests: TestScore[] }) {
    if (tests.length < 2) return null;
    const recent = tests.slice(-8);
    return (
        <div className="flex items-end gap-0.5 h-7">
            {recent.map((t, i) => {
                const pct = t.score / t.totalScore;
                const h = Math.max(4, Math.round(pct * 28));
                const isLast = i === recent.length - 1;
                const col = pct >= 0.6 ? '#4ade80' : pct >= 0.4 ? '#facc15' : '#f87171';
                return <div key={t.id} className="flex-1 rounded-sm" style={{ height: h, background: col, opacity: isLast ? 1 : 0.35 }} />;
            })}
        </div>
    );
}

/** Written answers counter — big tap target */
function WrittenCounter({ count, target, onAdd, onReset }: { count: number; target: number; onAdd: () => void; onReset: () => void }) {
    const pct = Math.min(100, Math.round((count / target) * 100));
    const isKilling = count >= target;
    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-1.5">
                    <PenLine className="w-3 h-3 text-pink-400" /> Written This Week
                </span>
                <span className={`text-[10px] font-black ${isKilling ? 'text-green-400' : 'text-gray-500'}`}>{count}/{target}</span>
            </div>
            {/* Progress bar */}
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-500 ${isKilling ? 'bg-green-400' : 'bg-pink-500'}`}
                    style={{ width: `${pct}%` }}
                />
            </div>
            <div className="flex gap-2 mt-1">
                <button
                    onClick={onAdd}
                    className="flex-1 bg-pink-500/10 hover:bg-pink-500/25 border border-pink-500/30 text-pink-400 font-black text-sm py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5"
                >
                    <Plus className="w-4 h-4" /> Wrote One
                </button>
                {count > 0 && (
                    <button onClick={onReset} className="text-gray-600 hover:text-gray-400 text-xs px-3 py-2.5 rounded-xl bg-white/5 transition-all">
                        Reset
                    </button>
                )}
            </div>
        </div>
    );
}

/** Revision Rounds R1 → R2 → R3 */
function RevisionRounds({ rounds, onMark }: { rounds: RevisionRound[]; onMark: (round: number) => void }) {
    const done = rounds.map(r => r.round);
    return (
        <div className="flex flex-col gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-1.5">
                <BookMarked className="w-3 h-3 text-indigo-400" /> Revision Rounds
            </span>
            <div className="flex gap-2">
                {[1, 2, 3].map(r => {
                    const completed = done.includes(r);
                    const completedRound = rounds.find(rr => rr.round === r);
                    return (
                        <button
                            key={r}
                            onClick={() => !completed && onMark(r)}
                            disabled={completed}
                            className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all border
                                ${completed
                                    ? 'bg-indigo-500/15 border-indigo-500/50 text-indigo-300 cursor-default'
                                    : 'bg-white/5 border-white/10 text-gray-600 hover:border-indigo-500/40 hover:text-indigo-400'
                                }`}
                            title={completed && completedRound ? `Done ${completedRound.date}` : `Mark R${r} done`}
                        >
                            {completed ? '✓' : ''} R{r}
                            {completed && completedRound && (
                                <div className="text-[8px] text-indigo-400/60 font-normal normal-case tracking-normal mt-0.5">
                                    {format(new Date(completedRound.date), 'MMM d')}
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

/** Concept holes (weakness tracker) */
function ConceptHoles({ holes, onAdd, onResolve }: {
    holes: ConceptHole[];
    onAdd: (chapter: string) => void;
    onResolve: (id: string) => void;
}) {
    const [input, setInput] = useState('');
    const openHoles = holes.filter(h => !h.resolved);

    const submit = () => {
        const val = input.trim();
        if (!val) return;
        onAdd(val);
        setInput('');
    };

    return (
        <div className="flex flex-col gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-1.5">
                <AlertCircle className="w-3 h-3 text-orange-400" />
                Weak Spots
                {openHoles.length > 0 && <span className="text-orange-400 ml-1">({openHoles.length})</span>}
            </span>
            {/* Chip list */}
            {openHoles.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                    {openHoles.map(h => (
                        <button
                            key={h.id}
                            onClick={() => onResolve(h.id)}
                            className="flex items-center gap-1 bg-orange-500/10 border border-orange-500/30 text-orange-400 text-[10px] font-bold px-2.5 py-1 rounded-full hover:bg-orange-500/20 transition-all group"
                            title="Click to mark resolved"
                        >
                            {h.chapter}
                            <X className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                    ))}
                </div>
            )}
            {/* Input */}
            <div className="flex gap-2">
                <input
                    type="text"
                    placeholder="e.g. AS-12, Amalgamation..."
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && submit()}
                    className="flex-1 bg-[#27272a] border border-white/5 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-orange-500/50 placeholder:text-gray-600"
                />
                <button onClick={submit} className="bg-orange-500/15 hover:bg-orange-500/25 border border-orange-500/30 text-orange-400 px-3 rounded-xl transition-all">
                    <Plus className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}

/** Confidence star buttons */
function ConfStars({ value, onChange }: { value: number; onChange: (n: number) => void }) {
    return (
        <div className="flex gap-1.5">
            {[1, 2, 3, 4, 5].map(n => (
                <button
                    key={n}
                    onClick={() => onChange(n)}
                    className={`w-6 h-6 rounded-full text-[10px] font-black flex items-center justify-center transition-all
                        ${n <= value ? 'bg-indigo-500 text-white shadow-[0_0_8px_rgba(99,102,241,0.5)]' : 'bg-white/5 text-gray-600 hover:text-gray-400'}`}
                >
                    {n}
                </button>
            ))}
        </div>
    );
}

/** Fast score log modal */
function QuickLogModal({ subject, onClose, onAdd }: {
    subject: CASubject;
    onClose: () => void;
    onAdd: (s: number, t: number, name: string, type: string) => void;
}) {
    const [score, setScore] = useState('');
    const [total, setTotal] = useState('100');
    const [name, setName] = useState('');
    const [type, setType] = useState('Mock');

    const pct = score && total ? Math.round((Number(score) / Number(total)) * 100) : null;
    const pctColor = pct !== null ? (pct >= 60 ? 'text-green-400' : pct >= 40 ? 'text-yellow-400' : 'text-red-400') : 'text-gray-500';

    const submit = () => {
        const s = Number(score), t = Number(total || 100);
        if (!score || isNaN(s)) return;
        onAdd(s, t, name, type);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-[#18181b] border border-white/10 rounded-[2rem] p-8 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-lg font-black text-white">Log Score</h3>
                        <p className="text-xs text-gray-500 mt-0.5">{subject.name}</p>
                    </div>
                    {pct !== null && <div className={`text-4xl font-black ${pctColor}`}>{pct}%</div>}
                </div>
                <div className="space-y-3">
                    <div className="flex gap-3">
                        <input type="text" placeholder="Test name (optional)" value={name} onChange={e => setName(e.target.value)}
                            className="flex-1 bg-[#27272a] border border-white/5 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-indigo-500 placeholder:text-gray-600" />
                        <select value={type} onChange={e => setType(e.target.value)}
                            className="bg-[#27272a] border border-white/5 rounded-xl px-3 py-3 text-white text-sm outline-none focus:border-indigo-500">
                            <option value="Mock">Mock</option>
                            <option value="Chapter">Chapter</option>
                            <option value="MCQ">MCQ</option>
                            <option value="MTP">MTP</option>
                            <option value="RTP">RTP</option>
                        </select>
                    </div>
                    <div className="flex gap-3 items-center">
                        <input autoFocus type="number" placeholder="Score" value={score} onChange={e => setScore(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()}
                            className="flex-1 bg-[#27272a] border border-white/5 rounded-xl px-4 py-3 text-white text-center text-2xl font-black outline-none focus:border-indigo-500" />
                        <span className="text-gray-500 font-bold text-xl">/</span>
                        <input type="number" placeholder="Total" value={total} onChange={e => setTotal(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()}
                            className="flex-1 bg-[#27272a] border border-white/5 rounded-xl px-4 py-3 text-white text-center text-2xl font-black outline-none focus:border-indigo-500" />
                    </div>
                    <button onClick={submit}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-3.5 rounded-xl text-sm transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)]">
                        Record →
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Subject Card ─────────────────────────────────────────────────────────────

function SubjectCard({ subject, onUpdate }: { subject: CASubject; onUpdate: (id: string, data: Partial<CASubject>) => void }) {
    const [showLog, setShowLog] = useState(false);
    const meta = SUBJECT_META[subject.id] || { short: subject.id.toUpperCase(), gradient: 'from-gray-500 to-gray-600', glow: '', border: '' };

    const tests = subject.tests || [];
    const conf = getConfNum(subject.confidence);
    const avg = calcAvg(tests);
    const lastScore = tests.length ? Math.round((tests[tests.length - 1].score / tests[tests.length - 1].totalScore) * 100) : null;
    const reality = getRealityLabel(conf, avg);
    const writtenCount = getWrittenCount(subject);

    // Trend
    const trend = (() => {
        if (tests.length < 2) return null;
        const d = (tests[tests.length - 1].score / tests[tests.length - 1].totalScore) - (tests[tests.length - 2].score / tests[tests.length - 2].totalScore);
        return d > 0.05 ? 'up' : d < -0.05 ? 'down' : 'flat';
    })();

    const handleAddTest = (score: number, total: number, name: string, type: string) => {
        const t: TestScore = { id: Date.now().toString(), name: name || type, date: todayStr(), type, score, totalScore: total };
        onUpdate(subject.id, { tests: [...tests, t] });
    };

    const addWritten = () => {
        const wk = currentWeekKey();
        const currentCount = subject.writtenAnswersWeekOf === wk ? (subject.writtenAnswersThisWeek || 0) : 0;
        onUpdate(subject.id, { writtenAnswersThisWeek: currentCount + 1, writtenAnswersWeekOf: wk });
    };

    const resetWritten = () => {
        onUpdate(subject.id, { writtenAnswersThisWeek: 0, writtenAnswersWeekOf: currentWeekKey() });
    };

    const markRevision = (round: number) => {
        const existing = subject.revisionRounds || [];
        if (existing.find(r => r.round === round)) return;
        onUpdate(subject.id, { revisionRounds: [...existing, { round, date: todayStr() }] });
    };

    const addConceptHole = (chapter: string) => {
        const existing = subject.conceptHoles || [];
        const newHole: ConceptHole = { id: Date.now().toString(), chapter, createdAt: todayStr(), resolved: false };
        onUpdate(subject.id, { conceptHoles: [...existing, newHole] });
    };

    const resolveConceptHole = (id: string) => {
        const updated = (subject.conceptHoles || []).map(h => h.id === id ? { ...h, resolved: true } : h);
        onUpdate(subject.id, { conceptHoles: updated });
    };

    return (
        <>
            {showLog && <QuickLogModal subject={subject} onClose={() => setShowLog(false)} onAdd={handleAddTest} />}

            <div className={`group relative bg-[#18181b] border border-white/5 ${meta.border} ${meta.glow} rounded-[1.5rem] overflow-hidden shadow-xl transition-all duration-300 flex flex-col`}>
                {/* Top accent */}
                <div className={`h-0.5 w-full bg-gradient-to-r ${meta.gradient} opacity-70 group-hover:opacity-100 transition-opacity`} />

                <div className="p-6 flex flex-col gap-5">
                    {/* ── Header ─────────────────────── */}
                    <div className="flex items-start justify-between">
                        <div>
                            <div className={`text-xs font-black uppercase tracking-widest mb-1 bg-gradient-to-r ${meta.gradient} bg-clip-text text-transparent`}>{meta.short}</div>
                            <h3 className="text-sm font-bold text-white leading-snug">{subject.name}</h3>
                        </div>
                        <div className="text-right">
                            <div className="flex items-center gap-1.5 justify-end">
                                {trend === 'up' && <TrendingUp className="w-3.5 h-3.5 text-green-400" />}
                                {trend === 'down' && <TrendingDown className="w-3.5 h-3.5 text-red-400" />}
                                {trend === 'flat' && <Minus className="w-3.5 h-3.5 text-gray-500" />}
                                {lastScore !== null
                                    ? <span className={`text-2xl font-black ${lastScore >= 60 ? 'text-green-400' : lastScore >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>{lastScore}%</span>
                                    : <span className="text-gray-600 text-sm">No test</span>
                                }
                            </div>
                            {avg !== null && tests.length > 1 && <div className="text-[10px] text-gray-600 font-mono">avg {avg}%</div>}
                        </div>
                    </div>

                    {/* Reality gap */}
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md border self-start ${reality.cls}`}>
                        {reality.text}
                    </span>

                    {/* Sparkline */}
                    <SparkBar tests={tests} />

                    {/* Score scroll */}
                    {tests.length > 0 && (
                        <div className="flex gap-2 overflow-x-auto pb-1 snap-x hide-scrollbar">
                            {tests.slice().reverse().map(t => {
                                const p = Math.round((t.score / t.totalScore) * 100);
                                const c = p >= 60 ? 'text-green-400' : p >= 40 ? 'text-yellow-400' : 'text-red-400';
                                return (
                                    <div key={t.id} className="shrink-0 snap-start w-24 bg-[#1e1e22] border border-white/5 rounded-xl p-2.5 text-center flex flex-col gap-0.5">
                                        <div className="text-[8px] text-gray-600 font-bold uppercase">{t.type}</div>
                                        <div className={`text-xl font-black ${c}`}>{p}%</div>
                                        <div className="text-[9px] text-gray-600 font-mono">{t.score}/{t.totalScore}</div>
                                        <div className="text-[8px] text-gray-700 uppercase tracking-widest">{format(new Date(t.date), 'MMM d')}</div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* ── Written Answers ─────────────── */}
                    <div className="border-t border-white/5 pt-4">
                        <WrittenCounter
                            count={writtenCount}
                            target={WRITTEN_TARGET}
                            onAdd={addWritten}
                            onReset={resetWritten}
                        />
                    </div>

                    {/* ── Concept Holes ───────────────── */}
                    <div className="border-t border-white/5 pt-4">
                        <ConceptHoles
                            holes={subject.conceptHoles || []}
                            onAdd={addConceptHole}
                            onResolve={resolveConceptHole}
                        />
                    </div>

                    {/* ── Revision Rounds ─────────────── */}
                    <div className="border-t border-white/5 pt-4">
                        <RevisionRounds
                            rounds={subject.revisionRounds || []}
                            onMark={markRevision}
                        />
                    </div>

                    {/* ── Confidence + Log Score ──────── */}
                    <div className="border-t border-white/5 pt-4 flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                                <BrainCircuit className="w-3.5 h-3.5 text-indigo-400" />
                                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Confidence</span>
                            </div>
                            <ConfStars value={conf} onChange={n => onUpdate(subject.id, { confidence: n })} />
                        </div>
                        <button
                            onClick={() => setShowLog(true)}
                            className={`w-full py-3 rounded-xl text-sm font-black text-white bg-gradient-to-r ${meta.gradient} hover:opacity-90 transition-all shadow-lg flex items-center justify-center gap-2`}
                        >
                            <Plus className="w-4 h-4" /> Log Score
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}

// ─── Summary Bar ─────────────────────────────────────────────────────────────

function SummaryBar({ subjects }: { subjects: CASubject[] }) {
    const daysLeft = differenceInDays(EXAM_DATE, new Date());
    const totalTests = subjects.reduce((s, sub) => s + (sub.tests?.length || 0), 0);
    const allTests = subjects.flatMap(s => s.tests || []);
    const avgAll = allTests.length ? Math.round(allTests.reduce((s, t) => s + (t.score / t.totalScore) * 100, 0) / allTests.length) : null;
    const totalWritten = subjects.reduce((s, sub) => s + getWrittenCount(sub), 0);
    const openHoles = subjects.reduce((s, sub) => s + (sub.conceptHoles || []).filter(h => !h.resolved).length, 0);

    const stats = [
        { label: 'Days Left', value: daysLeft, sub: 'to CA Final May 2027', color: daysLeft < 100 ? 'text-red-400' : 'text-orange-400', icon: <Flame className="w-4 h-4 text-orange-400" /> },
        { label: 'Tests Logged', value: totalTests, sub: 'across all subjects', color: 'text-blue-400', icon: <Zap className="w-4 h-4 text-blue-400" /> },
        { label: 'Overall Avg', value: avgAll !== null ? `${avgAll}%` : '—', sub: 'across all tests', color: avgAll !== null ? (avgAll >= 60 ? 'text-green-400' : 'text-red-400') : 'text-gray-500', icon: <TrendingUp className="w-4 h-4 text-green-400" /> },
        { label: 'Written This Week', value: totalWritten, sub: `target ${subjects.length * WRITTEN_TARGET} total`, color: totalWritten >= 10 ? 'text-green-400' : 'text-pink-400', icon: <PenLine className="w-4 h-4 text-pink-400" /> },
        { label: 'Open Weak Spots', value: openHoles, sub: 'concept holes unfixed', color: openHoles > 0 ? 'text-orange-400' : 'text-gray-500', icon: <AlertCircle className="w-4 h-4 text-orange-400" /> },
    ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
            {stats.map(s => (
                <div key={s.label} className="bg-[#18181b] border border-white/5 rounded-2xl p-4 flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black uppercase tracking-widest text-gray-600">{s.label}</span>
                        {s.icon}
                    </div>
                    <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
                    <div className="text-[9px] text-gray-600">{s.sub}</div>
                </div>
            ))}
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CATracker() {
    const { subjects, loading, updateSubject } = useCATracker();

    if (loading) return (
        <div className="min-h-screen bg-[#101012] flex items-center justify-center text-gray-500 font-mono animate-pulse">
            Loading...
        </div>
    );

    return (
        <div className="min-h-screen bg-[#101012] text-gray-300 p-6 md:p-10 pb-24">
            <div className="mb-8">
                <h1 className="text-3xl font-black text-white tracking-tight">CA Final · Command</h1>
                <p className="text-xs text-gray-500 mt-1.5">
                    Score trajectory · Written practice · Concept holes · Revision rounds — all in one tap.
                </p>
            </div>

            <SummaryBar subjects={subjects} />

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {subjects.map(s => (
                    <SubjectCard key={s.id} subject={s} onUpdate={updateSubject} />
                ))}
            </div>
        </div>
    );
}
