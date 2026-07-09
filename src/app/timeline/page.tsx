"use client";

import { useFirebaseData } from "@/hooks/useFirebaseData";
import { useState } from "react";
import { format, subDays, parseISO } from "date-fns";
import { getTodayStr } from "@/lib/dateUtils";
import { X } from "lucide-react";

const HOURS = Array.from({ length: 16 }, (_, i) => i + 7); // 7 to 22

function parseTimeToHours(timeStr: string): number {
    if (!timeStr) return 0;
    let match = timeStr.trim().match(/(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)?/);
    if (!match) return 0;
    let [_, h, m, meridiem] = match;
    let hour = parseInt(h);
    let min = parseInt(m) / 60;
    meridiem = (meridiem || '').toUpperCase();
    if (meridiem === 'PM' && hour !== 12) hour += 12;
    if (meridiem === 'AM' && hour === 12) hour = 0;
    return hour + min;
}

const getColorClass = (text: string) => {
    const lower = text.toLowerCase();
    if (lower.includes('fr') || lower.includes('cma')) return 'bg-[#FF84C6] text-black border-[#FF84C6] shadow-[0_0_10px_rgba(255,132,198,0.2)]';
    if (lower.includes('aud')) return 'bg-[#CBA92C] text-black border-[#CBA92C] shadow-[0_0_10px_rgba(203,169,44,0.2)]';
    if (lower.includes('law')) return 'bg-[#31D6A7] text-black border-[#31D6A7] shadow-[0_0_10px_rgba(49,214,167,0.2)]';
    if (lower.includes('sfm') || lower.includes('afm') || lower.includes('it')) return 'bg-[#F49642] text-black border-[#F49642] shadow-[0_0_10px_rgba(244,150,66,0.2)]';
    if (lower.includes('dt') || lower.includes('idt') || lower.includes('gst')) return 'bg-[#2DCBEC] text-black border-[#2DCBEC] shadow-[0_0_10px_rgba(45,203,236,0.2)]';
    return 'bg-[#AC84FF] text-black border-[#AC84FF] shadow-[0_0_10px_rgba(172,132,255,0.2)]';
};

const getSubjectName = (text: string) => {
    const s = text.toUpperCase();
    if (s.includes('FR')) return 'FR';
    if (s.includes('AUD')) return 'AUD';
    if (s.includes('LAW')) return 'LAW';
    if (s.includes('AFM') || s.includes('SFM')) return 'AFM';
    if (s.includes('DT')) return 'DT';
    if (s.includes('IDT') || s.includes('GST')) return 'IDT';
    if (s.includes('CMA')) return 'CMA';
    if (s.includes('IT')) return 'IT';
    return text.length > 5 ? text.substring(0, 5) : text;
}

const formatTimeRange = (start: number, end: number) => {
    const sH = Math.floor(start).toString().padStart(2, '0');
    const sM = Math.round((start % 1) * 60).toString().padStart(2, '0');
    const eH = Math.floor(end).toString().padStart(2, '0');
    const eM = Math.round((end % 1) * 60).toString().padStart(2, '0');
    return `${sH}:${sM} - ${eH}:${eM}`;
}

interface Block {
    startHour: number;
    endHour: number;
    text: string;
    subject: string;
    colorClass: string;
    inProgress?: boolean;
    dateStr: string;
}

export default function Timeline() {
    const { logs, loading } = useFirebaseData();
    const [selectedBlock, setSelectedBlock] = useState<Block | null>(null);

    if (loading) {
        return (
            <div className="bg-[#121212] min-h-screen text-gray-300 w-full rounded-[2rem] p-10 flex items-center justify-center font-mono text-xl animate-pulse">
                Initializing Grid...
            </div>
        );
    }

    const today = new Date();
    // Render last 7 days
    const daysToRender = Array.from({ length: 7 }, (_, i) => {
        const d = subDays(today, i);
        return format(d, 'yyyy-MM-dd');
    });

    return (
        <div className="bg-[#101012] min-h-screen text-gray-300 w-full rounded-[2rem] p-10 shadow-2xl relative overflow-hidden border border-[#2A2A2E]">
            {/* Header */}
            <div className="mb-10 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-white">Timeline</h1>
                    <p className="text-gray-400 mt-1 font-mono text-sm">Every session placed by time of day. Bar length = real study time.</p>
                </div>
                <div className="flex gap-4">
                    <div className="bg-[#1C1C1E] px-4 py-2 rounded-xl text-xs font-bold font-mono border border-[#2A2A2E] text-gray-400">Good day <span className="text-white">&ge; 8 h</span></div>
                    <div className="bg-[#1C1C1E] px-4 py-2 rounded-xl text-xs font-bold font-mono border border-[#2A2A2E] text-gray-400">Decent <span className="text-white">&ge; 6 h</span></div>
                </div>
            </div>

            {/* Grid layout */}
            <div className="relative border border-[#2A2A2E] bg-[#161618] rounded-xl shadow-2xl overflow-x-auto custom-scrollbar">
                <div className="min-w-[800px] md:min-w-0">
                    {/* Header Row */}
                    <div className="flex border-b border-[#2A2A2E] bg-[#1A1A1D]">
                        <div className="w-32 py-4 px-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest border-r border-[#2A2A2E] shrink-0 font-mono">
                            DATE
                        </div>
                        <div className="flex-1 flex relative h-full">
                            {HOURS.map(h => (
                                <div key={h} className="flex-1 min-w-0 border-r border-[#2A2A2E]/50 text-center py-4 text-[10px] text-gray-500 font-bold font-mono bg-[#1C1C20]">
                                    {h.toString().padStart(2, '0')}
                                </div>
                            ))}
                        </div>
                        <div className="w-20 py-4 text-center text-[10px] font-bold text-gray-500 uppercase tracking-widest border-l border-[#2A2A2E] shrink-0 font-mono">
                            TOTAL
                        </div>
                    </div>

                    {/* Days Rows */}
                    <div className="divide-y divide-[#2A2A2E]">
                        {daysToRender.map(dateStr => {
                            const log = logs.find(l => l.date === dateStr);

                            // Calculate blocks
                            const blocks: Block[] = [];
                            let totalStudyHours = 0;

                            const isToday = dateStr === getTodayStr();

                            if (log && log.entries) {
                                // extract valid time entries
                                const timeEntries = log.entries
                                    .map(e => {
                                        const match = e.match(/^(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)?)\s*-\s*(.*)/i);
                                        if (match) return { time: match[1], text: match[2], hour: parseTimeToHours(match[1]) };
                                        return null;
                                    })
                                    .filter(Boolean)
                                    .sort((a, b) => a!.hour - b!.hour) as { time: string, text: string, hour: number }[];

                                for (let i = 0; i < timeEntries.length; i++) {
                                    const cur = timeEntries[i];
                                    const next = timeEntries[i + 1];
                                    const startHour = Math.max(7, cur.hour); // clip to 7 am
                                    const endHourRaw = next ? next.hour : (isToday && i === timeEntries.length - 1 ? cur.hour + 2 : cur.hour + 2);
                                    const endHour = Math.min(23, endHourRaw); // clip to 23

                                    if (endHour > startHour && startHour >= 7 && startHour < 23) {
                                        blocks.push({
                                            startHour,
                                            endHour,
                                            text: cur.text,
                                            subject: getSubjectName(cur.text),
                                            colorClass: getColorClass(cur.text),
                                            inProgress: isToday && !next,
                                            dateStr
                                        });
                                        totalStudyHours += (endHour - startHour);
                                    }
                                }
                            }

                            // Use manual studyHours if entered, otherwise calculate from timeline
                            if (log && log.studyHours && totalStudyHours === 0) {
                                totalStudyHours = log.studyHours;
                            }

                            return (
                                <div key={dateStr} className="flex min-h-[64px] hover:bg-[#1A1A1D] transition-colors relative group">
                                    {/* Date Column */}
                                    <div className="w-32 p-4 border-r border-[#2A2A2E] shrink-0 flex flex-col justify-center">
                                        <div className="font-bold text-white text-sm tracking-tight">{format(parseISO(dateStr), 'dd MMM')}</div>
                                        <div className="text-xs text-gray-500 font-mono mt-0.5">{format(parseISO(dateStr), 'EEE')}{isToday ? ' • today' : ''}</div>
                                    </div>

                                    {/* timeline track */}
                                    <div className="flex-1 flex relative">
                                        {/* grid lines */}
                                        {HOURS.map(h => (
                                            <div key={`grid-${h}`} className="flex-1 min-w-0 border-r border-[#2A2A2E]/30 group-hover:border-[#2A2A2E]/70 transition-colors"></div>
                                        ))}

                                        {/* blocks */}
                                        {blocks.map((blk, idx) => {
                                            // scale: 16 hours total spanning 100% width.
                                            const leftPct = ((blk.startHour - 7) / 16) * 100;
                                            const widthPct = ((blk.endHour - blk.startHour) / 16) * 100;
                                            return (
                                                <div
                                                    key={idx}
                                                    className={`absolute top-[50%] -translate-y-[50%] h-[28px] rounded-md ${blk.colorClass} ${blk.inProgress ? 'opacity-80 border-dashed border-2' : ''} flex items-center px-3 overflow-hidden text-[10px] font-bold font-mono z-10 transition-transform hover:scale-[1.02] hover:z-20 cursor-pointer`}
                                                    style={{
                                                        left: `${Math.max(0, leftPct)}%`,
                                                        width: `${Math.min(100 - leftPct, widthPct)}%`,
                                                    }}
                                                    title={`${blk.text} (${Math.round((blk.endHour - blk.startHour) * 10) / 10}h)`}
                                                    onClick={() => setSelectedBlock(blk)}
                                                >
                                                    <span className="truncate drop-shadow-md">{blk.subject}</span>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Total Hours */}
                                    <div className={`w-20 p-4 border-l border-[#2A2A2E] shrink-0 flex items-center justify-center font-mono font-bold text-xs ${totalStudyHours >= 8 ? 'text-[#31D6A7]' : totalStudyHours >= 6 ? 'text-[#CBA92C]' : 'text-gray-500'}`}>
                                        {totalStudyHours > 0 ? (
                                            <span>
                                                <span className="text-white text-sm">{Math.floor(totalStudyHours)}</span>h {totalStudyHours % 1 !== 0 ? <span className="opacity-80 ml-0.5">{Math.round((totalStudyHours % 1) * 60)}m</span> : ''}
                                            </span>
                                        ) : (
                                            <span className="text-gray-600">-</span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-6 mt-8">
                {[
                    { name: 'AA', color: 'bg-[#AC84FF]' },
                    { name: 'LAW', color: 'bg-[#31D6A7]' },
                    { name: 'IT/AFM', color: 'bg-[#F49642]' },
                    { name: 'GST/DT', color: 'bg-[#2DCBEC]' },
                    { name: 'CMA/FR', color: 'bg-[#FF84C6]' },
                    { name: 'AUD', color: 'bg-[#CBA92C]' }
                ].map(l => (
                    <div key={l.name} className="flex items-center gap-2">
                        <span className={`w-3 h-3 rounded ${l.color}`}></span>
                        <span className="text-xs font-bold text-gray-400 font-mono">{l.name}</span>
                    </div>
                ))}
                <div className="ml-auto flex gap-6">
                    <div className="flex items-center gap-2">
                        <span className="w-4 h-4 rounded bg-[#E4E4E5]"></span>
                        <span className="text-xs text-gray-400 font-mono">done</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-4 h-4 rounded border-2 border-dashed border-[#E4E4E5] bg-transparent"></span>
                        <span className="text-xs text-gray-400 font-mono">in progress</span>
                    </div>
                </div>
            </div>

            {/* Modal */}
            {selectedBlock && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 shadow-2xl transition-all" onClick={() => setSelectedBlock(null)}>
                    <div
                        className="bg-[#1C1C1E] border border-white/10 p-8 rounded-[2rem] max-w-md w-full shadow-2xl shadow-black relative"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-[50px] pointer-events-none -translate-y-1/2 translate-x-1/4"></div>
                        <div className="absolute top-0 left-0 w-32 h-32 bg-teal-500/10 rounded-full blur-[50px] pointer-events-none -translate-y-1/2 -translate-x-1/4"></div>

                        <div className="flex justify-between items-start mb-8 relative z-10">
                            <div className="flex items-center gap-3">
                                <span className={`w-5 h-5 rounded-md ${selectedBlock.colorClass} shadow-md`}></span>
                                <h3 className="text-2xl font-black text-white tracking-tight">{selectedBlock.subject} Session</h3>
                            </div>
                            <button onClick={() => setSelectedBlock(null)} className="text-gray-500 hover:text-white transition-colors bg-white/5 p-2 rounded-xl hover:bg-white/10">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4 relative z-10">
                            <div className="bg-[#2C2C2E]/80 p-5 rounded-2xl border border-white/5 shadow-inner">
                                <p className="text-indigo-400 text-xs font-black uppercase tracking-widest mb-1.5 flex items-center gap-2">Details</p>
                                <p className="text-white text-base leading-relaxed break-words">{selectedBlock.text}</p>
                            </div>
                            <div className="flex gap-4">
                                <div className="bg-[#2C2C2E]/80 p-5 rounded-2xl border border-white/5 flex-1 shadow-inner">
                                    <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1.5">Date</p>
                                    <p className="text-gray-200 font-mono text-sm">{format(parseISO(selectedBlock.dateStr), 'dd MMM yyyy')}</p>
                                </div>
                                <div className="bg-[#2C2C2E]/80 p-5 rounded-2xl border border-white/5 flex-1 shadow-inner">
                                    <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1.5">Time Period</p>
                                    <p className="text-gray-200 font-mono text-sm">{formatTimeRange(selectedBlock.startHour, selectedBlock.endHour)}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
