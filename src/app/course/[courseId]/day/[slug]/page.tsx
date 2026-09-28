import { notFound } from "next/navigation";
import Link from "next/link";
import { getDayContent, getAllDays } from "@/lib/content";
import { courses, getCourseById } from "@/lib/courses";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import CompletionButton from "@/components/CompletionButton";
import CourseGuard from "@/components/CourseGuard";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Clock,
} from "@phosphor-icons/react/dist/ssr";

interface DayPageProps {
  params: Promise<{ courseId: string; slug: string }>;
}

export function generateStaticParams() {
  const params: { courseId: string; slug: string }[] = [];
  for (const course of courses) {
    if (course.status !== "available") continue;
    const days = getAllDays(course.id);
    for (const day of days) {
      params.push({ courseId: course.id, slug: `${day.day}` });
    }
  }
  return params;
}

export async function generateMetadata({ params }: DayPageProps) {
  const { courseId, slug } = await params;
  const course = getCourseById(courseId);
  if (!course) return { title: "Course Not Found" };

  const dayNum = parseInt(slug, 10);
  const day = getDayContent(courseId, dayNum);

  if (!day) return { title: "Day Not Found" };

  return {
    title: `Day ${day.day}: ${day.title} | ${course.title}`,
    description: day.concept,
  };
}

export default async function DayPage({ params }: DayPageProps) {
  const { courseId, slug } = await params;
  const course = getCourseById(courseId);
  if (!course) notFound();

  const dayNum = parseInt(slug, 10);

  if (isNaN(dayNum) || dayNum < 1 || dayNum > 30) {
    notFound();
  }

  const day = getDayContent(courseId, dayNum);
  if (!day) notFound();

  const allDays = getAllDays(courseId);
  const prevDay = dayNum > 1 ? dayNum - 1 : null;
  // TODO: Fix hardcoded 30 nextDay check if dynamic length is needed, for now use allDays.length
  const nextDay = dayNum < allDays.length ? dayNum + 1 : null;

  return (
    <CourseGuard localStorageKey={course.localStorageKey} courseId={courseId}>
      <div className="course-layout flex min-h-[calc(100vh-4rem)]">
        {/* Sidebar — fixed, independently scrollable */}
        <aside className="course-sidebar hidden w-72 shrink-0 border-r border-[var(--color-border-light)] bg-white lg:block">
          <div className="sticky top-16 flex h-[calc(100vh-4rem)] flex-col">
            {/* Sidebar header */}
            <div className="border-b border-[var(--color-border-light)] px-5 py-4">
              <Link
                href={`/course/${courseId}`}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--color-accent-light)] transition-colors hover:text-[var(--color-accent)]"
              >
                <ArrowLeft size={12} />
                Back to {course.title}
              </Link>
              <h3 className="mt-2 font-[family-name:var(--font-serif)] text-sm font-bold uppercase tracking-wider text-[var(--color-accent)]">
                Course Content
              </h3>
            </div>

            {/* Scrollable lesson list */}
            <nav className="flex-1 overflow-y-auto px-3 py-3">
              <div className="flex flex-col gap-0.5">
                {allDays.map((d) => (
                  <Link
                    key={d.day}
                    href={`/course/${courseId}/day/${d.day}`}
                    className={`group flex items-start gap-3 rounded-lg px-3 py-2.5 text-sm transition-all ${
                      d.day === dayNum
                        ? "bg-[var(--color-accent)] font-medium text-white shadow-sm"
                        : "text-[var(--color-accent-light)] hover:bg-[var(--color-alabaster)] hover:text-[var(--color-accent)]"
                    }`}
                  >
                    <span
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                        d.day === dayNum
                          ? "bg-white/20 text-white"
                          : "bg-[var(--color-border-light)] text-[var(--color-accent-light)] group-hover:bg-[var(--color-border)]"
                      }`}
                    >
                      {d.day}
                    </span>
                    <span className="leading-snug">{d.title}</span>
                  </Link>
                ))}
              </div>
            </nav>
          </div>
        </aside>

        {/* Main Content — full remaining width */}
        <article className="min-w-0 flex-1">
          {/* Top bar with chapter + day badge */}
          <div className="sticky top-16 z-10 border-b border-[var(--color-border-light)] bg-[var(--color-alabaster)]/95 backdrop-blur-sm">
            <div className="mx-auto flex max-w-5xl items-center justify-between px-8 py-3 xl:px-12">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--color-accent)]/10 px-3 py-1 text-xs font-semibold text-[var(--color-accent)]">
                  <BookOpen size={14} weight="duotone" />
                  Chapter {day.chapter}: {day.chapterTitle}
                </span>
                <span className="rounded-lg bg-white px-2.5 py-1 text-xs font-semibold text-[var(--color-accent-light)] ring-1 ring-[var(--color-border-light)]">
                  DAY {day.day}
                </span>
              </div>
              <div className="hidden items-center gap-3 sm:flex">
                {prevDay && (
                  <Link
                    href={`/course/${courseId}/day/${prevDay}`}
                    className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-[var(--color-accent-light)] transition-colors hover:bg-[var(--color-border-light)] hover:text-[var(--color-accent)]"
                  >
                    <ArrowLeft size={12} />
                    Prev
                  </Link>
                )}
                {nextDay && (
                  <Link
                    href={`/course/${courseId}/day/${nextDay}`}
                    className="inline-flex items-center gap-1 rounded-lg bg-[var(--color-accent)] px-2.5 py-1.5 text-xs font-medium text-white transition-all hover:opacity-90"
                  >
                    Next
                    <ArrowRight size={12} />
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Content area */}
          <div className="mx-auto max-w-5xl px-8 py-10 xl:px-12">
            {/* Title section */}
            <div className="animate-fade-in mb-10">
              <h1 className="font-[family-name:var(--font-serif)] text-3xl font-bold leading-tight text-[var(--color-accent)] sm:text-4xl lg:text-[2.75rem]">
                {day.title}
              </h1>
              <p className="mt-3 text-lg leading-relaxed text-[var(--color-accent-light)]">
                {day.concept}
              </p>
            </div>

            {/* Markdown Content — wide, no cramped card wrapper */}
            <div className="animate-fade-in course-content">
              <MarkdownRenderer content={day.content} />
            </div>

            {/* Completion + Navigation */}
            <div className="mt-16 border-t border-[var(--color-border-light)] pt-8">
              {/* Mark Complete */}
              <div className="flex justify-center">
                <CompletionButton day={day.day} courseId={courseId} />
              </div>

              {/* Prev / Next — full-width cards */}
              <div className="mt-8 grid grid-cols-2 gap-4">
                {prevDay ? (
                  <Link
                    href={`/course/${courseId}/day/${prevDay}`}
                    className="group flex flex-col rounded-xl border border-[var(--color-border-light)] bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <span className="flex items-center gap-1.5 text-xs font-medium text-[var(--color-accent-light)]">
                      <ArrowLeft size={12} />
                      Previous Lesson
                    </span>
                    <span className="mt-1 font-[family-name:var(--font-serif)] text-base font-semibold text-[var(--color-accent)]">
                      Day {prevDay}
                    </span>
                  </Link>
                ) : (
                  <div />
                )}
                {nextDay ? (
                  <Link
                    href={`/course/${courseId}/day/${nextDay}`}
                    className="group flex flex-col items-end rounded-xl bg-[var(--color-accent)] p-5 text-right text-white shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg"
                  >
                    <span className="flex items-center gap-1.5 text-xs font-medium text-white/70">
                      Next Lesson
                      <ArrowRight size={12} />
                    </span>
                    <span className="mt-1 font-[family-name:var(--font-serif)] text-base font-semibold">
                      Day {nextDay}
                    </span>
                  </Link>
                ) : (
                  <div />
                )}
              </div>
            </div>
          </div>
        </article>
      </div>
    </CourseGuard>
  );
}
