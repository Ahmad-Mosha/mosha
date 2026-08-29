"use client";

import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  /** `sm` matches the dense inline toolbars; `md` is the default control size. */
  size?: "sm" | "md";
  mono?: boolean;
  className?: string;
  ariaLabel?: string;
}

/**
 * Replaces the native <select>, which renders as an OS widget and ignores the
 * design system entirely. Same call shape as before — value / onValueChange —
 * so swapping one in is a one-line change.
 */
export function Select({
  value,
  onValueChange,
  options,
  placeholder = "Select...",
  size = "md",
  mono = false,
  className,
  ariaLabel,
}: SelectProps) {
  return (
    <SelectPrimitive.Root value={value} onValueChange={onValueChange}>
      <SelectPrimitive.Trigger
        aria-label={ariaLabel}
        className={cn(
          "group inline-flex items-center justify-between gap-1.5 rounded-lg border border-line bg-surface-2",
          "text-ink-2 transition-colors cursor-pointer outline-none",
          "hover:border-line-2 hover:bg-subtle",
          "data-[state=open]:border-accent data-[state=open]:bg-surface-2",
          "data-[placeholder]:text-ghost",
          size === "sm" ? "px-2 py-1 text-meta" : "px-2.5 py-1.5 text-label",
          mono && "font-mono",
          className
        )}
      >
        <SelectPrimitive.Value placeholder={placeholder} />
        <SelectPrimitive.Icon asChild>
          <ChevronDown
            className={cn(
              "shrink-0 text-ghost transition-transform duration-200 group-data-[state=open]:rotate-180",
              size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5"
            )}
          />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>

      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          sideOffset={5}
          className={cn(
            "z-[100] min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-xl",
            "border border-line bg-surface-2 p-1 shadow-lg shadow-black/[0.06]",
            "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
            "data-[side=bottom]:slide-in-from-top-1 data-[side=top]:slide-in-from-bottom-1"
          )}
        >
          <SelectPrimitive.Viewport className="max-h-64">
            {options.map((opt) => (
              <SelectPrimitive.Item
                key={opt.value}
                value={opt.value}
                className={cn(
                  "relative flex items-center gap-2 rounded-lg py-1.5 pl-2.5 pr-7 select-none outline-none cursor-pointer",
                  "text-label text-ink-2 transition-colors",
                  "data-[highlighted]:bg-subtle data-[highlighted]:text-ink",
                  "data-[state=checked]:font-semibold data-[state=checked]:text-ink",
                  mono && "font-mono text-meta"
                )}
              >
                <SelectPrimitive.ItemText>{opt.label}</SelectPrimitive.ItemText>
                <SelectPrimitive.ItemIndicator className="absolute right-2 flex items-center">
                  <Check className="w-3.5 h-3.5 text-accent" />
                </SelectPrimitive.ItemIndicator>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}

/**
 * Radix rejects "" as an item value, so an explicit "nothing selected" row
 * needs a sentinel. Call sites map it back to "" / undefined on change.
 */
export const NONE = "__none";
