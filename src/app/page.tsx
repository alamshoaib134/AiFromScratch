import { getChapters } from "@/lib/content";
import ProgressBar from "@/components/ProgressBar";
import DayCard from "@/components/DayCard";
import { Sparkle, BookOpen } from "@phosphor-icons/react/dist/ssr";

export default function HomePage() {
  const chapters = getChapters();
  const totalDays = chapters.reduce((sum, ch) => sum + ch.days.length, 0);

  let globalIndex = 0;

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      {/* Hero Section */}
      <section className="animate-fade-in mb-16 text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--color-border-light)] bg-white px-4 py-1.5 text-sm text-[var(--color-accent-light)] shadow-sm">
          <Sparkle size={16} weight="fill" className="text-amber-500" />
          <span>30 days to transform your understanding of AI</span>
        </div>

        <h1 className="font-[family-name:var(--font-serif)] text-4xl font-bold leading-tight tracking-tight text-[var(--color-accent)] sm:text-5xl md:text-6xl">
          The 30-Day
          <br />
          <span className="bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-light)] bg-clip-text text-transparent">
            AI Challenge
          </span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-[var(--color-accent-light)]">
          From foundational concepts to building real-world applications — master
          Artificial Intelligence with daily lessons, hands-on exercises, and
          practical projects.
        </p>

        {/* Progress Bar */}
        <div className="mx-auto mt-10 max-w-md">
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
  );
}
