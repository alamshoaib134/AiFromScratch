import Database from "better-sqlite3";

const DB_PATH =
  process.env.PAPERS_DB_PATH ||
  "/Users/shoaib/Desktop/paper_summ/papers.db";

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
}

let _db: Database.Database | null = null;

function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(DB_PATH, { readonly: true });
  }
  return _db;
}

export function getPapersWithExplanations(
  limit = 20,
  offset = 0
): PaperWithExplanation[] {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT
      r.paper_id,
      r.title,
      r.authors,
      r.published_date,
      r.source_url,
      r.abstract,
      e.explanation,
      e.model_used,
      e.gen_timestamp
    FROM explanations e
    JOIN raw_papers r ON e.paper_id = r.paper_id
    ORDER BY e.gen_timestamp DESC
    LIMIT ? OFFSET ?
  `);
  return stmt.all(limit, offset) as PaperWithExplanation[];
}

export function getPaperById(paper_id: string): PaperWithExplanation | null {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT
      r.paper_id,
      r.title,
      r.authors,
      r.published_date,
      r.source_url,
      r.abstract,
      e.explanation,
      e.model_used,
      e.gen_timestamp
    FROM explanations e
    JOIN raw_papers r ON e.paper_id = r.paper_id
    WHERE e.paper_id = ?
  `);
  return (stmt.get(paper_id) as PaperWithExplanation) ?? null;
}

export function getTotalPapersCount(): number {
  const db = getDb();
  const stmt = db.prepare(`SELECT COUNT(*) as count FROM explanations`);
  const row = stmt.get() as { count: number };
  return row.count;
}
