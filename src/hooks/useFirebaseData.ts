import { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc, addDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { useFirebase } from '../components/FirebaseProvider';

export interface Interval {
    id: string;
    name: string;
    days: number[];
    labels?: string[];
}

export interface Topic {
    id: string;
    name: string;
    createdAt: string;
    startDate: string;
    intervalId: string | null;
    type: 'spaced' | 'reminder';
    reminderDate: string | null;
    completedDates: string[];
    archived: boolean;
}

export interface DailyLog {
    id: string;
    date: string;
    entries: string[];
    studyHours?: number;
}

export interface Note {
    id: string;
    title: string;
    content: string;
    createdAt: string;
    updatedAt: string;
}

export function useFirebaseData() {
    const [topics, setTopics] = useState<Topic[]>([]);
    const [intervals, setIntervals] = useState<Interval[]>([]);
    const [logs, setLogs] = useState<DailyLog[]>([]);
    const [notes, setNotes] = useState<Note[]>([]);
    const [loading, setLoading] = useState(true);
    const { db } = useFirebase();

    useEffect(() => {
        if (!db) return;

        // Unsubscribe functions
        let unsubTopics: () => void;
        let unsubIntervals: () => void;
        let unsubLogs: () => void;
        let unsubNotes: () => void;

        try {
            unsubTopics = onSnapshot(collection(db, 'topics'), (snapshot) => {
                setTopics(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Topic)));
            }, (error) => console.error("Error fetching topics:", error));

            unsubIntervals = onSnapshot(collection(db, 'intervals'), (snapshot) => {
                setIntervals(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Interval)));
            }, (error) => console.error("Error fetching intervals:", error));

            unsubLogs = onSnapshot(query(collection(db, 'daily_logs'), orderBy('date', 'desc')), (snapshot) => {
                setLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DailyLog)));
            }, (error) => console.error("Error fetching logs:", error));

            unsubNotes = onSnapshot(query(collection(db, 'notes'), orderBy('updatedAt', 'desc')), (snapshot) => {
                setNotes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Note)));
            }, (error) => console.error("Error fetching notes:", error));

            setTimeout(() => setLoading(false), 0);
        } catch (e) {
            console.error("Firebase not properly initialized or offline", e);
            setTimeout(() => setLoading(false), 0);
        }

        return () => {
            if (unsubTopics) unsubTopics();
            if (unsubIntervals) unsubIntervals();
            if (unsubLogs) unsubLogs();
            if (unsubNotes) unsubNotes();
        };
    }, [db]);

    const addTopic = async (topic: Omit<Topic, 'id'>) => {
        if (!db) return;
        try {
            await addDoc(collection(db, 'topics'), topic);
        } catch (e) {
            console.error("Error adding topic: ", e);
        }
    };

    const updateTopic = async (id: string, data: Partial<Topic>) => {
        if (!db) return;
        try {
            await updateDoc(doc(db, 'topics', id), data);
        } catch (e) {
            console.error("Error updating topic: ", e);
        }
    };

    const addInterval = async (interval: Omit<Interval, 'id'>) => {
        if (!db) return;
        try {
            await addDoc(collection(db, 'intervals'), interval);
        } catch (e) {
            console.error("Error adding interval: ", e);
        }
    };

    const saveDailyLog = async (log: Omit<DailyLog, 'id'>, existingId?: string) => {
        if (!db) return;
        try {
            if (existingId) {
                await updateDoc(doc(db, 'daily_logs', existingId), log);
            } else {
                await addDoc(collection(db, 'daily_logs'), log);
            }
        } catch (e) {
            console.error("Error saving log: ", e);
        }
    };

    const addNote = async (note: Omit<Note, 'id'>) => {
        if (!db) return;
        try {
            await addDoc(collection(db, 'notes'), note);
        } catch (e) {
            console.error("Error adding note: ", e);
        }
    };

    const updateNote = async (id: string, data: Partial<Note>) => {
        if (!db) return;
        try {
            await updateDoc(doc(db, 'notes', id), data);
        } catch (e) {
            console.error("Error updating note: ", e);
        }
    };

    const deleteNote = async (id: string) => {
        if (!db) return;
        try {
            await deleteDoc(doc(db, 'notes', id));
        } catch (e) {
            console.error("Error deleting note: ", e);
        }
    };

    return { topics, intervals, logs, notes, loading, addTopic, updateTopic, addInterval, saveDailyLog, addNote, updateNote, deleteNote };
}
