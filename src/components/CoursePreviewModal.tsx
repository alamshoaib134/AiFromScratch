"use client";

import { useEffect, useCallback } from "react";
import { X, BookOpen, Key, Clock, GraduationCap } from "@phosphor-icons/react";
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
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[var(--color-accent)]/40 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="animate-scale-in relative z-10 flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-[var(--color-border-light)] bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[var(--color-border-light)] px-6 py-5">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-accent)] text-white shadow-md">
              <GraduationCap size={24} weight="duotone" />
            </div>
            <div>
              <h2 className="font-[family-name:var(--font-serif)] text-xl font-bold text-[var(--color-accent)]">
                {course.title}
              </h2>
              <p className="mt-0.5 text-sm text-[var(--color-accent-light)]">
                {course.subtitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-[var(--color-accent-light)] transition-colors hover:bg-[var(--color-border-light)] hover:text-[var(--color-accent)]"
          >
            <X size={20} weight="bold" />
          </button>
        </div>

        {/* Course Stats */}
        <div className="flex items-center gap-6 border-b border-[var(--color-border-light)] bg-[var(--color-alabaster)] px-6 py-3">
          <span className="flex items-center gap-1.5 text-sm text-[var(--color-accent-light)]">
            <BookOpen size={16} weight="duotone" />
            {course.chapters} chapters
          </span>
          <span className="flex items-center gap-1.5 text-sm text-[var(--color-accent-light)]">
            <GraduationCap size={16} weight="duotone" />
            {course.lessons} lessons
          </span>
          <span className="flex items-center gap-1.5 text-sm text-[var(--color-accent-light)]">
            <Clock size={16} weight="duotone" />
            {course.duration}
          </span>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <MarkdownRenderer content={overviewContent} />
        </div>

        {/* Footer CTA */}
        <div className="border-t border-[var(--color-border-light)] bg-[var(--color-alabaster)] px-6 py-4">
          {isUnlocked ? (
            <a
              href={`/course/${course.id}`}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-success)] px-6 py-3 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5"
            >
              <BookOpen size={18} weight="bold" />
              Continue Learning
            </a>
          ) : (
            <button
              onClick={onUnlock}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-accent)] px-6 py-3 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5"
            >
              <Key size={18} weight="bold" />
              Unlock Full Course
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
