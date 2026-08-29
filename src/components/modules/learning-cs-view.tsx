"use client";

import React, { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { BookOpen, ExternalLink } from "lucide-react";

export function LearningCsView() {
  const topics = useQuery(api.learning.list) || [];
  const [activeSubject, setActiveSubject] = useState<string>("All");

  const subjects = ["All", "Operating Systems", "Databases", "Go", "Node.js", "Bun", "Networking"];

  const filteredTopics =
    activeSubject === "All"
      ? topics
      : topics.filter((t: any) => t.subject === activeSubject);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bento-card rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs">
            <BookOpen className="w-4 h-4 text-emerald-700" />
            <span className="font-mono text-[11px] uppercase tracking-wider text-[#718096] font-semibold">
              The Polymath Engine
            </span>
          </div>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-[#1A202C] mt-1">
            Learning & Computer Science Roadmaps
          </h1>
          <p className="text-xs sm:text-sm text-[#4A5568] max-w-xl leading-relaxed mt-1">
            Deep systems understanding across OS, Database internals, Networks, Go, Node.js, and Bun.
          </p>
        </div>
      </div>

      {/* Subject Filter Pills */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none text-xs">
        {subjects.map((sub) => (
          <button
            key={sub}
            onClick={() => setActiveSubject(sub)}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              activeSubject === sub
                ? "bg-[#333E50] text-white font-semibold shadow-2xs"
                : "bg-white border border-[#E2E8F0] text-[#718096] hover:text-[#1A202C]"
            }`}
          >
            {sub}
          </button>
        ))}
      </div>

      {/* Topics Grid */}
      {filteredTopics.length === 0 ? (
        <div className="bento-card rounded-xl p-10 text-center text-xs text-[#A0AEC0]">
          No roadmaps or topics added yet for {activeSubject}.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {filteredTopics.map((topic: any) => (
            <article
              key={topic._id}
              className="bento-card rounded-xl p-5 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#EDF2F7] text-[#333E50]">
                    {topic.subject}
                  </span>
                  <span
                    className={`text-[10px] font-mono font-bold ${
                      topic.status === "mastered"
                        ? "text-emerald-700"
                        : "text-amber-700"
                    }`}
                  >
                    {topic.status === "mastered" ? "Mastered" : `${topic.progress}%`}
                  </span>
                </div>

                <h2 className="font-serif text-lg font-bold text-[#1A202C]">
                  {topic.title}
                </h2>
                <p className="text-xs text-[#4A5568] leading-relaxed">
                  {topic.description}
                </p>
              </div>

              <div className="space-y-3 pt-3 border-t border-[#ECEAE4]">
                {topic.notes && (
                  <p className="text-[11px] text-[#718096] italic bg-[#F8F9FA] p-2 rounded">
                    {topic.notes}
                  </p>
                )}

                {/* Progress Bar */}
                <div className="w-full bg-[#E2E8F0] h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      topic.status === "mastered" ? "bg-emerald-600" : "bg-[#333E50]"
                    }`}
                    style={{ width: `${topic.progress}%` }}
                  />
                </div>

                {/* Resources Link */}
                {topic.resources?.map((res: any, idx: number) => (
                  <a
                    key={idx}
                    href={res.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between text-xs text-[#333E50] hover:underline font-semibold"
                  >
                    <span className="truncate">{res.title}</span>
                    <ExternalLink className="w-3 h-3 shrink-0 ml-1 text-[#718096]" />
                  </a>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
