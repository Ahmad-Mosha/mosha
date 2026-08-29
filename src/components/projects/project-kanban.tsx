"use client";

import React, { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  Plus,
  MoreVertical,
  CheckCircle2,
  Circle,
  Trash2,
  Clock,
  ArrowRight,
  AlertCircle,
  Tag,
} from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Select } from "@/components/ui/select";

interface ProjectKanbanProps {
  projectId: any;
}

const COLUMNS = [
  { id: "todo", title: "Backlog / To Do", color: "border-slate-300", badge: "bg-slate-100 text-slate-700" },
  { id: "in_progress", title: "In Progress", color: "border-amber-400", badge: "bg-amber-50 text-amber-800" },
  { id: "in_review", title: "In Review", color: "border-blue-400", badge: "bg-blue-50 text-blue-800" },
  { id: "done", title: "Completed", color: "border-emerald-400", badge: "bg-emerald-50 text-emerald-800" },
];

export function ProjectKanban({ projectId }: ProjectKanbanProps) {
  const allTasks = useQuery(api.tasks.list) || [];
  const projectTasks = allTasks.filter((t: any) => t.projectId === projectId);

  const createTask = useMutation(api.tasks.create);
  const updateTask = useMutation(api.tasks.update);
  const removeTask = useMutation(api.tasks.remove);

  const [newTaskColumn, setNewTaskColumn] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState("p2_medium");

  const handleCreateTask = async (status: string) => {
    if (!newTaskTitle.trim()) return;

    await createTask({
      title: newTaskTitle.trim(),
      status,
      priority: newTaskPriority,
      module: "projects",
      projectId,
      isDaily: false,
    });

    setNewTaskTitle("");
    setNewTaskColumn(null);
  };

  const handleStatusChange = async (taskId: any, newStatus: string) => {
    await updateTask({
      id: taskId,
      status: newStatus,
      completedAt: newStatus === "done" ? new Date().toISOString() : undefined,
    });
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "p1_urgent":
        return (
          <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 font-mono text-[9px] font-semibold uppercase">
            Urgent
          </span>
        );
      case "p2_medium":
        return (
          <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-mono text-[9px] font-semibold uppercase">
            Medium
          </span>
        );
      default:
        return (
          <span className="px-1.5 py-0.5 rounded bg-slate-50 text-slate-600 border border-slate-200 font-mono text-[9px] font-semibold uppercase">
            Low
          </span>
        );
    }
  };

  return (
    <div className="flex-1 overflow-x-auto p-4 md:p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 min-w-[800px] h-full items-start">
        {COLUMNS.map((col) => {
          const colTasks = projectTasks.filter((t: any) => {
            if (col.id === "todo") return t.status === "todo" || !t.status;
            return t.status === col.id;
          });

          return (
            <div
              key={col.id}
              className="bg-surface border border-line rounded-2xl p-3 flex flex-col max-h-[calc(100vh-250px)] shadow-2xs"
            >
              {/* Column Header */}
              <div className="flex justify-between items-center px-2 py-1.5 mb-2">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${col.id === 'done' ? 'bg-emerald-500' : col.id === 'in_progress' ? 'bg-amber-500' : col.id === 'in_review' ? 'bg-blue-500' : 'bg-slate-400'}`} />
                  <h3 className="font-semibold text-xs text-ink">
                    {col.title}
                  </h3>
                  <span className="px-1.5 py-0.2 rounded-full bg-surface-2 border border-line font-mono text-[10px] text-faint">
                    {colTasks.length}
                  </span>
                </div>

                <button
                  onClick={() => {
                    setNewTaskColumn(col.id);
                    setNewTaskTitle("");
                  }}
                  className="p-1 hover:bg-subtle-2 rounded-md text-faint hover:text-ink transition-colors cursor-pointer"
                  title="Add Task"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Tasks List */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {/* Inline Add Task Form */}
                {newTaskColumn === col.id && (
                  <div className="p-3 bg-surface-2 border border-accent rounded-xl shadow-xs space-y-2 animate-in fade-in zoom-in-95">
                    <textarea
                      autoFocus
                      rows={2}
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleCreateTask(col.id);
                        }
                      }}
                      placeholder="Task description or issue..."
                      className="w-full text-xs text-ink focus:outline-none resize-none bg-transparent placeholder:text-ghost"
                    />

                    <div className="flex items-center justify-between pt-1 border-t border-line">
                      <Select
                        value={newTaskPriority}
                        onValueChange={setNewTaskPriority}
                        size="sm"
                        mono
                        options={[
                          { value: "p1_urgent", label: "🔴 Urgent" },
                          { value: "p2_medium", label: "🟡 Medium" },
                          { value: "p3_low", label: "⚪ Low" }
                        ]}
                      />

                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => setNewTaskColumn(null)}
                          className="px-2 py-1 text-[11px] text-faint hover:text-black"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCreateTask(col.id)}
                          className="px-2.5 py-1 rounded bg-accent text-accent-fg text-[11px] font-semibold"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {colTasks.length === 0 && newTaskColumn !== col.id && (
                  <div
                    onClick={() => {
                      setNewTaskColumn(col.id);
                      setNewTaskTitle("");
                    }}
                    className="py-6 border-2 border-dashed border-line rounded-xl text-center cursor-pointer hover:border-accent transition-colors"
                  >
                    <span className="text-[11px] text-ghost font-mono">
                      + Add task
                    </span>
                  </div>
                )}

                {colTasks.map((task: any) => {
                  const isDone = task.status === "done";
                  return (
                    <div
                      key={task._id}
                      className="p-3 bg-surface-2 border border-line hover:border-line-2 rounded-xl shadow-2xs space-y-2 group transition-all"
                    >
                      {/* Title & Checkbox */}
                      <div className="flex items-start gap-2">
                        <button
                          onClick={() =>
                            handleStatusChange(task._id, isDone ? "todo" : "done")
                          }
                          className="mt-0.5 text-ghost hover:text-emerald-600 transition-colors cursor-pointer shrink-0"
                        >
                          {isDone ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Circle className="w-4 h-4" />
                          )}
                        </button>

                        <span
                          className={`text-xs font-medium leading-relaxed flex-1 ${
                            isDone
                              ? "line-through text-ghost"
                              : "text-ink"
                          }`}
                        >
                          {task.title}
                        </span>

                        {/* Options Menu */}
                        <DropdownMenu.Root>
                          <DropdownMenu.Trigger
                            asChild
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-subtle-2 rounded text-faint transition-opacity cursor-pointer">
                              <MoreVertical className="w-3.5 h-3.5" />
                            </button>
                          </DropdownMenu.Trigger>
                          <DropdownMenu.Portal>
                            <DropdownMenu.Content
                              className="z-50 bg-surface-2 border border-line rounded-xl shadow-lg p-1 text-xs min-w-[140px]"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <DropdownMenu.Label className="px-2 py-1 text-[10px] font-mono text-ghost uppercase">
                                Move to Status
                              </DropdownMenu.Label>
                              {COLUMNS.map((c) => (
                                <DropdownMenu.Item
                                  key={c.id}
                                  onClick={() =>
                                    handleStatusChange(task._id, c.id)
                                  }
                                  className={`px-3 py-1 rounded-lg cursor-pointer flex items-center justify-between ${
                                    task.status === c.id
                                      ? "bg-subtle-2 font-semibold"
                                      : "hover:bg-subtle"
                                  }`}
                                >
                                  <span>{c.title}</span>
                                  {task.status === c.id && <span>✓</span>}
                                </DropdownMenu.Item>
                              ))}
                              <DropdownMenu.Separator className="h-[1px] bg-line my-1" />
                              <DropdownMenu.Item
                                onClick={() => removeTask({ id: task._id })}
                                className="px-3 py-1.5 rounded-lg hover:bg-rose-50 text-rose-600 cursor-pointer flex items-center gap-2"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Delete Task</span>
                              </DropdownMenu.Item>
                            </DropdownMenu.Content>
                          </DropdownMenu.Portal>
                        </DropdownMenu.Root>
                      </div>

                      {/* Footer: Priority & Move Arrows */}
                      <div className="flex items-center justify-between pt-1 border-t border-line/60 text-[10px]">
                        <div>{getPriorityBadge(task.priority)}</div>

                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {col.id !== "done" && (
                            <button
                              onClick={() => {
                                const currentIndex = COLUMNS.findIndex(
                                  (c) => c.id === col.id
                                );
                                if (currentIndex < COLUMNS.length - 1) {
                                  handleStatusChange(
                                    task._id,
                                    COLUMNS[currentIndex + 1].id
                                  );
                                }
                              }}
                              className="px-1.5 py-0.5 rounded bg-subtle-2 hover:bg-line text-accent font-mono font-medium flex items-center gap-0.5 cursor-pointer"
                              title="Advance to next status"
                            >
                              <span>Next</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
