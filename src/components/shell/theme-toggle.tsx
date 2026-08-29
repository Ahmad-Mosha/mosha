"use client";

import React, { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Theme is only known on the client; render a fixed-size placeholder first
  // so the header does not shift when it resolves.
  useEffect(() => setMounted(true), []);

  const isDark = resolvedTheme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="relative p-2 rounded-lg text-faint hover:text-ink hover:bg-subtle-2 transition-colors cursor-pointer"
      // The server cannot know the theme, so the title must stay absent until
      // mount or React reports a hydration mismatch on this attribute.
      title={mounted ? (isDark ? "Switch to light" : "Switch to dark") : undefined}
      aria-label="Toggle colour theme"
    >
      <span className="block w-4 h-4">
        {mounted && (
          <>
            <Sun
              className={`absolute w-4 h-4 transition-all duration-300 ${
                isDark ? "opacity-0 rotate-90 scale-50" : "opacity-100 rotate-0 scale-100"
              }`}
            />
            <Moon
              className={`absolute w-4 h-4 transition-all duration-300 ${
                isDark ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-90 scale-50"
              }`}
            />
          </>
        )}
      </span>
    </button>
  );
}
