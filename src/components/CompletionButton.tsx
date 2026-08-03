"use client";

import { useSyncExternalStore } from "react";
import { CheckCircle, Circle } from "@phosphor-icons/react";

interface CompletionButtonProps {
  day: number;
}

function createCompletionStore(day: number) {
  function getSnapshot(): boolean {
    if (typeof window === "undefined") return false;
    try {
      const stored = localStorage.getItem("ai-challenge-progress");
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

export default function CompletionButton({ day }: CompletionButtonProps) {
  const store = createCompletionStore(day);
  const completed = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot
  );

  const toggle = () => {
    const stored = localStorage.getItem("ai-challenge-progress");
    const progress: Record<string, boolean> = stored ? JSON.parse(stored) : {};

    const newState = !completed;
    if (newState) {
      progress[`day-${day}`] = true;
    } else {
      delete progress[`day-${day}`];
    }

    localStorage.setItem("ai-challenge-progress", JSON.stringify(progress));
    // Dispatch custom event so other components re-read localStorage
    window.dispatchEvent(new Event("progress-updated"));
  };

  return (
    <button
      onClick={toggle}
      className={`inline-flex items-center gap-2.5 rounded-xl px-6 py-3 text-sm font-semibold transition-all duration-300 ${
        completed
          ? "bg-[var(--color-success-light)] text-[var(--color-success)] hover:bg-[var(--color-success)]/20"
          : "bg-[var(--color-accent)] text-white shadow-md hover:shadow-lg hover:-translate-y-0.5"
      }`}
    >
      {completed ? (
        <>
          <CheckCircle size={20} weight="fill" />
          Completed
        </>
      ) : (
        <>
          <Circle size={20} weight="bold" />
          Mark as Complete
        </>
      )}
    </button>
  );
}
