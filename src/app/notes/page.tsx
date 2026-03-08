"use client";

import { useState } from "react";
import { useFirebaseData, Note } from "@/hooks/useFirebaseData";
import { Plus, Trash2, Edit2, CheckCircle2, FileText, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function NotesPage() {
    const { notes, addNote, updateNote, deleteNote, loading } = useFirebaseData();
    const [selectedNote, setSelectedNote] = useState<Note | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({ title: '', content: '' });

    if (loading) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <div className="animate-pulse space-y-4 w-full max-w-2xl">
                    <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-1/3"></div>
                    <div className="h-40 bg-gray-200 dark:bg-gray-800 rounded-2xl w-full"></div>
                </div>
            </div>
        );
    }

    const handleCreateNew = () => {
        const newNote = {
            title: 'Untitled Note',
            content: '# New Note\n\nStart typing here...',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        addNote(newNote);
        setIsEditing(false);
    };

    const handleSelectNote = (note: Note) => {
        setSelectedNote(note);
        setIsEditing(false);
        setEditForm({ title: note.title, content: note.content });
    };

    const handleSave = () => {
        if (selectedNote) {
            updateNote(selectedNote.id, {
                title: editForm.title || 'Untitled Note',
                content: editForm.content,
                updatedAt: new Date().toISOString()
            });
            setIsEditing(false);
            setSelectedNote({ ...selectedNote, ...editForm, updatedAt: new Date().toISOString() });
        }
    };

    const handleDelete = (id: string) => {
        if (window.confirm("Are you sure you want to delete this note?")) {
            deleteNote(id);
            if (selectedNote?.id === id) {
                setSelectedNote(null);
                setIsEditing(false);
            }
        }
    };

    return (
        <div className="flex h-[calc(100vh-6rem)] gap-6 pb-6">
            {/* Sidebar List */}
            <div className="w-1/3 min-w-[300px] flex flex-col bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl overflow-hidden shadow-sm">
                <div className="p-6 border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 flex justify-between items-center">
                    <h2 className="text-xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
                        <FileText className="w-5 h-5 text-indigo-500" /> Notes
                    </h2>
                    <button
                        onClick={handleCreateNew}
                        className="p-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 dark:bg-indigo-900/50 dark:hover:bg-indigo-800/80 dark:text-indigo-300 rounded-xl transition-all"
                        title="New Note"
                    >
                        <Plus className="w-5 h-5" />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                    {notes.length === 0 ? (
                        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                            <p>No notes yet</p>
                            <p className="text-sm mt-1">Click + to create one</p>
                        </div>
                    ) : (
                        notes.map(note => (
                            <div
                                key={note.id}
                                onClick={() => handleSelectNote(note)}
                                className={`group p-4 rounded-2xl cursor-pointer transition-all border ${selectedNote?.id === note.id
                                    ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 shadow-sm'
                                    : 'bg-transparent border-transparent hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-200 dark:hover:border-gray-700'
                                    }`}
                            >
                                <h3 className={`font-semibold truncate mb-1 ${selectedNote?.id === note.id ? 'text-indigo-700 dark:text-indigo-300' : 'text-gray-800 dark:text-gray-200'}`}>
                                    {note.title}
                                </h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center justify-between">
                                    {format(new Date(note.updatedAt), 'MMM d, yyyy • h:mm a')}
                                    {selectedNote?.id === note.id && <ChevronRight className="w-3 h-3 text-indigo-500" />}
                                </p>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl overflow-hidden shadow-sm relative">
                {selectedNote ? (
                    <>
                        {/* Note Header */}
                        <div className="px-8 py-6 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-gray-50/30 dark:bg-gray-900/30">
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={editForm.title}
                                    onChange={e => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                                    className="text-2xl font-bold bg-transparent outline-none border-b-2 border-indigo-500 focus:border-indigo-400 text-gray-900 dark:text-white w-2/3 pb-1"
                                    placeholder="Note Title"
                                />
                            ) : (
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{selectedNote.title}</h1>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                                        Last edited on {format(new Date(selectedNote.updatedAt), 'MMMM d, yyyy')}
                                    </p>
                                </div>
                            )}

                            <div className="flex items-center gap-3">
                                {isEditing ? (
                                    <button
                                        onClick={handleSave}
                                        className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-all shadow-md shadow-indigo-500/20"
                                    >
                                        <CheckCircle2 className="w-4 h-4" /> Save
                                    </button>
                                ) : (
                                    <>
                                        <button
                                            onClick={() => setIsEditing(true)}
                                            className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-xl transition-all"
                                        >
                                            <Edit2 className="w-4 h-4" /> Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(selectedNote.id)}
                                            className="p-3 bg-red-50 hover:bg-red-100 dark:bg-red-950/30 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 rounded-xl transition-all"
                                            title="Delete Note"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Note Body */}
                        <div className="flex-1 overflow-y-auto w-full custom-scrollbar">
                            {isEditing ? (
                                <div className="h-full w-full p-8">
                                    <textarea
                                        value={editForm.content}
                                        onChange={e => setEditForm({ ...editForm, content: e.target.value })}
                                        className="w-full h-full resize-none bg-transparent outline-none text-gray-800 dark:text-gray-200 prose prose-indigo dark:prose-invert max-w-none font-mono text-sm leading-relaxed"
                                        placeholder="Use Markdown to write your note..."
                                    />
                                </div>
                            ) : (
                                <div className="p-8 lg:p-12 w-full flex justify-center">
                                    <div className="prose prose-lg dark:prose-invert prose-indigo max-w-3xl w-full">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                            {selectedNote.content}
                                        </ReactMarkdown>
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
                        <div className="w-24 h-24 mb-6 rounded-3xl bg-gray-50 dark:bg-gray-800/50 flex items-center justify-center rotate-12 transition-transform hover:rotate-0 duration-500 cursor-default shadow-sm border border-gray-100 dark:border-gray-800">
                            <FileText className="w-10 h-10 text-gray-300 dark:text-gray-600" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-500 dark:text-gray-400">Select a note to view</h2>
                        <p className="mt-2 text-sm max-w-xs text-center">Or click the + button to create a new markdown note</p>
                    </div>
                )}
            </div>
        </div>
    );
}
