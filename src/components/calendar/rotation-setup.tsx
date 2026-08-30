"use client";

import React, { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { toast } from "sonner";
import { Repeat, X } from "lucide-react";
import { fromDayString, today } from "../../../convex/recurrence";
import { generateCyclePeriods, type CycleRule } from "@/lib/service";

const WEEKDAY = new Intl.DateTimeFormat(undefined, { weekday: "long" });

interface Props {
  dischargeDate?: string;
  existing?: Partial<CycleRule>;
  onClose: () => void;
}

/**
 * A fixed rotation is a rule, not a list. Enter the changeover date and the
 * two phase lengths and every home stretch through discharge is generated at
 * once, instead of marking eight ranges by hand.
 */
export function RotationSetup({ dischargeDate, existing, onClose }: Props) {
  const replaceCycle = useMutation(api.service.replaceCycle);
  const clearCycle = useMutation(api.service.clearCycle);

  const [anchor, setAnchor] = useState(existing?.anchor ?? today());
  const [anchorPhase, setAnchorPhase] = useState<"base" | "home">(
    (existing?.anchorPhase as "base" | "home") ?? "base"
  );
  const [baseDays, setBaseDays] = useState(existing?.baseDays ?? 7);
  const [homeDays, setHomeDays] = useState(existing?.homeDays ?? 7);
  const [saving, setSaving] = useState(false);

  const rule: CycleRule = { anchor, anchorPhase, baseDays, homeDays };

  // Preview against the real range so the count shown is the count stored.
  const rangeEnd = dischargeDate ?? "";
  const preview = rangeEnd ? generateCyclePeriods(rule, anchor, rangeEnd) : [];

  const apply = async () => {
    if (!rangeEnd) {
      toast.error("Set a discharge date first");
      return;
    }
    setSaving(true);
    try {
      const n = await replaceCycle({
        rule: { ...rule, anchorPhase },
        periods: preview,
      });
      toast.success(`Generated ${n} home ${n === 1 ? "period" : "periods"}`);
      onClose();
    } catch {
      toast.error("Could not generate the rotation");
    } finally {
      setSaving(false);
    }
  };

  const num = (v: number, set: (n: number) => void, label: string) => (
    <label className="space-y-1">
      <span className="block font-mono text-meta uppercase text-faint">{label}</span>
      <input
        type="number"
        min={1}
        max={90}
        value={v}
        onChange={(e) => set(Math.max(1, Number(e.target.value) || 1))}
        className="w-16 rounded-lg border border-line bg-surface-2 px-2 py-1 text-label
                   text-ink outline-none focus:border-accent"
      />
    </label>
  );

  return (
    <div className="space-y-3 rounded-xl border border-line bg-surface px-4 py-3">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-label font-semibold text-ink">
          <Repeat className="h-3.5 w-3.5 text-accent" /> Fixed rotation
        </span>
        <button
          onClick={onClose}
          className="grid h-7 w-7 place-items-center rounded-lg text-ghost hover:bg-subtle hover:text-ink cursor-pointer"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <label className="space-y-1">
          <span className="block font-mono text-meta uppercase text-faint">Changeover date</span>
          <input
            type="date"
            value={anchor}
            onChange={(e) => setAnchor(e.target.value)}
            className="rounded-lg border border-line bg-surface-2 px-2 py-1 text-label text-ink outline-none focus:border-accent"
          />
        </label>

        <label className="space-y-1">
          <span className="block font-mono text-meta uppercase text-faint">On that day I</span>
          <div className="flex overflow-hidden rounded-lg border border-line">
            {(["base", "home"] as const).map((phase) => (
              <button
                key={phase}
                onClick={() => setAnchorPhase(phase)}
                className={`px-2.5 py-1 text-label transition-colors cursor-pointer ${
                  anchorPhase === phase
                    ? "bg-accent font-semibold text-accent-fg"
                    : "bg-surface-2 text-muted hover:text-ink"
                }`}
              >
                {phase === "base" ? "return to base" : "go home"}
              </button>
            ))}
          </div>
        </label>

        {num(baseDays, setBaseDays, "Days at base")}
        {num(homeDays, setHomeDays, "Days home")}

        <button
          onClick={apply}
          disabled={saving || !rangeEnd}
          className="rounded-lg bg-accent px-3 py-1.5 text-label font-semibold text-accent-fg
                     transition-colors hover:bg-accent-hover disabled:opacity-40 cursor-pointer"
        >
          {saving ? "Generating…" : "Generate"}
        </button>

        {existing?.anchor && (
          <button
            onClick={async () => {
              const n = await clearCycle({});
              toast.success(`Removed ${n} generated ${n === 1 ? "period" : "periods"}`);
              onClose();
            }}
            className="rounded-lg border border-line px-3 py-1.5 text-label text-muted
                       transition-colors hover:bg-danger-tint hover:text-danger cursor-pointer"
          >
            Clear
          </button>
        )}
      </div>

      <p className="font-mono text-meta text-ghost">
        {rangeEnd ? (
          <>
            {preview.length} home {preview.length === 1 ? "period" : "periods"} until discharge
            {preview[0] && (
              <> · next starts {preview[0].startDate} ({WEEKDAY.format(fromDayString(preview[0].startDate))})</>
            )}
          </>
        ) : (
          "Set a discharge date first — the rotation runs up to it."
        )}
      </p>
    </div>
  );
}
