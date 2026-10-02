"use client";

import { useEffect, useCallback } from "react";
import { X, ArrowRight } from "@phosphor-icons/react";
import { Course } from "@/lib/courses";
import MarkdownRenderer from "@/components/MarkdownRenderer";

interface CoursePreviewModalProps {
  course: Course;
  overviewContent: string;
  isOpen: boolean;
  onClose: () => void;
  onUnlock: () => void;
  isUnlocked: boolean;
}

export default function CoursePreviewModal({
  course,
  overviewContent,
  isOpen,
  onClose,
  onUnlock,
  isUnlocked,
}: CoursePreviewModalProps) {
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleEscape]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-[var(--color-ink)] opacity-75"
        onClick={onClose}
      />

      <div className="relative z-10 flex max-h-[90vh] w-full max-w-3xl flex-col border-2 border-[var(--color-border)] bg-[var(--color-surface)] shadow-[8px_8px_0px_0px_var(--color-ink)]">
        <div className="flex items-start justify-between border-b-2 border-[var(--color-border)] px-8 py-6">
          <div>
            <h2 className="font-[family-name:var(--font-serif)] text-3xl font-medium text-[var(--color-ink)]">
              {course.title}
            </h2>
            <p className="mt-2 text-base text-[var(--color-ink)]">
              {course.subtitle}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[var(--color-ink)] border border-[var(--color-border)] hover:bg-[var(--color-ink)] hover:text-[var(--color-surface)] transition-colors"
          >
            <X size={24} weight="regular" />
          </button>
        </div>

        <div className="flex items-center gap-8 border-b-2 border-[var(--color-border)] bg-[var(--color-canvas)] px-8 py-4">
          <span className="text-sm font-medium text-[var(--color-ink)]">
            {course.chapters} chapters
          </span>
          <span className="text-sm font-medium text-[var(--color-ink)]">
            {course.lessons} lessons
          </span>
          <span className="text-sm font-medium text-[var(--color-ink)]">
            {course.duration}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-8 prose prose-ink max-w-none">
          <MarkdownRenderer content={overviewContent} />
        </div>

        <div className="border-t-2 border-[var(--color-border)] bg-[var(--color-canvas)] p-6">
          {isUnlocked ? (
            <a
              href={`/course/${course.id}`}
              className="flex w-full items-center justify-between border-2 border-[var(--color-border)] bg-[var(--color-ink)] px-6 py-4 text-base font-medium text-[var(--color-surface)] transition-colors hover:bg-[var(--color-accent)] hover:border-[var(--color-accent)]"
            >
              Continue Learning
              <ArrowRight size={20} />
            </a>
          ) : (
            <button
              onClick={onUnlock}
              className="flex w-full items-center justify-between border-2 border-[var(--color-border)] bg-[var(--color-ink)] px-6 py-4 text-base font-medium text-[var(--color-surface)] transition-colors hover:bg-[var(--color-accent)] hover:border-[var(--color-accent)]"
            >
              Unlock Full Course
              <ArrowRight size={20} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
