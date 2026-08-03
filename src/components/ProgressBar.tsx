"use client";

import { useSyncExternalStore } from "react";

interface ProgressBarProps {
  totalDays: number;
}

function getSnapshot(): number {
  if (typeof window === "undefined") return 0;
  const stored = localStorage.getItem("ai-challenge-progress");
  if (!stored) return 0;
  try {
    const progress: Record<string, boolean> = JSON.parse(stored);
    return Object.values(progress).filter(Boolean).length;
  } catch {
    return 0;
  }
}

function getServerSnapshot(): number {
  return 0;
}

function subscribe(callback: () => void): () => void {
  window.addEventListener("storage", callback);
  // Also listen for custom events from our own completion button
  window.addEventListener("progress-updated", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("progress-updated", callback);
  };
}

export default function ProgressBar({ totalDays }: ProgressBarProps) {
  const completedDays = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );

  const percentage =
    totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;

  return (
    <div className="w-full">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium text-[var(--color-accent-light)]">
          Your Progress
        </span>
        <span className="font-[family-name:var(--font-serif)] text-sm font-semibold text-[var(--color-accent)]">
          {completedDays} / {totalDays} days
        </span>
      </div>
      <div className="relative h-3 w-full overflow-hidden rounded-full bg-[var(--color-border-light)]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-light)] transition-all duration-700 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="mt-1.5 text-right text-xs text-[var(--color-accent-light)]">
        {percentage}% complete
      </p>
    </div>
  );
}
