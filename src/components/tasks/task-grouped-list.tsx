"use client";

import React, { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  DndContext, DragOverlay, PointerSensor, KeyboardSensor,
  closestCenter, useSensor, useSensors, type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, arrayMove, verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { AnimatePresence, motion } from "framer-motion";
import { listContainer, listItem } from "@/lib/motion";
import { TaskItemRow } from "./task-item-row";

export interface TaskGroup {
  id: string;
  label: string;
  /** Overdue reads as a warning; the rest are neutral headers. */
  tone?: "danger" | "default";
  tasks: any[];
}

interface Props {
  groups: TaskGroup[];
  onEdit: (task: any) => void;
  getGoalTitle: (goalId?: string) => string | undefined;
}

/**
 * Tasks grouped by when they are due, each group independently sortable by
 * drag. Reordering only ever rewrites the group it happened in, so dragging
 * inside Today cannot disturb the order of Later.
 */
export function TaskGroupedList({ groups, onEdit, getGoalTitle }: Props) {
  const reorder = useMutation(api.tasks.reorder);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = async ({ active, over }: DragEndEvent) => {
    setActiveId(null);
    if (!over || active.id === over.id) return;

    const group = groups.find((g) => g.tasks.some((t) => t._id === active.id));
    if (!group) return;

    const oldIndex = group.tasks.findIndex((t) => t._id === active.id);
    const newIndex = group.tasks.findIndex((t) => t._id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const ordered = arrayMove(group.tasks, oldIndex, newIndex).map((t) => t._id);
    await reorder({ orderedIds: ordered as any });
  };

  const activeTask = groups
    .flatMap((g) => g.tasks)
    .find((t) => t._id === activeId);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={({ active }) => setActiveId(String(active.id))}
      onDragCancel={() => setActiveId(null)}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-6">
        {groups.map((group) => (
          <section key={group.id} className="space-y-2.5">
            <header className="flex items-center gap-2">
              <h3
                className={`font-mono text-meta font-semibold uppercase ${
                  group.tone === "danger" ? "text-danger" : "text-faint"
                }`}
              >
                {group.label}
              </h3>
              <span className="font-mono text-meta text-ghost">{group.tasks.length}</span>
              <div className="h-px flex-1 bg-line" />
            </header>

            <SortableContext
              items={group.tasks.map((t) => t._id)}
              strategy={verticalListSortingStrategy}
            >
              <motion.div
                className="space-y-2.5"
                variants={listContainer}
                initial="initial"
                animate="animate"
              >
                <AnimatePresence initial={false}>
                  {group.tasks.map((task) => (
                    <motion.div key={task._id} layout variants={listItem} exit="exit">
                      <TaskItemRow
                        task={task}
                        onEdit={onEdit}
                        goalTitle={getGoalTitle(task.goalId)}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            </SortableContext>
          </section>
        ))}
      </div>

      <DragOverlay dropAnimation={{ duration: 180, easing: "cubic-bezier(0.22,1,0.36,1)" }}>
        {activeTask && (
          <div className="rotate-1 rounded-xl border border-accent bg-surface-2 p-3.5 shadow-lg">
            <span className="text-body font-semibold text-ink">{activeTask.title}</span>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
