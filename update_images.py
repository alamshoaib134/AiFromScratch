import os
import re
import shutil

SRC_DIR = "/Users/shoaib/Downloads/ai_photos"
DEST_DIR = "/Users/shoaib/Desktop/AiFromScratch/public/images/ai_photos"
CONTENT_DIR = "/Users/shoaib/Desktop/AiFromScratch/content"

# 1. Ensure dest exists
os.makedirs(DEST_DIR, exist_ok=True)

# 2. Copy and rename images
image_mapping = {} # day_num -> list of new_filenames
for filename in os.listdir(SRC_DIR):
    if not filename.lower().endswith('.png') and not filename.lower().endswith('.jpg'):
        continue
        
    # parse day num
    match = re.search(r'Day\s+(\d+)(?:_(\d+))?', filename, re.IGNORECASE)
    day_num = None
    if match:
        day_num = int(match.group(1))
        
    # rename
    new_name = filename.lower().replace(' ', '-').replace('_', '-')
    src_path = os.path.join(SRC_DIR, filename)
    dest_path = os.path.join(DEST_DIR, new_name)
    shutil.copy2(src_path, dest_path)
    print(f"Copied {filename} to {new_name}")
    
    if day_num is not None:
        if day_num not in image_mapping:
            image_mapping[day_num] = []
        image_mapping[day_num].append(new_name)

# Sort images for each day
for day in image_mapping:
    image_mapping[day].sort()

# 3. Insert into MD files
def get_image_markdown(day_num):
    images = image_mapping.get(day_num, [])
    if not images:
        return ""
    md_str = ""
    for img in images:
        md_str += f"![Day {day_num} Illustration](/images/ai_photos/{img})\n"
    return md_str

for file in os.listdir(CONTENT_DIR):
    if not file.startswith('day-') or not file.endswith('.md'):
        continue
    
    day_match = re.search(r'day-(\d+)\.md', file)
    if not day_match:
        continue
        
    day_num = int(day_match.group(1))
    img_md = get_image_markdown(day_num)
    if not img_md:
        continue
        
    file_path = os.path.join(CONTENT_DIR, file)
    with open(file_path, 'r') as f:
        content = f.read()
        
    # We want to insert after the main heading.
    frontmatter_match = re.search(r'^---\n.*?\n---\n*', content, re.DOTALL)
    start_idx = frontmatter_match.end() if frontmatter_match else 0
    
    heading_match = re.search(r'(Day \d+:[^\n]*\n={3,}\n*)', content[start_idx:])
    if not heading_match:
        heading_match = re.search(r'(# Day \d+:[^\n]*\n*)', content[start_idx:])
        
    if heading_match:
        insert_idx = start_idx + heading_match.end()
        new_content = content[:insert_idx] + "\n" + img_md + "\n" + content[insert_idx:]
        with open(file_path, 'w') as f:
            f.write(new_content)
        print(f"Added images to {file}")
    else:
        print(f"Warning: Could not find heading in {file}. Trying fallback...")
        # Fallback: append after frontmatter
        new_content = content[:start_idx] + "\n" + img_md + "\n" + content[start_idx:]
        with open(file_path, 'w') as f:
            f.write(new_content)
        print(f"Added images to {file} via fallback")

print("Done")
