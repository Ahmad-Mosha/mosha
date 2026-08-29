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
import { ProblemSolvingView } from "@/components/modules/problem-solving-view";
import { GymFitnessView } from "@/components/modules/gym-fitness-view";
import { FinanceView } from "@/components/modules/finance-view";
import { LearningCsView } from "@/components/modules/learning-cs-view";
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
      case "problems":
        return <ProblemSolvingView />;
      case "gym":
        return <GymFitnessView />;
      case "finance":
        return <FinanceView />;
      case "learning":
        return <LearningCsView />;
      case "journal":
        return <EngineeringJournalView />;
      default:
        return <GenericModuleView moduleId={activeModule} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F9F9] flex flex-row antialiased text-[#1A202C]">
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

        {/* Main Content View (Edge-to-Edge full width for Notes workspace) */}
        <main
          className={`flex-1 w-full animate-in fade-in duration-150 ${
            activeModule === "notes"
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
