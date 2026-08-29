"use client";

import React from "react";
import { ModuleId } from "@/lib/store";
import { Compass } from "lucide-react";

interface GenericModuleProps {
  moduleId: ModuleId;
}

const PLANNED: Record<string, string> = {
  career: "Engineering Career & Market",
  skills: "Skill Graph & Mastery Radar",
  interview: "Interview Mode Arena",
  ideas: "Personal Ideas & Sandbox",
  analytics: "Life & Engineering Analytics",
  calendar: "Calendar",
  resources: "Resources",
};

/**
 * Reached only by a module that has a route but no screen yet. Says so
 * plainly — the previous version rendered invented records, which made a
 * half-built module look like a broken one.
 */
export function GenericModuleView({ moduleId }: GenericModuleProps) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
      <Compass className="w-8 h-8 text-line-2" />
      <h1 className="font-serif text-title text-ink">
        {PLANNED[moduleId] || "Module"}
      </h1>
      <p className="text-label text-faint max-w-xs">
        Not built yet. It has a place in the system, but no screen behind it.
      </p>
    </div>
  );
}
