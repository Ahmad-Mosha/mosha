"use client";

import React, { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { X, FolderPlus, Edit2 } from "lucide-react";

interface FolderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  editingFolder?: any | null;
}

const FOLDER_EMOJIS = [
  "🏗️", "🧩", "🎖️", "💼", "💡", "📚",
  "⚙️", "🚀", "🧠", "🔐", "🌐", "🧪",
  "📈", "🎨", "💍", "🕌", "🌱", "🔑"
];

export function FolderDialog({ isOpen, onClose, editingFolder }: FolderDialogProps) {
  const createFolder = useMutation(api.notes.createFolder);
  const updateFolder = useMutation(api.notes.updateFolder);

  const [name, setName] = useState("");
  const [icon, setIcon] = useState("📁");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingFolder) {
      setName(editingFolder.name || "");
      setIcon(editingFolder.icon || "📁");
    } else {
      setName("");
      setIcon("📁");
    }
  }, [editingFolder, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      if (editingFolder) {
        await updateFolder({
          id: editingFolder._id,
          name: name.trim(),
          icon,
        });
      } else {
        await createFolder({
          name: name.trim(),
          icon,
        });
      }
      onClose();
    } catch (err) {
      console.error("Failed to save folder:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs animate-in fade-in" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-surface-2 p-5 shadow-2xl border border-line animate-in zoom-in-95 space-y-4">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <Dialog.Title className="font-serif text-heading font-bold text-ink">
              {editingFolder ? "Rename Folder" : "Create Folder"}
            </Dialog.Title>
            <Dialog.Close className="p-1 rounded-md text-faint hover:text-ink hover:bg-subtle-2 cursor-pointer">
              <X className="w-4 h-4" />
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5 text-label">
            {/* Folder Emoji Picker */}
            <div className="space-y-1">
              <label className="font-mono text-meta uppercase tracking-wider text-faint font-semibold">
                Select Icon
              </label>
              <div className="grid grid-cols-6 gap-1.5 p-2 bg-subtle rounded-xl border border-line">
                {FOLDER_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setIcon(emoji)}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-heading hover:bg-surface-2 cursor-pointer transition-colors ${
                      icon === emoji ? "bg-surface-2 border border-accent shadow-xs" : ""
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Folder Name */}
            <div className="space-y-1">
              <label className="font-mono text-meta uppercase tracking-wider text-faint font-semibold">
                Folder Name *
              </label>
              <input
                type="text"
                required
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Distributed Systems, LeetCode..."
                className="w-full px-3 py-2 rounded-lg border border-line focus:border-accent focus:outline-none text-label text-ink"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-line">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 rounded-lg text-faint hover:bg-subtle-2 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!name.trim() || isSubmitting}
                className="px-4 py-1.5 rounded-lg bg-accent hover:bg-accent-hover disabled:opacity-50 text-accent-fg font-semibold shadow-xs transition-colors cursor-pointer"
              >
                {editingFolder ? "Save" : "Create"}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
