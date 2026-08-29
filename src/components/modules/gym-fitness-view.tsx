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
          <div className="flex items-center space-x-2 text-label">
            <Dumbbell className="w-4 h-4 text-danger" />
            <span className="font-mono text-meta uppercase tracking-wider text-faint font-semibold">
              Iron Journal
            </span>
          </div>
          <h1 className="font-serif text-display font-bold tracking-tight text-ink mt-1">
            Gym & Fitness Progress
          </h1>
          <p className="text-label sm:text-body text-muted max-w-xl leading-relaxed mt-1">
            Physical strength, progressive overload tracking, and disciplined longevity.
          </p>
        </div>
      </div>

      {/* PR Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bento-card rounded-xl p-5 space-y-2">
          <div className="flex items-center justify-between text-label text-faint font-mono">
            <span>Deadlift (1RM Target)</span>
            <Award className="w-4 h-4 text-warn" />
          </div>
          <div className="text-title font-serif font-bold text-ink">
            160 kg <span className="text-label font-mono font-normal text-success">(PR Hit 🏆)</span>
          </div>
          <div className="text-meta text-faint font-mono">Target: 180 kg by Q4</div>
        </div>

        <div className="bento-card rounded-xl p-5 space-y-2">
          <div className="flex items-center justify-between text-label text-faint font-mono">
            <span>Weighted Pull-Up</span>
            <Award className="w-4 h-4 text-info" />
          </div>
          <div className="text-title font-serif font-bold text-ink">
            +30 kg <span className="text-label font-mono font-normal text-faint">(x 5 reps)</span>
          </div>
          <div className="text-meta text-faint font-mono">Target: +40 kg</div>
        </div>

        <div className="bento-card rounded-xl p-5 space-y-2">
          <div className="flex items-center justify-between text-label text-faint font-mono">
            <span>Barbell Overhead Press</span>
            <Award className="w-4 h-4 text-danger" />
          </div>
          <div className="text-title font-serif font-bold text-ink">
            72.5 kg <span className="text-label font-mono font-normal text-faint">(x 4 reps)</span>
          </div>
          <div className="text-meta text-faint font-mono">Target: 80 kg</div>
        </div>
      </div>

      {/* Volume Chart & Session History */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Weekly Volume Chart (Recharts) */}
        <div className="lg:col-span-6 bento-card rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-line pb-2">
            <span className="font-mono text-label font-bold uppercase tracking-wider text-faint">
              Weekly Tonnage (kg)
            </span>
            <span className="text-label font-mono text-success font-semibold">
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
          <div className="flex items-center justify-between border-b border-line pb-2">
            <span className="font-mono text-label font-bold uppercase tracking-wider text-faint">
              Workout History
            </span>
            <span className="text-label font-mono text-faint">
              {sessions.length} Logged
            </span>
          </div>

          <div className="space-y-3">
            {sessions.length === 0 ? (
              <p className="text-label text-ghost py-6 text-center">
                No workouts logged yet.
              </p>
            ) : (
              sessions.map((session: any) => (
                <div
                  key={session._id}
                  className="p-4 rounded-lg bg-subtle border border-line space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="font-serif font-bold text-body text-ink">
                      {session.title}
                    </div>
                    <span className="text-meta font-mono text-faint">
                      {session.date} • {session.durationMinutes} mins
                    </span>
                  </div>
                  <p className="text-label text-muted">{session.notes}</p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {session.exercises?.map((ex: any, idx: number) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded text-meta font-mono bg-surface-2 border border-line text-ink"
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
