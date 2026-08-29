"use client";

import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { TipTapEditor } from "./tiptap-editor";
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
  BookOpen,
} from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

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

  // 2-Layer States: Sidebar Open/Close
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Selection & Tree Expand States
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [tagInput, setTagInput] = useState("");

  // Local state for smooth title typing
  const [localTitle, setLocalTitle] = useState("");

  // Folder Dialog
  const [isFolderDialogOpen, setIsFolderDialogOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<any | null>(null);

  // Auto-expand all folders on mount
  useEffect(() => {
    if (folders.length > 0) {
      const expanded: Record<string, boolean> = {};
      folders.forEach((f: any) => {
        expanded[f._id] = true;
      });
      setExpandedFolders((prev) => ({ ...expanded, ...prev }));
    }
  }, [folders.length]);

  // Set default active note if none selected
  useEffect(() => {
    if (notes.length > 0 && !activeNoteId) {
      setActiveNoteId(notes[0]._id);
    }
  }, [notes, activeNoteId]);

  const activeNote = notes.find((n: any) => n._id === activeNoteId) || null;

  // Sync localTitle whenever activeNote changes ID
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

  // Direct save handler called by TipTap when debounce expires (Zero re-render lag)
  const handleEditorChange = async (html: string, plainText: string) => {
    if (!activeNote) return;
    try {
      await updateNote({
        id: activeNote._id,
        content: html,
        plainText,
      });
    } catch (err) {
      console.error("Auto-save content failed:", err);
    }
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
    }, 400);
  };

  const handleCreateNewNote = async (folderId?: string) => {
    try {
      const newId = await createNote({
        title: "Untitled Note",
        content: "<p></p>",
        plainText: "",
        folderId: (folderId as any) || undefined,
        tags: [],
      });

      if (newId) {
        setActiveNoteId(newId);
        setLocalTitle("Untitled Note");
        if (folderId) {
          setExpandedFolders((prev) => ({ ...prev, [folderId]: true }));
        }
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

  // Filter notes by search query
  const getFilteredNotesForFolder = (folderId: string | null) => {
    return notes.filter((note: any) => {
      const matchFolder = folderId ? note.folderId === folderId : !note.folderId;
      if (!matchFolder) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = note.title?.toLowerCase().includes(q);
        const matchText = note.plainText?.toLowerCase().includes(q);
        const matchTags = note.tags?.some((t: string) => t.toLowerCase().includes(q));
        if (!matchTitle && !matchText && !matchTags) return false;
      }
      return true;
    });
  };

  const uncategorizedNotes = getFilteredNotesForFolder(null);

  // Active note folder
  const activeNoteFolder = activeNote?.folderId
    ? folders.find((f: any) => f._id === activeNote.folderId)
    : null;

  return (
    <div className="w-full h-full bg-white flex flex-col md:flex-row overflow-hidden select-none">
      {/* ========================================================================= */}
      {/* LAYER 1: SIDEBAR (FOLDERS WITH NOTES DIRECTLY INSIDE)                      */}
      {/* ========================================================================= */}
      {isSidebarOpen && (
        <aside className="w-full md:w-72 lg:w-80 bg-[#FAFAFA] border-r border-[#ECEAE4] flex flex-col h-full shrink-0 animate-in slide-in-from-left duration-200">
          {/* Header Bar */}
          <div className="px-4 py-3 border-b border-[#ECEAE4] bg-white flex justify-between items-center">
            <h2 className="font-mono text-xs text-[#333E50] font-bold tracking-wider uppercase">
              Knowledge Base
            </h2>

            <div className="flex items-center space-x-1">
              <button
                onClick={() => handleCreateNewNote()}
                className="text-[#4A5568] hover:text-[#1A202C] p-1.5 rounded-lg hover:bg-[#F1F3F5] transition-colors cursor-pointer"
                title="Create Note"
              >
                <Plus className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  setEditingFolder(null);
                  setIsFolderDialogOpen(true);
                }}
                className="text-[#4A5568] hover:text-[#1A202C] p-1.5 rounded-lg hover:bg-[#F1F3F5] transition-colors cursor-pointer"
                title="Create Folder"
              >
                <FolderPlus className="w-4 h-4" />
              </button>

              <button
                onClick={() => setIsSidebarOpen(false)}
                className="text-[#718096] hover:text-[#1A202C] p-1.5 rounded-lg hover:bg-[#F1F3F5] transition-colors cursor-pointer"
                title="Collapse Sidebar"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="p-2.5 border-b border-[#ECEAE4] bg-white">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#A0AEC0]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search notes..."
                className="w-full bg-[#F8F9FA] border border-[#E2E8F0] rounded-lg pl-7 pr-2.5 py-1 text-xs text-[#1A202C] focus:outline-none focus:border-[#333E50]"
              />
            </div>
          </div>

          {/* Tree: Folders & Notes */}
          <div className="flex-1 overflow-y-auto p-2 space-y-2 text-xs">
            {/* 1. Folders with their Notes */}
            {folders.map((folder: any) => {
              const isExpanded = Boolean(expandedFolders[folder._id]);
              const folderNotes = getFilteredNotesForFolder(folder._id);

              return (
                <div key={folder._id} className="space-y-0.5">
                  {/* Folder Row Header */}
                  <div
                    onClick={(e) => toggleFolderExpand(folder._id, e)}
                    className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-[#F1F3F5] cursor-pointer transition-colors group text-[#2D3748] font-medium"
                  >
                    <div className="flex items-center gap-1.5 truncate flex-1">
                      <button
                        onClick={(e) => toggleFolderExpand(folder._id, e)}
                        className="text-[#718096] hover:text-[#1A202C] p-0.5 cursor-pointer"
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <Folder className="w-4 h-4 text-[#4A5568] shrink-0" />
                      <span className="truncate font-semibold">{folder.name}</span>
                    </div>

                    <div className="flex items-center space-x-1">
                      <span className="text-[10px] font-mono text-[#A0AEC0]">
                        {folderNotes.length}
                      </span>

                      {/* Add note to folder */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCreateNewNote(folder._id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-black/5 rounded text-[#718096] hover:text-[#1A202C] transition-opacity cursor-pointer"
                        title="Add Note in Folder"
                      >
                        <Plus className="w-3 h-3" />
                      </button>

                      {/* Folder Options */}
                      <DropdownMenu.Root>
                        <DropdownMenu.Trigger
                          asChild
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-black/5 rounded text-[#718096] hover:text-[#1A202C] transition-opacity cursor-pointer">
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
                                setEditingFolder(folder);
                                setIsFolderDialogOpen(true);
                              }}
                              className="px-3 py-1.5 rounded-lg hover:bg-[#F8F9FA] cursor-pointer flex items-center gap-2"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-[#718096]" />
                              <span>Rename Folder</span>
                            </DropdownMenu.Item>
                            <DropdownMenu.Item
                              onClick={(e) =>
                                handleDeleteFolder(folder._id, e as any)
                              }
                              className="px-3 py-1.5 rounded-lg hover:bg-rose-50 text-rose-600 cursor-pointer flex items-center gap-2"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete Folder</span>
                            </DropdownMenu.Item>
                          </DropdownMenu.Content>
                        </DropdownMenu.Portal>
                      </DropdownMenu.Root>
                    </div>
                  </div>

                  {/* Notes Inside Folder */}
                  {isExpanded && (
                    <div className="pl-5 space-y-0.5 border-l border-[#E2E8F0] ml-3 mt-0.5">
                      {folderNotes.length === 0 ? (
                        <div
                          onClick={() => handleCreateNewNote(folder._id)}
                          className="px-2 py-1 text-[11px] text-[#A0AEC0] hover:text-[#333E50] cursor-pointer flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add note...</span>
                        </div>
                      ) : (
                        folderNotes.map((note: any) => {
                          const isSelected = activeNote?._id === note._id;
                          return (
                            <div
                              key={note._id}
                              onClick={() => setActiveNoteId(note._id)}
                              className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors group/note ${
                                isSelected
                                  ? "bg-[#333E50] text-white font-semibold shadow-xs"
                                  : "text-[#4A5568] hover:bg-white hover:text-[#1A202C]"
                              }`}
                            >
                              <div className="flex items-center gap-1.5 truncate flex-1">
                                <FileText
                                  className={`w-3.5 h-3.5 shrink-0 ${
                                    isSelected ? "text-white" : "text-[#A0AEC0]"
                                  }`}
                                />
                                <span className="truncate">
                                  {note.title || "Untitled Note"}
                                </span>
                              </div>

                              <div className="flex items-center space-x-1 shrink-0">
                                {note.isPinned && (
                                  <Pin
                                    className={`w-3 h-3 ${
                                      isSelected
                                        ? "text-amber-300 fill-amber-300"
                                        : "text-amber-500 fill-amber-500"
                                    }`}
                                  />
                                )}
                                <button
                                  onClick={(e) =>
                                    handleDeleteNote(note._id, e)
                                  }
                                  className={`opacity-0 group-hover/note:opacity-100 p-0.5 rounded transition-opacity cursor-pointer ${
                                    isSelected
                                      ? "hover:bg-white/20 text-white"
                                      : "hover:bg-rose-50 text-rose-500"
                                  }`}
                                  title="Delete Note"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* 2. Uncategorized / General Notes */}
            <div className="pt-2">
              <div className="px-2 py-1 text-[11px] font-mono text-[#718096] uppercase font-semibold">
                General Notes ({uncategorizedNotes.length})
              </div>

              <div className="space-y-0.5 mt-0.5">
                {uncategorizedNotes.map((note: any) => {
                  const isSelected = activeNote?._id === note._id;
                  return (
                    <div
                      key={note._id}
                      onClick={() => setActiveNoteId(note._id)}
                      className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors group/note ${
                        isSelected
                          ? "bg-[#333E50] text-white font-semibold shadow-xs"
                          : "text-[#4A5568] hover:bg-white hover:text-[#1A202C]"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 truncate flex-1">
                        <FileText
                          className={`w-3.5 h-3.5 shrink-0 ${
                            isSelected ? "text-white" : "text-[#A0AEC0]"
                          }`}
                        />
                        <span className="truncate">
                          {note.title || "Untitled Note"}
                        </span>
                      </div>

                      <div className="flex items-center space-x-1 shrink-0">
                        {note.isPinned && (
                          <Pin
                            className={`w-3 h-3 ${
                              isSelected
                                ? "text-amber-300 fill-amber-300"
                                : "text-amber-500 fill-amber-500"
                            }`}
                          />
                        )}
                        <button
                          onClick={(e) => handleDeleteNote(note._id, e)}
                          className={`opacity-0 group-hover/note:opacity-100 p-0.5 rounded transition-opacity cursor-pointer ${
                            isSelected
                              ? "hover:bg-white/20 text-white"
                              : "hover:bg-rose-50 text-rose-500"
                          }`}
                          title="Delete Note"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Empty State */}
            {folders.length === 0 && uncategorizedNotes.length === 0 && (
              <div className="py-12 text-center px-4 space-y-2">
                <p className="text-xs text-[#A0AEC0]">No notes created yet.</p>
                <button
                  onClick={() => handleCreateNewNote()}
                  className="px-3 py-1.5 rounded-lg bg-[#333E50] text-white text-xs font-semibold hover:bg-[#252E3B] shadow-xs cursor-pointer inline-block"
                >
                  + Create First Note
                </button>
              </div>
            )}
          </div>
        </aside>
      )}

      {/* ========================================================================= */}
      {/* LAYER 2: THE FULL-WIDTH NOTE WRITING CANVAS (100% SCREEN REAL ESTATE)     */}
      {/* ========================================================================= */}
      <main className="flex-1 flex flex-col h-full bg-white overflow-hidden">
        {activeNote ? (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* Top Toolbar Bar */}
            <div className="px-6 py-3 border-b border-[#ECEAE4] flex flex-wrap items-center justify-between gap-3 bg-[#FCFCFB] shrink-0 text-xs">
              {/* Left Controls: Open Sidebar Toggle & Folder Breadcrumb */}
              <div className="flex items-center space-x-2">
                {!isSidebarOpen && (
                  <button
                    onClick={() => setIsSidebarOpen(true)}
                    className="p-1.5 rounded-lg border border-[#E2E8F0] hover:bg-[#F1F3F5] text-[#4A5568] transition-colors cursor-pointer flex items-center gap-1.5"
                    title="Open Notes Sidebar"
                  >
                    <PanelLeft className="w-3.5 h-3.5" />
                    <span className="font-semibold">Sidebar</span>
                  </button>
                )}

                <div className="flex items-center gap-1.5 text-xs text-[#718096]">
                  <Folder className="w-3.5 h-3.5 text-[#A0AEC0]" />
                  <span className="font-medium text-[#1A202C]">
                    {activeNoteFolder ? activeNoteFolder.name : "General Notes"}
                  </span>
                </div>
              </div>

              {/* Tags Manager */}
              <div className="flex flex-wrap items-center gap-1.5 flex-1 max-w-md">
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
                {/* Folder Dropdown */}
                <select
                  value={activeNote.folderId || ""}
                  onChange={async (e) => {
                    const val = e.target.value || undefined;
                    await updateNote({
                      id: activeNote._id,
                      folderId: val as any,
                    });
                  }}
                  className="bg-white px-2.5 py-1 rounded-lg border border-[#E2E8F0] text-xs text-[#1A202C] focus:outline-none cursor-pointer"
                >
                  <option value="">📁 General (No Folder)</option>
                  {folders.map((f: any) => (
                    <option key={f._id} value={f._id}>
                      📁 {f.name}
                    </option>
                  ))}
                </select>

                {/* Linked Life Goal */}
                <select
                  value={activeNote.goalId || ""}
                  onChange={async (e) => {
                    const val = e.target.value || undefined;
                    await updateNote({
                      id: activeNote._id,
                      goalId: val as any,
                    });
                  }}
                  className="hidden xl:block bg-white px-2.5 py-1 rounded-lg border border-[#E2E8F0] text-xs text-[#1A202C] focus:outline-none cursor-pointer"
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

            {/* Note Canvas (Spacious & Clean) */}
            <div className="flex-1 overflow-y-auto px-6 md:px-14 py-6 space-y-4 max-w-6xl w-full mx-auto">
              <input
                type="text"
                value={localTitle}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Note Title..."
                className="font-serif text-3xl md:text-5xl font-bold text-[#1A202C] focus:outline-none w-full bg-transparent placeholder:text-[#CBD5E1] border-b border-transparent focus:border-[#E2E8F0] pb-2 transition-colors"
              />

              {/* TipTap Rich Text Editor */}
              <TipTapEditor
                key={activeNote._id}
                initialContent={activeNote.content || ""}
                onChange={handleEditorChange}
              />
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
            <BookOpen className="w-12 h-12 text-[#CBD5E1]" />
            <div className="space-y-1">
              <h3 className="font-serif text-2xl font-bold text-[#1A202C]">
                Knowledge Base Workspace
              </h3>
              <p className="text-xs text-[#718096] max-w-sm">
                Select a note from the sidebar or click below to create a new note.
              </p>
            </div>
            <button
              onClick={() => handleCreateNewNote()}
              className="px-5 py-2.5 rounded-xl bg-[#333E50] hover:bg-[#252E3B] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              + Create Note
            </button>
          </div>
        )}
      </main>

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
