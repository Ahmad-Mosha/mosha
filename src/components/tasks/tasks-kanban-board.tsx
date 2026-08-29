"use client";

import React, { useMemo, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  DndContext, DragOverlay, PointerSensor, KeyboardSensor,
  closestCorners, useSensor, useSensors,
  type DragEndEvent, type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext, useSortable, arrayMove,
  verticalListSortingStrategy, sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useDroppable } from "@dnd-kit/core";
import { GripVertical, Plus, RotateCcw } from "lucide-react";
import confetti from "canvas-confetti";
import { effectiveStatus, isRecurring, RECURRENCE_LABEL, recurrenceOf } from "../../../convex/recurrence";

interface KanbanProps {
  tasks: any[];
  onEdit: (task: any) => void;
  onAddTaskInStatus: (status: string) => void;
}

const COLUMNS = [
  { id: "todo", title: "To Do", accent: "bg-subtle-2 text-muted" },
  { id: "in_progress", title: "In Progress", accent: "bg-info-tint text-info" },
  { id: "done", title: "Done", accent: "bg-success-tint text-success" },
];

function PriorityDot({ priority }: { priority: string }) {
  const tone =
    priority === "p1_urgent" ? "bg-danger"
    : priority === "p3_low" ? "bg-line-2"
    : "bg-warn";
  return <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${tone}`} />;
}

function Card({ task, onEdit }: { task: any; onEdit: (t: any) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task._id });

  const done = effectiveStatus(task) === "done";

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      onClick={() => onEdit(task)}
      className={`group/card cursor-pointer rounded-lg border border-line bg-surface-2 p-2.5
                  transition-colors hover:border-accent/40 ${
                    isDragging ? "opacity-40" : ""
                  }`}
    >
      <div className="flex items-start gap-1.5">
        <button
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
          aria-label={`Reorder ${task.title}`}
          className="mt-0.5 cursor-grab touch-none text-ghost opacity-0 transition-opacity
                     group-hover/card:opacity-100 active:cursor-grabbing"
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>

        <div className="min-w-0 flex-1 space-y-1.5">
          <h5
            className={`line-clamp-2 text-label font-medium leading-snug ${
              done ? "text-ghost line-through" : "text-ink"
            }`}
          >
            {task.title}
          </h5>

          <div className="flex flex-wrap items-center gap-1.5 font-mono text-meta text-faint">
            <PriorityDot priority={task.priority} />
            {isRecurring(task) && (
              <span className="flex items-center gap-0.5 text-info">
                <RotateCcw className="h-2.5 w-2.5" />
                {RECURRENCE_LABEL[recurrenceOf(task)]}
                {(task.streakCount || 0) > 0 && (
                  <span className="ml-0.5 text-warn">{task.streakCount}</span>
                )}
              </span>
            )}
            {task.dueDate && <span>{task.dueDate.slice(5)}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

function Column({
  column, tasks, onEdit, onAdd,
}: {
  column: (typeof COLUMNS)[number];
  tasks: any[];
  onEdit: (t: any) => void;
  onAdd: (status: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `column:${column.id}` });

  return (
    <div
      ref={setNodeRef}
      className={`flex min-h-[420px] flex-col rounded-xl border bg-surface p-3 transition-colors ${
        isOver ? "border-accent bg-accent-soft/40" : "border-line"
      }`}
    >
      <div className="mb-3 flex items-center justify-between border-b border-line pb-2">
        <span className="text-label font-semibold text-ink">{column.title}</span>
        <span className={`rounded-full px-2 py-0.5 font-mono text-meta font-semibold ${column.accent}`}>
          {tasks.length}
        </span>
      </div>

      <SortableContext items={tasks.map((t) => t._id)} strategy={verticalListSortingStrategy}>
        <div className="flex-1 space-y-2">
          {tasks.length === 0 ? (
            <p className="py-10 text-center font-mono text-label text-ghost">Drop tasks here</p>
          ) : (
            tasks.map((t) => <Card key={t._id} task={t} onEdit={onEdit} />)
          )}
        </div>
      </SortableContext>

      <button
        type="button"
        onClick={() => onAdd(column.id)}
        className="mt-3 flex w-full items-center justify-center gap-1 rounded-lg border border-dashed
                   border-line-2 py-2 text-label text-faint transition-colors hover:border-accent
                   hover:text-ink cursor-pointer"
      >
        <Plus className="h-3.5 w-3.5" />
        Add to {column.title}
      </button>
    </div>
  );
}

export function TasksKanbanBoard({ tasks, onEdit, onAddTaskInStatus }: KanbanProps) {
  const move = useMutation(api.tasks.move);
  const [activeId, setActiveId] = useState<string | null>(null);
  /** Local copy so cards follow the cursor before the server round trip. */
  const [override, setOverride] = useState<Record<string, string>>({});

  const sensors = useSensors(
    // A few pixels of travel first, or every click on a card starts a drag.
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const byColumn = useMemo(() => {
    const sorted = [...tasks].sort((a, b) => (a.order ?? 1e9) - (b.order ?? 1e9));
    return Object.fromEntries(
      COLUMNS.map((c) => [
        c.id,
        sorted.filter((t) => (override[t._id] ?? effectiveStatus(t)) === c.id),
      ])
    ) as Record<string, any[]>;
  }, [tasks, override]);

  const columnOf = (id: string) =>
    COLUMNS.find((c) => byColumn[c.id].some((t) => t._id === id))?.id;

  const handleDragEnd = async ({ active, over }: DragEndEvent) => {
    setActiveId(null);
    if (!over) return;

    const from = columnOf(String(active.id));
    const overId = String(over.id);
    const to = overId.startsWith("column:")
      ? overId.slice("column:".length)
      : columnOf(overId);

    if (!from || !to) return;

    const target = [...byColumn[to]];
    const activeTask = tasks.find((t) => t._id === active.id);

    let ordered: string[];
    if (from === to) {
      const oldIndex = target.findIndex((t) => t._id === active.id);
      const newIndex = target.findIndex((t) => t._id === overId);
      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;
      ordered = arrayMove(target, oldIndex, newIndex).map((t) => t._id);
    } else {
      const at = overId.startsWith("column:")
        ? target.length
        : Math.max(0, target.findIndex((t) => t._id === overId));
      const next = [...target];
      next.splice(at, 0, activeTask);
      ordered = next.map((t) => t._id);
    }

    // Paint the move immediately; Convex confirms a moment later.
    setOverride((o) => ({ ...o, [String(active.id)]: to }));

    if (to === "done" && from !== "done") {
      confetti({ particleCount: 45, spread: 55, origin: { y: 0.7 } });
    }

    try {
      await move({ id: active.id as any, status: to, orderedIds: ordered as any });
    } finally {
      setOverride((o) => {
        const { [String(active.id)]: _dropped, ...rest } = o;
        return rest;
      });
    }
  };

  const activeTask = tasks.find((t) => t._id === activeId);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={({ active }: DragStartEvent) => setActiveId(String(active.id))}
      onDragCancel={() => setActiveId(null)}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-3">
        {COLUMNS.map((c) => (
          <Column
            key={c.id}
            column={c}
            tasks={byColumn[c.id]}
            onEdit={onEdit}
            onAdd={onAddTaskInStatus}
          />
        ))}
      </div>

      {/* Follows the cursor at full opacity while the original dims in place. */}
      <DragOverlay dropAnimation={{ duration: 180, easing: "cubic-bezier(0.22,1,0.36,1)" }}>
        {activeTask && (
          <div className="rotate-1 rounded-lg border border-accent bg-surface-2 p-2.5 shadow-lg">
            <h5 className="line-clamp-2 text-label font-medium text-ink">{activeTask.title}</h5>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
