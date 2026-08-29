"use client";

import React, { useState, useEffect, useCallback } from "react";
import { fetchRandomQuranVerse, QuranVerse, INITIAL_VERSES } from "@/lib/quran";
import { Sparkles, RotateCw, Quote } from "lucide-react";

export function QuoteRotator() {
  const [currentVerse, setCurrentVerse] = useState<QuranVerse>(
    INITIAL_VERSES[0],
  );
  const [isFading, setIsFading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const getNextVerse = useCallback(async () => {
    setIsFading(true);
    setIsLoading(true);

    try {
      const nextVerse = await fetchRandomQuranVerse();
      setTimeout(() => {
        setCurrentVerse(nextVerse);
        setIsFading(false);
        setIsLoading(false);
      }, 400);
    } catch {
      setIsFading(false);
      setIsLoading(false);
    }
  }, []);

  // Automatic rotation every 20 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      getNextVerse();
    }, 20000);
    return () => clearInterval(interval);
  }, [getNextVerse]);

  return (
    <div className="relative bg-subtle border border-line rounded-xl p-5 flex flex-col justify-between overflow-hidden shadow-2xs group min-h-[160px]">
      {/* Background Decorative Quote Icon */}
      <Quote className="absolute top-3 left-3 w-8 h-8 text-line -rotate-12 pointer-events-none opacity-60" />

      {/* Top Header Row with Surah Reference & Refresh Trigger */}
      <div className="flex items-center justify-between text-label z-10">
        <div className="flex items-center space-x-2">
          <span className="w-1.5 h-1.5 rounded-full bg-warn" />
          <span className="font-mono text-meta uppercase tracking-wider text-faint font-medium">
            Quran Wisdom
          </span>
          <span className="text-line-2">•</span>
          <span className="font-mono text-meta text-muted">
            {currentVerse.surahNameEnglish} ({currentVerse.surahNumber}:
            {currentVerse.ayahNumber})
          </span>
        </div>

        <button
          onClick={getNextVerse}
          disabled={isLoading}
          title="Randomize verse from entire Quran"
          className="flex items-center space-x-1.5 px-2 py-1 rounded-md text-meta font-mono text-faint hover:text-ink hover:bg-subtle-2 transition-all cursor-pointer"
        >
          <RotateCw
            className={`w-3 h-3 ${isLoading ? "animate-spin text-warn" : ""}`}
          />
          <span className="hidden sm:inline">Random Verse</span>
        </button>
      </div>

      {/* Main Verse Content */}
      <div
        className={`my-3 text-center space-y-2 transition-opacity duration-400 z-10 ${
          isFading ? "opacity-0 scale-98" : "opacity-100 scale-100"
        }`}
      >
        {/* Arabic Calligraphy Verse */}
        <p
          dir="rtl"
          lang="ar"
          className="font-arabic text-title sm:text-title text-ink font-semibold leading-relaxed"
        >
          {currentVerse.arabic}
        </p>

        {/* English Translation */}
        <p className="text-label sm:text-body text-muted font-serif italic max-w-xl mx-auto leading-normal">
          &ldquo;{currentVerse.translation}&rdquo;
        </p>
      </div>

      {/* Footer Reference */}
      <div className="text-center z-10">
        <span className="text-meta font-mono uppercase tracking-widest text-ghost">
          {currentVerse.surahNameArabic} • {currentVerse.ayahNumber}
        </span>
      </div>
    </div>
  );
}
