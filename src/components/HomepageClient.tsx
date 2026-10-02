"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { courses, Course } from "@/lib/courses";
import CourseCard from "@/components/CourseCard";
import CoursePreviewModal from "@/components/CoursePreviewModal";
import PasscodeModal from "@/components/PasscodeModal";
import { ArrowRight } from "@phosphor-icons/react";
import Link from "next/link";

interface HomepageClientProps {
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

export default function HomepageClient({
  overviewContent,
}: HomepageClientProps) {
  const searchParams = useSearchParams();
  const unlockParam = searchParams.get("unlock");

  const [isUnlocked, setIsUnlocked] = useState(false);
  const [previewCourse, setPreviewCourse] = useState<Course | null>(null);
  const [showPasscode, setShowPasscode] = useState(false);

  const [unlockingCourse, setUnlockingCourse] = useState<Course | null>(null);

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

  const handleSelectCourse = (course: Course) => {
    if (course.status !== "available") return;
    
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
      <div className="mx-auto max-w-6xl px-6 py-16">
        {/* Hero Section */}
        <header className="mb-20 text-left border-b-4 border-[var(--color-border)] pb-12">
          <h1 className="font-[family-name:var(--font-serif)] text-5xl font-medium leading-tight text-[var(--color-ink)] sm:text-7xl mb-6">
            AI Academy
          </h1>
          <p className="max-w-3xl text-xl leading-relaxed text-[var(--color-ink)]">
            A curated collection of courses designed to take you from AI fundamentals to advanced systems. 
            No fluff, no prerequisites — just clear, structured knowledge.
          </p>
        </header>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          {/* Main Content (Courses) */}
          <section className="lg:col-span-8" aria-labelledby="courses-heading">
            <h2 id="courses-heading" className="font-[family-name:var(--font-serif)] text-3xl font-medium text-[var(--color-ink)] mb-8">
              Available Courses
            </h2>
            <div className="flex flex-col border-b border-[var(--color-border)]">
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

          {/* Sidebar */}
          <div className="lg:col-span-4 flex flex-col gap-12">
            {/* Paper Everyday */}
            <section>
              <h2 className="font-[family-name:var(--font-serif)] text-2xl font-medium text-[var(--color-ink)] mb-6 border-b border-[var(--color-border)] pb-2">
                Paper Everyday
              </h2>
              <div className="border border-[var(--color-border)] p-6 bg-[var(--color-surface)]">
                <div className="mb-4">
                  <span className="bg-[var(--color-ink)] text-[var(--color-canvas)] text-xs px-2 py-0.5 border border-[var(--color-border)]">
                    Free • Daily
                  </span>
                </div>
                <h3 className="font-[family-name:var(--font-serif)] text-xl font-medium text-[var(--color-ink)] mb-2">
                  Research Simplified
                </h3>
                <p className="text-base leading-relaxed text-[var(--color-ink)] mb-6">
                  One AI research paper explained clearly every day. Stay at the frontier of AI research — no jargon, just insight.
                </p>
                <Link
                  href="/papers"
                  className="inline-flex items-center text-base font-medium text-[var(--color-accent)] hover:underline underline-offset-4"
                >
                  Browse papers
                  <ArrowRight size={16} className="ml-1" />
                </Link>
              </div>
            </section>

            {/* Author */}
            <section>
              <h2 className="font-[family-name:var(--font-serif)] text-2xl font-medium text-[var(--color-ink)] mb-6 border-b border-[var(--color-border)] pb-2">
                About the Author
              </h2>
              <div className="flex flex-col">
                <img 
                  src="https://github.com/alamshoaib134.png" 
                  alt="Shoaib Alam"
                  className="w-full h-auto grayscale border border-[var(--color-border)] mb-4"
                />
                <h3 className="font-[family-name:var(--font-serif)] text-xl font-medium text-[var(--color-ink)] mb-1">
                  Shoaib Alam
                </h3>
                <p className="text-sm font-medium text-[var(--color-muted)] mb-4">
                  AI Engineer at JPMC &bull; NLP Researcher (IIT Gandhinagar)
                </p>
                <p className="text-base leading-relaxed text-[var(--color-ink)] mb-6">
                  I specialize in building fiduciary-grade hybrid RAG solutions and scalable AI systems for institutional finance. As a pioneer of Hybrid RAG at JPMC and published researcher at EMNLP 2024 (LEGOBench), I bridge the gap between cutting-edge AI research and production-ready enterprise applications.
                </p>
                <a
                  href="https://shoaibalam.vercel.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-base font-medium text-[var(--color-accent)] hover:underline underline-offset-4"
                >
                  View Full Portfolio
                  <ArrowRight size={16} className="ml-1" />
                </a>
              </div>
            </section>
          </div>
        </div>
      </div>

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
