import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import {
  getAllPapersWithSlugs,
  getPaperBySlug,
  getPaperById,
} from "@/lib/papers";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import {
  ArrowLeft,
  ArrowRight,
  Article,
  ArrowUpRight,
  Calendar,
  User,
  Robot,
  BookOpen,
} from "@phosphor-icons/react/dist/ssr";

const BASE_URL = "https://aieveryday.vercel.app";

/* ─── Static Generation (SSG) ─── */

/**
 * Pre-renders all paper pages at build time.
 * Each paper gets its own statically generated HTML page
 * with an SEO-friendly slug URL.
 */
export function generateStaticParams() {
  const papers = getAllPapersWithSlugs();
  return papers.map((paper) => ({
    slug: paper.slug,
  }));
}

// Allow dynamic params so old arXiv ID URLs can be caught and redirected
export const dynamicParams = true;

/* ─── Dynamic SEO Metadata ─── */

interface PaperPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: PaperPageProps): Promise<Metadata> {
  const { slug } = await params;
  const paper = getPaperBySlug(slug);

  if (!paper) {
    return { title: "Paper Not Found | AI Academy" };
  }

  const seoTitle = `${paper.title} Explained for Beginners | AI Academy`;
  const seoDescription = paper.abstract?.slice(0, 155) + "…";

  return {
    title: { absolute: seoTitle },
    description: seoDescription,
    keywords: [
      paper.title,
      `${paper.title} explained`,
      `${paper.title} summary`,
      "AI research paper explained",
      "AI paper for beginners",
      "AI Academy paper breakdown",
    ],
    alternates: {
      canonical: `${BASE_URL}/papers/${slug}`,
    },
    openGraph: {
      title: seoTitle,
      description: seoDescription,
      url: `${BASE_URL}/papers/${slug}`,
      siteName: "AI Academy",
      type: "article",
      locale: "en_US",
      publishedTime: paper.published_date,
      authors: paper.authors.split(",").map((a) => a.trim()),
    },
    twitter: {
      card: "summary_large_image",
      title: seoTitle,
      description: seoDescription,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-snippet": -1,
      },
    },
  };
}

/* ─── Helpers ─── */

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

function formatAuthors(authors: string): string {
  const list = authors.split(",").map((a) => a.trim());
  if (list.length <= 3) return list.join(", ");
  return `${list.slice(0, 3).join(", ")} +${list.length - 3} more`;
}

function parseCategories(arxiv_categories: string | null): string[] {
  if (!arxiv_categories) return [];
  try {
    const parsed = JSON.parse(arxiv_categories);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/* ─── Page Component ─── */

export default async function PaperSlugPage({ params }: PaperPageProps) {
  const { slug } = await params;
  const paper = getPaperBySlug(slug);

  if (!paper) {
    // Check if this is a legacy arXiv ID URL (e.g., /papers/2609.11085)
    // ArXiv IDs contain a dot — slugs never do
    if (slug.includes(".")) {
      const legacyPaper = getPaperById(slug);
      if (legacyPaper) {
        const allPapers = getAllPapersWithSlugs();
        const match = allPapers.find((p) => p.paper_id === slug);
        if (match) {
          redirect(`/papers/${match.slug}`);
        }
      }
    }
    notFound();
  }

  // Get all papers for prev/next navigation
  const allPapers = getAllPapersWithSlugs();
  const currentIdx = allPapers.findIndex((p) => p.slug === slug);
  const prevPaper =
    currentIdx < allPapers.length - 1 ? allPapers[currentIdx + 1] : null;
  const nextPaper = currentIdx > 0 ? allPapers[currentIdx - 1] : null;

  const categories = parseCategories(paper.arxiv_categories);

  // JSON-LD structured data for this specific paper
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: `${paper.title} Explained for Beginners`,
    description: paper.abstract?.slice(0, 300),
    url: `${BASE_URL}/papers/${slug}`,
    datePublished: paper.published_date,
    dateModified: paper.gen_timestamp,
    author: paper.authors.split(",").map((a) => ({
      "@type": "Person",
      name: a.trim(),
    })),
    publisher: {
      "@type": "EducationalOrganization",
      name: "AI Academy",
      url: BASE_URL,
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${BASE_URL}/papers/${slug}`,
    },
    about: {
      "@type": "ScholarlyArticle",
      name: paper.title,
      url: paper.source_url,
    },
  };

  return (
    <>
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />

      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex gap-10">
          {/* Sidebar — Paper List */}
          <aside className="hidden w-64 shrink-0 lg:block">
            <div className="sticky top-24">
              <h3 className="mb-4 font-[family-name:var(--font-serif)] text-sm font-bold uppercase tracking-wider text-[var(--color-muted)]">
                All Papers
              </h3>
              <nav className="flex max-h-[calc(100vh-8rem)] flex-col gap-0.5 overflow-y-auto pr-2">
                {allPapers.map((p) => (
                  <Link
                    key={p.paper_id}
                    href={`/papers/${p.slug}`}
                    className={`flex items-start gap-2 px-3 py-2 text-sm transition-colors border border-transparent ${
                      p.slug === slug
                        ? "bg-[var(--color-ink)] font-medium text-[var(--color-canvas)]"
                        : "text-[var(--color-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-ink)]"
                    }`}
                  >
                    <BookOpen
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
            <nav className="mb-8" aria-label="Breadcrumb">
              <Link
                href="/papers"
                className="inline-flex items-center gap-1.5 text-sm text-[var(--color-muted)] transition-colors hover:text-[var(--color-ink)]"
              >
                <ArrowLeft size={14} />
                Back to Paper Everyday
              </Link>
            </nav>

            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="inline-flex items-center gap-1.5 bg-[var(--color-ink)] text-[var(--color-canvas)] px-3 py-1 text-xs font-medium border border-[var(--color-border)]">
                <Article size={14} weight="fill" />
                arXiv:{paper.paper_id}
              </span>
              <span className="inline-flex items-center gap-1.5 border border-[var(--color-border)] px-3 py-1 text-xs font-medium text-[var(--color-ink)]">
                <Robot size={14} weight="fill" />
                {paper.model_used || "AI Explained"}
              </span>
              <span className="inline-flex items-center gap-1.5 border border-[var(--color-border)] px-3 py-1 text-xs font-medium text-[var(--color-muted)]">
                <Calendar size={14} />
                {formatDate(paper.published_date)}
              </span>
            </div>

            {/* Title — H1 with SEO-optimized text */}
            <h1 className="font-[family-name:var(--font-serif)] text-3xl font-medium leading-tight text-[var(--color-ink)] sm:text-4xl mb-2">
              {paper.title}
              <span className="block text-xl text-[var(--color-muted)] font-normal mt-1">
                Explained for Beginners
              </span>
            </h1>

            {/* Authors */}
            <p className="flex items-center gap-1.5 text-base text-[var(--color-muted)] mb-2">
              <User size={16} />
              {formatAuthors(paper.authors)}
            </p>

            {/* Category tags */}
            {categories.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-8">
                {categories.map((cat) => (
                  <span
                    key={cat}
                    className="inline-flex items-center border border-[var(--color-border-light)] px-2 py-0.5 text-xs text-[var(--color-muted)]"
                  >
                    {cat}
                  </span>
                ))}
              </div>
            )}

            {/* Abstract */}
            <div className="border-l-4 border-[var(--color-border)] bg-[var(--color-surface)] p-6 mb-8">
              <h2 className="font-[family-name:var(--font-serif)] text-sm font-medium uppercase tracking-wider text-[var(--color-muted)] mb-2">
                Abstract
              </h2>
              <p className="text-sm leading-relaxed text-[var(--color-ink)]">
                {paper.abstract}
              </p>
            </div>

            {/* Explanation Content */}
            <div className="border border-[var(--color-border)] bg-[var(--color-surface)] p-8 sm:p-10 mb-8">
              <MarkdownRenderer content={paper.explanation} />
            </div>

            {/* arXiv Link */}
            <div className="flex justify-center mb-8">
              <a
                href={paper.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 border-2 border-[var(--color-border)] bg-[var(--color-ink)] px-6 py-3 text-sm font-medium text-[var(--color-canvas)] transition-colors hover:bg-[var(--color-accent)] hover:border-[var(--color-accent)]"
              >
                View Original Paper on arXiv
                <ArrowUpRight size={16} />
              </a>
            </div>

            {/* Prev / Next Navigation */}
            <div className="flex items-stretch justify-between gap-4 mb-8">
              {prevPaper ? (
                <Link
                  href={`/papers/${prevPaper.slug}`}
                  className="flex-1 flex items-center gap-3 border border-[var(--color-border)] p-4 transition-colors hover:bg-[var(--color-surface)] group"
                >
                  <ArrowLeft
                    size={16}
                    className="shrink-0 text-[var(--color-muted)] group-hover:text-[var(--color-ink)]"
                  />
                  <div className="min-w-0">
                    <span className="text-xs text-[var(--color-muted)] block">
                      Previous Paper
                    </span>
                    <span className="text-sm font-medium text-[var(--color-ink)] line-clamp-1">
                      {prevPaper.title}
                    </span>
                  </div>
                </Link>
              ) : (
                <div className="flex-1" />
              )}
              {nextPaper ? (
                <Link
                  href={`/papers/${nextPaper.slug}`}
                  className="flex-1 flex items-center justify-end gap-3 border border-[var(--color-border)] p-4 transition-colors hover:bg-[var(--color-surface)] group text-right"
                >
                  <div className="min-w-0">
                    <span className="text-xs text-[var(--color-muted)] block">
                      Next Paper
                    </span>
                    <span className="text-sm font-medium text-[var(--color-ink)] line-clamp-1">
                      {nextPaper.title}
                    </span>
                  </div>
                  <ArrowRight
                    size={16}
                    className="shrink-0 text-[var(--color-muted)] group-hover:text-[var(--color-ink)]"
                  />
                </Link>
              ) : (
                <div className="flex-1" />
              )}
            </div>

            {/* CTA to course */}
            <div className="border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center">
              <p className="text-base text-[var(--color-ink)] mb-3">
                Want to understand AI papers like this from scratch?
              </p>
              <Link
                href="/learn-ai-roadmap"
                className="inline-flex items-center gap-2 text-base font-medium text-[var(--color-accent)] hover:underline underline-offset-4"
              >
                Follow the free AI Learning Roadmap →
              </Link>
            </div>
          </article>
        </div>
      </div>
    </>
  );
}
