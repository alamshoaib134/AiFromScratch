import papersData from "@/data/papers.json";

export interface PaperWithExplanation {
  paper_id: string;
  title: string;
  authors: string;
  published_date: string;
  source_url: string;
  abstract: string;
  explanation: string;
  model_used: string;
  gen_timestamp: string;
  arxiv_categories: string | null;
}

// Cast the imported JSON to our interface
// (Updated to trigger hot-reload for new data)
const allPapers = papersData as unknown as PaperWithExplanation[];

/* ─── Slug Utilities ─── */

/**
 * Generates an SEO-friendly slug from a paper title.
 * e.g. "Attention Is All You Need" → "attention-is-all-you-need-explained-simply"
 */
export function generatePaperSlug(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "") // remove special chars
    .replace(/\s+/g, "-")          // spaces → hyphens
    .replace(/-+/g, "-")           // collapse multiple hyphens
    .replace(/^-|-$/g, "")         // trim leading/trailing hyphens
    .slice(0, 80);                 // limit length for URL friendliness
  return `${base}-explained-simply`;
}

/**
 * Returns all papers with their generated slugs.
 */
export function getAllPapersWithSlugs(): (PaperWithExplanation & { slug: string })[] {
  const slugMap = new Map<string, number>();
  return allPapers.map((paper) => {
    let slug = generatePaperSlug(paper.title);
    // Handle duplicate slugs by appending a counter
    const count = slugMap.get(slug) || 0;
    if (count > 0) {
      slug = `${slug}-${count}`;
    }
    slugMap.set(slug.replace(/-\d+$/, ""), count + 1);
    return { ...paper, slug };
  });
}

/**
 * Find a paper by its SEO slug.
 */
export function getPaperBySlug(slug: string): (PaperWithExplanation & { slug: string }) | null {
  const papersWithSlugs = getAllPapersWithSlugs();
  return papersWithSlugs.find((p) => p.slug === slug) || null;
}

/* ─── Original API (unchanged for backward compatibility) ─── */

export function getPapersWithExplanations(
  limit = 20,
  offset = 0
): (PaperWithExplanation & { slug: string })[] {
  const papersWithSlugs = getAllPapersWithSlugs();
  return papersWithSlugs.slice(offset, offset + limit);
}

export function getPaperById(paper_id: string): PaperWithExplanation | null {
  const paper = allPapers.find((p) => p.paper_id === paper_id);
  return paper || null;
}

export function getTotalPapersCount(): number {
  return allPapers.length;
}

