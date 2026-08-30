"use client";

import React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { AlertTriangle } from "lucide-react";

/**
 * A confirm step for destructive actions.
 *
 * Deliberately a real dialog rather than a two-click button: a delete that
 * lives one stray click away from the thing it destroys is how you lose work
 * you meant to keep.
 */
export function ConfirmDialog({
  open, title, body, confirmLabel = "Delete", onConfirm, onCancel,
}: {
  open: boolean;
  title: string;
  body?: string;
  confirmLabel?: string;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}) {
  const [busy, setBusy] = React.useState(false);

  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onCancel()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-xs animate-in fade-in" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-[60] w-full max-w-sm -translate-x-1/2 -translate-y-1/2 space-y-3 rounded-2xl border border-line bg-surface-2 p-5 shadow-2xl animate-in zoom-in-95">
          <div className="flex items-start gap-3">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-danger-tint text-danger">
              <AlertTriangle className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <Dialog.Title className="font-serif text-heading text-ink">{title}</Dialog.Title>
              {body && <p className="mt-1 text-label text-faint">{body}</p>}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Dialog.Close className="rounded-lg border border-line px-4 py-2 text-label text-muted transition-colors hover:bg-subtle hover:text-ink cursor-pointer">
              Cancel
            </Dialog.Close>
            <button
              autoFocus
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try { await onConfirm(); } finally { setBusy(false); }
              }}
              className="rounded-lg bg-danger px-4 py-2 text-label font-semibold text-accent-fg transition-opacity hover:opacity-90 disabled:opacity-50 cursor-pointer"
            >
              {busy ? "Deleting…" : confirmLabel}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
