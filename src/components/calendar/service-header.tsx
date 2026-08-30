"use client";

import React, { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Home, Flag, Pencil, Check, X } from "lucide-react";
import { fromDayString } from "../../../convex/recurrence";
import type { Countdown } from "@/lib/service";

const SHORT = new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short" });

interface Props {
  countdown: Countdown;
  dischargeDate?: string;
  serviceStartDate?: string;
}

/**
 * The number that matters, kept at the top of the screen. Everything else on
 * this page is scheduling; this is the one thing worth seeing every time.
 */
export function ServiceHeader({ countdown, dischargeDate, serviceStartDate }: Props) {
  const setConfig = useMutation(api.service.setConfig);
  const [editing, setEditing] = useState(false);
  const [discharge, setDischarge] = useState(dischargeDate ?? "");
  const [start, setStart] = useState(serviceStartDate ?? "");

  const save = async () => {
    await setConfig({
      dischargeDate: discharge || undefined,
      serviceStartDate: start || undefined,
    });
    setEditing(false);
  };

  if (!dischargeDate && !editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="flex w-full items-center gap-2 rounded-xl border border-dashed border-line-2
                   px-4 py-3 text-left transition-colors hover:border-accent hover:bg-surface cursor-pointer"
      >
        <Flag className="h-4 w-4 text-faint" />
        <span className="text-label text-muted">
          Set your discharge date to start the countdown
        </span>
      </button>
    );
  }

  if (editing) {
    return (
      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-line bg-surface px-4 py-3">
        <label className="space-y-1">
          <span className="block font-mono text-meta uppercase text-faint">Service started</span>
          <input
            type="date"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className="rounded-lg border border-line bg-surface-2 px-2 py-1 text-label text-ink outline-none focus:border-accent"
          />
        </label>
        <label className="space-y-1">
          <span className="block font-mono text-meta uppercase text-faint">Discharge</span>
          <input
            type="date"
            value={discharge}
            onChange={(e) => setDischarge(e.target.value)}
            className="rounded-lg border border-line bg-surface-2 px-2 py-1 text-label text-ink outline-none focus:border-accent"
          />
        </label>
        <button
          onClick={save}
          className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-label
                     font-semibold text-accent-fg hover:bg-accent-hover cursor-pointer"
        >
          <Check className="h-3.5 w-3.5" /> Save
        </button>
        <button
          onClick={() => setEditing(false)}
          className="grid h-8 w-8 place-items-center rounded-lg border border-line text-faint
                     hover:bg-subtle hover:text-ink cursor-pointer"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  const { daysLeft, percentServed, currentLeave, daysLeftOfLeave, nextLeave, daysUntilNextLeave } =
    countdown;
  const done = daysLeft !== null && daysLeft <= 0;

  return (
    <div className="group/hdr relative overflow-hidden rounded-xl border border-line bg-surface px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-baseline gap-2.5">
          {done ? (
            <span className="font-serif text-title text-success">Served. You're out.</span>
          ) : (
            <>
              <span className="font-serif text-display leading-none text-ink">{daysLeft}</span>
              <span className="text-label text-muted">
                {daysLeft === 1 ? "day" : "days"} until discharge
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-4">
          {currentLeave ? (
            <span className="flex items-center gap-1.5 rounded-lg bg-success-tint px-2.5 py-1 text-label font-medium text-success">
              <Home className="h-3.5 w-3.5" />
              Home — {daysLeftOfLeave} {daysLeftOfLeave === 1 ? "day" : "days"} left
            </span>
          ) : nextLeave ? (
            <span className="flex items-center gap-1.5 text-label text-muted">
              <Home className="h-3.5 w-3.5 text-success" />
              Home in <strong className="text-ink">{daysUntilNextLeave}</strong> days
              <span className="font-mono text-meta text-ghost">
                {SHORT.format(fromDayString(nextLeave.startDate))}
              </span>
            </span>
          ) : (
            <span className="text-label text-ghost">No leave scheduled</span>
          )}

          <button
            onClick={() => setEditing(true)}
            title="Edit service dates"
            className="grid h-7 w-7 place-items-center rounded-lg text-ghost opacity-0
                       transition-opacity hover:bg-subtle hover:text-ink
                       group-hover/hdr:opacity-100 cursor-pointer"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {percentServed !== null && (
        <div className="mt-2.5 space-y-1">
          <div className="h-1.5 overflow-hidden rounded-full bg-subtle-2">
            <div
              className="h-full rounded-full bg-accent transition-[width] duration-500 ease-out"
              style={{ width: `${percentServed}%` }}
            />
          </div>
          <div className="flex justify-between font-mono text-meta text-ghost">
            <span>{countdown.daysServed} served</span>
            <span>{percentServed.toFixed(1)}%</span>
          </div>
        </div>
      )}
    </div>
  );
}
