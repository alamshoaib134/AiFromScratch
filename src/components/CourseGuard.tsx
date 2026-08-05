"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface CourseGuardProps {
  localStorageKey: string;
  children: React.ReactNode;
}

export default function CourseGuard({
  localStorageKey,
  children,
}: CourseGuardProps) {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "unlocked" | "locked">(
    "loading"
  );

  useEffect(() => {
    // Read localStorage only on the client, after mount
    try {
      const unlocked = localStorage.getItem(localStorageKey) === "true";
      if (unlocked) {
        setStatus("unlocked");
      } else {
        setStatus("locked");
        router.replace("/?unlock=30-days-of-ai");
      }
    } catch {
      setStatus("locked");
      router.replace("/?unlock=30-days-of-ai");
    }
  }, [localStorageKey, router]);

  if (status !== "unlocked") {
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
