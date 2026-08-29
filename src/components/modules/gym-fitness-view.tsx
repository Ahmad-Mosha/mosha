"use client";

import React from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Dumbbell, Award } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

const VOLUME_DATA = [
  { day: "Mon", volume: 14200 },
  { day: "Tue", volume: 16800 },
  { day: "Wed", volume: 0 },
  { day: "Thu", volume: 18450 },
  { day: "Fri", volume: 15200 },
  { day: "Sat", volume: 19100 },
  { day: "Sun", volume: 0 },
];

export function GymFitnessView() {
  const sessions = useQuery(api.gym.list) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bento-card rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs">
            <Dumbbell className="w-4 h-4 text-rose-600" />
            <span className="font-mono text-[11px] uppercase tracking-wider text-[#718096] font-semibold">
              Iron Journal
            </span>
          </div>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-[#1A202C] mt-1">
            Gym & Fitness Progress
          </h1>
          <p className="text-xs sm:text-sm text-[#4A5568] max-w-xl leading-relaxed mt-1">
            Physical strength, progressive overload tracking, and disciplined longevity.
          </p>
        </div>
      </div>

      {/* PR Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bento-card rounded-xl p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-[#718096] font-mono">
            <span>Deadlift (1RM Target)</span>
            <Award className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-serif font-bold text-[#1A202C]">
            160 kg <span className="text-xs font-mono font-normal text-emerald-700">(PR Hit 🏆)</span>
          </div>
          <div className="text-[11px] text-[#718096] font-mono">Target: 180 kg by Q4</div>
        </div>

        <div className="bento-card rounded-xl p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-[#718096] font-mono">
            <span>Weighted Pull-Up</span>
            <Award className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-serif font-bold text-[#1A202C]">
            +30 kg <span className="text-xs font-mono font-normal text-[#718096]">(x 5 reps)</span>
          </div>
          <div className="text-[11px] text-[#718096] font-mono">Target: +40 kg</div>
        </div>

        <div className="bento-card rounded-xl p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-[#718096] font-mono">
            <span>Barbell Overhead Press</span>
            <Award className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-serif font-bold text-[#1A202C]">
            72.5 kg <span className="text-xs font-mono font-normal text-[#718096]">(x 4 reps)</span>
          </div>
          <div className="text-[11px] text-[#718096] font-mono">Target: 80 kg</div>
        </div>
      </div>

      {/* Volume Chart & Session History */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Weekly Volume Chart (Recharts) */}
        <div className="lg:col-span-6 bento-card rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#ECEAE4] pb-2">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#718096]">
              Weekly Tonnage (kg)
            </span>
            <span className="text-xs font-mono text-emerald-700 font-semibold">
              ▲ +8% over last week
            </span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={VOLUME_DATA}>
                <XAxis dataKey="day" stroke="#718096" fontSize={11} tickLine={false} />
                <YAxis stroke="#718096" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1A202C",
                    borderColor: "#333E50",
                    borderRadius: "8px",
                    color: "#FFF",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="volume" fill="#333E50" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Workout Sessions */}
        <div className="lg:col-span-6 bento-card rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#ECEAE4] pb-2">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#718096]">
              Workout History
            </span>
            <span className="text-xs font-mono text-[#718096]">
              {sessions.length} Logged
            </span>
          </div>

          <div className="space-y-3">
            {sessions.length === 0 ? (
              <p className="text-xs text-[#A0AEC0] py-6 text-center">
                No workouts logged yet.
              </p>
            ) : (
              sessions.map((session: any) => (
                <div
                  key={session._id}
                  className="p-4 rounded-lg bg-[#F8F9FA] border border-[#E2E8F0] space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="font-serif font-bold text-sm text-[#1A202C]">
                      {session.title}
                    </div>
                    <span className="text-[10px] font-mono text-[#718096]">
                      {session.date} • {session.durationMinutes} mins
                    </span>
                  </div>
                  <p className="text-xs text-[#4A5568]">{session.notes}</p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {session.exercises?.map((ex: any, idx: number) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded text-[10px] font-mono bg-white border border-[#E2E8F0] text-[#1A202C]"
                      >
                        {ex.name}: {ex.weightKg}kg x {ex.reps}
                      </span>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
