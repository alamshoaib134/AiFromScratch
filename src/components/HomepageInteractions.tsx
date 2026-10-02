"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { courses, Course } from "@/lib/courses";
import CoursePreviewModal from "@/components/CoursePreviewModal";
import PasscodeModal from "@/components/PasscodeModal";

interface HomepageInteractionsProps {
  overviewContent: string;
}

function checkUnlocked(key: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(key) === "true";
  } catch {
    return false;
  }
}

/**
 * Inner component that uses useSearchParams (must be inside Suspense).
 */
function HomepageInteractionsInner({
  overviewContent,
}: HomepageInteractionsProps) {
  const searchParams = useSearchParams();
  const unlockParam = searchParams.get("unlock");

  const [isUnlocked, setIsUnlocked] = useState(false);
  const [previewCourse, setPreviewCourse] = useState<Course | null>(null);
  const [showPasscode, setShowPasscode] = useState(false);
  const [unlockingCourse, setUnlockingCourse] = useState<Course | null>(null);

  // Handle ?unlock= parameter
  useEffect(() => {
    if (unlockParam) {
      const course = courses.find((c) => c.id === unlockParam);
      if (course) {
        const unlocked = checkUnlocked(course.localStorageKey);
        if (!unlocked) {
          setUnlockingCourse(course);
          setShowPasscode(true);
        } else {
          const url = new URL(window.location.href);
          url.searchParams.delete("unlock");
          window.history.replaceState({}, "", url.toString());
        }
      }
    }
  }, [unlockParam]);

  // Listen for storage / progress changes
  useEffect(() => {
    const onStorageChange = () => {
      setIsUnlocked((prev) => !prev);
    };
    window.addEventListener("storage", onStorageChange);
    window.addEventListener("progress-updated", onStorageChange);
    return () => {
      window.removeEventListener("storage", onStorageChange);
      window.removeEventListener("progress-updated", onStorageChange);
    };
  }, []);

  // Attach click handlers to server-rendered course cards
  const handleCourseClick = useCallback((e: MouseEvent) => {
    const target = (e.target as HTMLElement).closest<HTMLElement>(
      "[data-course-id]"
    );
    if (!target) return;

    const courseId = target.getAttribute("data-course-id");
    const course = courses.find((c) => c.id === courseId);
    if (!course || course.status !== "available") return;

    if (checkUnlocked(course.localStorageKey)) {
      window.location.href = `/course/${course.id}`;
      return;
    }
    setPreviewCourse(course);
  }, []);

  useEffect(() => {
    document.addEventListener("click", handleCourseClick);
    return () => document.removeEventListener("click", handleCourseClick);
  }, [handleCourseClick]);

  const handleUnlock = () => {
    setUnlockingCourse(previewCourse);
    setPreviewCourse(null);
    setShowPasscode(true);
  };

  return (
    <>
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

      {unlockingCourse && (
        <PasscodeModal
          key={showPasscode ? "open" : "closed"}
          isOpen={showPasscode}
          onClose={() => setShowPasscode(false)}
          courseId={unlockingCourse.id}
          localStorageKey={unlockingCourse.localStorageKey}
        />
      )}
    </>
  );
}

/**
 * Exported wrapper with Suspense boundary (required for useSearchParams
 * in statically pre-rendered pages).
 */
export default function HomepageInteractions(props: HomepageInteractionsProps) {
  return (
    <Suspense fallback={null}>
      <HomepageInteractionsInner {...props} />
    </Suspense>
  );
}
