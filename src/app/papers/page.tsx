import { getPapers, getTotalPapersCount } from "@/lib/papers";
import Link from "next/link";
import {
  ArrowLeft,
  Newspaper,
  ArrowRight,
  Calendar,
  User,
} from "@phosphor-icons/react/dist/ssr";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Paper Everyday | AI Academy",
  description:
    "Daily AI research paper breakdowns — one paper explained clearly, every day. Stay current with the frontier of artificial intelligence research.",
};

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function formatAuthors(authors: string): string {
  const list = authors.split(",").map((a) => a.trim());
  if (list.length <= 2) return list.join(", ");
  return `${list[0]} +${list.length - 1} more`;
}

export default function PapersPage() {
  const papers = getPapers(100, 0);
  const total = getTotalPapersCount();

  // Group papers by date (using published_date or gen_timestamp)
  const grouped = new Map<string, typeof papers>();
  for (const p of papers) {
    const dateKey = new Date(p.submitted_on_daily).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    if (!grouped.has(dateKey)) grouped.set(dateKey, []);
    grouped.get(dateKey)!.push(p);
  }

  return (
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

      {/* Header */}
      <section className="animate-fade-in mb-12 text-center">
        <h1 className="font-[family-name:var(--font-serif)] text-3xl font-bold leading-tight tracking-tight text-[var(--color-accent)] sm:text-4xl md:text-5xl">
          <span className="bg-gradient-to-r from-amber-600 to-orange-500 bg-clip-text text-transparent">
            Paper Everyday
          </span>
        </h1>

        <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-[var(--color-accent-light)]">
          One AI research paper, explained clearly — every single day. Skip the
          jargon, get the insight.
        </p>

        <div className="mx-auto mt-6 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-1.5 text-sm text-amber-700">
          <Newspaper size={16} weight="fill" />
          <span>{total} papers explained &amp; growing daily</span>
        </div>
      </section>

      {/* Papers grouped by date — grid like the 30-day course */}
      {Array.from(grouped.entries()).map(([dateLabel, datePapers]) => (
        <section key={dateLabel} className="mb-14">
          {/* Date Header */}
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 text-white">
              <Calendar size={18} weight="duotone" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-accent-light)]">
                Published
              </p>
              <h2 className="font-[family-name:var(--font-serif)] text-xl font-bold text-[var(--color-accent)]">
                {dateLabel}
              </h2>
            </div>
          </div>

          {/* Paper Cards Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {datePapers.map((paper, idx) => {
              const staggerClass = `stagger-${Math.min((idx % 6) + 1, 6)}`;
              return (
                <Link
                  key={paper.paper_id}
                  href={`/papers/${paper.paper_id}`}
                  className={`animate-fade-in ${staggerClass} group relative flex flex-col rounded-2xl border border-[var(--color-border-light)] bg-[var(--color-card)] p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-[var(--color-border)]`}
                >
                  {/* Badge row */}
                  <div className="mb-3 flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                      <Newspaper size={12} weight="fill" />
                      arXiv
                    </span>
                    <span className="text-xs text-[var(--color-accent-light)]">
                      {formatDate(paper.published_date)}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="mb-1.5 font-[family-name:var(--font-serif)] text-base font-bold leading-snug text-[var(--color-accent)] transition-colors group-hover:text-amber-700">
                    {paper.title}
                  </h3>

                  {/* Authors */}
                  <p className="mb-4 flex-1 text-sm leading-relaxed text-[var(--color-accent-light)]">
                    <User size={12} className="mr-1 inline" />
                    {formatAuthors(paper.authors)}
                  </p>

                  {/* Arrow */}
                  <div className="flex items-center text-xs font-medium text-[var(--color-accent-light)] transition-colors group-hover:text-amber-600">
                    <span>Read explanation</span>
                    <ArrowRight
                      size={14}
                      className="ml-1 transition-transform group-hover:translate-x-1"
                    />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
