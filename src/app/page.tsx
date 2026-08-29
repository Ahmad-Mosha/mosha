"use client";

import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useMoshaStore } from "@/lib/store";
import { screenTransition } from "@/lib/motion";
import { SideNav } from "@/components/shell/side-nav";
import { TopHeader } from "@/components/shell/top-header";
import { CommandMenu } from "@/components/shell/command-menu";
import { TasksScreen } from "@/components/tasks/tasks-screen";
import { TaskCreateDialog } from "@/components/tasks/task-create-dialog";
import { MajorGoalsBento } from "@/components/goals/major-goals-bento";
import { GoalDialog } from "@/components/goals/goal-dialog";
import { NotesScreen } from "@/components/notes/notes-screen";
import { ProjectsScreen } from "@/components/projects/projects-screen";
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
      case "projects":
        return <ProjectsScreen />;
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

  const isEdgeToEdge = activeModule === "notes" || activeModule === "projects";

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

        {/* Edge-to-edge workspaces (Notes, Projects) mount a full-height editor.
            Fading that whole subtree stalls the animation mid-flight and washes
            out the screen, so those swap instantly; the padded module screens
            keep the transition. */}
        {isEdgeToEdge ? (
          <main
            key={activeModule}
            className="flex-1 w-full h-[calc(100vh-53px)] overflow-hidden"
          >
            {renderModuleContent()}
          </main>
        ) : (
          <AnimatePresence mode="wait" initial={false}>
            <motion.main
              key={activeModule}
              variants={screenTransition}
              initial="initial"
              animate="animate"
              exit="exit"
              className="flex-1 w-full px-6 py-6 max-w-7xl mx-auto"
            >
              {renderModuleContent()}
            </motion.main>
          </AnimatePresence>
        )}
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
