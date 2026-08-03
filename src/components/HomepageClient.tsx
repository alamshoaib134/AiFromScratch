"use client";

import { useState, useSyncExternalStore } from "react";
import { useSearchParams } from "next/navigation";
import { courses, Course } from "@/lib/courses";
import CourseCard from "@/components/CourseCard";
import CoursePreviewModal from "@/components/CoursePreviewModal";
import PasscodeModal from "@/components/PasscodeModal";
import {
  Sparkle,
  GraduationCap,
} from "@phosphor-icons/react";

interface HomepageClientProps {
  overviewContent: string;
}

// Check if course is unlocked in localStorage
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
    window.addEventListener("progress-updated", callback);
    return () => {
      window.removeEventListener("storage", callback);
      window.removeEventListener("progress-updated", callback);
    };
  }
  return { getSnapshot, getServerSnapshot, subscribe };
}

const unlockStore = createUnlockStore("course_30_days_unlocked");

export default function HomepageClient({
  overviewContent,
}: HomepageClientProps) {
  const searchParams = useSearchParams();
  const unlockParam = searchParams.get("unlock");

  const isUnlocked = useSyncExternalStore(
    unlockStore.subscribe,
    unlockStore.getSnapshot,
    unlockStore.getServerSnapshot
  );

  const [previewCourse, setPreviewCourse] = useState<Course | null>(
    null
  );
  const [showPasscode, setShowPasscode] = useState(
    unlockParam === "30-days-of-ai"
  );

  const handleSelectCourse = (course: Course) => {
    // If already unlocked, go directly to the course
    if (course.localStorageKey === "course_30_days_unlocked" && isUnlocked) {
      window.location.href = `/course/${course.id}`;
      return;
    }
    setPreviewCourse(course);
  };

  const handleUnlock = () => {
    setPreviewCourse(null);
    setShowPasscode(true);
  };

  return (
    <>
      <div className="mx-auto max-w-6xl px-6 py-12">
        {/* Hero Section */}
        <section className="animate-fade-in mb-16 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--color-border-light)] bg-white px-4 py-1.5 text-sm text-[var(--color-accent-light)] shadow-sm">
            <Sparkle size={16} weight="fill" className="text-amber-500" />
            <span>Master AI — one course at a time</span>
          </div>

          <h1 className="font-[family-name:var(--font-serif)] text-4xl font-bold leading-tight tracking-tight text-[var(--color-accent)] sm:text-5xl md:text-6xl">
            <span className="bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-light)] bg-clip-text text-transparent">
              AI Academy
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-[var(--color-accent-light)]">
            A curated collection of courses designed to take you from AI
            fundamentals to advanced systems. No fluff, no prerequisites — just
            clear, structured knowledge.
          </p>
        </section>

        {/* Course Catalog */}
        <section>
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-accent)] text-white">
              <GraduationCap size={18} weight="duotone" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-accent-light)]">
                Course Catalog
              </p>
              <h2 className="font-[family-name:var(--font-serif)] text-xl font-bold text-[var(--color-accent)]">
                Available Courses
              </h2>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course, index) => (
              <CourseCard
                key={course.id}
                course={course}
                onSelect={handleSelectCourse}
                index={index}
              />
            ))}
          </div>
        </section>
      </div>

      {/* Course Preview Modal */}
      {previewCourse && (
        <CoursePreviewModal
          course={previewCourse}
          overviewContent={overviewContent}
          isOpen={!!previewCourse}
          onClose={() => setPreviewCourse(null)}
          onUnlock={handleUnlock}
          isUnlocked={isUnlocked}
        />
      )}

      {/* Passcode Modal */}
      <PasscodeModal
        key={showPasscode ? "open" : "closed"}
        isOpen={showPasscode}
        onClose={() => setShowPasscode(false)}
        courseId="30-days-of-ai"
        localStorageKey="course_30_days_unlocked"
      />
    </>
  );
}
