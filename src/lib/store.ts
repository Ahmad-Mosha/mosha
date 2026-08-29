import { create } from "zustand";

export type SidebarVariant = "full" | "mini";

export type ModuleId =
  | "tasks"
  | "goals"
  | "today"
  | "projects"
  | "learning"
  | "problems"
  | "career"
  | "calendar"
  | "gym"
  | "finance"
  | "journal"
  | "notes"
  | "resources"
  | "ideas"
  | "skills"
  | "interview"
  | "analytics";

interface MoshaState {
  // Sidebar State
  sidebarVariant: SidebarVariant;
  toggleSidebar: () => void;
  setSidebarVariant: (variant: SidebarVariant) => void;

  // Active Module / Navigation (Defaults to Home / Tasks)
  activeModule: ModuleId;
  setActiveModule: (mod: ModuleId) => void;

  // Command Menu (⌘K)
  isCommandMenuOpen: boolean;
  setCommandMenuOpen: (open: boolean) => void;

  // Task Dialog (Create/Edit)
  isTaskDialogOpen: boolean;
  setTaskDialogOpen: (open: boolean) => void;
  editingTaskId: string | null;
  setEditingTaskId: (id: string | null) => void;

  // Goal Dialog (Create/Edit)
  isGoalDialogOpen: boolean;
  setGoalDialogOpen: (open: boolean) => void;
  editingGoalId: string | null;
  setEditingGoalId: (id: string | null) => void;

  // Quick Note / Capture Dialog
  isCaptureDialogOpen: boolean;
  setCaptureDialogOpen: (open: boolean) => void;

  // Deep Work / Focus Session
  focusRunning: boolean;
  focusSecondsLeft: number;
  focusInitialSeconds: number;
  startFocus: (minutes?: number) => void;
  pauseFocus: () => void;
  resetFocus: () => void;
  tickFocus: () => void;
}

export const useMoshaStore = create<MoshaState>((set) => ({
  sidebarVariant: "full",
  toggleSidebar: () =>
    set((state) => ({
      sidebarVariant: state.sidebarVariant === "full" ? "mini" : "full",
    })),
  setSidebarVariant: (variant) => set({ sidebarVariant: variant }),

  // Default to tasks as the primary Home screen
  activeModule: "tasks",
  setActiveModule: (mod) => set({ activeModule: mod }),

  // Command Menu
  isCommandMenuOpen: false,
  setCommandMenuOpen: (open) => set({ isCommandMenuOpen: open }),

  // Task Dialog
  isTaskDialogOpen: false,
  setTaskDialogOpen: (open) => set({ isTaskDialogOpen: open }),
  editingTaskId: null,
  setEditingTaskId: (id) => set({ editingTaskId: id }),

  // Goal Dialog
  isGoalDialogOpen: false,
  setGoalDialogOpen: (open) => set({ isGoalDialogOpen: open }),
  editingGoalId: null,
  setEditingGoalId: (id) => set({ editingGoalId: id }),

  // Capture Dialog
  isCaptureDialogOpen: false,
  setCaptureDialogOpen: (open) => set({ isCaptureDialogOpen: open }),

  // Focus Timer (Default 50 min deep work block)
  focusRunning: false,
  focusSecondsLeft: 50 * 60,
  focusInitialSeconds: 50 * 60,
  startFocus: (minutes = 50) =>
    set({
      focusRunning: true,
      focusSecondsLeft: minutes * 60,
      focusInitialSeconds: minutes * 60,
    }),
  pauseFocus: () => set({ focusRunning: false }),
  resetFocus: () =>
    set((state) => ({
      focusRunning: false,
      focusSecondsLeft: state.focusInitialSeconds,
    })),
  tickFocus: () =>
    set((state) => {
      if (!state.focusRunning || state.focusSecondsLeft <= 0) {
        return { focusRunning: false };
      }
      return { focusSecondsLeft: state.focusSecondsLeft - 1 };
    }),
}));
