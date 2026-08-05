import os
import re

CONTENT_DIR = "content"
OVERVIEW_FILE = os.path.join(CONTENT_DIR, "overview.md")

def parse_overview():
    days = {}
    current_chapter_num = 0
    current_chapter_title = ""
    
    with open(OVERVIEW_FILE, 'r') as f:
        lines = f.readlines()
        
    for line in lines:
        chapter_match = re.match(r'^## Chapter (\d+): (.*)', line)
        if chapter_match:
            current_chapter_num = int(chapter_match.group(1))
            current_chapter_title = chapter_match.group(2).split(' · ')[0].strip()
            continue
            
        # Match table rows: | 1 | NLP | The bridge... |
        row_match = re.match(r'^\|\s*(\d+)\s*\|\s*([^\|]+?)\s*\|\s*([^\|]+?)\s*\|', line)
        if row_match:
            day = int(row_match.group(1))
            topic = row_match.group(2).strip()
            concept = row_match.group(3).strip()
            days[day] = {
                "title": topic,
                "day": day,
                "concept": concept,
                "chapter": current_chapter_num,
                "chapterTitle": current_chapter_title
            }
    return days

def update_frontmatter(file_path, day_info):
    with open(file_path, 'r') as f:
        content = f.read()
        
    # Find frontmatter block
    frontmatter_pattern = re.compile(r'^---\n(.*?)\n---', re.DOTALL)
    match = frontmatter_pattern.search(content)
    
    if not match:
        return
        
    new_frontmatter = f"""---
title: "{day_info['title']}"
day: {day_info['day']}
concept: "{day_info['concept']}"
chapter: {day_info['chapter']}
chapterTitle: "{day_info['chapterTitle']}"
---"""
    
    new_content = content[:match.start()] + new_frontmatter + content[match.end():]
    with open(file_path, 'w') as f:
        f.write(new_content)

def main():
    days = parse_overview()
    print("Parsed days:", len(days))
    
    # 1. Swap files first!
    # Vector DB (day 4) -> tmp
    os.rename(os.path.join(CONTENT_DIR, "day-4.md"), os.path.join(CONTENT_DIR, "tmp-7.md"))
    # Attention (day 5) -> day-4
    os.rename(os.path.join(CONTENT_DIR, "day-5.md"), os.path.join(CONTENT_DIR, "day-4.md"))
    # Hallucinations (day 6) -> day-5
    os.rename(os.path.join(CONTENT_DIR, "day-6.md"), os.path.join(CONTENT_DIR, "day-5.md"))
    # tmp (Vector DB) -> day-7
    os.rename(os.path.join(CONTENT_DIR, "tmp-7.md"), os.path.join(CONTENT_DIR, "day-7.md"))
    
    # day-6.md is now gone (it was moved to 5). We will generate it later, but for now we create a dummy one
    with open(os.path.join(CONTENT_DIR, "day-6.md"), 'w') as f:
        f.write("---\n---\n\nDay 6: RAG\n")
        
    # Update headers
    def fix_header(day_file, old_day_str, new_day_str):
        p = os.path.join(CONTENT_DIR, day_file)
        with open(p, 'r') as f:
            c = f.read()
        c = c.replace(f"Day {old_day_str}:", f"Day {new_day_str}:")
        with open(p, 'w') as f:
            f.write(c)
            
    fix_header("day-7.md", "4", "7")
    fix_header("day-4.md", "5", "4")
    fix_header("day-5.md", "6", "5")
    
    # 2. Update frontmatter for all
    for day_num, info in days.items():
        file_path = os.path.join(CONTENT_DIR, f"day-{day_num}.md")
        if os.path.exists(file_path):
            update_frontmatter(file_path, info)

if __name__ == "__main__":
    main()
