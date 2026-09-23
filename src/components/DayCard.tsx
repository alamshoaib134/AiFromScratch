"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { CheckCircle, Circle, ArrowRight } from "@phosphor-icons/react";

interface DayCardProps {
  day: number;
  title: string;
  concept: string;
  index: number;
  courseId: string;
}

function createDayStore(day: number, courseId: string) {
  function getSnapshot(): boolean {
    if (typeof window === "undefined") return false;
    try {
      const stored = localStorage.getItem(`${courseId}-progress`);
      if (!stored) return false;
      const progress: Record<string, boolean> = JSON.parse(stored);
      return !!progress[`day-${day}`];
    } catch {
      return false;
    }
  }

  function getServerSnapshot(): boolean {
    return false;
  }

  function subscribe(callback: () => void): () => void {
    window.addEventListener("storage", callback);
    window.addEventListener("progress-updated", callback);
    return () => {
      window.removeEventListener("storage", callback);
      window.removeEventListener("progress-updated", callback);
    };
  }

  return { getSnapshot, getServerSnapshot, subscribe };
}

export default function DayCard({ day, title, concept, index, courseId }: DayCardProps) {
  const store = createDayStore(day, courseId);
  const completed = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot
  );

  const staggerClass = `stagger-${Math.min((index % 6) + 1, 6)}`;

  return (
    <Link
      href={`/course/${courseId}/day/${day}`}
      className={`animate-fade-in ${staggerClass} group relative flex flex-col rounded-2xl border bg-[var(--color-card)] p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
        completed
          ? "border-[var(--color-success)]/30 bg-[var(--color-success-light)]/30"
          : "border-[var(--color-border-light)] hover:border-[var(--color-border)]"
      }`}
    >
      {/* Day Badge + Completion */}
      <div className="mb-3 flex items-center justify-between">
        <span className="inline-flex items-center rounded-lg bg-[var(--color-alabaster)] px-2.5 py-1 text-xs font-semibold text-[var(--color-accent-light)]">
          DAY {day}
        </span>
        {completed ? (
          <CheckCircle
            size={22}
            weight="fill"
            className="text-[var(--color-success)]"
          />
        ) : (
          <Circle
            size={22}
            weight="regular"
            className="text-[var(--color-border)] transition-colors group-hover:text-[var(--color-accent-light)]"
          />
        )}
      </div>

      {/* Title */}
      <h3 className="mb-1.5 font-[family-name:var(--font-serif)] text-base font-bold leading-snug text-[var(--color-accent)] transition-colors group-hover:text-[var(--color-stone-warm)]">
        {title}
      </h3>

      {/* Concept */}
      <p className="mb-4 flex-1 text-sm leading-relaxed text-[var(--color-accent-light)]">
        {concept}
      </p>

      {/* Arrow */}
      <div className="flex items-center text-xs font-medium text-[var(--color-accent-light)] transition-colors group-hover:text-[var(--color-accent)]">
        <span>Start lesson</span>
        <ArrowRight
          size={14}
          className="ml-1 transition-transform group-hover:translate-x-1"
        />
      </div>
    </Link>
  );
}
