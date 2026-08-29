"use client";

import React, { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { FolderDialog } from "./folder-dialog";
import {
  Folder,
  ChevronRight,
  ChevronDown,
  Plus,
  Search,
  MoreVertical,
  Pin,
  Star,
  Trash2,
  FolderPlus,
  Edit2,
  FileText,
  PanelLeftClose,
  PanelLeft,
  Maximize2,
  Minimize2,
  BookOpen,
} from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

const MarkdownEditor = dynamic(
  () =>
    import("./markdown-editor").then((mod) => mod.MarkdownEditorComponent),
  {
    ssr: false,
    loading: () => (
      <div className="p-8 text-xs text-[#A0AEC0] animate-pulse">
        Loading editor...
      </div>
    ),
  }
);

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

  // Warm instant hydration cache
  const [cachedNotes, setCachedNotes] = useState<any[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("mosha_cached_notes");
      if (saved) setCachedNotes(JSON.parse(saved));
    } catch {}
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

  // Responsive Pane Collapse States (User can collapse sidebars for maximum writing canvas!)
  const [isFolderSidebarOpen, setIsFolderSidebarOpen] = useState(true);
  const [isNotesListOpen, setIsNotesListOpen] = useState(true);

  // Selection States
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [tagInput, setTagInput] = useState("");

  // Local state for smooth title typing
  const [localTitle, setLocalTitle] = useState("");

  // Folder Dialog
  const [isFolderDialogOpen, setIsFolderDialogOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<any | null>(null);

  // Set default active note when folder or notes change
  useEffect(() => {
    const inFolder = notes.filter((n: any) =>
      selectedFolderId ? n.folderId === selectedFolderId : true
    );
    if (inFolder.length > 0) {
      if (!activeNoteId || !inFolder.some((n: any) => n._id === activeNoteId)) {
        setActiveNoteId(inFolder[0]._id);
      }
    } else {
      setActiveNoteId(null);
    }
  }, [selectedFolderId, notes, activeNoteId]);

  const activeNote = notes.find((n: any) => n._id === activeNoteId) || null;

  // Sync localTitle whenever activeNote ID changes
  useEffect(() => {
    if (activeNote) {
      setLocalTitle(activeNote.title || "");
    } else {
      setLocalTitle("");
    }
  }, [activeNote?._id]);

  const toggleFolderExpand = (folderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedFolders((prev) => ({ ...prev, [folderId]: !prev[folderId] }));
  };

  // Debounced auto-save timer for Content
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleEditorChange = (markdownContent: string) => {
    if (!activeNote) return;

    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(async () => {
      try {
        await updateNote({
          id: activeNote._id,
          content: markdownContent,
          plainText: markdownContent.slice(0, 300),
        });
      } catch (err) {
        console.error("Auto-save content failed:", err);
      }
    }, 400);
  };

  // Debounced auto-save timer for Title
  const titleTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleTitleChange = (newTitle: string) => {
    setLocalTitle(newTitle);
    if (!activeNote) return;

    if (titleTimerRef.current) clearTimeout(titleTimerRef.current);
    titleTimerRef.current = setTimeout(async () => {
      try {
        await updateNote({
          id: activeNote._id,
          title: newTitle,
        });
      } catch (err) {
        console.error("Auto-save title failed:", err);
      }
    }, 300);
  };

  const handleCreateNewNote = async () => {
    try {
      const newId = await createNote({
        title: "Untitled Note",
        content: "# Untitled Note\n\nStart typing...",
        plainText: "Start typing...",
        folderId: (selectedFolderId as any) || undefined,
        tags: [],
      });

      if (newId) {
        setActiveNoteId(newId);
        setLocalTitle("Untitled Note");
      }
    } catch (err) {
      console.error("Failed to create note:", err);
    }
  };

  const handleDeleteNote = async (id: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await removeNote({ id });
      if (activeNoteId === id) {
        const remaining = notes.filter((n: any) => n._id !== id);
        setActiveNoteId(remaining.length > 0 ? remaining[0]._id : null);
      }
    } catch (err) {
      console.error("Failed to delete note:", err);
    }
  };

  const handleDeleteFolder = async (folderId: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await removeFolder({ id: folderId });
      if (selectedFolderId === folderId) {
        const remaining = folders.filter((f: any) => f._id !== folderId);
        setSelectedFolderId(remaining.length > 0 ? remaining[0]._id : null);
      }
    } catch (err) {
      console.error("Failed to delete folder:", err);
    }
  };

  const handleAddTag = async (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && tagInput.trim() && activeNote) {
      e.preventDefault();
      const currentTags = activeNote.tags || [];
      const cleanTag = tagInput.trim().replace(/^#/, "");
      if (!currentTags.includes(cleanTag)) {
        const nextTags = [...currentTags, cleanTag];
        await updateNote({
          id: activeNote._id,
          tags: nextTags,
        });
      }
      setTagInput("");
    }
  };

  const handleRemoveTag = async (tagToRemove: string) => {
    if (!activeNote) return;
    const currentTags = activeNote.tags || [];
    const nextTags = currentTags.filter((t: string) => t !== tagToRemove);
    await updateNote({
      id: activeNote._id,
      tags: nextTags,
    });
  };

  // Folder Hierarchy helpers
  const parentFolders = folders.filter((f: any) => !f.parentId);
  const getSubfolders = (parentId: string) =>
    folders.filter((f: any) => f.parentId === parentId);

  const selectedFolder = folders.find((f: any) => f._id === selectedFolderId);

  // Filter notes
  const filteredNotes = notes.filter((note: any) => {
    if (selectedFolderId && note.folderId !== selectedFolderId) {
      const noteFolder = folders.find((f: any) => f._id === note.folderId);
      if (noteFolder?.parentId !== selectedFolderId && note.folderId !== selectedFolderId) {
        return false;
      }
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = note.title?.toLowerCase().includes(q);
      const matchText = note.plainText?.toLowerCase().includes(q);
      const matchTags = note.tags?.some((t: string) => t.toLowerCase().includes(q));
      if (!matchTitle && !matchText && !matchTags) return false;
    }

    return true;
  });

  const isDistractionFree = !isFolderSidebarOpen && !isNotesListOpen;

  return (
    <div className="w-full h-full bg-white flex flex-col md:flex-row overflow-hidden select-none">
      {/* ========================================================================= */}
      {/* 1. COLLAPSIBLE LEFT FOLDER TREE PANEL                                     */}
      {/* ========================================================================= */}
      {isFolderSidebarOpen && (
        <aside className="w-full md:w-60 bg-[#FAFAFA] border-r border-[#ECEAE4] flex flex-col h-full shrink-0 animate-in slide-in-from-left duration-200">
          {/* Panel Header */}
          <div className="px-4 py-3.5 border-b border-[#ECEAE4] flex justify-between items-center bg-white">
            <h2 className="font-mono text-xs text-[#333E50] font-bold tracking-wider uppercase">
              Folders
            </h2>
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  setEditingFolder(null);
                  setIsFolderDialogOpen(true);
                }}
                className="text-[#4A5568] hover:text-[#1A202C] p-1.5 rounded-md hover:bg-[#F1F3F5] transition-colors cursor-pointer"
                title="Create New Folder"
              >
                <FolderPlus className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsFolderSidebarOpen(false)}
                className="text-[#718096] hover:text-[#1A202C] p-1.5 rounded-md hover:bg-[#F1F3F5] transition-colors cursor-pointer"
                title="Collapse Folders Sidebar"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Tree Structure */}
          <div className="px-2 py-2.5 flex-1 overflow-y-auto space-y-1 text-xs">
            {/* All Notes Root Option */}
            <div
              onClick={() => setSelectedFolderId(null)}
              className={`flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer transition-colors ${
                selectedFolderId === null
                  ? "bg-[#ECEFF3] text-[#1A202C] font-semibold border-l-2 border-[#333E50]"
                  : "text-[#2D3748] hover:bg-white"
              }`}
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#4A5568]" />
                <span className="font-medium">All Notes</span>
              </div>
              <span className="text-[10px] font-mono text-[#A0AEC0]">
                {notes.length}
              </span>
            </div>

            {/* Folders List */}
            {parentFolders.length === 0 ? (
              <div className="py-8 text-center px-3 space-y-2">
                <p className="text-[11px] text-[#A0AEC0]">No custom folders.</p>
                <button
                  onClick={() => {
                    setEditingFolder(null);
                    setIsFolderDialogOpen(true);
                  }}
                  className="text-xs text-[#333E50] hover:underline font-semibold flex items-center gap-1 mx-auto"
                >
                  <Plus className="w-3 h-3" />
                  <span>Create Folder</span>
                </button>
              </div>
            ) : (
              parentFolders.map((parent: any) => {
                const subfolders = getSubfolders(parent._id);
                const isExpanded = Boolean(expandedFolders[parent._id]);
                const isSelected = selectedFolderId === parent._id;
                const parentNoteCount = notes.filter((n: any) => n.folderId === parent._id).length;

                return (
                  <div key={parent._id} className="space-y-0.5">
                    {/* Parent Folder Row */}
                    <div
                      onClick={() => setSelectedFolderId(parent._id)}
                      className={`flex items-center gap-1.5 px-2 py-2 rounded-lg cursor-pointer transition-colors group ${
                        isSelected
                          ? "bg-[#ECEFF3] text-[#1A202C] font-semibold border-l-2 border-[#333E50]"
                          : "text-[#2D3748] hover:bg-white"
                      }`}
                    >
                      {subfolders.length > 0 ? (
                        <button
                          onClick={(e) => toggleFolderExpand(parent._id, e)}
                          className="text-[#718096] hover:text-[#1A202C] p-0.5 cursor-pointer"
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5" />
                          )}
                        </button>
                      ) : (
                        <div className="w-3.5" />
                      )}

                      <Folder className="w-4 h-4 text-[#4A5568] group-hover:text-[#333E50] shrink-0" />
                      <span className="flex-1 truncate font-medium">{parent.name}</span>
                      <span className="text-[10px] font-mono text-[#A0AEC0] opacity-80 mr-1">
                        {parentNoteCount}
                      </span>

                      {/* Options Dropdown (Rename / Delete) */}
                      <DropdownMenu.Root>
                        <DropdownMenu.Trigger asChild onClick={(e) => e.stopPropagation()}>
                          <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-black/5 rounded text-[#718096] hover:text-[#1A202C] transition-opacity cursor-pointer">
                            <MoreVertical className="w-3.5 h-3.5" />
                          </button>
                        </DropdownMenu.Trigger>
                        <DropdownMenu.Portal>
                          <DropdownMenu.Content
                            className="z-50 bg-white border border-[#E2E8F0] rounded-xl shadow-lg p-1 text-xs min-w-[130px]"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <DropdownMenu.Item
                              onClick={() => {
                                setEditingFolder(parent);
                                setIsFolderDialogOpen(true);
                              }}
                              className="px-3 py-1.5 rounded-lg hover:bg-[#F8F9FA] cursor-pointer flex items-center gap-2"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-[#718096]" />
                              <span>Rename</span>
                            </DropdownMenu.Item>
                            <DropdownMenu.Item
                              onClick={(e) => handleDeleteFolder(parent._id, e as any)}
                              className="px-3 py-1.5 rounded-lg hover:bg-rose-50 text-rose-600 cursor-pointer flex items-center gap-2"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete Folder</span>
                            </DropdownMenu.Item>
                          </DropdownMenu.Content>
                        </DropdownMenu.Portal>
                      </DropdownMenu.Root>
                    </div>

                    {/* Subfolders */}
                    {isExpanded && subfolders.length > 0 && (
                      <div className="pl-4 space-y-0.5 mt-0.5">
                        {subfolders.map((sub: any) => {
                          const isSubSelected = selectedFolderId === sub._id;
                          const subCount = notes.filter((n: any) => n.folderId === sub._id).length;

                          return (
                            <div
                              key={sub._id}
                              onClick={() => setSelectedFolderId(sub._id)}
                              className={`flex items-center justify-between px-2 py-1.5 rounded-r-lg cursor-pointer transition-colors group/sub ${
                                isSubSelected
                                  ? "bg-[#ECEFF3] text-[#1A202C] font-semibold border-l-2 border-[#333E50]"
                                  : "text-[#4A5568] hover:bg-white hover:text-[#1A202C]"
                              }`}
                            >
                              <div className="flex items-center gap-2 truncate flex-1">
                                <Folder className="w-3.5 h-3.5 text-[#718096] shrink-0" />
                                <span className="truncate">{sub.name}</span>
                              </div>
                              <span className="text-[10px] font-mono text-[#A0AEC0] mr-1">
                                {subCount}
                              </span>

                              <DropdownMenu.Root>
                                <DropdownMenu.Trigger asChild onClick={(e) => e.stopPropagation()}>
                                  <button className="opacity-0 group-hover/sub:opacity-100 p-0.5 hover:bg-black/5 rounded text-[#718096] hover:text-[#1A202C] transition-opacity cursor-pointer">
                                    <MoreVertical className="w-3 h-3" />
                                  </button>
                                </DropdownMenu.Trigger>
                                <DropdownMenu.Portal>
                                  <DropdownMenu.Content
                                    className="z-50 bg-white border border-[#E2E8F0] rounded-xl shadow-lg p-1 text-xs min-w-[130px]"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <DropdownMenu.Item
                                      onClick={() => {
                                        setEditingFolder(sub);
                                        setIsFolderDialogOpen(true);
                                      }}
                                      className="px-3 py-1.5 rounded-lg hover:bg-[#F8F9FA] cursor-pointer flex items-center gap-2"
                                    >
                                      <Edit2 className="w-3.5 h-3.5 text-[#718096]" />
                                      <span>Rename</span>
                                    </DropdownMenu.Item>
                                    <DropdownMenu.Item
                                      onClick={(e) => handleDeleteFolder(sub._id, e as any)}
                                      className="px-3 py-1.5 rounded-lg hover:bg-rose-50 text-rose-600 cursor-pointer flex items-center gap-2"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                      <span>Delete</span>
                                    </DropdownMenu.Item>
                                  </DropdownMenu.Content>
                                </DropdownMenu.Portal>
                              </DropdownMenu.Root>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </aside>
      )}

      {/* ========================================================================= */}
      {/* 2. COLLAPSIBLE MIDDLE COLUMN: NOTES LIST (w-64 to w-72)                    */}
      {/* ========================================================================= */}
      {isNotesListOpen && (
        <div className="w-full md:w-64 bg-[#FBFBFA] border-r border-[#ECEAE4] flex flex-col h-full overflow-hidden shrink-0 animate-in slide-in-from-left duration-150">
          {/* Header Bar */}
          <div className="p-2.5 border-b border-[#ECEAE4] bg-white flex items-center justify-between gap-1.5">
            {!isFolderSidebarOpen && (
              <button
                onClick={() => setIsFolderSidebarOpen(true)}
                className="p-1.5 rounded-md text-[#718096] hover:text-[#1A202C] hover:bg-[#F1F3F5] transition-colors cursor-pointer"
                title="Open Folders Sidebar"
              >
                <PanelLeft className="w-4 h-4" />
              </button>
            )}

            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#A0AEC0]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="w-full bg-[#F8F9FA] border border-[#E2E8F0] rounded-lg pl-7 pr-2 py-1 text-xs text-[#1A202C] focus:outline-none focus:border-[#333E50]"
              />
            </div>

            <button
              onClick={handleCreateNewNote}
              className="px-2.5 py-1 bg-[#333E50] text-white rounded-lg text-xs font-semibold hover:bg-[#252E3B] transition-colors flex items-center gap-1 shadow-2xs cursor-pointer shrink-0"
              title="Create Note"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Note</span>
            </button>
          </div>

          {/* Notes Items List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {filteredNotes.length === 0 ? (
              <div className="py-16 text-center px-4 space-y-2">
                <p className="text-xs text-[#A0AEC0] font-mono">No notes found</p>
                <button
                  onClick={handleCreateNewNote}
                  className="px-3 py-1.5 rounded-lg bg-[#333E50] text-white text-xs font-semibold shadow-xs hover:bg-[#252E3B] transition-colors cursor-pointer inline-block"
                >
                  + New Note
                </button>
              </div>
            ) : (
              filteredNotes.map((note: any) => {
                const isSelected = activeNote?._id === note._id;
                return (
                  <div
                    key={note._id}
                    onClick={() => setActiveNoteId(note._id)}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer space-y-1 select-none ${
                      isSelected
                        ? "bg-white border-[#333E50] shadow-xs"
                        : "bg-white/70 border-[#E2E8F0] hover:border-[#CBD5E1] hover:bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1.5">
                      <h4
                        className={`text-xs font-semibold leading-snug line-clamp-1 ${
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

                    <p className="text-[11px] text-[#718096] line-clamp-2 leading-relaxed">
                      {note.plainText || "Empty note..."}
                    </p>

                    <div className="flex items-center justify-between pt-1 text-[10px] font-mono text-[#A0AEC0]">
                      <div className="flex gap-1 overflow-hidden truncate max-w-[120px]">
                        {(note.tags || []).slice(0, 2).map((t: string) => (
                          <span key={t} className="text-[#718096]">
                            #{t}
                          </span>
                        ))}
                      </div>
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
      )}

      {/* ========================================================================= */}
      {/* 3. RIGHT COLUMN: FULL-WIDTH DISTRACTION-FREE CANVAS (100% SCREEN WIDTH)    */}
      {/* ========================================================================= */}
      <div className="flex-1 flex flex-col h-full bg-white overflow-hidden">
        {activeNote ? (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* Top Toolbar Bar with Collapse Toggles */}
            <div className="px-6 py-2.5 border-b border-[#ECEAE4] flex flex-wrap items-center justify-between gap-3 bg-[#FCFCFB] shrink-0 text-xs">
              {/* Left Controls: Sidebar Toggles & Breadcrumb */}
              <div className="flex items-center space-x-2">
                {!isFolderSidebarOpen && (
                  <button
                    onClick={() => setIsFolderSidebarOpen(true)}
                    className="p-1.5 rounded-lg border border-[#E2E8F0] hover:bg-[#F1F3F5] text-[#4A5568] transition-colors cursor-pointer"
                    title="Open Folders"
                  >
                    <Folder className="w-3.5 h-3.5" />
                  </button>
                )}

                <button
                  onClick={() => setIsNotesListOpen(!isNotesListOpen)}
                  className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                    !isNotesListOpen
                      ? "bg-[#333E50] text-white"
                      : "border-[#E2E8F0] hover:bg-[#F1F3F5] text-[#4A5568]"
                  }`}
                  title={isNotesListOpen ? "Collapse Notes List" : "Show Notes List"}
                >
                  <PanelLeft className="w-3.5 h-3.5" />
                </button>

                {/* Zen Full Width Mode Toggle */}
                <button
                  onClick={() => {
                    if (isDistractionFree) {
                      setIsFolderSidebarOpen(true);
                      setIsNotesListOpen(true);
                    } else {
                      setIsFolderSidebarOpen(false);
                      setIsNotesListOpen(false);
                    }
                  }}
                  className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                    isDistractionFree
                      ? "bg-[#333E50] text-white"
                      : "border-[#E2E8F0] hover:bg-[#F1F3F5] text-[#4A5568]"
                  }`}
                  title={
                    isDistractionFree
                      ? "Exit Distraction-Free Mode"
                      : "Enter Full Width Distraction-Free Writing"
                  }
                >
                  {isDistractionFree ? (
                    <Minimize2 className="w-3.5 h-3.5" />
                  ) : (
                    <Maximize2 className="w-3.5 h-3.5" />
                  )}
                </button>

                <span className="text-xs text-[#718096] hidden sm:inline font-medium">
                  {selectedFolder ? selectedFolder.name : "All Notes"}
                </span>
              </div>

              {/* Tags Manager */}
              <div className="flex flex-wrap items-center gap-1.5 flex-1 max-w-sm">
                {(activeNote.tags || []).map((tag: string) => (
                  <span
                    key={tag}
                    className="bg-[#F1F3F5] text-[#4A5568] px-2 py-0.5 rounded text-[11px] font-mono font-medium flex items-center gap-1"
                  >
                    <span>#{tag}</span>
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="text-[#A0AEC0] hover:text-rose-600 cursor-pointer ml-0.5"
                    >
                      ×
                    </button>
                  </span>
                ))}

                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                  placeholder="+ tag..."
                  className="text-xs font-mono text-[#4A5568] bg-transparent focus:outline-none px-1 py-0.5 placeholder:text-[#A0AEC0] w-16"
                />
              </div>

              {/* Metadata & Actions */}
              <div className="flex items-center space-x-1.5">
                <select
                  value={activeNote.folderId || ""}
                  onChange={async (e) => {
                    const val = e.target.value || undefined;
                    await updateNote({
                      id: activeNote._id,
                      folderId: val as any,
                    });
                  }}
                  className="bg-white px-2 py-1 rounded border border-[#E2E8F0] text-xs text-[#1A202C] focus:outline-none cursor-pointer"
                >
                  <option value="">No Folder</option>
                  {folders.map((f: any) => (
                    <option key={f._id} value={f._id}>
                      📁 {f.name}
                    </option>
                  ))}
                </select>

                <select
                  value={activeNote.goalId || ""}
                  onChange={async (e) => {
                    const val = e.target.value || undefined;
                    await updateNote({
                      id: activeNote._id,
                      goalId: val as any,
                    });
                  }}
                  className="hidden xl:block bg-white px-2 py-1 rounded border border-[#E2E8F0] text-xs text-[#1A202C] focus:outline-none cursor-pointer"
                >
                  <option value="">No Linked Goal</option>
                  {goals.map((g: any) => (
                    <option key={g._id} value={g._id}>
                      {g.icon || "🎯"} {g.title}
                    </option>
                  ))}
                </select>

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

            {/* Spacious Note Canvas */}
            <div className="flex-1 overflow-y-auto px-6 md:px-12 py-6 space-y-4 max-w-6xl w-full mx-auto">
              <input
                type="text"
                value={localTitle}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Note Title..."
                className="font-serif text-2xl md:text-4xl font-bold text-[#1A202C] focus:outline-none w-full bg-transparent placeholder:text-[#CBD5E1] border-b border-transparent focus:border-[#E2E8F0] pb-2 transition-colors"
              />

              {/* Industry-Standard Markdown Editor */}
              <div className="pt-1">
                <MarkdownEditor
                  key={activeNote._id}
                  content={activeNote.content || ""}
                  onChange={handleEditorChange}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
            <BookOpen className="w-12 h-12 text-[#CBD5E1]" />
            <div className="space-y-1">
              <h3 className="font-serif text-xl font-bold text-[#1A202C]">
                {selectedFolder ? selectedFolder.name : "Knowledge Base"}
              </h3>
              <p className="text-xs text-[#718096] max-w-xs">
                No note selected. Click &ldquo;+ Note&rdquo; to begin writing your thoughts, architectures, or reflections.
              </p>
            </div>
            <button
              onClick={handleCreateNewNote}
              className="px-5 py-2.5 rounded-xl bg-[#333E50] hover:bg-[#252E3B] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              + Create Note
            </button>
          </div>
        )}
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
