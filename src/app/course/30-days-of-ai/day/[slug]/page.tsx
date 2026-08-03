import { notFound } from "next/navigation";
import Link from "next/link";
import { getDayContent, getAllDays } from "@/lib/content";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import CompletionButton from "@/components/CompletionButton";
import CourseGuard from "@/components/CourseGuard";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
} from "@phosphor-icons/react/dist/ssr";

interface DayPageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  const days = getAllDays();
  return days.map((day) => ({ slug: `${day.day}` }));
}

export async function generateMetadata({ params }: DayPageProps) {
  const { slug } = await params;
  const dayNum = parseInt(slug, 10);
  const day = getDayContent(dayNum);

  if (!day) return { title: "Day Not Found" };

  return {
    title: `Day ${day.day}: ${day.title} | 30-Day AI Challenge`,
    description: day.concept,
  };
}

export default async function DayPage({ params }: DayPageProps) {
  const { slug } = await params;
  const dayNum = parseInt(slug, 10);

  if (isNaN(dayNum) || dayNum < 1 || dayNum > 30) {
    notFound();
  }

  const day = getDayContent(dayNum);
  if (!day) notFound();

  const allDays = getAllDays();
  const prevDay = dayNum > 1 ? dayNum - 1 : null;
  const nextDay = dayNum < 30 ? dayNum + 1 : null;

  return (
    <CourseGuard localStorageKey="course_30_days_unlocked">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex gap-10">
          {/* Sidebar — Day List */}
          <aside className="hidden w-64 shrink-0 lg:block">
            <div className="sticky top-24">
              <h3 className="mb-4 font-[family-name:var(--font-serif)] text-sm font-bold uppercase tracking-wider text-[var(--color-accent-light)]">
                All Lessons
              </h3>
              <nav className="flex flex-col gap-0.5">
                {allDays.map((d) => (
                  <Link
                    key={d.day}
                    href={`/course/30-days-of-ai/day/${d.day}`}
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                      d.day === dayNum
                        ? "bg-[var(--color-accent)] font-medium text-white"
                        : "text-[var(--color-accent-light)] hover:bg-[var(--color-border-light)] hover:text-[var(--color-accent)]"
                    }`}
                  >
                    <span className="w-6 shrink-0 text-xs opacity-60">
                      {d.day}
                    </span>
                    <span className="truncate">{d.title}</span>
                  </Link>
                ))}
              </nav>
            </div>
          </aside>

          {/* Main Content */}
          <article className="min-w-0 flex-1">
            {/* Breadcrumb */}
            <div className="animate-fade-in mb-8">
              <Link
                href="/course/30-days-of-ai"
                className="inline-flex items-center gap-1.5 text-sm text-[var(--color-accent-light)] transition-colors hover:text-[var(--color-accent)]"
              >
                <ArrowLeft size={14} />
                Back to 30 Days of AI
              </Link>

              <div className="mt-4 flex items-center gap-3">
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--color-accent)]/10 px-3 py-1 text-xs font-semibold text-[var(--color-accent)]">
                  <BookOpen size={14} weight="duotone" />
                  Chapter {day.chapter}: {day.chapterTitle}
                </span>
                <span className="rounded-lg bg-[var(--color-alabaster)] px-2.5 py-1 text-xs font-semibold text-[var(--color-accent-light)] ring-1 ring-[var(--color-border-light)]">
                  DAY {day.day}
                </span>
              </div>

              <h1 className="mt-4 font-[family-name:var(--font-serif)] text-3xl font-bold leading-tight text-[var(--color-accent)] sm:text-4xl">
                {day.title}
              </h1>
              <p className="mt-2 text-lg text-[var(--color-accent-light)]">
                {day.concept}
              </p>
            </div>

            {/* Markdown Content */}
            <div className="animate-fade-in rounded-2xl border border-[var(--color-border-light)] bg-white p-8 shadow-sm sm:p-10">
              <MarkdownRenderer content={day.content} />
            </div>

            {/* Completion + Navigation */}
            <div className="mt-8 flex flex-col gap-6">
              {/* Mark Complete */}
              <div className="flex justify-center">
                <CompletionButton day={day.day} />
              </div>

              {/* Prev / Next */}
              <div className="flex items-center justify-between">
                {prevDay ? (
                  <Link
                    href={`/course/30-days-of-ai/day/${prevDay}`}
                    className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-border-light)] bg-white px-5 py-3 text-sm font-medium text-[var(--color-accent-light)] shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md hover:text-[var(--color-accent)]"
                  >
                    <ArrowLeft size={16} />
                    Day {prevDay}
                  </Link>
                ) : (
                  <div />
                )}
                {nextDay ? (
                  <Link
                    href={`/course/30-days-of-ai/day/${nextDay}`}
                    className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-accent)] px-5 py-3 text-sm font-medium text-white shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg"
                  >
                    Day {nextDay}
                    <ArrowRight size={16} />
                  </Link>
                ) : (
                  <div />
                )}
              </div>
            </div>
          </article>
        </div>
      </div>
    </CourseGuard>
  );
}
