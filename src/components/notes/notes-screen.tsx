"use client";

import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { TipTapEditor } from "./tiptap-editor";
import { FolderDialog } from "./folder-dialog";
import {
  FolderPlus,
  Plus,
  Search,
  Pin,
  Star,
  Trash2,
  Folder as FolderIcon,
  Tag,
  Target,
  FileText,
  Clock,
  MoreVertical,
  Edit2,
  ChevronRight,
} from "lucide-react";

export function NotesScreen() {
  const folders = useQuery(api.notes.listFolders) || [];
  const convexNotes = useQuery(api.notes.listNotes);
  const goals = useQuery(api.goals.list) || [];

  const createNote = useMutation(api.notes.createNote);
  const updateNote = useMutation(api.notes.updateNote);
  const removeNote = useMutation(api.notes.removeNote);
  const togglePinned = useMutation(api.notes.togglePinned);
  const toggleFavorite = useMutation(api.notes.toggleFavorite);
  const removeFolder = useMutation(api.notes.removeFolder);
  const seedIfEmpty = useMutation(api.notes.seedIfEmpty);

  // Warm instant hydration cache
  const [cachedNotes, setCachedNotes] = useState<any[]>([]);
  const [isLoadedFromCache, setIsLoadedFromCache] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("mosha_cached_notes");
      if (saved) setCachedNotes(JSON.parse(saved));
    } catch {}
    setIsLoadedFromCache(true);
  }, []);

  useEffect(() => {
    if (convexNotes !== undefined) {
      setCachedNotes(convexNotes);
      try {
        localStorage.setItem("mosha_cached_notes", JSON.stringify(convexNotes));
      } catch {}
    }
  }, [convexNotes]);

  const notes = convexNotes !== undefined ? convexNotes : cachedNotes;

  // Auto seed initial welcoming note & folders if totally empty
  useEffect(() => {
    if (convexNotes && convexNotes.length === 0 && folders.length === 0) {
      seedIfEmpty();
    }
  }, [convexNotes, folders.length, seedIfEmpty]);

  // Active navigation states
  const [selectedFolderId, setSelectedFolderId] = useState<string>("all"); // "all" | "pinned" | "favorites" | folderId
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Folder dialog state
  const [isFolderDialogOpen, setIsFolderDialogOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<any | null>(null);

  // Set default active note on first load
  useEffect(() => {
    if (!activeNoteId && notes.length > 0) {
      setActiveNoteId(notes[0]._id);
    }
  }, [notes, activeNoteId]);

  const activeNote = notes.find((n: any) => n._id === activeNoteId) || notes[0] || null;

  // Debounced auto-save timer
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleEditorChange = (html: string, plainText: string) => {
    if (!activeNote) return;

    // Optimistically update local cache
    const updatedNotes = notes.map((n: any) =>
      n._id === activeNote._id ? { ...n, content: html, plainText, updatedAt: new Date().toISOString() } : n
    );
    setCachedNotes(updatedNotes);

    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(async () => {
      try {
        await updateNote({
          id: activeNote._id,
          content: html,
          plainText,
        });
      } catch (err) {
        console.error("Auto-save failed:", err);
      }
    }, 600);
  };

  const handleTitleChange = async (newTitle: string) => {
    if (!activeNote) return;
    const updatedNotes = notes.map((n: any) =>
      n._id === activeNote._id ? { ...n, title: newTitle, updatedAt: new Date().toISOString() } : n
    );
    setCachedNotes(updatedNotes);

    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(async () => {
      await updateNote({
        id: activeNote._id,
        title: newTitle,
      });
    }, 500);
  };

  const handleCreateNewNote = async () => {
    const targetFolderId =
      selectedFolderId !== "all" && selectedFolderId !== "pinned" && selectedFolderId !== "favorites"
        ? (selectedFolderId as any)
        : undefined;

    const newId = await createNote({
      title: "Untitled Note",
      content: "<p></p>",
      plainText: "",
      folderId: targetFolderId,
    });

    if (newId) {
      setActiveNoteId(newId);
    }
  };

  const handleDeleteNote = async (id: any) => {
    await removeNote({ id });
    const remaining = notes.filter((n: any) => n._id !== id);
    setActiveNoteId(remaining.length > 0 ? remaining[0]._id : null);
  };

  // Filter computation
  const filteredNotes = notes.filter((note: any) => {
    if (selectedFolderId === "pinned" && !note.isPinned) return false;
    if (selectedFolderId === "favorites" && !note.isFavorite) return false;
    if (
      selectedFolderId !== "all" &&
      selectedFolderId !== "pinned" &&
      selectedFolderId !== "favorites" &&
      note.folderId !== selectedFolderId
    ) {
      return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = note.title?.toLowerCase().includes(q);
      const matchText = note.plainText?.toLowerCase().includes(q);
      if (!matchTitle && !matchText) return false;
    }

    return true;
  });

  const getFolderName = (folderId?: string) => {
    if (!folderId) return undefined;
    const f = folders.find((item: any) => item._id === folderId);
    return f ? `${f.icon} ${f.name}` : undefined;
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* 3-Column Layout: Folders Sidebar -> Notes List -> Rich Text Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start min-h-[calc(100vh-140px)]">
        {/* Column 1: Folders / Navigation Sidebar (3 Cols) */}
        <div className="lg:col-span-3 bento-card rounded-2xl p-3.5 space-y-3 bg-[#FBFBFA]">
          <div className="flex items-center justify-between border-b border-[#ECEAE4] pb-2 px-1">
            <h3 className="font-serif font-bold text-sm text-[#1A202C]">
              Notebooks
            </h3>
            <button
              onClick={() => {
                setEditingFolder(null);
                setIsFolderDialogOpen(true);
              }}
              title="Add New Folder"
              className="p-1 rounded-md text-[#718096] hover:text-[#1A202C] hover:bg-white transition-colors cursor-pointer"
            >
              <FolderPlus className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Filters */}
          <div className="space-y-0.5 text-xs">
            <button
              onClick={() => setSelectedFolderId("all")}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                selectedFolderId === "all"
                  ? "bg-[#333E50] text-white font-semibold shadow-2xs"
                  : "text-[#4A5568] hover:bg-white hover:text-[#1A202C]"
              }`}
            >
              <div className="flex items-center space-x-2">
                <FileText className="w-3.5 h-3.5" />
                <span>All Notes</span>
              </div>
              <span className="font-mono text-[10px] opacity-80">{notes.length}</span>
            </button>

            <button
              onClick={() => setSelectedFolderId("pinned")}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                selectedFolderId === "pinned"
                  ? "bg-[#333E50] text-white font-semibold shadow-2xs"
                  : "text-[#4A5568] hover:bg-white hover:text-[#1A202C]"
              }`}
            >
              <div className="flex items-center space-x-2">
                <Pin className="w-3.5 h-3.5" />
                <span>Pinned</span>
              </div>
              <span className="font-mono text-[10px] opacity-80">
                {notes.filter((n: any) => n.isPinned).length}
              </span>
            </button>

            <button
              onClick={() => setSelectedFolderId("favorites")}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                selectedFolderId === "favorites"
                  ? "bg-[#333E50] text-white font-semibold shadow-2xs"
                  : "text-[#4A5568] hover:bg-white hover:text-[#1A202C]"
              }`}
            >
              <div className="flex items-center space-x-2">
                <Star className="w-3.5 h-3.5" />
                <span>Favorites</span>
              </div>
              <span className="font-mono text-[10px] opacity-80">
                {notes.filter((n: any) => n.isFavorite).length}
              </span>
            </button>
          </div>

          {/* Folders List */}
          <div className="pt-2 border-t border-[#ECEAE4] space-y-1">
            <div className="text-[10px] font-mono uppercase text-[#718096] px-1 font-semibold">
              Folders ({folders.length})
            </div>

            <div className="space-y-0.5 max-h-56 overflow-y-auto">
              {folders.map((f: any) => {
                const count = notes.filter((n: any) => n.folderId === f._id).length;
                const isSelected = selectedFolderId === f._id;

                return (
                  <div
                    key={f._id}
                    className={`group flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-[#333E50] text-white font-semibold shadow-2xs"
                        : "text-[#4A5568] hover:bg-white hover:text-[#1A202C]"
                    }`}
                    onClick={() => setSelectedFolderId(f._id)}
                  >
                    <div className="flex items-center space-x-2 truncate">
                      <span>{f.icon || "📁"}</span>
                      <span className="truncate">{f.name}</span>
                    </div>

                    <div className="flex items-center space-x-1">
                      <span className="font-mono text-[10px] opacity-80">{count}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingFolder(f);
                          setIsFolderDialogOpen(true);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-black transition-opacity"
                        title="Rename"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Column 2: Notes List Pane (4 Cols) */}
        <div className="lg:col-span-4 bento-card rounded-2xl p-3.5 space-y-3 bg-[#FDFDFD] flex flex-col justify-between">
          <div className="space-y-2.5">
            {/* Search & Add New Note Header */}
            <div className="flex items-center justify-between gap-2">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#A0AEC0]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search notes..."
                  className="w-full pl-8 pr-2 py-1.5 rounded-lg border border-[#E2E8F0] bg-white text-xs text-[#1A202C] focus:outline-none focus:border-[#333E50]"
                />
              </div>

              <button
                onClick={handleCreateNewNote}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-[#333E50] hover:bg-[#252E3B] text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Note</span>
              </button>
            </div>

            {/* Notes List Scrollable */}
            <div className="space-y-2 max-h-[calc(100vh-230px)] overflow-y-auto pr-0.5">
              {filteredNotes.length === 0 ? (
                <div className="py-12 text-center text-xs text-[#A0AEC0] font-mono">
                  No notes found. Click &ldquo;+ Note&rdquo; to begin.
                </div>
              ) : (
                filteredNotes.map((note: any) => {
                  const isSelected = activeNote?._id === note._id;
                  const folderLabel = getFolderName(note.folderId);

                  return (
                    <div
                      key={note._id}
                      onClick={() => setActiveNoteId(note._id)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer space-y-1.5 select-none ${
                        isSelected
                          ? "bg-white border-[#333E50] shadow-xs"
                          : "bg-white border-[#E2E8F0] hover:border-[#CBD5E1] shadow-2xs"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h4
                          className={`text-xs font-semibold leading-snug truncate ${
                            isSelected ? "text-[#1A202C] font-bold" : "text-[#2D3748]"
                          }`}
                        >
                          {note.title || "Untitled Note"}
                        </h4>

                        <div className="flex items-center space-x-1 shrink-0">
                          {note.isPinned && (
                            <Pin className="w-3 h-3 text-amber-500 fill-amber-500" />
                          )}
                          {note.isFavorite && (
                            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                          )}
                        </div>
                      </div>

                      {/* Plain text preview */}
                      <p className="text-[11px] text-[#718096] line-clamp-2 leading-relaxed">
                        {note.plainText || "No additional text content."}
                      </p>

                      {/* Footer Badge & Time */}
                      <div className="flex items-center justify-between pt-1 text-[10px] font-mono text-[#A0AEC0]">
                        {folderLabel ? (
                          <span className="px-1.5 py-0.5 rounded bg-[#F1F3F5] text-[#4A5568] truncate max-w-[120px]">
                            {folderLabel}
                          </span>
                        ) : (
                          <span className="text-[#CBD5E1]">General</span>
                        )}

                        <span>
                          {note.updatedAt
                            ? new Date(note.updatedAt).toLocaleDateString([], {
                                month: "short",
                                day: "numeric",
                              })
                            : ""}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Column 3: Rich Text Editor Canvas (5 Cols on large, full on max) */}
        <div className="lg:col-span-5 bento-card rounded-2xl p-4 sm:p-5 space-y-4 bg-white min-h-[560px]">
          {activeNote ? (
            <div className="space-y-4 flex flex-col h-full">
              {/* Note Header: Title input + Folder dropdown + Quick Controls */}
              <div className="space-y-2 border-b border-[#ECEAE4] pb-3">
                <div className="flex items-center justify-between gap-2">
                  <input
                    type="text"
                    value={activeNote.title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="Note Title..."
                    className="font-serif text-2xl font-bold text-[#1A202C] focus:outline-none w-full bg-transparent placeholder:text-[#A0AEC0]"
                  />

                  {/* Actions: Pin, Star, Delete */}
                  <div className="flex items-center space-x-1 shrink-0">
                    <button
                      onClick={() => togglePinned({ id: activeNote._id })}
                      className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                        activeNote.isPinned
                          ? "bg-amber-50 border-amber-300 text-amber-700"
                          : "border-[#E2E8F0] text-[#718096] hover:bg-[#F8F9FA]"
                      }`}
                      title="Pin note"
                    >
                      <Pin className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => toggleFavorite({ id: activeNote._id })}
                      className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                        activeNote.isFavorite
                          ? "bg-amber-50 border-amber-300 text-amber-500 fill-amber-500"
                          : "border-[#E2E8F0] text-[#718096] hover:bg-[#F8F9FA]"
                      }`}
                      title="Favorite note"
                    >
                      <Star className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleDeleteNote(activeNote._id)}
                      className="p-1.5 rounded-lg border border-[#E2E8F0] text-[#718096] hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
                      title="Delete note"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Metadata Row: Folder Selector & Linked Goal */}
                <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-[#718096]">
                  {/* Folder Selector */}
                  <div className="flex items-center space-x-1">
                    <FolderIcon className="w-3 h-3 text-[#718096]" />
                    <select
                      value={activeNote.folderId || ""}
                      onChange={async (e) => {
                        const val = e.target.value || undefined;
                        await updateNote({
                          id: activeNote._id,
                          folderId: val as any,
                        });
                      }}
                      className="bg-[#F8F9FA] px-2 py-0.5 rounded border border-[#E2E8F0] text-[#1A202C] focus:outline-none cursor-pointer"
                    >
                      <option value="">No Folder</option>
                      {folders.map((f: any) => (
                        <option key={f._id} value={f._id}>
                          {f.icon} {f.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Goal Selector */}
                  <div className="flex items-center space-x-1">
                    <Target className="w-3 h-3 text-[#718096]" />
                    <select
                      value={activeNote.goalId || ""}
                      onChange={async (e) => {
                        const val = e.target.value || undefined;
                        await updateNote({
                          id: activeNote._id,
                          goalId: val as any,
                        });
                      }}
                      className="bg-[#F8F9FA] px-2 py-0.5 rounded border border-[#E2E8F0] text-[#1A202C] focus:outline-none cursor-pointer"
                    >
                      <option value="">No Linked Goal</option>
                      {goals.map((g: any) => (
                        <option key={g._id} value={g._id}>
                          {g.icon || "🎯"} {g.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* TipTap Rich Text Editor */}
              <div className="flex-1">
                <TipTapEditor
                  key={activeNote._id}
                  content={activeNote.content || ""}
                  onChange={handleEditorChange}
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-96 text-center space-y-3">
              <FileText className="w-12 h-12 text-[#CBD5E1]" />
              <h3 className="font-serif text-lg font-bold text-[#1A202C]">
                No note selected
              </h3>
              <p className="text-xs text-[#718096] max-w-xs">
                Select an existing note from the list or create a new one to begin writing.
              </p>
              <button
                onClick={handleCreateNewNote}
                className="px-4 py-2 rounded-lg bg-[#333E50] hover:bg-[#252E3B] text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
              >
                + Create Note
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Folder Create / Rename Dialog */}
      <FolderDialog
        isOpen={isFolderDialogOpen}
        onClose={() => {
          setIsFolderDialogOpen(false);
          setEditingFolder(null);
        }}
        editingFolder={editingFolder}
      />
    </div>
  );
}
