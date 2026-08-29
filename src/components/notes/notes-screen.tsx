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
  LayoutGrid,
  Columns,
  Sparkles,
  BookOpen,
  Code2,
  FileText,
  Clock,
  ArrowRight,
} from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

const NOTE_TEMPLATES = [
  {
    id: "reflection",
    title: "Daily Reflection & Clarity",
    icon: "🌱",
    tags: ["reflection", "daily"],
    content: `
      <h1>Daily Reflection & Strategic Clarity</h1>
      <blockquote><p>💡 <strong>Core Intention:</strong> Cultivate relentless clarity, discipline, and intentional engineering excellence.</p></blockquote>
      <h2>1. Key Wins & Discoveries</h2>
      <ul>
        <li>What went exceptionally well today?</li>
        <li>What algorithmic or architectural insight did I unlock?</li>
      </ul>
      <h2>2. Challenges & Lessons Learned</h2>
      <p>Analyze bottlenecks without judgment. Focus on actionable course correction.</p>
      <h2>3. Non-Negotiables for Tomorrow</h2>
      <ul data-type="taskList">
        <li data-type="taskItem" data-checked="false"><label><input type="checkbox"><span></span></label><div><p>Deep work focus block (50 min)</p></div></li>
        <li data-type="taskItem" data-checked="false"><label><input type="checkbox"><span></span></label><div><p>Solve 1 algorithmic pattern problem</p></div></li>
        <li data-type="taskItem" data-checked="false"><label><input type="checkbox"><span></span></label><div><p>Physical training & recovery</p></div></li>
      </ul>
    `,
    plainText: "Daily Reflection & Strategic Clarity: Key wins, algorithmic discoveries, and tomorrow's non-negotiables.",
  },
  {
    id: "architecture",
    title: "System Architecture RFC & Design",
    icon: "🏗️",
    tags: ["architecture", "systems"],
    content: `
      <h1>System Architecture RFC: Distributed Systems</h1>
      <p>High-level architectural blueprint and failure mode analysis.</p>
      <h2>1. Overview & Problem Statement</h2>
      <p>Describe the current throughput bottleneck and the proposed decoupled design.</p>
      <h2>2. Data Flow & Token Bucket Algorithm</h2>
      <pre><code class="language-typescript">// Token bucket rate limiter implementation
interface RateLimiter {
  allowRequest(userId: string, tokensRequired: number): boolean;
}

class TokenBucket implements RateLimiter {
  private capacity: number = 100;
  private refillRatePerSec: number = 10;
  
  allowRequest(userId: string, tokensRequired: number): boolean {
    // Check available capacity and refill timestamps
    return true;
  }
}</code></pre>
      <h2>3. Verification & Observability Plan</h2>
      <ul>
        <li>Distributed metrics via Prometheus & Grafana.</li>
        <li>p99 latency target: &lt; 25ms.</li>
      </ul>
    `,
    plainText: "System Architecture RFC: Distributed systems blueprint, token bucket rate limiter, and observability plan.",
  },
  {
    id: "leetcode",
    title: "Algorithmic Pattern Breakdown",
    icon: "🧩",
    tags: ["algorithms", "patterns"],
    content: `
      <h1>Pattern Breakdown: Two Pointers & Sliding Window</h1>
      <p>Core intuition and invariant mechanics for O(N) linear time complexity.</p>
      <h2>1. The Invariant</h2>
      <blockquote><p>📌 <strong>Invariant:</strong> Expand right pointer while window is valid; contract left pointer to restore validity.</p></blockquote>
      <h2>2. Canonical Implementation</h2>
      <pre><code class="language-python">def lengthOfLongestSubstring(s: str) -> int:
    char_index_map = {}
    left = 0
    max_len = 0
    
    for right, char in enumerate(s):
        if char in char_index_map and char_index_map[char] >= left:
            left = char_index_map[char] + 1
        char_index_map[char] = right
        max_len = max(max_len, right - left + 1)
        
    return max_len</code></pre>
    `,
    plainText: "Pattern Breakdown: Two Pointers & Sliding Window. Core invariants and canonical Python implementation.",
  },
];

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

  // View States: "split" (Default 3-pane modern layout) vs "grid" (Gallery cards layout)
  const [viewMode, setViewMode] = useState<"split" | "grid">("split");
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [tagInput, setTagInput] = useState("");

  // Folder Dialog
  const [isFolderDialogOpen, setIsFolderDialogOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<any | null>(null);

  // Auto-expand folders on mount
  useEffect(() => {
    if (folders.length > 0) {
      const expanded: Record<string, boolean> = {};
      folders.forEach((f: any) => {
        if (!f.parentId) expanded[f._id] = true;
      });
      setExpandedFolders((prev) => ({ ...expanded, ...prev }));

      if (!selectedFolderId) {
        const arch = folders.find((f: any) => f.name.toLowerCase() === "architecture");
        if (arch) {
          setSelectedFolderId(arch._id);
        } else {
          setSelectedFolderId(folders[0]._id);
        }
      }
    }
  }, [folders, selectedFolderId]);

  // Set default active note when folder changes
  useEffect(() => {
    if (notes.length > 0) {
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
    }
  }, [selectedFolderId, notes, activeNoteId]);

  const toggleFolderExpand = (folderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedFolders((prev) => ({ ...prev, [folderId]: !prev[folderId] }));
  };

  const activeNote = notes.find((n: any) => n._id === activeNoteId) || null;

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
    const newId = await createNote({
      title: "Untitled Note",
      content: "<p></p>",
      plainText: "",
      folderId: (selectedFolderId as any) || undefined,
      tags: [],
    });

    if (newId) {
      setActiveNoteId(newId);
    }
  };

  const handleApplyTemplate = async (template: typeof NOTE_TEMPLATES[0]) => {
    const newId = await createNote({
      title: template.title,
      content: template.content,
      plainText: template.plainText,
      folderId: (selectedFolderId as any) || undefined,
      tags: template.tags,
    });

    if (newId) {
      setActiveNoteId(newId);
      if (viewMode === "grid") setViewMode("split");
    }
  };

  const handleDeleteNote = async (id: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    await removeNote({ id });
    if (activeNoteId === id) {
      const remaining = notes.filter((n: any) => n._id !== id);
      setActiveNoteId(remaining.length > 0 ? remaining[0]._id : null);
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
  const selectedParentFolder = selectedFolder?.parentId
    ? folders.find((f: any) => f._id === selectedFolder.parentId)
    : null;

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

  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm flex flex-col md:flex-row h-[calc(100vh-130px)] overflow-hidden animate-in fade-in duration-200 select-none">
      {/* 1. Left Folder Tree Panel (Knowledge Base) */}
      <aside className="w-full md:w-64 bg-[#FAFAFA] border-r border-[#E2E8F0] flex flex-col h-full shrink-0">
        {/* Panel Header */}
        <div className="px-4 py-3.5 border-b border-[#ECEAE4] flex justify-between items-center bg-white">
          <h2 className="font-mono text-xs text-[#333E50] font-bold tracking-wider uppercase">
            Knowledge Base
          </h2>
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
        </div>

        {/* Tree Structure */}
        <div className="px-2.5 py-3 flex-1 overflow-y-auto space-y-1 text-xs">
          {parentFolders.map((parent: any) => {
            const subfolders = getSubfolders(parent._id);
            const isExpanded = Boolean(expandedFolders[parent._id]);
            const isSelected = selectedFolderId === parent._id;
            const parentNoteCount = notes.filter((n: any) => n.folderId === parent._id).length;

            return (
              <div key={parent._id} className="space-y-0.5">
                {/* Parent Folder Row */}
                <div
                  onClick={() => setSelectedFolderId(parent._id)}
                  className={`flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-pointer transition-colors group ${
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
                  <span className="text-[10px] font-mono text-[#A0AEC0] opacity-80">
                    {parentNoteCount}
                  </span>
                </div>

                {/* Subfolders List */}
                {isExpanded && subfolders.length > 0 && (
                  <div className="pl-5 space-y-0.5 mt-0.5">
                    {subfolders.map((sub: any) => {
                      const isSubSelected = selectedFolderId === sub._id;
                      const subCount = notes.filter((n: any) => n.folderId === sub._id).length;

                      return (
                        <div
                          key={sub._id}
                          onClick={() => setSelectedFolderId(sub._id)}
                          className={`flex items-center justify-between px-2.5 py-1.5 rounded-r-lg cursor-pointer transition-colors ${
                            isSubSelected
                              ? "bg-[#ECEFF3] text-[#1A202C] font-semibold border-l-2 border-[#333E50]"
                              : "text-[#4A5568] hover:bg-white hover:text-[#1A202C]"
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <Folder className="w-3.5 h-3.5 text-[#718096] shrink-0" />
                            <span className="truncate">{sub.name}</span>
                          </div>
                          <span className="text-[10px] font-mono text-[#A0AEC0]">
                            {subCount}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </aside>

      {/* 2. Main Area: Unified 3-Pane Split View & Gallery Mode (No Wasted Space!) */}
      <main className="flex-1 flex flex-col h-full bg-white overflow-hidden">
        {/* Universal Top Action Bar */}
        <div className="h-14 border-b border-[#ECEAE4] px-5 flex justify-between items-center bg-white shrink-0 gap-3">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-1.5 text-xs text-[#4A5568]">
            <span className="hover:text-[#1A202C] cursor-pointer transition-colors font-medium">
              {selectedParentFolder ? selectedParentFolder.name : "Knowledge"}
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-[#CBD5E1]" />
            <span className="text-[#1A202C] font-bold">
              {selectedFolder ? selectedFolder.name : "All Notes"}
            </span>
            <span className="ml-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono bg-[#EDF2F7] text-[#4A5568] font-semibold">
              {filteredNotes.length} notes
            </span>
          </div>

          {/* Search, View Mode Toggle, and New Note Button */}
          <div className="flex items-center gap-2 text-xs">
            {/* Search Input */}
            <div className="relative w-44 sm:w-56">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#A0AEC0]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search notes..."
                className="w-full bg-[#F8F9FA] border border-[#E2E8F0] rounded-lg pl-8 pr-2.5 py-1 text-xs text-[#1A202C] focus:outline-none focus:border-[#333E50]"
              />
            </div>

            {/* View Mode Toggle: Split Workspace vs Grid */}
            <div className="flex items-center rounded-lg border border-[#E2E8F0] bg-white p-0.5">
              <button
                onClick={() => setViewMode("split")}
                className={`p-1 rounded-md transition-colors cursor-pointer ${
                  viewMode === "split"
                    ? "bg-[#333E50] text-white shadow-2xs"
                    : "text-[#718096] hover:text-[#1A202C]"
                }`}
                title="Split Workspace View"
              >
                <Columns className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1 rounded-md transition-colors cursor-pointer ${
                  viewMode === "grid"
                    ? "bg-[#333E50] text-white shadow-2xs"
                    : "text-[#718096] hover:text-[#1A202C]"
                }`}
                title="Grid Gallery View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              onClick={handleCreateNewNote}
              className="px-3 py-1.5 bg-[#333E50] text-white rounded-lg text-xs font-semibold hover:bg-[#252E3B] transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Note</span>
            </button>
          </div>
        </div>

        {/* Content Body: Split View OR Grid View */}
        {viewMode === "split" ? (
          /* ========================================================================= */
          /* 1. SPLIT VIEW: High Density, Linear Notes List + Full Active Editor Canvas */
          /* ========================================================================= */
          <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden">
            {/* Middle Column: Notes List (w-72) */}
            <div className="w-full md:w-72 bg-[#FBFBFA] border-r border-[#ECEAE4] flex flex-col h-full overflow-hidden shrink-0">
              <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
                {filteredNotes.length === 0 ? (
                  <div className="py-8 text-center px-4 space-y-2">
                    <p className="text-xs text-[#A0AEC0] font-mono">No notes in folder</p>
                    <button
                      onClick={handleCreateNewNote}
                      className="text-xs text-[#333E50] hover:underline font-semibold"
                    >
                      + Create first note
                    </button>
                  </div>
                ) : (
                  filteredNotes.map((note: any) => {
                    const isSelected = activeNote?._id === note._id;
                    return (
                      <div
                        key={note._id}
                        onClick={() => setActiveNoteId(note._id)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer space-y-1 select-none ${
                          isSelected
                            ? "bg-white border-[#333E50] shadow-xs"
                            : "bg-white/60 border-[#E2E8F0] hover:border-[#CBD5E1] hover:bg-white"
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
                          <div className="flex gap-1 overflow-hidden truncate max-w-[140px]">
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

            {/* Right Column: Full Rich-Text TipTap Editor Canvas (Fills entire rest of screen!) */}
            <div className="flex-1 flex flex-col h-full bg-white overflow-hidden">
              {activeNote ? (
                <div className="flex-1 flex flex-col h-full overflow-hidden">
                  {/* Editor Header Bar */}
                  <div className="px-6 py-3 border-b border-[#ECEAE4] flex flex-wrap items-center justify-between gap-2 bg-[#FCFCFB] shrink-0 text-xs">
                    {/* Tags Manager */}
                    <div className="flex flex-wrap items-center gap-1.5 flex-1">
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
                        className="text-xs font-mono text-[#4A5568] bg-transparent focus:outline-none px-1 py-0.5 placeholder:text-[#A0AEC0] w-20"
                      />
                    </div>

                    {/* Metadata & Actions */}
                    <div className="flex items-center space-x-2">
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
                        className="hidden lg:block bg-white px-2 py-1 rounded border border-[#E2E8F0] text-xs text-[#1A202C] focus:outline-none cursor-pointer"
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

                  {/* Note Canvas */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-3">
                    <input
                      type="text"
                      value={activeNote.title}
                      onChange={(e) => handleTitleChange(e.target.value)}
                      placeholder="Note Title..."
                      className="font-serif text-2xl md:text-3xl font-bold text-[#1A202C] focus:outline-none w-full bg-transparent placeholder:text-[#CBD5E1]"
                    />

                    <TipTapEditor
                      key={activeNote._id}
                      content={activeNote.content || ""}
                      onChange={handleEditorChange}
                    />
                  </div>
                </div>
              ) : (
                /* Empty Canvas with Quick Starter Templates (Zero Wasted Space!) */
                <div className="flex-1 overflow-y-auto p-8 space-y-6 flex flex-col justify-center max-w-2xl mx-auto">
                  <div className="space-y-2 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-[#F1F3F5] text-[#333E50] flex items-center justify-center mx-auto text-xl font-bold font-serif">
                      M
                    </div>
                    <h3 className="font-serif text-2xl font-bold text-[#1A202C]">
                      Create or Choose a Note
                    </h3>
                    <p className="text-xs text-[#718096]">
                      Select an existing note or kickstart a structured document with a template below.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {NOTE_TEMPLATES.map((tmpl) => (
                      <div
                        key={tmpl.id}
                        onClick={() => handleApplyTemplate(tmpl)}
                        className="p-4 rounded-xl border border-[#E2E8F0] hover:border-[#333E50] hover:shadow-xs transition-all cursor-pointer bg-[#FAFAFA] hover:bg-white space-y-2 group"
                      >
                        <div className="text-2xl">{tmpl.icon}</div>
                        <h4 className="font-serif font-bold text-xs text-[#1A202C] group-hover:text-[#333E50]">
                          {tmpl.title}
                        </h4>
                        <p className="text-[10px] text-[#718096] line-clamp-2">
                          {tmpl.plainText}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="text-center pt-2">
                    <button
                      onClick={handleCreateNewNote}
                      className="px-5 py-2 rounded-lg bg-[#333E50] text-white text-xs font-semibold hover:bg-[#252E3B] shadow-sm transition-colors cursor-pointer"
                    >
                      + Blank Note
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* 2. GRID / GALLERY VIEW (With Templates When Empty)                         */
          /* ========================================================================= */
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {filteredNotes.length === 0 ? (
              <div className="space-y-6 max-w-3xl mx-auto py-8">
                <div className="text-center space-y-2">
                  <BookOpen className="w-10 h-10 text-[#CBD5E1] mx-auto" />
                  <h3 className="font-serif text-xl font-bold text-[#1A202C]">
                    No notes in {selectedFolder ? selectedFolder.name : "this folder"}
                  </h3>
                  <p className="text-xs text-[#718096]">
                    Start writing a blank note or choose a curated template below to jumpstart your documentation.
                  </p>
                </div>

                {/* Quick Templates Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {NOTE_TEMPLATES.map((tmpl) => (
                    <div
                      key={tmpl.id}
                      onClick={() => handleApplyTemplate(tmpl)}
                      className="p-5 rounded-xl border border-[#E2E8F0] hover:border-[#333E50] hover:shadow-md transition-all cursor-pointer bg-white space-y-2.5 group"
                    >
                      <div className="text-3xl">{tmpl.icon}</div>
                      <h4 className="font-serif font-bold text-sm text-[#1A202C] group-hover:text-[#333E50]">
                        {tmpl.title}
                      </h4>
                      <p className="text-xs text-[#718096] line-clamp-3">
                        {tmpl.plainText}
                      </p>
                      <span className="text-[10px] font-mono text-[#333E50] font-semibold flex items-center gap-1 pt-1 group-hover:underline">
                        <span>Use Template</span>
                        <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  ))}
                </div>

                <div className="text-center pt-2">
                  <button
                    onClick={handleCreateNewNote}
                    className="px-5 py-2.5 rounded-xl bg-[#333E50] text-white text-xs font-semibold hover:bg-[#252E3B] shadow-sm transition-colors cursor-pointer"
                  >
                    + Create Blank Note
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredNotes.map((note: any) => (
                  <div
                    key={note._id}
                    onClick={() => {
                      setActiveNoteId(note._id);
                      setViewMode("split");
                    }}
                    className="bg-white border border-[#E2E8F0] rounded-xl p-5 hover:border-[#333E50] transition-all cursor-pointer flex flex-col h-60 group shadow-2xs hover:shadow-md relative overflow-hidden"
                  >
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
                            className="z-50 bg-white border border-[#E2E8F0] rounded-xl shadow-lg p-1 text-xs min-w-[130px]"
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

                    <p className="text-xs text-[#718096] leading-relaxed line-clamp-4 flex-1 mb-4">
                      {note.plainText || "Click to open and write notes..."}
                    </p>

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

                {/* Create Note Placeholder Card */}
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
            )}
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
