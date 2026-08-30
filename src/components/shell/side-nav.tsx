"use client";

import React from "react";
import { useMoshaStore, ModuleId } from "@/lib/store";
import {
  CheckSquare,
  CalendarDays,
  Target,
  FileText,
  Code2,
  BookOpen,
  Layers,
  Dumbbell,
  Wallet,
  BookMarked,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import * as Tooltip from "@radix-ui/react-tooltip";

interface NavItem {
  id: ModuleId;
  label: string;
  icon: React.ElementType;
  badge?: string;
}

/**
 * Only modules with a real screen behind them. Career, Skill Graph, Interview,
 * Ideas and Analytics are on the roadmap but rendered invented data, so they
 * are out of the nav until they are built.
 */
const NAV_ITEMS: NavItem[] = [
  { id: "tasks", label: "Tasks & Focus", icon: CheckSquare, badge: "Home" },
  { id: "calendar", label: "Calendar", icon: CalendarDays },
  { id: "goals", label: "Major Life Goals", icon: Target, badge: "Pillars" },
  { id: "notes", label: "Notes & Knowledge", icon: FileText, badge: "Docs" },
  { id: "problems", label: "Problem Solving", icon: Code2 },
  { id: "learning", label: "Learning & CS", icon: BookOpen },
  { id: "projects", label: "Projects", icon: Layers },
  { id: "gym", label: "Gym & Fitness", icon: Dumbbell },
  { id: "finance", label: "Sovereign Finance", icon: Wallet },
  { id: "journal", label: "Engineering Journal", icon: BookMarked },
];

export function SideNav() {
  const { sidebarVariant, toggleSidebar, activeModule, setActiveModule } =
    useMoshaStore();

  const isMini = sidebarVariant === "mini";

  return (
    <aside
      className={`fixed left-0 top-0 z-50 h-screen bg-surface border-r border-line flex flex-col justify-between transition-all duration-300 ease-in-out ${
        isMini ? "w-16" : "w-64"
      }`}
    >
      {/*
        Collapsed, there is only 36px of content box — not enough for the 32px
        mark and a separate toggle, which is why they used to overlap. So the
        mark becomes the toggle, revealing a chevron on hover.
      */}
      <div
        className={`flex items-center border-b border-line/60 py-4 ${
          isMini ? "justify-center px-2" : "justify-between px-3.5"
        }`}
      >
        {isMini ? (
          <button
            onClick={toggleSidebar}
            title="Expand sidebar"
            aria-label="Expand sidebar"
            className="group/mark grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-accent
                       text-accent-fg shadow-sm transition-colors hover:bg-accent-hover cursor-pointer"
          >
            <span className="font-serif text-heading font-bold group-hover/mark:hidden">M</span>
            <ChevronRight className="hidden h-4 w-4 group-hover/mark:block" />
          </button>
        ) : (
          <>
            <div
              onClick={() => setActiveModule("tasks")}
              className="flex min-w-0 cursor-pointer select-none items-center gap-3"
            >
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-accent
                               font-serif text-heading font-bold text-accent-fg shadow-sm">
                M
              </span>
              <span className="min-w-0 leading-tight">
                <span className="block truncate font-serif text-heading font-bold tracking-tight text-ink">
                  MOSHA
                </span>
                <span className="block truncate font-mono text-meta uppercase tracking-wider text-faint">
                  Precision Workspace
                </span>
              </span>
            </div>

            <button
              onClick={toggleSidebar}
              title="Collapse sidebar"
              aria-label="Collapse sidebar"
              className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-faint
                         transition-colors hover:bg-subtle-2 hover:text-ink cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          </>
        )}
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2 space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeModule === item.id;

          const buttonContent = (
            <button
              key={item.id}
              onClick={() => setActiveModule(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-label font-medium transition-all group relative cursor-pointer ${
                isActive
                  ? "bg-accent text-accent-fg shadow-xs font-semibold"
                  : "text-muted hover:bg-subtle-2 hover:text-ink"
              } ${isMini ? "justify-center px-0" : ""}`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 transition-transform ${
                  isActive ? "text-accent-fg" : "text-faint group-hover:text-ink"
                }`}
              />

              {!isMini && (
                <span className="truncate flex-1 text-left tracking-tight">
                  {item.label}
                </span>
              )}

              {!isMini && item.badge && (
                <span
                  className={`text-meta font-mono px-1.5 py-0.5 rounded uppercase tracking-wider ${
                    isActive
                      ? "bg-accent-fg/20 text-accent-fg"
                      : "bg-subtle-2 text-muted"
                  }`}
                >
                  {item.badge}
                </span>
              )}

              {/* Active Indicator Bar */}
              {isActive && isMini && (
                <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-accent rounded-r-full" />
              )}
            </button>
          );

          if (isMini) {
            return (
              <Tooltip.Root key={item.id}>
                <Tooltip.Trigger asChild>{buttonContent}</Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Content
                    side="right"
                    sideOffset={10}
                    className="z-50 px-2.5 py-1 text-label font-medium bg-ink text-accent-fg rounded-md shadow-lg"
                  >
                    {item.label}
                    <Tooltip.Arrow className="fill-ink" />
                  </Tooltip.Content>
                </Tooltip.Portal>
              </Tooltip.Root>
            );
          }

          return buttonContent;
        })}
      </div>

      {/* User / Profile Status Footer */}
      <div className="p-2.5 border-t border-line/60 bg-subtle">
        <div
          className={`flex items-center gap-3 p-2 rounded-lg bg-surface-2 border border-line shadow-2xs ${
            isMini ? "justify-center" : ""
          }`}
        >
          <div className="relative shrink-0">
            <div className="w-7 h-7 rounded-full bg-accent text-accent-fg flex items-center justify-center text-label font-bold font-mono">
              AG
            </div>
            <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-success ring-2 ring-surface-2" />
          </div>
          {!isMini && (
            <div className="overflow-hidden leading-tight flex-1">
              <span className="block text-label font-semibold text-ink truncate">
                Ahmed (Mosha)
              </span>
              <span className="block text-meta font-mono text-faint truncate">
                Precision Focus
              </span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
