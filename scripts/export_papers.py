import sqlite3
import json
import os

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
    
    cursor.execute("SELECT * FROM paper_details ORDER BY submitted_on_daily DESC, published_date DESC")
    rows = cursor.fetchall()
    
    papers = []
    for row in rows:
        paper_dict = dict(row)
        # Remove massive text fields not needed by the frontend
        paper_dict.pop('contents', None)
        paper_dict.pop('references_text', None)
        papers.append(paper_dict)
    
    with open(OUTPUT_PATH, 'w') as f:
        json.dump(papers, f, indent=2)
        
    print(f"Successfully exported {len(papers)} papers to {OUTPUT_PATH}")
    
    file_size_mb = os.path.getsize(OUTPUT_PATH) / (1024 * 1024)
    print(f"File size: {file_size_mb:.2f} MB")

if __name__ == "__main__":
    main()
