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
  Newspaper,
  ArrowRight,
} from "@phosphor-icons/react";
import Link from "next/link";

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

  // We use previewCourse for the unlock flow too, to know which course to unlock.
  // Instead of a single isUnlocked state, we should check it per course, or since previewCourse handles unlocking:
  const [unlockingCourse, setUnlockingCourse] = useState<Course | null>(null);

  // On mount: check if URL asks to unlock a specific course
  useEffect(() => {
    if (unlockParam) {
      const course = courses.find((c) => c.id === unlockParam);
      if (course) {
        const unlocked = checkUnlocked(course.localStorageKey);
        if (!unlocked) {
          setUnlockingCourse(course);
          setShowPasscode(true);
        } else {
          // If already unlocked, clean up the URL param silently
          const url = new URL(window.location.href);
          url.searchParams.delete("unlock");
          window.history.replaceState({}, "", url.toString());
        }
      }
    }
  }, [unlockParam]);

  // Listen for storage changes (e.g. when the passcode modal sets the key)
  useEffect(() => {
    const onStorageChange = () => {
      // Force re-render on storage change so CourseCard UI updates
      setIsUnlocked((prev) => !prev);
    };
    window.addEventListener("storage", onStorageChange);
    window.addEventListener("progress-updated", onStorageChange);
    return () => {
      window.removeEventListener("storage", onStorageChange);
      window.removeEventListener("progress-updated", onStorageChange);
    };
  }, []);

  const handleSelectCourse = (course: Course) => {
    if (course.status !== "available") return;
    
    // If already unlocked, go directly to the course
    if (checkUnlocked(course.localStorageKey)) {
      window.location.href = `/course/${course.id}`;
      return;
    }
    setPreviewCourse(course);
  };

  const handleUnlock = () => {
    setUnlockingCourse(previewCourse);
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

            {/* Paper Everyday — special card */}
            <Link
              href="/papers"
              className={`animate-fade-in stagger-${Math.min(courses.length + 1, 6)} group relative flex flex-col rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-6 text-left shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:border-amber-300`}
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-md">
                  <Newspaper size={22} weight="duotone" />
                </div>
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
                  Free • Daily
                </span>
              </div>

              <h3 className="mb-1 font-[family-name:var(--font-serif)] text-lg font-bold leading-snug text-[var(--color-accent)] transition-colors group-hover:text-amber-700">
                Paper Everyday
              </h3>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-amber-600">
                Research Simplified
              </p>
              <p className="mb-5 flex-1 text-sm leading-relaxed text-[var(--color-accent-light)]">
                One AI research paper explained clearly every day. Stay at the
                frontier of AI research — no jargon, just insight.
              </p>

              <div className="flex items-center border-t border-amber-200/60 pt-4 text-xs font-medium text-amber-600 transition-colors group-hover:text-amber-700">
                <span>Browse papers</span>
                <ArrowRight
                  size={14}
                  className="ml-1 transition-transform group-hover:translate-x-1"
                />
              </div>
            </Link>
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
