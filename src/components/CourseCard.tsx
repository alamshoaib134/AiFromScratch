"use client";

import { Course } from "@/lib/courses";
import {
  Clock,
  BookOpen,
  Brain,
  Database,
  Robot,
  Wrench,
  Eye,
} from "@phosphor-icons/react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const courseIcons: Record<string, any> = {
  Brain,
  Database,
  Robot,
  Wrench,
  Eye,
};

interface CourseCardProps {
  course: Course;
  onSelect: (course: Course) => void;
  index: number;
}

export default function CourseCard({
  course,
  onSelect,
  index,
}: CourseCardProps) {
  const isAvailable = course.status === "available";
  const IconComponent = courseIcons[course.iconName];
  const staggerClass = `stagger-${Math.min(index + 1, 6)}`;

  return (
    <button
      onClick={() => isAvailable && onSelect(course)}
      disabled={!isAvailable}
      className={`animate-fade-in ${staggerClass} group relative flex flex-col rounded-2xl border p-6 text-left transition-all duration-300 ${
        isAvailable
          ? "cursor-pointer border-[var(--color-border-light)] bg-[var(--color-card)] shadow-sm hover:-translate-y-1.5 hover:shadow-xl hover:border-[var(--color-border)]"
          : "cursor-not-allowed border-[var(--color-border-light)]/60 bg-[var(--color-card)]/60 opacity-60"
      }`}
    >
      {/* Discount Ribbon */}
      {course.discountPercentage > 0 && (
        <div className={`absolute top-0 left-6 -translate-y-1/2 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm transition-transform group-hover:scale-105 ${isAvailable ? 'bg-rose-500' : 'bg-[var(--color-border)]'}`}>
          {course.discountPercentage}% OFF
        </div>
      )}

      {/* Badge */}
      <div className="mb-4 flex items-center justify-between">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${
            isAvailable
              ? "bg-[var(--color-accent)] text-white shadow-md"
              : "bg-[var(--color-border-light)] text-[var(--color-accent-light)]"
          }`}
        >
          {IconComponent && (
            <IconComponent size={22} weight="duotone" />
          )}
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            isAvailable
              ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
              : "bg-[var(--color-border-light)] text-[var(--color-accent-light)] ring-1 ring-[var(--color-border)]"
          }`}
        >
          {course.badge}
        </span>
      </div>

      {/* Title */}
      <h3
        className={`mb-1 font-[family-name:var(--font-serif)] text-lg font-bold leading-snug ${
          isAvailable
            ? "text-[var(--color-accent)] group-hover:text-[var(--color-stone-warm)]"
            : "text-[var(--color-accent-light)]"
        } transition-colors`}
      >
        {course.title}
      </h3>

      {/* Subtitle */}
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--color-accent-light)]">
        {course.subtitle}
      </p>

      {/* Description */}
      <p className="mb-5 flex-1 text-sm leading-relaxed text-[var(--color-accent-light)]">
        {course.description}
      </p>

      {/* Meta & Pricing */}
      <div className="flex items-center justify-between border-t border-[var(--color-border-light)] pt-4">
        <div className="flex flex-col gap-1">
          {course.lessons > 0 ? (
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-xs text-[var(--color-accent-light)]">
                <BookOpen size={14} />
                {course.lessons} lessons
              </span>
              <span className="flex items-center gap-1.5 text-xs text-[var(--color-accent-light)]">
                <Clock size={14} />
                {course.duration}
              </span>
            </div>
          ) : (
            <span className="text-xs italic text-[var(--color-border)]">
              Details coming soon
            </span>
          )}
        </div>

        {/* Pricing */}
        <div className="flex flex-col items-end leading-none">
          <span className={`text-[10px] font-bold uppercase tracking-wider ${isAvailable ? 'text-[var(--color-accent-light)] line-through decoration-rose-400/60' : 'text-[var(--color-border)] line-through'}`}>
            ₹{course.originalPrice}
          </span>
          <span className={`font-[family-name:var(--font-serif)] text-lg font-bold ${isAvailable ? 'text-[var(--color-accent)] group-hover:text-rose-600 transition-colors' : 'text-[var(--color-border)]'}`}>
            ₹{course.discountPrice}
          </span>
        </div>
      </div>
    </button>
  );
}
