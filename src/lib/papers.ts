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

export function getPapersWithExplanations(
  limit = 20,
  offset = 0
): PaperWithExplanation[] {
  // Data is already ordered by the python script, but we can return a slice
  return allPapers.slice(offset, offset + limit);
}

export function getPaperById(paper_id: string): PaperWithExplanation | null {
  const paper = allPapers.find((p) => p.paper_id === paper_id);
  return paper || null;
}

export function getTotalPapersCount(): number {
  return allPapers.length;
}
