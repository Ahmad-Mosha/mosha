"use client";

import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { TipTapEditor } from "./tiptap-editor";
import { FolderDialog } from "./folder-dialog";
import {
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Plus,
  Search,
  MoreVertical,
  ArrowLeft,
  Pin,
  Star,
  Trash2,
  Tag,
  Target,
  FileText,
  FolderPlus,
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

  // Navigation & View State
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const [activeEditingNoteId, setActiveEditingNoteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [tagInput, setTagInput] = useState("");

  // Folder Dialog
  const [isFolderDialogOpen, setIsFolderDialogOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<any | null>(null);
  const [parentFolderIdForNew, setParentFolderIdForNew] = useState<string | undefined>(undefined);

  // Auto-expand parent folders on mount
  useEffect(() => {
    if (folders.length > 0) {
      const expanded: Record<string, boolean> = {};
      folders.forEach((f: any) => {
        if (!f.parentId) {
          expanded[f._id] = true;
        }
      });
      setExpandedFolders((prev) => ({ ...expanded, ...prev }));

      // Set default selected folder to Architecture if available or first subfolder
      if (!selectedFolderId) {
        const arch = folders.find((f: any) => f.name.toLowerCase() === "architecture");
        if (arch) {
          setSelectedFolderId(arch._id);
        } else if (folders.length > 0) {
          setSelectedFolderId(folders[0]._id);
        }
      }
    }
  }, [folders, selectedFolderId]);

  const toggleFolderExpand = (folderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedFolders((prev) => ({
      ...prev,
      [folderId]: !prev[folderId],
    }));
  };

  const activeEditingNote = notes.find((n: any) => n._id === activeEditingNoteId) || null;

  // Debounced auto-save timer
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleEditorChange = (html: string, plainText: string) => {
    if (!activeEditingNote) return;

    // Optimistically update local cache
    const updatedNotes = notes.map((n: any) =>
      n._id === activeEditingNote._id ? { ...n, content: html, plainText, updatedAt: new Date().toISOString() } : n
    );
    setCachedNotes(updatedNotes);

    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(async () => {
      try {
        await updateNote({
          id: activeEditingNote._id,
          content: html,
          plainText,
        });
      } catch (err) {
        console.error("Auto-save failed:", err);
      }
    }, 600);
  };

  const handleTitleChange = async (newTitle: string) => {
    if (!activeEditingNote) return;
    const updatedNotes = notes.map((n: any) =>
      n._id === activeEditingNote._id ? { ...n, title: newTitle, updatedAt: new Date().toISOString() } : n
    );
    setCachedNotes(updatedNotes);

    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(async () => {
      await updateNote({
        id: activeEditingNote._id,
        title: newTitle,
      });
    }, 500);
  };

  const handleCreateNewNote = async () => {
    const newId = await createNote({
      title: "Untitled Note",
      content: "<p></p>",
      plainText: "",
      folderId: (selectedFolderId as any) || undefined,
      tags: [],
    });

    if (newId) {
      setActiveEditingNoteId(newId);
    }
  };

  const handleDeleteNote = async (id: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    await removeNote({ id });
    if (activeEditingNoteId === id) {
      setActiveEditingNoteId(null);
    }
  };

  const handleAddTag = async (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && tagInput.trim() && activeEditingNote) {
      e.preventDefault();
      const currentTags = activeEditingNote.tags || [];
      const cleanTag = tagInput.trim().replace(/^#/, "");
      if (!currentTags.includes(cleanTag)) {
        const nextTags = [...currentTags, cleanTag];
        await updateNote({
          id: activeEditingNote._id,
          tags: nextTags,
        });
      }
      setTagInput("");
    }
  };

  const handleRemoveTag = async (tagToRemove: string) => {
    if (!activeEditingNote) return;
    const currentTags = activeEditingNote.tags || [];
    const nextTags = currentTags.filter((t: string) => t !== tagToRemove);
    await updateNote({
      id: activeEditingNote._id,
      tags: nextTags,
    });
  };

  // Folder Hierarchy helpers
  const parentFolders = folders.filter((f: any) => !f.parentId);
  const getSubfolders = (parentId: string) =>
    folders.filter((f: any) => f.parentId === parentId);

  const selectedFolder = folders.find((f: any) => f._id === selectedFolderId);
  const selectedParentFolder = selectedFolder?.parentId
    ? folders.find((f: any) => f._id === selectedFolder.parentId)
    : null;

  // Filter notes for grid
  const filteredNotes = notes.filter((note: any) => {
    if (selectedFolderId && note.folderId !== selectedFolderId) {
      // Check if note belongs to subfolder of selected parent folder
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

  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm flex flex-col md:flex-row h-[calc(100vh-130px)] overflow-hidden animate-in fade-in duration-200 select-none">
      {/* 1. Left Folder Tree Panel (Matching Stitch Design) */}
      <aside className="w-full md:w-72 bg-white border-r border-[#E2E8F0] flex flex-col h-full shrink-0">
        {/* Panel Header */}
        <div className="px-5 py-4 border-b border-[#ECEAE4] flex justify-between items-center">
          <h2 className="font-mono text-xs text-[#333E50] font-bold tracking-wider uppercase">
            Knowledge Base
          </h2>
          <button
            onClick={() => {
              setEditingFolder(null);
              setParentFolderIdForNew(undefined);
              setIsFolderDialogOpen(true);
            }}
            className="text-[#4A5568] hover:text-[#1A202C] p-1.5 rounded-md hover:bg-[#F1F3F5] transition-colors cursor-pointer"
            title="Create New Folder"
          >
            <FolderPlus className="w-4 h-4" />
          </button>
        </div>

        {/* Tree Structure */}
        <div className="px-3 py-3 flex-1 overflow-y-auto">
          <ul className="space-y-1 text-xs">
            {parentFolders.map((parent: any) => {
              const subfolders = getSubfolders(parent._id);
              const isExpanded = Boolean(expandedFolders[parent._id]);
              const isSelected = selectedFolderId === parent._id;

              return (
                <li key={parent._id} className="space-y-0.5">
                  {/* Parent Folder Row */}
                  <div
                    onClick={() => {
                      setSelectedFolderId(parent._id);
                      setActiveEditingNoteId(null);
                    }}
                    className={`flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-pointer transition-colors group ${
                      isSelected
                        ? "bg-[#ECEFF3] text-[#1A202C] font-semibold border-l-2 border-[#333E50]"
                        : "text-[#2D3748] hover:bg-[#F8F9FA]"
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
                      <div className="w-4" />
                    )}

                    <Folder className="w-4 h-4 text-[#4A5568] group-hover:text-[#333E50] shrink-0" />
                    <span className="flex-1 truncate font-medium">{parent.name}</span>
                  </div>

                  {/* Subfolders List */}
                  {isExpanded && subfolders.length > 0 && (
                    <ul className="pl-6 space-y-0.5 mt-0.5">
                      {subfolders.map((sub: any) => {
                        const isSubSelected = selectedFolderId === sub._id;
                        return (
                          <li key={sub._id}>
                            <div
                              onClick={() => {
                                setSelectedFolderId(sub._id);
                                setActiveEditingNoteId(null);
                              }}
                              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-r-lg cursor-pointer transition-colors ${
                                isSubSelected
                                  ? "bg-[#ECEFF3] text-[#1A202C] font-semibold border-l-2 border-[#333E50]"
                                  : "text-[#4A5568] hover:bg-[#F8F9FA] hover:text-[#1A202C]"
                              }`}
                            >
                              <Folder className="w-3.5 h-3.5 text-[#718096] shrink-0" />
                              <span className="flex-1 truncate">{sub.name}</span>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </aside>

      {/* 2. Main Content Area: Grid View VS Full Editor Canvas */}
      <main className="flex-1 flex flex-col h-full bg-[#FDFDFD] overflow-hidden">
        {activeEditingNote ? (
          /* ========================================================================= */
          /* EDITOR VIEW: Clean, Tranquil, Full-Featured TipTap Writing Canvas        */
          /* ========================================================================= */
          <div className="flex-1 flex flex-col h-full overflow-hidden animate-in fade-in duration-150">
            {/* Action & Metadata Header */}
            <div className="h-16 border-b border-[#ECEAE4] px-6 bg-white flex justify-between items-center gap-4 shrink-0">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveEditingNoteId(null)}
                  className="px-3 py-1.5 rounded-lg border border-[#E2E8F0] hover:bg-[#F8F9FA] text-[#4A5568] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Notes</span>
                </button>

                {/* Breadcrumbs */}
                <div className="hidden sm:flex items-center gap-1.5 text-xs text-[#718096]">
                  <span>{selectedParentFolder ? selectedParentFolder.name : "Notes"}</span>
                  {selectedFolder && (
                    <>
                      <ChevronRight className="w-3 h-3 text-[#CBD5E1]" />
                      <span className="font-semibold text-[#1A202C]">{selectedFolder.name}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Note Metadata Dropdowns & Actions */}
              <div className="flex items-center space-x-2 text-xs">
                {/* Folder Selector */}
                <select
                  value={activeEditingNote.folderId || ""}
                  onChange={async (e) => {
                    const val = e.target.value || undefined;
                    await updateNote({
                      id: activeEditingNote._id,
                      folderId: val as any,
                    });
                  }}
                  className="bg-[#F8F9FA] px-2.5 py-1.5 rounded-lg border border-[#E2E8F0] text-xs text-[#1A202C] focus:outline-none cursor-pointer"
                >
                  <option value="">No Folder</option>
                  {folders.map((f: any) => (
                    <option key={f._id} value={f._id}>
                      📁 {f.name}
                    </option>
                  ))}
                </select>

                {/* Linked Life Goal */}
                <select
                  value={activeEditingNote.goalId || ""}
                  onChange={async (e) => {
                    const val = e.target.value || undefined;
                    await updateNote({
                      id: activeEditingNote._id,
                      goalId: val as any,
                    });
                  }}
                  className="hidden md:block bg-[#F8F9FA] px-2.5 py-1.5 rounded-lg border border-[#E2E8F0] text-xs text-[#1A202C] focus:outline-none cursor-pointer"
                >
                  <option value="">No Linked Goal</option>
                  {goals.map((g: any) => (
                    <option key={g._id} value={g._id}>
                      {g.icon || "🎯"} {g.title}
                    </option>
                  ))}
                </select>

                {/* Pin & Favorite */}
                <button
                  onClick={() => togglePinned({ id: activeEditingNote._id })}
                  className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                    activeEditingNote.isPinned
                      ? "bg-amber-50 border-amber-300 text-amber-700"
                      : "border-[#E2E8F0] text-[#718096] hover:bg-[#F8F9FA]"
                  }`}
                  title="Pin note"
                >
                  <Pin className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => toggleFavorite({ id: activeEditingNote._id })}
                  className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                    activeEditingNote.isFavorite
                      ? "bg-amber-50 border-amber-300 text-amber-500 fill-amber-500"
                      : "border-[#E2E8F0] text-[#718096] hover:bg-[#F8F9FA]"
                  }`}
                  title="Favorite note"
                >
                  <Star className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => handleDeleteNote(activeEditingNote._id)}
                  className="p-2 rounded-lg border border-[#E2E8F0] text-[#718096] hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
                  title="Delete note"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Note Canvas Container */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-4 max-w-4xl w-full mx-auto">
              {/* Title input */}
              <input
                type="text"
                value={activeEditingNote.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Note Title..."
                className="font-serif text-3xl md:text-4xl font-bold text-[#1A202C] focus:outline-none w-full bg-transparent placeholder:text-[#CBD5E1]"
              />

              {/* Tags Editor */}
              <div className="flex flex-wrap items-center gap-1.5 pb-2 border-b border-[#ECEAE4]/60">
                {(activeEditingNote.tags || []).map((tag: string) => (
                  <span
                    key={tag}
                    className="bg-[#F1F3F5] text-[#4A5568] px-2.5 py-1 rounded-md text-[11px] font-mono font-medium flex items-center gap-1"
                  >
                    <span>#{tag}</span>
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="text-[#A0AEC0] hover:text-rose-600 cursor-pointer text-xs ml-0.5"
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
                  placeholder="+ Add tag (Press Enter)..."
                  className="text-xs font-mono text-[#4A5568] bg-transparent focus:outline-none px-2 py-0.5 placeholder:text-[#A0AEC0]"
                />
              </div>

              {/* TipTap Rich Text Editor */}
              <TipTapEditor
                key={activeEditingNote._id}
                content={activeEditingNote.content || ""}
                onChange={handleEditorChange}
              />
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* GRID VIEW: Matching the Stitch Design Exactly (Breadcrumbs + Cards Grid)   */
          /* ========================================================================= */
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* Top Action Bar (Matching Stitch Screen) */}
            <div className="h-16 border-b border-[#E2E8F0] flex justify-between items-center px-6 bg-white shrink-0">
              {/* Breadcrumb path */}
              <div className="flex items-center gap-2 text-sm text-[#4A5568]">
                <span className="hover:text-[#1A202C] cursor-pointer transition-colors font-medium">
                  {selectedParentFolder ? selectedParentFolder.name : "Engineering"}
                </span>
                <ChevronRight className="w-4 h-4 text-[#CBD5E1]" />
                <span className="text-[#1A202C] font-semibold">
                  {selectedFolder ? selectedFolder.name : "Architecture"}
                </span>
                <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-mono bg-[#EDF2F7] text-[#4A5568]">
                  {filteredNotes.length} notes
                </span>
              </div>

              {/* Search & New Note Button */}
              <div className="flex items-center gap-3">
                <div className="relative hidden sm:block w-64">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#A0AEC0]" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search notes..."
                    className="w-full bg-white border border-[#E2E8F0] rounded-lg pl-8 pr-3 py-1.5 text-xs text-[#1A202C] focus:outline-none focus:border-[#333E50]"
                  />
                </div>

                <button
                  onClick={handleCreateNewNote}
                  className="px-4 py-2 bg-[#333E50] text-white rounded-lg text-xs font-semibold hover:bg-[#252E3B] transition-colors flex items-center gap-2 shadow-xs cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Note</span>
                </button>
              </div>
            </div>

            {/* Notes Grid (Matching Stitch Screen) */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {/* Note Cards */}
                {filteredNotes.map((note: any) => (
                  <div
                    key={note._id}
                    onClick={() => setActiveEditingNoteId(note._id)}
                    className="bg-white border border-[#E2E8F0] rounded-xl p-5 hover:border-[#333E50] transition-all cursor-pointer flex flex-col h-60 group shadow-2xs hover:shadow-md relative overflow-hidden"
                  >
                    {/* Header: Title + Options */}
                    <div className="flex justify-between items-start mb-2.5">
                      <h3 className="font-semibold text-sm text-[#1A202C] leading-snug line-clamp-2 pr-2">
                        {note.title || "Untitled Note"}
                      </h3>

                      <DropdownMenu.Root>
                        <DropdownMenu.Trigger asChild onClick={(e) => e.stopPropagation()}>
                          <button className="text-[#A0AEC0] hover:text-[#1A202C] p-1 hover:bg-[#F1F3F5] rounded-md transition-colors cursor-pointer shrink-0">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </DropdownMenu.Trigger>

                        <DropdownMenu.Portal>
                          <DropdownMenu.Content
                            className="z-50 bg-white border border-[#E2E8F0] rounded-xl shadow-lg p-1 text-xs min-w-[130px] animate-in fade-in zoom-in-95"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <DropdownMenu.Item
                              onClick={() => togglePinned({ id: note._id })}
                              className="px-3 py-1.5 rounded-lg hover:bg-[#F8F9FA] cursor-pointer flex items-center gap-2"
                            >
                              <Pin className="w-3.5 h-3.5 text-amber-600" />
                              <span>{note.isPinned ? "Unpin" : "Pin"}</span>
                            </DropdownMenu.Item>
                            <DropdownMenu.Item
                              onClick={() => toggleFavorite({ id: note._id })}
                              className="px-3 py-1.5 rounded-lg hover:bg-[#F8F9FA] cursor-pointer flex items-center gap-2"
                            >
                              <Star className="w-3.5 h-3.5 text-amber-500" />
                              <span>{note.isFavorite ? "Unfavorite" : "Favorite"}</span>
                            </DropdownMenu.Item>
                            <DropdownMenu.Separator className="h-[1px] bg-[#ECEAE4] my-1" />
                            <DropdownMenu.Item
                              onClick={(e) => handleDeleteNote(note._id, e as any)}
                              className="px-3 py-1.5 rounded-lg hover:bg-rose-50 text-rose-600 cursor-pointer flex items-center gap-2"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete</span>
                            </DropdownMenu.Item>
                          </DropdownMenu.Content>
                        </DropdownMenu.Portal>
                      </DropdownMenu.Root>
                    </div>

                    {/* Body snippet */}
                    <p className="text-xs text-[#718096] leading-relaxed line-clamp-4 flex-1 mb-4">
                      {note.plainText || "Click to open and write notes..."}
                    </p>

                    {/* Tags Pills at bottom */}
                    <div className="flex flex-wrap gap-1.5 mt-auto pt-2">
                      {(note.tags && note.tags.length > 0 ? note.tags : ["notes"]).map(
                        (tag: string) => (
                          <span
                            key={tag}
                            className="bg-[#F1F3F5] text-[#4A5568] px-2 py-0.5 rounded-md text-[10px] font-mono uppercase tracking-wider font-semibold"
                          >
                            #{tag}
                          </span>
                        )
                      )}
                    </div>
                  </div>
                ))}

                {/* Empty State / Add New Placeholder Card (Matching Stitch Screen) */}
                <div
                  onClick={handleCreateNewNote}
                  className="border-2 border-dashed border-[#CBD5E1] rounded-xl p-5 hover:border-[#333E50] transition-all cursor-pointer flex flex-col items-center justify-center h-60 group bg-[#FAFAFA] hover:bg-[#F4F5F7]"
                >
                  <Plus className="w-8 h-8 text-[#A0AEC0] group-hover:text-[#333E50] transition-colors mb-2" />
                  <span className="font-semibold text-xs text-[#718096] group-hover:text-[#333E50] transition-colors">
                    Create Note
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Folder Create Dialog */}
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
