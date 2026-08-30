"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { NoteEditor } from "./editor";
import { NoteTree } from "./note-tree";
import { FolderDialog } from "./folder-dialog";
import { Select, NONE } from "@/components/ui/select";
import { useMoshaStore } from "@/lib/store";
import { toast } from "sonner";
import {
  BookOpen, Folder, FolderPlus, PanelLeft, PanelLeftClose,
  Pin, Plus, Search, Star, Trash2, X,
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

  /**
   * No localStorage cache here, deliberately.
   *
   * It used to seed the tree while the socket connected, but the editor mounts
   * with whatever content the note has at that moment and is keyed by note id
   * — which does not change when the real data lands. So a note opened from a
   * stale cache kept the stale body, and the next save wrote it back over the
   * real one. It cost two notes before it was caught. A skeleton for a few
   * hundred milliseconds is a much better trade than losing writing.
   */
  const notes = convexNotes ?? [];
  const isLoadingNotes = convexNotes === undefined;

  const focusNoteId = useMoshaStore((s) => s.focusNoteId);
  const clearFocusNote = useMoshaStore((s) => s.clearFocusNote);

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [localTitle, setLocalTitle] = useState("");
  const [isFolderDialogOpen, setIsFolderDialogOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<any | null>(null);

  // Expand every folder the first time they arrive, then leave the user's own
  // open/closed choices alone.
  const didAutoExpand = useRef(false);
  useEffect(() => {
    if (didAutoExpand.current || folders.length === 0) return;
    didAutoExpand.current = true;
    setExpanded(Object.fromEntries(folders.map((f: any) => [f._id, true])));
  }, [folders]);

  useEffect(() => {
    if (notes.length > 0 && !activeNoteId) setActiveNoteId(notes[0]._id);
  }, [notes, activeNoteId]);

  // Another screen asked for a specific note; take it, then release the request
  // so it cannot override the next selection the user makes.
  useEffect(() => {
    if (!focusNoteId) return;
    setActiveNoteId(focusNoteId);
    clearFocusNote();
  }, [focusNoteId, clearFocusNote]);

  const activeNote = notes.find((n: any) => n._id === activeNoteId) || null;

  useEffect(() => {
    setLocalTitle(activeNote?.title || "");
  }, [activeNote?._id]);

  const isSearching = searchQuery.trim().length > 0;
  const visibleNotes = isSearching
    ? notes.filter((n: any) => {
        const q = searchQuery.toLowerCase();
        return (
          n.title?.toLowerCase().includes(q) ||
          n.plainText?.toLowerCase().includes(q) ||
          n.tags?.some((t: string) => t.toLowerCase().includes(q))
        );
      })
    : notes;

  const handleEditorChange = useCallback(
    async (content: string, plainText: string) => {
      if (!activeNoteId) return;
      try {
        await updateNote({ id: activeNoteId as any, content, plainText });
      } catch {
        toast.error("Could not save note");
      }
    },
    [activeNoteId, updateNote]
  );

  const titleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleTitleChange = (next: string) => {
    setLocalTitle(next);
    if (!activeNoteId) return;
    if (titleTimer.current) clearTimeout(titleTimer.current);
    titleTimer.current = setTimeout(() => {
      updateNote({ id: activeNoteId as any, title: next }).catch(() =>
        toast.error("Could not save title")
      );
    }, 400);
  };

  const handleCreateNote = async (folderId?: string) => {
    try {
      const id = await createNote({
        title: "Untitled Note",
        content: "<p></p>",
        plainText: "",
        folderId: (folderId as any) || undefined,
        tags: [],
      });
      if (id) {
        setActiveNoteId(id);
        setLocalTitle("Untitled Note");
        if (folderId) setExpanded((p) => ({ ...p, [folderId]: true }));
      }
    } catch {
      toast.error("Could not create note");
    }
  };

  const handleDeleteNote = async (id: string) => {
    const doomed = notes.find((n: any) => n._id === id);
    try {
      await removeNote({ id: id as any });
      if (activeNoteId === id) {
        const rest = notes.filter((n: any) => n._id !== id);
        setActiveNoteId(rest[0]?._id ?? null);
      }
      toast.success(`Deleted “${doomed?.title || "Untitled Note"}”`);
    } catch {
      toast.error("Could not delete note");
    }
  };

  const handleDeleteFolder = async (id: string) => {
    try {
      await removeFolder({ id: id as any });
      toast.success("Folder deleted — its notes moved to General");
    } catch {
      toast.error("Could not delete folder");
    }
  };

  const addTag = async (e: React.KeyboardEvent) => {
    if (e.key !== "Enter" || !tagInput.trim() || !activeNote) return;
    e.preventDefault();
    const tag = tagInput.trim().replace(/^#/, "");
    const tags = activeNote.tags || [];
    if (!tags.includes(tag)) {
      await updateNote({ id: activeNote._id, tags: [...tags, tag] });
    }
    setTagInput("");
  };

  const removeTag = async (tag: string) => {
    if (!activeNote) return;
    await updateNote({
      id: activeNote._id,
      tags: (activeNote.tags || []).filter((t: string) => t !== tag),
    });
  };

  const activeFolder = activeNote?.folderId
    ? folders.find((f: any) => f._id === activeNote.folderId)
    : null;

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-surface-2 md:flex-row">
      {/* ---- Sidebar ------------------------------------------------------ */}
      {isSidebarOpen && (
        <aside className="flex h-full w-full shrink-0 flex-col border-r border-line bg-surface md:w-72">
          <div className="flex items-center justify-between border-b border-line px-3 py-2.5">
            <h2 className="font-mono text-meta font-semibold uppercase text-faint">
              Knowledge Base
            </h2>
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => handleCreateNote()}
                title="New note"
                className="grid h-7 w-7 place-items-center rounded-md text-muted
                           hover:bg-subtle-2 hover:text-ink transition-colors cursor-pointer"
              >
                <Plus className="h-4 w-4" />
              </button>
              <button
                onClick={() => { setEditingFolder(null); setIsFolderDialogOpen(true); }}
                title="New folder"
                className="grid h-7 w-7 place-items-center rounded-md text-muted
                           hover:bg-subtle-2 hover:text-ink transition-colors cursor-pointer"
              >
                <FolderPlus className="h-4 w-4" />
              </button>
              <button
                onClick={() => setIsSidebarOpen(false)}
                title="Hide sidebar"
                className="grid h-7 w-7 place-items-center rounded-md text-faint
                           hover:bg-subtle-2 hover:text-ink transition-colors cursor-pointer"
              >
                <PanelLeftClose className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="border-b border-line p-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ghost" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search notes…"
                className="w-full rounded-lg border border-line bg-subtle py-1.5 pl-8 pr-7
                           text-label text-ink outline-none transition-colors
                           placeholder:text-ghost focus:border-accent focus:bg-surface-2"
              />
              {isSearching && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-ghost
                             hover:text-ink cursor-pointer"
                  title="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-1.5">
            {isLoadingNotes ? (
              <div className="space-y-1.5 p-2" aria-label="Loading notes">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="h-7 animate-pulse rounded-md bg-subtle" />
                ))}
              </div>
            ) : notes.length === 0 && folders.length === 0 ? (
              <div className="space-y-3 px-3 py-12 text-center">
                <p className="text-label text-ghost">No notes yet.</p>
                <button
                  onClick={() => handleCreateNote()}
                  className="rounded-lg bg-accent px-3 py-1.5 text-label font-semibold
                             text-accent-fg hover:bg-accent-hover cursor-pointer"
                >
                  Create first note
                </button>
              </div>
            ) : isSearching && visibleNotes.length === 0 ? (
              <p className="px-3 py-8 text-center text-label text-ghost">
                Nothing matches “{searchQuery}”.
              </p>
            ) : (
              <NoteTree
                folders={folders as any}
                notes={visibleNotes as any}
                activeNoteId={activeNoteId}
                expanded={expanded}
                isSearching={isSearching}
                onToggleFolder={(id) => setExpanded((p) => ({ ...p, [id]: !p[id] }))}
                onSelectNote={setActiveNoteId}
                onCreateNote={handleCreateNote}
                onEditFolder={(f) => { setEditingFolder(f); setIsFolderDialogOpen(true); }}
                onDeleteFolder={handleDeleteFolder}
                onDeleteNote={handleDeleteNote}
              />
            )}
          </div>
        </aside>
      )}

      {/* ---- Editor pane -------------------------------------------------- */}
      <main className="flex h-full flex-1 flex-col overflow-hidden bg-surface-2">
        {/* The editor must never mount before the real note has loaded — it is
            keyed by note id, so it would keep whatever body it started with. */}
        {isLoadingNotes ? null : activeNote ? (
          <>
            <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-line px-4 py-2">
              {!isSidebarOpen && (
                <button
                  onClick={() => setIsSidebarOpen(true)}
                  title="Show sidebar"
                  className="grid h-7 w-7 place-items-center rounded-md border border-line
                             text-muted hover:bg-subtle transition-colors cursor-pointer"
                >
                  <PanelLeft className="h-3.5 w-3.5" />
                </button>
              )}

              <span className="flex items-center gap-1.5 text-label text-faint">
                <Folder className="h-3.5 w-3.5 text-ghost" />
                {activeFolder ? activeFolder.name : "General"}
              </span>

              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1">
                {(activeNote.tags || []).map((tag: string) => (
                  <span
                    key={tag}
                    className="flex items-center gap-1 rounded bg-subtle-2 px-1.5 py-0.5
                               font-mono text-meta text-muted"
                  >
                    #{tag}
                    <button
                      onClick={() => removeTag(tag)}
                      className="text-ghost hover:text-danger cursor-pointer"
                      title={`Remove #${tag}`}
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </span>
                ))}
                <input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={addTag}
                  placeholder="+ tag"
                  className="w-16 bg-transparent px-1 font-mono text-meta text-muted
                             outline-none placeholder:text-ghost"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <Select
                  value={activeNote.folderId || NONE}
                  onValueChange={(v) =>
                    updateNote({
                      id: activeNote._id,
                      folderId: (v === NONE ? undefined : v) as any,
                    })
                  }
                  size="sm"
                  options={[
                    { value: NONE, label: "General" },
                    ...folders.map((f: any) => ({ value: f._id, label: f.name })),
                  ]}
                />
                <Select
                  value={activeNote.goalId || NONE}
                  onValueChange={(v) =>
                    updateNote({
                      id: activeNote._id,
                      goalId: (v === NONE ? undefined : v) as any,
                    })
                  }
                  size="sm"
                  className="hidden xl:inline-flex"
                  options={[
                    { value: NONE, label: "No linked goal" },
                    ...goals.map((g: any) => ({
                      value: g._id,
                      label: `${g.icon || "🎯"} ${g.title}`,
                    })),
                  ]}
                />

                <button
                  onClick={() => togglePinned({ id: activeNote._id })}
                  title={activeNote.isPinned ? "Unpin" : "Pin note"}
                  className={`grid h-7 w-7 place-items-center rounded-md border transition-colors cursor-pointer ${
                    activeNote.isPinned
                      ? "border-warn/35 bg-warn-tint text-warn"
                      : "border-line text-faint hover:bg-subtle"
                  }`}
                >
                  <Pin className={`h-3.5 w-3.5 ${activeNote.isPinned ? "fill-current" : ""}`} />
                </button>
                <button
                  onClick={() => toggleFavorite({ id: activeNote._id })}
                  title={activeNote.isFavorite ? "Unstar" : "Star note"}
                  className={`grid h-7 w-7 place-items-center rounded-md border transition-colors cursor-pointer ${
                    activeNote.isFavorite
                      ? "border-warn/35 bg-warn-tint text-warn"
                      : "border-line text-faint hover:bg-subtle"
                  }`}
                >
                  <Star className={`h-3.5 w-3.5 ${activeNote.isFavorite ? "fill-current" : ""}`} />
                </button>
                <button
                  onClick={() => handleDeleteNote(activeNote._id)}
                  title="Delete note"
                  className="grid h-7 w-7 place-items-center rounded-md border border-line
                             text-faint hover:bg-danger-tint hover:text-danger
                             transition-colors cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Title sits above the editor's scroll area so it stays put while
                the note scrolls, and the toolbar stays reachable. */}
            <div className="shrink-0 border-b border-line px-8 pb-3 pt-6 md:px-12">
              <input
                value={localTitle}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Untitled"
                className="block w-full max-w-3xl bg-transparent font-serif
                           text-display text-ink outline-none placeholder:text-line-2"
              />
            </div>

            <div className="min-h-0 flex-1">
              <NoteEditor
                key={activeNote._id}
                initialContent={activeNote.content || ""}
                onChange={handleEditorChange}
              />
            </div>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
            <BookOpen className="h-10 w-10 text-line-2" />
            <div className="space-y-1">
              <h3 className="font-serif text-title text-ink">Knowledge Base</h3>
              <p className="max-w-xs text-label text-faint">
                Pick a note from the sidebar, or start a new one.
              </p>
            </div>
            <button
              onClick={() => handleCreateNote()}
              className="rounded-xl bg-accent px-5 py-2.5 text-label font-semibold
                         text-accent-fg hover:bg-accent-hover transition-colors cursor-pointer"
            >
              New note
            </button>
          </div>
        )}
      </main>

      <FolderDialog
        isOpen={isFolderDialogOpen}
        onClose={() => { setIsFolderDialogOpen(false); setEditingFolder(null); }}
        editingFolder={editingFolder}
      />
    </div>
  );
}
