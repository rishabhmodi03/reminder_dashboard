# Project Specification: Spaced Repetition & Daily Log App

## Tech Stack
- **Framework**: Next.js (Static Export mode)
- **Deployment**: GitHub Actions (Static Page Generation)
- **Database**: Firebase Cloud Firestore (Unauthenticated requests enabled)
- **Styling**: TailwindCSS (recommended for rapid development) or Vanilla CSS

## Features Overview
The application is a combination of a spaced repetition system, a one-time reminder app, and a "things done today" daily log. 

### Core Functionality
1. **Spaced Repetition System**: Track topics that need to be revised on specific interval days (e.g., 1, 3, 7, 14 days after the start date).
2. **One-Time Reminders**: Schedule one-off reminders for specific dates.
3. **Daily Logging**: A simple, editable text area to log daily accomplishments.

---

## Data Models (Firestore Collections)

### 1. `topics`
Stores both spaced repetition subjects and one-time reminders.
```typescript
interface Topic {
  id: string; // Document ID (UUID)
  name: string; // E.g., "Binary Search"
  createdAt: string; // "YYYY-MM-DD"
  startDate: string; // "YYYY-MM-DD" - when repetition begins
  intervalId: string; // References an Interval ID (e.g., "default"). Null if type is "reminder"
  type: "spaced" | "reminder";
  reminderDate: string | null; // "YYYY-MM-DD" - only used when type = "reminder"
  completedDates: string[]; // Array of "YYYY-MM-DD" dates user marked as done
  archived: boolean;
}
```

### 2. `intervals`
Stores reusable interval patterns for spaced repetition.
```typescript
interface Interval {
  id: string; // Document ID
  name: string; // E.g., "Standard", "Aggressive"
  days: number[]; // Array of offsets, e.g., [1, 3, 7, 14, 30, 60, 90]
}
```

### 3. `daily_logs`
Stores daily accomplishment entries.
```typescript
interface DailyLog {
  id: string; // Document ID (can be the date string "YYYY-MM-DD" for easy querying)
  date: string; // "YYYY-MM-DD"
  entries: string[]; // List of strings written by the user
}
```

---

## Page Requirements

### 1. Dashboard (`/`)
The main view showing everything relevant for "Today".

- **Today's Revisions**: 
  - Query `topics` where `type == "spaced"` and `archived == false`.
  - Calculate if today's date matches `startDate + interval.days[X]`.
  - Display: Topic Name, Revision Number (e.g., "Rev 3 of 7").
  - Action: ✅ Checkbox to mark complete (adds today's date to `completedDates`).
- **Today's Reminders**: 
  - Query `topics` where `type == "reminder"`, `archived == false`, and `reminderDate == today`.
  - Action: ✅ Checkbox to mark complete.
- **Upcoming (Tomorrow + Day After)**: 
  - Collapsed/expandable section displaying calculated revisions and reminders due in the next 1-2 days. Read-only.
- **Overdue**: 
  - Topics or reminders that were due on past dates but *not* found in `completedDates` for those specific dates. Highlighted in Red/Orange for urgency.

### 2. Manage Topics (`/topics`)
A dedicated page for CRUD operations on topics and intervals.

- **Add New Topic (Form)**:
  - Fields: Topic Name (Text), Type (Toggle: Spaced / Reminder).
  - If Spaced: Show "Interval" dropdown (fetches from `intervals` collection) and "Start Date" (Default: Today).
  - If Reminder: Show "Reminder Date" picker.
- **Manage Intervals (Modal / Sub-section)**:
  - List existing intervals.
  - Form to create new: Name, Days (comma-separated numbers converted to array).
- **Topic List (Table)**: 
  - Columns: Name, Type, Interval, Start Date, Progress (e.g., "3/7 done").
  - Action: Archive toggle/button. Filter to toggle showing Active vs Archived topics.

### 3. Daily Log (`/log`)
A timeline of accomplishments.

- **Today's Box**:
  - Simple editable textarea. 
  - Button to "Save" to Firestore `daily_logs` under today's date.
- **History View**:
  - Fetch history for the last 5 days (excluding today).
  - Display as a vertical timeline list (yesterday at the top). Read-only.

---

## Actions for the Developer
1. Initialize Next.js project: `npx create-next-app@latest .`
2. Configure Next.js for static export by setting `output: 'export'` in `next.config.mjs`.
3. Set up Firebase JS SDK and initialize Firestore client instance (remember to configure it such that connection config is injected via env variables).
4. Create the 3 main page routes (`/`, `/topics`, `/log`) with their respective React components.
5. Create utility functions for date manipulations (standardizing all timezone logic to avoid "YYYY-MM-DD" mismatch errors) and interval day calculations.
6. Set up a GitHub Actions workflow `.github/workflows/deploy.yml` that runs `npm run build` (triggering Next.js static export) and deploys to GitHub Pages or another static host.
