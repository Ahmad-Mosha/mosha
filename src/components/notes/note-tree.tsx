"use client";

import React from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  ChevronRight, Edit2, FileText, Folder, FolderOpen,
  MoreHorizontal, Pin, Plus, Star, Trash2,
} from "lucide-react";

/**
 * Every row — folder or note, at any depth — is laid out on the same grid:
 *
 *   [ chevron 14px ][ icon 15px ][ label ][ trailing ]
 *
 * Notes have no children, so their chevron cell stays empty rather than absent.
 * That is what keeps folder and note icons on one vertical rail; the previous
 * tree gave folders and notes different padding and nested them in an extra
 * indented wrapper, so nothing lined up.
 */
const INDENT = 14;

interface Note {
  _id: string;
  title?: string;
  isPinned?: boolean;
  isFavorite?: boolean;
  folderId?: string;
}

interface FolderNode {
  _id: string;
  name: string;
  parentId?: string;
}

interface RowProps {
  depth: number;
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
}

function Row({ depth, active, onClick, children, className = "" }: RowProps) {
  return (
    <div
      onClick={onClick}
      style={{ paddingLeft: 6 + depth * INDENT }}
      className={`group/row grid h-7 grid-cols-[14px_15px_1fr_auto] items-center gap-1.5
        rounded-md pr-1.5 cursor-pointer transition-colors ${
          active
            ? "bg-accent text-accent-fg"
            : "text-muted hover:bg-subtle-2 hover:text-ink"
        } ${className}`}
    >
      {children}
    </div>
  );
}

function IconBtn({
  onClick, title, children, always = false,
}: {
  onClick: (e: React.MouseEvent) => void;
  title: string;
  children: React.ReactNode;
  always?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`grid h-5 w-5 place-items-center rounded transition-opacity
        hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer ${
          always ? "" : "opacity-0 group-hover/row:opacity-100 focus:opacity-100"
        }`}
    >
      {children}
    </button>
  );
}

interface TreeProps {
  folders: FolderNode[];
  notes: Note[];
  activeNoteId: string | null;
  expanded: Record<string, boolean>;
  onToggleFolder: (id: string) => void;
  onSelectNote: (id: string) => void;
  onCreateNote: (folderId?: string) => void;
  onEditFolder: (folder: FolderNode) => void;
  onDeleteFolder: (id: string) => void;
  onDeleteNote: (id: string) => void;
  /** Search collapses the tree into a flat result list. */
  isSearching: boolean;
}

export function NoteTree({
  folders, notes, activeNoteId, expanded,
  onToggleFolder, onSelectNote, onCreateNote,
  onEditFolder, onDeleteFolder, onDeleteNote, isSearching,
}: TreeProps) {
  const folderIds = new Set(folders.map((f) => f._id));
  const childFolders = (parentId?: string) =>
    folders.filter((f) => (parentId ? f.parentId === parentId : !f.parentId));

  // A note whose folder no longer exists still belongs somewhere visible.
  const notesIn = (folderId: string | null) =>
    notes.filter((n) =>
      folderId
        ? n.folderId === folderId
        : !n.folderId || !folderIds.has(n.folderId)
    );

  const renderNote = (note: Note, depth: number) => {
    const active = note._id === activeNoteId;
    return (
      <Row
        key={note._id}
        depth={depth}
        active={active}
        onClick={() => onSelectNote(note._id)}
      >
        <span />
        <FileText
          className={`h-3.5 w-3.5 ${active ? "" : "text-ghost"}`}
        />
        <span className={`truncate text-label ${active ? "font-medium" : ""}`}>
          {note.title || "Untitled Note"}
        </span>
        <span className="flex items-center gap-0.5">
          {note.isPinned && <Pin className="h-3 w-3 fill-current text-warn" />}
          {note.isFavorite && <Star className="h-3 w-3 fill-current text-warn" />}
          <IconBtn
            title="Delete note"
            onClick={(e) => { e.stopPropagation(); onDeleteNote(note._id); }}
          >
            <Trash2 className="h-3 w-3" />
          </IconBtn>
        </span>
      </Row>
    );
  };

  const renderFolder = (folder: FolderNode, depth: number): React.ReactNode => {
    const open = isSearching || Boolean(expanded[folder._id]);
    const subfolders = childFolders(folder._id);
    const folderNotes = notesIn(folder._id);
    const count = folderNotes.length + subfolders.length;

    // While searching, hide branches with nothing to show.
    if (isSearching && count === 0) return null;

    return (
      <div key={folder._id}>
        <Row depth={depth} onClick={() => onToggleFolder(folder._id)}>
          <ChevronRight
            className={`h-3.5 w-3.5 text-ghost transition-transform duration-150 ${
              open ? "rotate-90" : ""
            }`}
          />
          {open ? (
            <FolderOpen className="h-3.5 w-3.5 text-faint" />
          ) : (
            <Folder className="h-3.5 w-3.5 text-faint" />
          )}
          <span className="truncate text-label font-medium text-ink-2">
            {folder.name}
          </span>
          <span className="flex items-center gap-0.5">
            <span className="px-1 font-mono text-meta text-ghost group-hover/row:hidden">
              {count || ""}
            </span>
            <IconBtn
              title="New note here"
              onClick={(e) => { e.stopPropagation(); onCreateNote(folder._id); }}
            >
              <Plus className="h-3 w-3" />
            </IconBtn>
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild onClick={(e) => e.stopPropagation()}>
                <button
                  className="grid h-5 w-5 place-items-center rounded opacity-0
                             transition-opacity group-hover/row:opacity-100
                             hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer"
                  title="Folder options"
                >
                  <MoreHorizontal className="h-3 w-3" />
                </button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  align="end"
                  sideOffset={4}
                  onClick={(e) => e.stopPropagation()}
                  className="z-[100] min-w-[150px] rounded-xl border border-line
                             bg-surface-2 p-1 text-label shadow-lg"
                >
                  <DropdownMenu.Item
                    onClick={() => onEditFolder(folder)}
                    className="flex cursor-pointer items-center gap-2 rounded-lg px-2.5
                               py-1.5 outline-none hover:bg-subtle text-ink-2"
                  >
                    <Edit2 className="h-3.5 w-3.5 text-faint" />
                    Rename
                  </DropdownMenu.Item>
                  <DropdownMenu.Item
                    onClick={() => onDeleteFolder(folder._id)}
                    className="flex cursor-pointer items-center gap-2 rounded-lg px-2.5
                               py-1.5 outline-none text-danger hover:bg-danger-tint"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete folder
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          </span>
        </Row>

        {open && (
          <div>
            {subfolders.map((sub) => renderFolder(sub, depth + 1))}
            {folderNotes.map((n) => renderNote(n, depth + 1))}
            {!isSearching && count === 0 && (
              <Row depth={depth + 1} onClick={() => onCreateNote(folder._id)}>
                <span />
                <Plus className="h-3 w-3 text-ghost" />
                <span className="truncate text-label text-ghost">Add note…</span>
                <span />
              </Row>
            )}
          </div>
        )}
      </div>
    );
  };

  const loose = notesIn(null);

  return (
    <div className="py-1">
      {childFolders().map((f) => renderFolder(f, 0))}

      {loose.length > 0 && (
        <>
          <div
            className="mt-2 mb-0.5 px-2 font-mono text-meta uppercase text-ghost"
            style={{ paddingLeft: 6 }}
          >
            General
          </div>
          {loose.map((n) => renderNote(n, 0))}
        </>
      )}
    </div>
  );
}
