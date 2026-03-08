import React, { useState } from 'react';
import {
    format,
    addMonths,
    subMonths,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    isSameMonth,
    isSameDay,
    addDays,
    startOfDay,
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarProps {
    onSelectDate: (dateStr: string) => void;
    selectedDate: string;
    itemsMap: Record<string, { revisionCount: number; reminderCount: number }>;
}

export function DashboardCalendar({ onSelectDate, selectedDate, itemsMap }: CalendarProps) {
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const renderHeader = () => {
        return (
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {format(currentMonth, 'MMMM yyyy')}
                </h2>
                <div className="flex space-x-2">
                    <button
                        onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            </div>
        );
    };

    const renderDaysOfWeek = () => {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        return (
            <div className="grid grid-cols-7 gap-1 mb-2">
                {days.map((day, i) => (
                    <div key={i} className="text-center font-semibold text-sm text-gray-500 dark:text-gray-400 py-2">
                        {day}
                    </div>
                ))}
            </div>
        );
    };

    const renderCells = () => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(monthStart);
        const startDate = startOfWeek(monthStart);
        const endDate = endOfWeek(monthEnd);

        const rows = [];
        let days = [];
        let day = startDate;
        let formattedDate = '';
        const selectedDateObj = new Date(selectedDate);

        while (day <= endDate) {
            for (let i = 0; i < 7; i++) {
                formattedDate = format(day, 'yyyy-MM-dd');
                const cloneDay = day;
                const isCurrentMonth = isSameMonth(day, monthStart);
                const isSelected = isSameDay(day, selectedDateObj);
                const isToday = isSameDay(day, new Date());

                const dayStats = itemsMap[formattedDate] || { revisionCount: 0, reminderCount: 0 };
                const hasRevisions = dayStats.revisionCount > 0;
                const hasReminders = dayStats.reminderCount > 0;

                const isPastDate = day < startOfDay(new Date());
                const isOverdue = isPastDate && (hasRevisions || hasReminders);

                days.push(
                    <button
                        key={formattedDate}
                        onClick={() => onSelectDate(format(cloneDay, 'yyyy-MM-dd'))}
                        className={`
              relative flex flex-col items-center justify-center w-10 h-10 mx-auto border rounded-full transition-all
              ${!isCurrentMonth ? 'text-gray-400 dark:text-gray-600 bg-gray-50/50 dark:bg-gray-900/20 border-transparent' : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700'}
              ${isSelected ? 'ring-2 ring-blue-500 bg-blue-50/50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' : ''}
              ${isToday && !isSelected ? 'border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400 font-bold' : ''}
              ${isOverdue && !isSelected ? 'border-red-200 dark:border-red-800/60 bg-red-50/30 dark:bg-red-900/10' : ''}
              hover:border-blue-300 dark:hover:border-blue-600
            `}
                    >
                        <span className={`text-sm ${isSelected ? 'font-bold text-blue-700 dark:text-blue-300' : ''} ${isOverdue && !isSelected ? 'text-red-500 dark:text-red-400' : ''}`}>
                            {format(day, 'd')}
                        </span>

                        <div className="flex gap-1 mt-0.5">
                            {isOverdue ? (
                                <div className="w-1.5 h-1.5 rounded-full bg-red-500" title="Overdue Tasks" />
                            ) : (
                                <>
                                    {hasRevisions && (
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500" title={`${dayStats.revisionCount} Tasks`} />
                                    )}
                                    {hasReminders && (
                                        <div className="w-1.5 h-1.5 rounded-full bg-purple-500" title={`${dayStats.reminderCount} Reminders`} />
                                    )}
                                </>
                            )}
                        </div>
                    </button>
                );
                day = addDays(day, 1);
            }
            rows.push(
                <div className="grid grid-cols-7 gap-2 mb-2" key={day.toString()}>
                    {days}
                </div>
            );
            days = [];
        }
        return <div>{rows}</div>;
    };

    return (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-sm">
            {renderHeader()}
            {renderDaysOfWeek()}
            {renderCells()}

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-4 mt-6 pt-4 border-t border-gray-100 dark:border-gray-800 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <span>Revisions</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-purple-500" />
                    <span>Reminders</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    <span>Overdue</span>
                </div>
            </div>
        </div>
    );
}
