import { getChapters } from "@/lib/content";
import CourseGuard from "@/components/CourseGuard";
import ProgressBar from "@/components/ProgressBar";
import DayCard from "@/components/DayCard";
import { BookOpen } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";

export default function CourseViewerPage() {
  const chapters = getChapters();
  const totalDays = chapters.reduce((sum, ch) => sum + ch.days.length, 0);

  let globalIndex = 0;

  return (
    <CourseGuard localStorageKey="course_30_days_unlocked">
      <div className="mx-auto max-w-6xl px-6 py-10">
        {/* Breadcrumb */}
        <div className="animate-fade-in mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-[var(--color-accent-light)] transition-colors hover:text-[var(--color-accent)]"
          >
            <ArrowLeft size={14} />
            Back to AI Academy
          </Link>
        </div>

        {/* Course Header */}
        <section className="animate-fade-in mb-12 text-center">
          <h1 className="font-[family-name:var(--font-serif)] text-3xl font-bold leading-tight tracking-tight text-[var(--color-accent)] sm:text-4xl md:text-5xl">
            30 Days of AI Challenge
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-[var(--color-accent-light)]">
            The ultimate guide to the vocabulary, mechanics, and future of
            Artificial Intelligence. From NLP fundamentals to AGI.
          </p>

          {/* Progress Bar */}
          <div className="mx-auto mt-8 max-w-md">
            <ProgressBar totalDays={totalDays} />
          </div>
        </section>

        {/* Chapters */}
        {chapters.map((chapter) => (
          <section key={chapter.chapter} className="mb-14">
            {/* Chapter Header */}
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-accent)] text-white">
                <BookOpen size={18} weight="duotone" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-accent-light)]">
                  Chapter {chapter.chapter}
                </p>
                <h2 className="font-[family-name:var(--font-serif)] text-xl font-bold text-[var(--color-accent)]">
                  {chapter.title}
                </h2>
              </div>
            </div>

            {/* Day Cards Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {chapter.days.map((day) => {
                const idx = globalIndex++;
                return (
                  <DayCard
                    key={day.day}
                    day={day.day}
                    title={day.title}
                    concept={day.concept}
                    index={idx}
                  />
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </CourseGuard>
  );
}
