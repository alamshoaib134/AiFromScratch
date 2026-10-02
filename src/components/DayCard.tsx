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

export default function DayCard({ day, title, concept, courseId }: DayCardProps) {
  const store = createDayStore(day, courseId);
  const completed = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot
  );

  return (
    <Link
      href={`/course/${courseId}/day/${day}`}
      className={`group flex flex-col border border-[var(--color-border)] p-5 transition-colors ${
        completed
          ? "bg-[#EAEAEA]"
          : "bg-[var(--color-surface)] hover:bg-[#F9F9F9]"
      }`}
    >
      <div className="mb-4 flex items-center justify-between border-b border-[var(--color-border)] pb-2">
        <span className="text-sm font-medium text-[var(--color-ink)]">
          Day {day}
        </span>
        {completed ? (
          <CheckCircle size={20} weight="fill" className="text-[var(--color-ink)]" />
        ) : (
          <Circle size={20} weight="regular" className="text-[var(--color-border)] group-hover:text-[var(--color-ink)]" />
        )}
      </div>

      <h3 className="mb-2 font-[family-name:var(--font-serif)] text-lg font-medium leading-snug text-[var(--color-ink)]">
        {title}
      </h3>

      <p className="mb-4 flex-1 text-sm leading-relaxed text-[var(--color-ink)]">
        {concept}
      </p>

      <div className="flex items-center text-sm font-medium text-[var(--color-ink)]">
        <span>Start lesson</span>
        <ArrowRight size={16} className="ml-2 transition-transform group-hover:translate-x-1" />
      </div>
    </Link>
  );
}
