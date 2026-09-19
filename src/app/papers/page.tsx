import { getPapersWithExplanations, getTotalPapersCount } from "@/lib/papers";
import Link from "next/link";
import {
  ArrowLeft,
  Newspaper,
  ArrowRight,
  Calendar,
  User,
  Tag,
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

// Color palette for category badges
const CATEGORY_COLORS: Record<string, { bg: string; text: string; ring: string; gradient: string }> = {
  "Artificial Intelligence": { bg: "bg-violet-50", text: "text-violet-700", ring: "ring-violet-200", gradient: "from-violet-500 to-purple-500" },
  "Machine Learning": { bg: "bg-blue-50", text: "text-blue-700", ring: "ring-blue-200", gradient: "from-blue-500 to-cyan-500" },
  "Computer Vision and Pattern Recognition": { bg: "bg-emerald-50", text: "text-emerald-700", ring: "ring-emerald-200", gradient: "from-emerald-500 to-teal-500" },
  "Computation and Language": { bg: "bg-rose-50", text: "text-rose-700", ring: "ring-rose-200", gradient: "from-rose-500 to-pink-500" },
  "Robotics": { bg: "bg-orange-50", text: "text-orange-700", ring: "ring-orange-200", gradient: "from-orange-500 to-amber-500" },
  "Information Retrieval": { bg: "bg-sky-50", text: "text-sky-700", ring: "ring-sky-200", gradient: "from-sky-500 to-blue-500" },
  "Software Engineering": { bg: "bg-indigo-50", text: "text-indigo-700", ring: "ring-indigo-200", gradient: "from-indigo-500 to-violet-500" },
  "Multimedia": { bg: "bg-fuchsia-50", text: "text-fuchsia-700", ring: "ring-fuchsia-200", gradient: "from-fuchsia-500 to-pink-500" },
  "Sound": { bg: "bg-cyan-50", text: "text-cyan-700", ring: "ring-cyan-200", gradient: "from-cyan-500 to-teal-500" },
  "Audio and Speech Processing": { bg: "bg-teal-50", text: "text-teal-700", ring: "ring-teal-200", gradient: "from-teal-500 to-green-500" },
};

const DEFAULT_COLOR = { bg: "bg-slate-50", text: "text-slate-700", ring: "ring-slate-200", gradient: "from-slate-500 to-gray-500" };

function getCategoryColor(category: string) {
  return CATEGORY_COLORS[category] || DEFAULT_COLOR;
}

function parseCategories(arxiv_categories: string | null): string[] {
  if (!arxiv_categories) return ["Uncategorized"];
  try {
    const parsed = JSON.parse(arxiv_categories);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : ["Uncategorized"];
  } catch {
    return ["Uncategorized"];
  }
}

export default function PapersPage() {
  const papers = getPapersWithExplanations(100, 0);
  const total = getTotalPapersCount();

  // Group papers by their primary (first) arxiv category
  const grouped = new Map<string, typeof papers>();
  for (const p of papers) {
    const categories = parseCategories(p.arxiv_categories);
    const primaryCategory = categories[0];
    if (!grouped.has(primaryCategory)) grouped.set(primaryCategory, []);
    grouped.get(primaryCategory)!.push(p);
  }

  // Sort categories by count (most papers first)
  const sortedCategories = Array.from(grouped.entries()).sort(
    (a, b) => b[1].length - a[1].length
  );

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

        {/* Category overview pills */}
        <div className="mx-auto mt-6 flex max-w-3xl flex-wrap items-center justify-center gap-2">
          {sortedCategories.map(([category, catPapers]) => {
            const color = getCategoryColor(category);
            return (
              <a
                key={category}
                href={`#category-${category.toLowerCase().replace(/\s+/g, "-")}`}
                className={`inline-flex items-center gap-1.5 rounded-full ${color.bg} px-3 py-1 text-xs font-medium ${color.text} ring-1 ${color.ring} transition-all hover:shadow-sm hover:scale-105`}
              >
                <Tag size={12} weight="fill" />
                {category}
                <span className="ml-0.5 rounded-full bg-white/70 px-1.5 py-0.5 text-[10px] font-bold">
                  {catPapers.length}
                </span>
              </a>
            );
          })}
        </div>
      </section>

      {/* Papers grouped by category */}
      {sortedCategories.map(([category, catPapers]) => {
        const color = getCategoryColor(category);
        return (
          <section
            key={category}
            id={`category-${category.toLowerCase().replace(/\s+/g, "-")}`}
            className="mb-14 scroll-mt-6"
          >
            {/* Category Header */}
            <div className="mb-6 flex items-center gap-3">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br ${color.gradient} text-white`}
              >
                <Tag size={18} weight="duotone" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-accent-light)]">
                  Category
                </p>
                <h2 className="font-[family-name:var(--font-serif)] text-xl font-bold text-[var(--color-accent)]">
                  {category}
                  <span className="ml-2 text-sm font-normal text-[var(--color-accent-light)]">
                    ({catPapers.length} {catPapers.length === 1 ? "paper" : "papers"})
                  </span>
                </h2>
              </div>
            </div>

            {/* Paper Cards Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {catPapers.map((paper, idx) => {
                const staggerClass = `stagger-${Math.min((idx % 6) + 1, 6)}`;
                const paperCategories = parseCategories(paper.arxiv_categories);
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
                        <Calendar size={12} className="mr-1 inline" />
                        {formatDate(paper.published_date)}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="mb-1.5 font-[family-name:var(--font-serif)] text-base font-bold leading-snug text-[var(--color-accent)] transition-colors group-hover:text-amber-700">
                      {paper.title}
                    </h3>

                    {/* Authors */}
                    <p className="mb-3 text-sm leading-relaxed text-[var(--color-accent-light)]">
                      <User size={12} className="mr-1 inline" />
                      {formatAuthors(paper.authors)}
                    </p>

                    {/* Category tags */}
                    <div className="mb-4 flex flex-1 flex-wrap gap-1">
                      {paperCategories.map((cat) => {
                        const catColor = getCategoryColor(cat);
                        return (
                          <span
                            key={cat}
                            className={`inline-flex items-center rounded-md ${catColor.bg} px-1.5 py-0.5 text-[10px] font-medium ${catColor.text}`}
                          >
                            {cat}
                          </span>
                        );
                      })}
                    </div>

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
        );
      })}
    </div>
  );
}
