import { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, setDoc, updateDoc } from 'firebase/firestore';
import { useFirebase } from '../components/FirebaseProvider';

export interface Revision {
    id: string;
    title: string;
    targetDays: number;
    startDate: string;
    completed: boolean;
}

export interface TestScore {
    id: string;
    date: string;
    type: string;
    name?: string;
    score: number;
    totalScore: number;
    notes?: string;
}

export interface CAReminder {
    id: string;
    text: string;
    dueDate: string; // e.g. "2026-03-30" 
    completed: boolean;
}

export interface CASubject {
    id: string;
    name: string;
    lecturesCompleted: number;
    lecturesTotal: number;
    qbCompleted?: number;
    qbTotal?: number;
    mcqCompleted?: number;
    mcqTotal?: number;
    confidence?: 'Low' | 'Medium' | 'High';
    materials?: string[]; // array of completed material IDs
    revisions: Revision[];
    tests: TestScore[];
    reminders?: CAReminder[];
}

const DEFAULT_SUBJECTS = [
    { id: 'fr', name: 'Financial Reporting (FR)' },
    { id: 'afm', name: 'Adv. Financial Mgt (AFM)' },
    { id: 'audit', name: 'Advanced Auditing' },
    { id: 'dt', name: 'Direct Tax Laws (DT)' },
    { id: 'idt', name: 'Indirect Tax Laws (IDT)' },
];

export function useCATracker() {
    const [subjects, setSubjects] = useState<CASubject[]>([]);
    const [loading, setLoading] = useState(true);
    const { db } = useFirebase();

    useEffect(() => {
        if (!db) return;

        let isMounted = true;
        const unsub = onSnapshot(collection(db, 'ca_subjects'), (snapshot) => {
            if (!isMounted) return;
            const fetchedSubjects = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CASubject));

            if (fetchedSubjects.length === 0) {
                DEFAULT_SUBJECTS.forEach(async (subj) => {
                    const newSubj: CASubject = {
                        id: subj.id,
                        name: subj.name,
                        lecturesCompleted: 0,
                        lecturesTotal: 100,
                        revisions: [],
                        tests: []
                    };
                    try {
                        await setDoc(doc(db, 'ca_subjects', subj.id), newSubj);
                    } catch (e) {
                        console.error('Error initializing subject', e);
                    }
                });
            } else {
                const sorted = DEFAULT_SUBJECTS.map(ds => fetchedSubjects.find(fs => fs.id === ds.id) || {
                    id: ds.id, name: ds.name, lecturesCompleted: 0, lecturesTotal: 100, revisions: [], tests: []
                });
                setSubjects(sorted);
            }
            setTimeout(() => setLoading(false), 0);
        }, (error) => {
            console.error("Error fetching CA subjects:", error);
            if (isMounted) setTimeout(() => setLoading(false), 0);
        });

        return () => {
            isMounted = false;
            unsub();
        };
    }, [db]);

    const updateSubject = async (id: string, data: Partial<CASubject>) => {
        if (!db) return;
        try {
            await updateDoc(doc(db, 'ca_subjects', id), data);
        } catch (e) {
            console.error("Error updating subject: ", e);
        }
    };

    return { subjects, loading, updateSubject };
}
