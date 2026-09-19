import os
import re
import sqlite3
import json

DB_PATH = "/Users/shoaib/Desktop/paper_summ/papers.db"
OUTPUT_PATH = "src/data/papers.json"

def main():
    if not os.path.exists(DB_PATH):
        print(f"Error: {DB_PATH} not found.")
        return

    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    query = """
    SELECT
      r.paper_id,
      r.title,
      r.authors,
      r.published_date,
      r.source_url,
      r.abstract,
      e.explanation,
      e.model_used,
      e.gen_timestamp,
      pd.arxiv_categories
    FROM explanations e
    JOIN raw_papers r ON e.paper_id = r.paper_id
    LEFT JOIN paper_details pd ON e.paper_id = pd.paper_id
    ORDER BY e.gen_timestamp DESC
    """
    cursor.execute(query)
    rows = cursor.fetchall()
    
    papers = [dict(row) for row in rows]
    
    with open(OUTPUT_PATH, 'w') as f:
        json.dump(papers, f, indent=2)
        
    print(f"Successfully exported {len(papers)} papers to {OUTPUT_PATH}")
    
    file_size_mb = os.path.getsize(OUTPUT_PATH) / (1024 * 1024)
    print(f"File size: {file_size_mb:.2f} MB")

if __name__ == "__main__":
    main()
