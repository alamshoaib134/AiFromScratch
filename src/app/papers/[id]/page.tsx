import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getPaperById,
  getPapers,
} from "@/lib/papers";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import {
  ArrowLeft,
  ArrowRight,
  Newspaper,
  Article,
  ArrowUpRight,
  Calendar,
  User,
  Robot,
} from "@phosphor-icons/react/dist/ssr";

export const dynamic = "force-dynamic";

interface PaperPageProps {
  params: Promise<{ id: string }>;
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export async function generateMetadata({ params }: PaperPageProps) {
  const { id } = await params;
  const paper = getPaperById(id);

  if (!paper) return { title: "Paper Not Found" };

  return {
    title: `${paper.title} | Paper Everyday`,
    description: paper.abstract?.slice(0, 160),
  };
}

export default async function PaperDetailPage({ params }: PaperPageProps) {
  const { id } = await params;
  const paper = getPaperById(id);

  if (!paper) {
    notFound();
  }

  // Get all papers for the sidebar
  const allPapers = getPapers(100, 0);

  // Find prev/next based on position in the list
  const currentIdx = allPapers.findIndex((p) => p.paper_id === id);
  const prevPaper = currentIdx < allPapers.length - 1 ? allPapers[currentIdx + 1] : null;
  const nextPaper = currentIdx > 0 ? allPapers[currentIdx - 1] : null;

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex gap-10">
        {/* Sidebar — Paper List */}
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-24">
            <h3 className="mb-4 font-[family-name:var(--font-serif)] text-sm font-bold uppercase tracking-wider text-[var(--color-accent-light)]">
              All Papers
            </h3>
            <nav className="flex max-h-[calc(100vh-8rem)] flex-col gap-0.5 overflow-y-auto pr-2">
              {allPapers.map((p) => (
                <Link
                  key={p.paper_id}
                  href={`/papers/${p.paper_id}`}
                  className={`flex items-start gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${p.paper_id === id
                      ? "bg-gradient-to-r from-amber-500 to-orange-500 font-medium text-white"
                      : "text-[var(--color-accent-light)] hover:bg-[var(--color-border-light)] hover:text-[var(--color-accent)]"
                    }`}
                >
                  <Newspaper
                    size={14}
                    weight="fill"
                    className="mt-0.5 shrink-0 opacity-60"
                  />
                  <span className="line-clamp-2">{p.title}</span>
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
              href="/papers"
              className="inline-flex items-center gap-1.5 text-sm text-[var(--color-accent-light)] transition-colors hover:text-[var(--color-accent)]"
            >
              <ArrowLeft size={14} />
              Back to Paper Everyday
            </Link>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
                <Article size={14} weight="fill" />
                arXiv:{paper.paper_id}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                <Robot size={14} weight="fill" />
                {paper.model_used || "AI Explained"}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--color-alabaster)] px-2.5 py-1 text-xs font-semibold text-[var(--color-accent-light)] ring-1 ring-[var(--color-border-light)]">
                <Calendar size={14} />
                {formatDate(paper.published_date)}
              </span>
            </div>

            <h1 className="mt-4 font-[family-name:var(--font-serif)] text-3xl font-bold leading-tight text-[var(--color-accent)] sm:text-4xl">
              {paper.title}
            </h1>

            <p className="mt-2 flex items-center gap-1.5 text-base text-[var(--color-accent-light)]">
              <User size={16} />
              {paper.authors}
            </p>
          </div>

          {/* Abstract */}
          <div className="animate-fade-in mb-6 rounded-xl border border-amber-200/60 bg-amber-50/50 p-5">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-amber-600">
              Abstract
            </h3>
            <p className="text-sm leading-relaxed text-[var(--color-accent-light)]">
              {paper.abstract}
            </p>
          </div>

          {/* Explanation Content */}
          <div className="animate-fade-in rounded-2xl border border-[var(--color-border-light)] bg-white p-8 shadow-sm sm:p-10">
            <MarkdownRenderer content={paper.explanation} />
          </div>

          {/* Navigation + arXiv link */}
          <div className="mt-8 flex flex-col gap-6">
            {/* arXiv link */}
            <div className="flex justify-center">
              <a
                href={paper.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-3 text-sm font-semibold text-white shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg"
              >
                View Original Paper on arXiv
                <ArrowUpRight
                  size={16}
                  className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                />
              </a>
            </div>

            {/* Prev / Next */}
            <div className="flex items-center justify-between">
              {prevPaper ? (
                <Link
                  href={`/papers/${prevPaper.paper_id}`}
                  className="inline-flex max-w-[45%] items-center gap-2 rounded-xl border border-[var(--color-border-light)] bg-white px-5 py-3 text-sm font-medium text-[var(--color-accent-light)] shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md hover:text-[var(--color-accent)]"
                >
                  <ArrowLeft size={16} className="shrink-0" />
                  <span className="truncate">{prevPaper.title}</span>
                </Link>
              ) : (
                <div />
              )}
              {nextPaper ? (
                <Link
                  href={`/papers/${nextPaper.paper_id}`}
                  className="inline-flex max-w-[45%] items-center gap-2 rounded-xl bg-[var(--color-accent)] px-5 py-3 text-sm font-medium text-white shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <span className="truncate">{nextPaper.title}</span>
                  <ArrowRight size={16} className="shrink-0" />
                </Link>
              ) : (
                <div />
              )}
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}
