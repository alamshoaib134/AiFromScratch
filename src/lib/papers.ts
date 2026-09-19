import papersData from "@/data/papers.json";

export interface PaperDetail {
  paper_id: string;
  authors: string;
  title: string;
  abstract: string;
  contents: string;
  references_text: string;
  upvotes: number;
  ai_summary: string;
  ai_keywords: string;
  github_repo: string;
  github_stars: number;
  project_page: string;
  linked_models: string;
  linked_datasets: string;
  discussion_id: string;
  organization: string;
  media_urls: string;
  thumbnail: string;
  submitted_by: string;
  published_date: string;
  submitted_on_daily: string;
  num_comments: number;
  source_url: string;
  load_timestamp: string;
  categories: string;
  arxiv_categories: string;
}

// Cast the imported JSON to our interface
const allPapers = papersData as unknown as PaperDetail[];

export function getPapers(
  limit = 20,
  offset = 0
): PaperDetail[] {
  // Data is already ordered by the python script, but we can return a slice
  return allPapers.slice(offset, offset + limit);
}

export function getPaperById(paper_id: string): PaperDetail | null {
  const paper = allPapers.find((p) => p.paper_id === paper_id);
  return paper || null;
}

export function getTotalPapersCount(): number {
  return allPapers.length;
}
