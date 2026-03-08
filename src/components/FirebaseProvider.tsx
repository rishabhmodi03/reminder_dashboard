"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";

interface FirebaseContextType {
    db: Firestore | null;
    app: FirebaseApp | null;
    projectId: string | null;
    setProjectId: (id: string) => void;
    clearProjectId: () => void;
}

const FirebaseContext = createContext<FirebaseContextType>({
    db: null,
    app: null,
    projectId: null,
    setProjectId: () => { },
    clearProjectId: () => { },
});

export const useFirebase = () => useContext(FirebaseContext);

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [projectId, setProjectIdState] = useState<string | null>(null);
    const [db, setDb] = useState<Firestore | null>(null);
    const [app, setApp] = useState<FirebaseApp | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const stored = localStorage.getItem("firebaseProjectId");
        if (stored) {
            setProjectIdState(stored);
        } else {
            setShowModal(true);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        if (projectId) {
            try {
                const firebaseConfig = { projectId };
                // Need to specify an explicit name if initializing multiple apps, but here we just reuse default
                const initializedApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
                setApp(initializedApp);
                setDb(getFirestore(initializedApp));
            } catch (e) {
                console.error("Failed to initialize Firebase:", e);
            }
        } else {
            setDb(null);
            setApp(null);
        }
    }, [projectId]);

    const handleSave = (id: string) => {
        setProjectIdState(id);
        localStorage.setItem("firebaseProjectId", id);
        setShowModal(false);
    };

    const clearProjectId = () => {
        localStorage.removeItem("firebaseProjectId");
        setProjectIdState(null);
        setShowModal(true);
    };

    if (loading) {
        return null;
    }

    return (
        <FirebaseContext.Provider value={{ db, app, projectId, setProjectId: handleSave, clearProjectId }}>
            {children}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100]">
                    <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-xl max-w-md w-full mx-4 border border-gray-100 dark:border-gray-800">
                        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-50">Setup Database</h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-6 font-medium">
                            Please enter your Firestore Project ID to continue. Your data will be synced with this database.
                        </p>
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            const val = new FormData(e.currentTarget).get('projectId') as string;
                            if (val.trim()) handleSave(val.trim());
                        }}>
                            <input
                                name="projectId"
                                type="text"
                                placeholder="e.g. your-project-id"
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 mb-6 focus:ring-2 focus:ring-blue-500 transition-all font-mono outline-none"
                                autoFocus
                                required
                            />
                            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors">
                                Save & Continue
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </FirebaseContext.Provider>
    );
};
