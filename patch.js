const fs = require('fs');
const content = fs.readFileSync('src/app/page.tsx', 'utf8');

let newContent = content.replace(
`import { CheckCircle2, Circle, Clock, AlertTriangle, CalendarDays } from "lucide-react";`,
`import { useCATracker } from "@/hooks/useCATracker";
import { CheckCircle2, Circle, Clock, AlertTriangle, CalendarDays, ExternalLink } from "lucide-react";
import Link from 'next/link';
import { format, differenceInDays } from "date-fns";`
);

newContent = newContent.replace(
`  const { topics, intervals, loading, updateTopic } = useFirebaseData();`,
`  const { topics, intervals, loading: fbLoading, updateTopic } = useFirebaseData();
  const { subjects, loading: caLoading, updateSubject } = useCATracker();
  const loading = fbLoading || caLoading;`
);

newContent = newContent.replace(
`  const todayRevisions: { topic: Topic; revision: number; dueDate: string; totalRevs: number }[] = [];
  const todayReminders: Topic[] = [];
  const upcoming: { topic: Topic; revision?: number; dueDate: string; isReminder: boolean; daysAway: number }[] = [];
  const overdueItems: { topic: Topic; revision?: number; dueDate: string; isReminder: boolean }[] = [];`,
`  const todayRevisions: { topic: Topic; revision: number; dueDate: string; totalRevs: number; isCARevision?: boolean; subjectId?: string; revisionId?: string }[] = [];
  const todayReminders: (Topic | { id: string; name: string; isCAReminder: true; subjectId: string; dueDate: string })[] = [];
  const upcoming: { name?: string; topic?: Topic; revision?: number; dueDate: string; isReminder: boolean; daysAway: number; isCAReminder?: boolean; isCARevision?: boolean; subjectId?: string; revisionId?: string }[] = [];
  const overdueItems: { name?: string; topic?: Topic; revision?: number; dueDate: string; isReminder: boolean; isCAReminder?: boolean; isCARevision?: boolean; subjectId?: string; reminderId?: string; revisionId?: string }[] = [];`
);

newContent = newContent.replace(
    `const handleComplete = (topic: Topic, dateToComplete: string) => {`,
    `  // Extract CA Revisions & Reminders
  subjects.forEach(subj => {
    // Revisions
    (subj.revisions || []).forEach((rev, idx) => {
      if (!rev.completed) {
        const dueDateObj = new Date(rev.startDate);
        dueDateObj.setDate(dueDateObj.getDate() + rev.targetDays);
        const dueDateStr = format(dueDateObj, 'yyyy-MM-dd');

        if (dueDateStr === today) {
          todayRevisions.push({ topic: { id: rev.id, name: subj.name, type: 'spaced', intervalId: '', createdAt: '', startDate: '', reminderDate: '', completedDates: [], archived: false } as Topic, revision: idx + 1, dueDate: dueDateStr, totalRevs: subj.revisions.length, isCARevision: true, subjectId: subj.id, revisionId: rev.id });
        } else if (isDatePast(dueDateStr)) {
          overdueItems.push({ name: subj.name, dueDate: dueDateStr, isReminder: false, isCARevision: true, subjectId: subj.id, revisionId: rev.id, revision: idx + 1 });
        } else {
          const daysAway = differenceInDays(dueDateObj, new Date(today));
          upcoming.push({ name: subj.name, dueDate: dueDateStr, isReminder: false, daysAway, isCARevision: true, subjectId: subj.id, revisionId: rev.id, revision: idx + 1 });
        }
      }
    });

    // Reminders
    (subj.reminders || []).forEach(rem => {
      if (!rem.completed) {
        if (rem.dueDate === today) {
          todayReminders.push({ id: rem.id, name: \`\${subj.name}: \${rem.text}\`, isCAReminder: true, subjectId: subj.id, dueDate: rem.dueDate });
        } else if (isDatePast(rem.dueDate)) {
          overdueItems.push({ name: \`\${subj.name}: \${rem.text}\`, dueDate: rem.dueDate, isReminder: true, isCAReminder: true, subjectId: subj.id, reminderId: rem.id });
        } else {
          const daysAway = differenceInDays(new Date(rem.dueDate), new Date(today));
          upcoming.push({ name: \`\${subj.name}: \${rem.text}\`, dueDate: rem.dueDate, isReminder: true, daysAway, isCAReminder: true });
        }
      }
    });
  });

  upcoming.sort((a, b) => a.daysAway - b.daysAway);

  const handleComplete = (topic: Topic, dateToComplete: string) => {`
);

newContent = newContent.replace(
`  const handleComplete = (topic: Topic, dateToComplete: string) => {
    updateTopic(topic.id, {
      completedDates: [...topic.completedDates, dateToComplete]
    });
  };`,
`  const handleComplete = (topic: Topic, dateToComplete: string) => {
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
  };`
);


newContent = newContent.replace(
`                  <h3 className="font-medium text-lg">{item.topic.name}</h3>`,
`                  <h3 className="font-medium text-lg flex items-center gap-2">
                    {item.isCAReminder || item.isCARevision ? item.name : item.topic?.name}
                    {(item.isCAReminder || item.isCARevision) && (
                      <Link href="/ca-tracker" className="text-red-400 hover:text-red-300" title="Go to CA Tracker">
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    )}
                  </h3>`
);

newContent = newContent.replace(
`                  onClick={() => handleComplete(item.topic, item.dueDate)}`,
`                  onClick={() => {
                    if (item.isCAReminder && item.subjectId && item.reminderId) handleCompleteCAReminder(item.subjectId, item.reminderId);
                    else if (item.isCARevision && item.subjectId && item.revisionId) handleCompleteCARevision(item.subjectId, item.revisionId);
                    else if (item.topic) handleComplete(item.topic, item.dueDate);
                  }}`
);

newContent = newContent.replace(
`                    <h3 className="text-lg font-semibold text-gray-100">{rev.topic.name}</h3>`,
`                    <h3 className="text-lg font-semibold text-gray-100 flex items-center gap-2">
                      {rev.topic.name}
                      {rev.isCARevision && (
                        <Link href="/ca-tracker" className="text-blue-400 hover:text-blue-300" title="Go to CA Tracker">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      )}
                    </h3>`
);

newContent = newContent.replace(
`                    onClick={() => handleComplete(rev.topic, rev.dueDate)}`,
`                    onClick={() => {
                      if (rev.isCARevision && rev.subjectId && rev.revisionId) handleCompleteCARevision(rev.subjectId, rev.revisionId);
                      else handleComplete(rev.topic, rev.dueDate);
                    }}`
);

newContent = newContent.replace(
`                  <h3 className="text-lg font-semibold text-gray-100">{topic.name}</h3>`,
`                  <h3 className="text-lg font-semibold text-gray-100 flex items-center gap-2">
                    {topic.name}
                    {('isCAReminder' in topic) && (
                      <Link href="/ca-tracker" className="text-pink-400 hover:text-pink-300" title="Go to CA Tracker">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    )}
                  </h3>`
);

newContent = newContent.replace(
`                    onClick={() => handleComplete(topic, topic.reminderDate!)}`,
`                    onClick={() => {
                      if ('isCAReminder' in topic && topic.subjectId) {
                        handleCompleteCAReminder(topic.subjectId, topic.id);
                      } else {
                        handleComplete(topic as Topic, (topic as Topic).reminderDate!);
                      }
                    }}`
);

newContent = newContent.replace(
`                <div className={\`absolute top-0 left-0 w-1 h-full \${item.isReminder ? 'bg-purple-500/50' : 'bg-blue-500/50'}\`}></div>
                <h3 className="font-semibold text-gray-200">{item.topic.name}</h3>
                <p className="text-sm text-gray-500 mt-2 flex items-center space-x-2">
                  <span>{item.isReminder ? 'Reminder' : \`Revision \${item.revision}\`}</span>
                  <span className="mx-1">•</span>
                  <span className={\`text-xs font-bold px-2 py-0.5 rounded-full \${item.daysAway === 1 ? 'bg-indigo-500/20 text-indigo-300' : 'bg-gray-800 text-gray-400'}\`}>
                    {item.daysAway === 1 ? 'Tomorrow' : 'In 2 Days'}
                  </span>
                </p>`,
`                <div className={\`absolute top-0 left-0 w-1 h-full \${item.isCAReminder ? 'bg-pink-500/50' : item.isReminder ? 'bg-purple-500/50' : 'bg-blue-500/50'}\`}></div>
                <h3 className="font-semibold text-gray-200 flex items-center gap-2">
                  {item.name || (item as any).topic?.name}
                  {(item.isCAReminder || item.isCARevision) && (
                    <Link href="/ca-tracker" className={\`\${item.isCAReminder ? 'text-pink-400 hover:text-pink-300' : 'text-blue-400 hover:text-blue-300'}\`} title="Go to CA Tracker">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </h3>
                <p className="text-sm text-gray-500 mt-2 flex items-center space-x-2">
                  <span>{item.isReminder ? 'Reminder' : \`Revision \${item.revision}\`}</span>
                  <span className="mx-1">•</span>
                  <span className={\`text-xs font-bold px-2 py-0.5 rounded-full \${item.daysAway === 1 ? 'bg-indigo-500/20 text-indigo-300' : 'bg-gray-800 text-gray-400'}\`}>
                    {item.daysAway === 1 ? 'Tomorrow' : \`In \${item.daysAway} Days\`}
                  </span>
                </p>`
);

fs.writeFileSync('src/app/page.tsx', newContent);
console.log('done patching');
