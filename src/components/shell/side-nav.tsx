"use client";

import React from "react";
import { useMoshaStore, ModuleId } from "@/lib/store";
import {
  CheckSquare,
  Target,
  Code2,
  BookOpen,
  Briefcase,
  Layers,
  Dumbbell,
  Wallet,
  BookMarked,
  GitBranch,
  Mic,
  Lightbulb,
  BarChart3,
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

const NAV_ITEMS: NavItem[] = [
  { id: "tasks", label: "Tasks & Focus", icon: CheckSquare, badge: "Home" },
  { id: "goals", label: "Major Life Goals", icon: Target, badge: "Pillars" },
  { id: "problems", label: "Problem Solving", icon: Code2, badge: "100%" },
  { id: "learning", label: "Learning & CS", icon: BookOpen },
  { id: "career", label: "Engineering Career", icon: Briefcase },
  { id: "projects", label: "Projects & Tech", icon: Layers },
  { id: "gym", label: "Gym & Fitness", icon: Dumbbell },
  { id: "finance", label: "Sovereign Finance", icon: Wallet },
  { id: "journal", label: "Engineering Journal", icon: BookMarked },
  { id: "skills", label: "Skill Graph", icon: GitBranch },
  { id: "interview", label: "Interview Mode", icon: Mic },
  { id: "ideas", label: "Personal Ideas", icon: Lightbulb },
  { id: "analytics", label: "Analytics & Pulse", icon: BarChart3 },
];

export function SideNav() {
  const { sidebarVariant, toggleSidebar, activeModule, setActiveModule } =
    useMoshaStore();

  const isMini = sidebarVariant === "mini";

  return (
    <aside
      className={`fixed left-0 top-0 z-50 h-screen bg-[#FDFDFD] border-r border-[#E2E8F0] flex flex-col justify-between transition-all duration-300 ease-in-out ${
        isMini ? "w-16" : "w-64"
      }`}
    >
      {/* Top Brand Header */}
      <div className="flex items-center justify-between px-3.5 py-4 border-b border-[#ECEAE4]/60">
        <div
          onClick={() => setActiveModule("tasks")}
          className="flex items-center space-x-3 cursor-pointer overflow-hidden select-none"
        >
          <div className="w-8 h-8 rounded-lg bg-[#333E50] text-white flex items-center justify-center font-serif font-bold text-base shadow-sm shrink-0">
            M
          </div>
          {!isMini && (
            <div className="leading-tight transition-opacity duration-200">
              <span className="font-serif font-bold text-base tracking-tight text-[#1A202C]">
                MOSHA
              </span>
              <span className="block text-[10px] font-mono uppercase tracking-wider text-[#718096]">
                Precision Workspace
              </span>
            </div>
          )}
        </div>

        {/* Toggle Mini / Full Button */}
        <button
          onClick={toggleSidebar}
          title={isMini ? "Expand Sidebar" : "Collapse to Mini"}
          className="p-1 rounded-md text-[#718096] hover:text-[#1A202C] hover:bg-[#F3F4F6] transition-colors cursor-pointer"
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
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all group relative cursor-pointer ${
                isActive
                  ? "bg-[#333E50] text-white shadow-xs font-semibold"
                  : "text-[#4A5568] hover:bg-[#F4F5F7] hover:text-[#1A202C]"
              } ${isMini ? "justify-center px-0" : ""}`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 transition-transform ${
                  isActive ? "text-white" : "text-[#718096] group-hover:text-[#1A202C]"
                }`}
              />

              {!isMini && (
                <span className="truncate flex-1 text-left tracking-tight">
                  {item.label}
                </span>
              )}

              {!isMini && item.badge && (
                <span
                  className={`text-[9px] font-mono px-1.5 py-0.5 rounded uppercase tracking-wider ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-[#EDF2F7] text-[#4A5568]"
                  }`}
                >
                  {item.badge}
                </span>
              )}

              {/* Active Indicator Bar */}
              {isActive && isMini && (
                <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-[#333E50] rounded-r-full" />
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
                    className="z-50 px-2.5 py-1 text-xs font-medium bg-[#1A202C] text-white rounded-md shadow-lg"
                  >
                    {item.label}
                    <Tooltip.Arrow className="fill-[#1A202C]" />
                  </Tooltip.Content>
                </Tooltip.Portal>
              </Tooltip.Root>
            );
          }

          return buttonContent;
        })}
      </div>

      {/* User / Profile Status Footer */}
      <div className="p-2.5 border-t border-[#ECEAE4]/60 bg-[#FAFAFA]">
        <div
          className={`flex items-center gap-3 p-2 rounded-lg bg-white border border-[#E2E8F0] shadow-2xs ${
            isMini ? "justify-center" : ""
          }`}
        >
          <div className="relative shrink-0">
            <div className="w-7 h-7 rounded-full bg-[#333E50] text-white flex items-center justify-center text-xs font-bold font-mono">
              AG
            </div>
            <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white" />
          </div>
          {!isMini && (
            <div className="overflow-hidden leading-tight flex-1">
              <span className="block text-xs font-semibold text-[#1A202C] truncate">
                Ahmed (Mosha)
              </span>
              <span className="block text-[10px] font-mono text-[#718096] truncate">
                Precision Focus
              </span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
