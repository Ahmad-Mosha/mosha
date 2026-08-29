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
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-5 shadow-2xl border border-[#E2E8F0] animate-in zoom-in-95 space-y-4">
          <div className="flex items-center justify-between border-b border-[#ECEAE4] pb-3">
            <Dialog.Title className="font-serif text-lg font-bold text-[#1A202C]">
              {editingFolder ? "Rename Folder" : "Create Folder"}
            </Dialog.Title>
            <Dialog.Close className="p-1 rounded-md text-[#718096] hover:text-[#1A202C] hover:bg-[#F3F4F6] cursor-pointer">
              <X className="w-4 h-4" />
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            {/* Folder Emoji Picker */}
            <div className="space-y-1">
              <label className="font-mono text-[11px] uppercase tracking-wider text-[#718096] font-semibold">
                Select Icon
              </label>
              <div className="grid grid-cols-6 gap-1.5 p-2 bg-[#F8F9FA] rounded-xl border border-[#E2E8F0]">
                {FOLDER_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setIcon(emoji)}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-base hover:bg-white cursor-pointer transition-colors ${
                      icon === emoji ? "bg-white border border-[#333E50] shadow-xs" : ""
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Folder Name */}
            <div className="space-y-1">
              <label className="font-mono text-[11px] uppercase tracking-wider text-[#718096] font-semibold">
                Folder Name *
              </label>
              <input
                type="text"
                required
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Distributed Systems, LeetCode..."
                className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] focus:border-[#333E50] focus:outline-none text-xs text-[#1A202C]"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-[#ECEAE4]">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 rounded-lg text-[#718096] hover:bg-[#F3F4F6] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!name.trim() || isSubmitting}
                className="px-4 py-1.5 rounded-lg bg-[#333E50] hover:bg-[#252E3B] disabled:opacity-50 text-white font-semibold shadow-xs transition-colors cursor-pointer"
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
