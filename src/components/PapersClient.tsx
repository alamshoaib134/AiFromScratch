"use client";

import { useState, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Article,
  ArrowUpRight,
  CaretDown,
  CaretUp,
  MagnifyingGlass,
  Spinner,
  Newspaper,
  Calendar,
  User,
  Robot,
} from "@phosphor-icons/react";

interface Paper {
  paper_id: string;
  title: string;
  authors: string;
  published_date: string;
  source_url: string;
  abstract: string;
  explanation: string;
  model_used: string;
  gen_timestamp: string;
}

interface PapersClientProps {
  initialPapers: Paper[];
  total: number;
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

function formatAuthors(authors: string): string {
  const list = authors.split(",").map((a) => a.trim());
  if (list.length <= 3) return list.join(", ");
  return `${list.slice(0, 3).join(", ")} +${list.length - 3} more`;
}

function PaperCard({ paper, index }: { paper: Paper; index: number }) {
  const [expanded, setExpanded] = useState(false);

  const staggerClass = `stagger-${Math.min(index + 1, 6)}`;

  return (
    <article
      className={`animate-fade-in ${staggerClass} overflow-hidden rounded-2xl border border-[var(--color-border-light)] bg-white shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5`}
    >
      {/* Card Header */}
      <div className="p-6 pb-4">
        {/* Badge row */}
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
            <Article size={12} weight="fill" />
            arXiv:{paper.paper_id}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
            <Robot size={12} weight="fill" />
            {paper.model_used || "AI Explained"}
          </span>
        </div>

        {/* Title */}
        <h2 className="mb-3 font-[family-name:var(--font-serif)] text-xl font-bold leading-snug text-[var(--color-accent)]">
          {paper.title}
        </h2>

        {/* Meta */}
        <div className="mb-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--color-accent-light)]">
          <span className="flex items-center gap-1">
            <User size={12} />
            {formatAuthors(paper.authors)}
          </span>
          <span className="flex items-center gap-1">
            <Calendar size={12} />
            {formatDate(paper.published_date)}
          </span>
        </div>

        {/* Abstract preview */}
        <p className="line-clamp-3 text-sm leading-relaxed text-[var(--color-accent-light)]">
          {paper.abstract}
        </p>
      </div>

      {/* Explanation accordion */}
      <div className="border-t border-[var(--color-border-light)]">
        <button
          onClick={() => setExpanded(!expanded)}
          className="group flex w-full items-center justify-between px-6 py-4 text-sm font-semibold text-[var(--color-accent)] transition-colors hover:bg-[var(--color-alabaster)]"
          aria-expanded={expanded}
          id={`paper-toggle-${paper.paper_id}`}
        >
          <span className="flex items-center gap-2">
            <Newspaper size={16} weight="duotone" className="text-amber-500" />
            {expanded ? "Hide Explanation" : "Read Full Explanation"}
          </span>
          {expanded ? (
            <CaretUp size={16} className="transition-transform group-hover:text-amber-500" />
          ) : (
            <CaretDown size={16} className="transition-transform group-hover:text-amber-500" />
          )}
        </button>

        {expanded && (
          <div className="animate-fade-in border-t border-[var(--color-border-light)] bg-[var(--color-alabaster)] px-6 py-6">
            <div className="prose prose-sm max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {paper.explanation}
              </ReactMarkdown>
            </div>

            <div className="mt-6 flex items-center justify-between">
              <p className="text-xs text-[var(--color-border)]">
                Generated {formatDate(paper.gen_timestamp)}
              </p>
              <a
                href={paper.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border-light)] bg-white px-4 py-1.5 text-xs font-semibold text-[var(--color-accent)] shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                id={`paper-arxiv-${paper.paper_id}`}
              >
                View on arXiv
                <ArrowUpRight
                  size={12}
                  className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                />
              </a>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}

export default function PapersClient({
  initialPapers,
  total,
}: PapersClientProps) {
  const [papers, setPapers] = useState<Paper[]>(initialPapers);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [offset, setOffset] = useState(initialPapers.length);
  const [hasMore, setHasMore] = useState(initialPapers.length < total);

  // Client-side search filter
  const filtered = query.trim()
    ? papers.filter(
      (p) =>
        p.title.toLowerCase().includes(query.toLowerCase()) ||
        p.authors.toLowerCase().includes(query.toLowerCase())
    )
    : papers;

  const loadMore = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/papers?limit=10&offset=${offset}`);
      const data = await res.json();
      setPapers((prev) => [...prev, ...data.papers]);
      setOffset((prev) => prev + data.papers.length);
      setHasMore(offset + data.papers.length < data.total);
    } catch (e) {
      console.error("Failed to load more papers:", e);
    } finally {
      setLoading(false);
    }
  }, [loading, offset]);

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      {/* Hero */}
      <section className="animate-fade-in mb-12 text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--color-border-light)] bg-white px-4 py-1.5 text-sm text-[var(--color-accent-light)] shadow-sm">
          <Newspaper size={16} weight="fill" className="text-amber-500" />
          <span>{total} papers explained &amp; growing daily</span>
        </div>

        <h1 className="font-[family-name:var(--font-serif)] text-4xl font-bold leading-tight tracking-tight text-[var(--color-accent)] sm:text-5xl">
          <span className="bg-gradient-to-r from-amber-600 to-orange-500 bg-clip-text text-transparent">
            Paper Everyday
          </span>
        </h1>

        <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-[var(--color-accent-light)]">
          One AI research paper, explained clearly — every single day. Skip the
          jargon, get the insight.
        </p>
      </section>

      {/* Search */}
      <div className="animate-fade-in stagger-2 mb-8">
        <div className="relative">
          <MagnifyingGlass
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-border)]"
          />
          <input
            type="search"
            placeholder="Search papers by title or author…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            id="papers-search"
            className="w-full rounded-xl border border-[var(--color-border-light)] bg-white py-3 pl-11 pr-4 text-sm text-[var(--color-accent)] placeholder-[var(--color-border)] shadow-sm outline-none transition-all focus:border-[var(--color-accent-light)] focus:ring-2 focus:ring-[var(--color-accent-light)]/20"
          />
        </div>
        {query && (
          <p className="mt-2 text-xs text-[var(--color-accent-light)]">
            Showing {filtered.length} result{filtered.length !== 1 ? "s" : ""}{" "}
            for &ldquo;{query}&rdquo;
          </p>
        )}
      </div>

      {/* Stats strip */}
      <div className="animate-fade-in stagger-2 mb-8 grid grid-cols-3 gap-4">
        {[
          { label: "Papers Explained", value: total },
          { label: "Loaded", value: papers.length },
          { label: "Showing", value: filtered.length },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="rounded-xl border border-[var(--color-border-light)] bg-white p-4 text-center shadow-sm"
          >
            <p className="font-[family-name:var(--font-serif)] text-2xl font-bold text-[var(--color-accent)]">
              {value}
            </p>
            <p className="mt-0.5 text-xs text-[var(--color-accent-light)]">
              {label}
            </p>
          </div>
        ))}
      </div>

      {/* Paper List */}
      <div className="space-y-5">
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--color-border)] py-16 text-center text-[var(--color-accent-light)]">
            <Article size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">No papers found</p>
            <p className="mt-1 text-sm">Try a different search term</p>
          </div>
        ) : (
          filtered.map((paper, i) => (
            <PaperCard key={paper.paper_id} paper={paper} index={i} />
          ))
        )}
      </div>

      {/* Load More */}
      {!query && hasMore && (
        <div className="mt-10 flex justify-center">
          <button
            onClick={loadMore}
            disabled={loading}
            id="papers-load-more"
            className="group inline-flex items-center gap-2 rounded-full border border-[var(--color-border-light)] bg-white px-6 py-3 text-sm font-semibold text-[var(--color-accent)] shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md disabled:opacity-50"
          >
            {loading ? (
              <>
                <Spinner size={16} className="animate-spin" />
                Loading…
              </>
            ) : (
              <>
                Load More Papers
                <CaretDown size={16} className="group-hover:translate-y-0.5 transition-transform" />
              </>
            )}
          </button>
        </div>
      )}

      {!hasMore && papers.length > 0 && !query && (
        <p className="mt-8 text-center text-xs text-[var(--color-border)]">
          You&apos;ve read through all {total} papers. Check back tomorrow for more!
        </p>
      )}
    </div>
  );
}
