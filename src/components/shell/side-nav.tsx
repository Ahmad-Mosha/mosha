"use client";

import React from "react";
import { useMoshaStore, ModuleId } from "@/lib/store";
import {
  CheckSquare,
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
  { id: "goals", label: "Major Life Goals", icon: Target, badge: "Pillars" },
  { id: "notes", label: "Notes & Knowledge", icon: FileText, badge: "Docs" },
  { id: "problems", label: "Problem Solving", icon: Code2 },
  { id: "learning", label: "Learning & CS", icon: BookOpen },
  { id: "projects", label: "Projects & Tech", icon: Layers },
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
      {/* Top Brand Header */}
      <div className="flex items-center justify-between px-3.5 py-4 border-b border-line/60">
        <div
          onClick={() => setActiveModule("tasks")}
          className="flex items-center space-x-3 cursor-pointer overflow-hidden select-none"
        >
          <div className="w-8 h-8 rounded-lg bg-accent text-accent-fg flex items-center justify-center font-serif font-bold text-heading shadow-sm shrink-0">
            M
          </div>
          {!isMini && (
            <div className="leading-tight transition-opacity duration-200">
              <span className="font-serif font-bold text-heading tracking-tight text-ink">
                MOSHA
              </span>
              <span className="block text-meta font-mono uppercase tracking-wider text-faint">
                Precision Workspace
              </span>
            </div>
          )}
        </div>

        {/* Toggle Mini / Full Button */}
        <button
          onClick={toggleSidebar}
          title={isMini ? "Expand Sidebar" : "Collapse to Mini"}
          className="p-1 rounded-md text-faint hover:text-ink hover:bg-subtle-2 transition-colors cursor-pointer"
        >
          {isMini ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
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
