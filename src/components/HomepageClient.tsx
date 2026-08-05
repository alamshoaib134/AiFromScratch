"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { courses, Course } from "@/lib/courses";
import CourseCard from "@/components/CourseCard";
import CoursePreviewModal from "@/components/CoursePreviewModal";
import PasscodeModal from "@/components/PasscodeModal";
import {
  Sparkle,
  GraduationCap,
  UserFocus,
  ArrowUpRight,
} from "@phosphor-icons/react";

interface HomepageClientProps {
  overviewContent: string;
}

// Helper to check localStorage safely
function checkUnlocked(key: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(key) === "true";
  } catch {
    return false;
  }
}

export default function HomepageClient({
  overviewContent,
}: HomepageClientProps) {
  const searchParams = useSearchParams();
  const unlockParam = searchParams.get("unlock");

  const [isUnlocked, setIsUnlocked] = useState(false);
  const [previewCourse, setPreviewCourse] = useState<Course | null>(null);
  const [showPasscode, setShowPasscode] = useState(false);

  // On mount: check localStorage and decide whether to show the passcode modal
  useEffect(() => {
    const unlocked = checkUnlocked("course_30_days_unlocked");
    setIsUnlocked(unlocked);

    if (unlockParam === "30-days-of-ai" && !unlocked) {
      // Only show passcode if the course is NOT already unlocked
      setShowPasscode(true);
    }

    // If already unlocked, clean up the URL param silently
    if (unlocked && unlockParam) {
      const url = new URL(window.location.href);
      url.searchParams.delete("unlock");
      window.history.replaceState({}, "", url.toString());
    }
  }, [unlockParam]);

  // Listen for storage changes (e.g. when the passcode modal sets the key)
  useEffect(() => {
    const onStorageChange = () => {
      setIsUnlocked(checkUnlocked("course_30_days_unlocked"));
    };
    window.addEventListener("storage", onStorageChange);
    window.addEventListener("progress-updated", onStorageChange);
    return () => {
      window.removeEventListener("storage", onStorageChange);
      window.removeEventListener("progress-updated", onStorageChange);
    };
  }, []);

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

        {/* About the Author */}
        <section className="mt-20 border-t border-[var(--color-border-light)] pt-16">
          <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:gap-10">
            <div className="flex shrink-0 items-center justify-center sm:block">
              <div className="relative h-28 w-28 overflow-hidden rounded-full border-4 border-white bg-white shadow-xl ring-1 ring-[var(--color-border-light)]">
                <img 
                  src="https://github.com/alamshoaib134.png" 
                  alt="Shoaib Alam"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
            
            <div className="flex-1 text-center sm:text-left">
              <div className="mb-2 flex items-center justify-center gap-2 sm:justify-start">
                <UserFocus size={20} className="text-[var(--color-accent)]" />
                <p className="text-sm font-semibold uppercase tracking-wider text-[var(--color-accent-light)]">
                  About the Author
                </p>
              </div>
              <h2 className="mb-2 font-[family-name:var(--font-serif)] text-3xl font-bold text-[var(--color-accent)]">
                Shoaib Alam
              </h2>
              <p className="mb-4 text-sm font-semibold text-emerald-700">
                AI Engineer at JPMC &bull; NLP Researcher (IIT Gandhinagar)
              </p>
              <p className="mb-6 max-w-3xl leading-relaxed text-[var(--color-accent-light)]">
                I specialize in building fiduciary-grade hybrid RAG solutions and scalable AI systems for institutional finance. As a pioneer of Hybrid RAG at JPMC and published researcher at EMNLP 2024 (LEGOBench), I bridge the gap between cutting-edge AI research and production-ready enterprise applications.
              </p>
              <a
                href="https://shoaibalam.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2 rounded-full border border-[var(--color-border-light)] bg-white px-5 py-2 text-sm font-semibold text-[var(--color-accent)] shadow-sm transition-all hover:-translate-y-0.5 hover:border-[var(--color-border)] hover:shadow-md"
              >
                View Full Portfolio
                <ArrowUpRight
                  size={16}
                  className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                />
              </a>
            </div>
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
