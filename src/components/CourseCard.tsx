"use client";

import { Course } from "@/lib/courses";
import { ArrowRight } from "@phosphor-icons/react";

interface CourseCardProps {
  course: Course;
  onSelect: (course: Course) => void;
  index: number;
}

export default function CourseCard({
  course,
  onSelect,
}: CourseCardProps) {
  const isAvailable = course.status === "available";

  return (
    <button
      onClick={() => isAvailable && onSelect(course)}
      disabled={!isAvailable}
      aria-label={`View details for ${course.title}`}
      className={`group w-full flex flex-col md:flex-row md:items-start justify-between border-t border-[var(--color-border)] py-6 text-left transition-colors ${
        isAvailable
          ? "cursor-pointer hover:bg-[var(--color-surface)]"
          : "cursor-not-allowed opacity-60 bg-[var(--color-canvas)]"
      }`}
    >
      <article className="flex w-full flex-col md:flex-row md:items-start justify-between">
      <div className="flex-1 pr-8">
        <div className="flex items-center gap-4 mb-2">
          <h3 className="font-[family-name:var(--font-serif)] text-2xl font-medium text-[var(--color-ink)]">
            {course.title}
          </h3>
          {!isAvailable && (
            <span className="text-sm text-[var(--color-muted)] italic">
              Coming soon
            </span>
          )}
          {course.discountPercentage > 0 && isAvailable && (
            <span className="bg-[var(--color-ink)] text-[var(--color-canvas)] text-xs px-2 py-0.5 border border-[var(--color-border)]">
              {course.discountPercentage}% off
            </span>
          )}
        </div>
        <p className="text-base text-[var(--color-ink)] mb-1">
          {course.description}
        </p>
        <p className="text-sm text-[var(--color-muted)]">
          {course.subtitle}
        </p>
      </div>

      <div className="mt-4 md:mt-0 flex flex-col md:items-end min-w-[150px]">
        {course.lessons > 0 ? (
          <div className="text-sm text-[var(--color-ink)] mb-2">
            {course.lessons} lessons, {course.duration}
          </div>
        ) : null}
        
        <div className="flex items-center gap-3">
           {isAvailable && course.originalPrice > course.discountPrice ? (
             <span className="text-[var(--color-muted)] line-through text-sm">₹{course.originalPrice}</span>
           ) : null}
           <span className="text-lg font-medium text-[var(--color-ink)]">₹{course.discountPrice}</span>
           {isAvailable && (
             <ArrowRight size={20} className="ml-2" />
           )}
        </div>
      </div>
      </article>
    </button>
  );
}
