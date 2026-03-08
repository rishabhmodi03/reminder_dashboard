export const getSpacedRepetitionGuide = (revisionNum: number): string => {
    switch (revisionNum) {
        case 1: return "Day 0: BLIND RECALL — write headings, recall points";
        case 2: return "Day 1: QUESTIONS — solve from primary QB";
        case 3: return "Day 3: RECALL + DIFFERENT QB — test if it survived 3 days";
        case 4: return "Day 7: FULL RECALL — this is where you discover real gaps";
        case 5: return "Day 14: APPLICATION — case study questions (not just recall)";
        case 6: return "Day 28: COMPREHENSIVE — war book + past paper question";
        case 7: return "Day 56: REINFORCEMENT — recall + redo wrong questions";
        case 8: return "Day 90: STRESS TEST — timed conditions, exam difficulty";
        case 9: return "Day 120: RAPID RECALL — should be near-automatic by now";
        default: return "Day 150+: MAINTENANCE — folded into revision rounds";
    }
}

export const getSpacedRepetitionScheduleEntries = () => [
    { day: 0, text: 'BLIND RECALL — write headings, recall points' },
    { day: 1, text: 'QUESTIONS — solve from primary QB' },
    { day: 3, text: 'RECALL + DIFFERENT QB — test if it survived 3 days' },
    { day: 7, text: 'FULL RECALL — this is where you discover real gaps' },
    { day: 14, text: 'APPLICATION — case study questions (not just recall)' },
    { day: 28, text: 'COMPREHENSIVE — war book + past paper question' },
    { day: 56, text: 'REINFORCEMENT — recall + redo wrong questions' },
    { day: 90, text: 'STRESS TEST — timed conditions, exam difficulty' },
    { day: 120, text: 'RAPID RECALL — should be near-automatic by now' },
    { day: 150, text: 'MAINTENANCE — folded into revision rounds' },
];

// Full schedule description for spaced‑repetition reminders
export const getSpacedRepetitionSchedule = (): string => {
    return `Day 0 (same night):    BLIND RECALL — write headings, recall points
Day 1:                 QUESTIONS — solve from primary QB
Day 3:                 RECALL + DIFFERENT QB — test if it survived 3 days
Day 7:                 FULL RECALL — this is where you discover real gaps
Day 14:                APPLICATION — case study questions (not just recall)
Day 28:                COMPREHENSIVE — war book + past paper question
Day 56:                REINFORCEMENT — recall + redo wrong questions
Day 90:                STRESS TEST — timed conditions, exam-level difficulty
Day 120:               RAPID RECALL — should be near‑automatic by now
Day 150+:              MAINTENANCE — folded into revision rounds`;
};
