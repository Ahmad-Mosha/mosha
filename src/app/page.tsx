"use client";

import React from "react";
import { useMoshaStore } from "@/lib/store";
import { SideNav } from "@/components/shell/side-nav";
import { TopHeader } from "@/components/shell/top-header";
import { CommandMenu } from "@/components/shell/command-menu";
import { TasksScreen } from "@/components/tasks/tasks-screen";
import { TaskCreateDialog } from "@/components/tasks/task-create-dialog";
import { MajorGoalsBento } from "@/components/goals/major-goals-bento";
import { GoalDialog } from "@/components/goals/goal-dialog";
import { NotesScreen } from "@/components/notes/notes-screen";
import { CalendarScreen } from "@/components/calendar/calendar-screen";
import { ProjectsScreen } from "@/components/projects/projects-screen";
import { ProblemsScreen } from "@/components/problems/problems-screen";
import { GymScreen } from "@/components/gym/gym-screen";
import { FinanceView } from "@/components/modules/finance-view";
import { LearningScreen } from "@/components/learning/learning-screen";
import { EngineeringJournalView } from "@/components/modules/engineering-journal-view";
import { GenericModuleView } from "@/components/modules/generic-module-view";

export default function Home() {
  const {
    sidebarVariant,
    activeModule,
    isTaskDialogOpen,
    setTaskDialogOpen,
  } = useMoshaStore();

  const isMini = sidebarVariant === "mini";

  const renderModuleContent = () => {
    switch (activeModule) {
      case "tasks":
      case "today":
        return <TasksScreen />;
      case "goals":
        return <MajorGoalsBento />;
      case "notes":
        return <NotesScreen />;
      case "calendar":
        return <CalendarScreen />;
      case "projects":
        return <ProjectsScreen />;
      case "problems":
        return <ProblemsScreen />;
      case "gym":
        return <GymScreen />;
      case "finance":
        return <FinanceView />;
      case "learning":
        return <LearningScreen />;
      case "journal":
        return <EngineeringJournalView />;
      default:
        return <GenericModuleView moduleId={activeModule} />;
    }
  };

  // Only screens that manage their own full height. Projects is a normal
  // scrolling page and needs the padded container like every other module.
  const isEdgeToEdge = activeModule === "notes" || activeModule === "calendar";

  return (
    <div className="min-h-screen bg-canvas flex flex-row antialiased text-ink">
      {/* Collapsible Sidebar with Mini Variant */}
      <SideNav />

      {/* Main Workspace Area */}
      <div
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out ${
          isMini ? "md:ml-16" : "md:ml-64"
        }`}
      >
        {/* Top Header Bar */}
        <TopHeader />

        {/* Screen change is a CSS animation, not a JS one.
            framer's AnimatePresence in wait-mode stranded mid-flight whenever
            the incoming screen did heavy synchronous mount work — a Tiptap
            editor, a 42-cell drag-enabled grid — leaving the whole module
            frozen at half opacity. A CSS keyframe cannot stall on a blocked
            frame, and re-keying it per module replays it on every switch. */}
        <main
          key={activeModule}
          className={`flex-1 w-full animate-in fade-in slide-in-from-bottom-1 duration-200 ${
            isEdgeToEdge
              ? "h-[calc(100vh-53px)] overflow-hidden"
              : "px-6 py-6 max-w-7xl mx-auto"
          }`}
        >
          {renderModuleContent()}
        </main>
      </div>

      {/* Global Modals */}
      <GoalDialog />
      <TaskCreateDialog
        isOpen={isTaskDialogOpen}
        onClose={() => setTaskDialogOpen(false)}
      />
      <CommandMenu />
    </div>
  );
}
