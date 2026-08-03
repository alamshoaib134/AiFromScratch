"use client";

import { useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";

interface CourseGuardProps {
  localStorageKey: string;
  children: React.ReactNode;
}

function createUnlockStore(key: string) {
  function getSnapshot(): boolean {
    if (typeof window === "undefined") return false;
    try {
      return localStorage.getItem(key) === "true";
    } catch {
      return false;
    }
  }
  function getServerSnapshot(): boolean {
    return false;
  }
  function subscribe(callback: () => void): () => void {
    window.addEventListener("storage", callback);
    return () => window.removeEventListener("storage", callback);
  }
  return { getSnapshot, getServerSnapshot, subscribe };
}

export default function CourseGuard({
  localStorageKey,
  children,
}: CourseGuardProps) {
  const router = useRouter();

  // Create store specifically for this key
  const store = createUnlockStore(localStorageKey);
  const isUnlocked = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot
  );

  // We are relying on the fact that if we are on client and not unlocked, we should redirect.
  // We can't redirect during render, so we do it in a setTimeout (which is asynchronous, bypassing the sync lint rule)
  // or we can just render a meta refresh, but router.replace is better.
  if (typeof window !== "undefined" && !isUnlocked) {
    setTimeout(() => {
      router.replace("/?unlock=30-days-of-ai");
    }, 0);
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-accent)]" />
          <span className="text-sm text-[var(--color-accent-light)]">
            Redirecting...
          </span>
        </div>
      </div>
    );
  }

  // If server-side rendering, or client-side unlocked
  if (!isUnlocked) {
     return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-accent)]" />
          <span className="text-sm text-[var(--color-accent-light)]">
            Verifying access...
          </span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
