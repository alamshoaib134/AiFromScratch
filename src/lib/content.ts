import fs from "fs";
import path from "path";
import matter from "gray-matter";

export interface DayMeta {
  day: number;
  title: string;
  concept: string;
  chapter: number;
  chapterTitle: string;
  slug: string;
}

export interface DayContent extends DayMeta {
  content: string;
}

export interface Chapter {
  chapter: number;
  title: string;
  days: DayMeta[];
}

const baseContentDir = path.join(process.cwd(), "content");

/**
 * Get metadata for all days in a course, sorted by day number.
 */
export function getAllDays(courseId: string): DayMeta[] {
  const courseContentDir = path.join(baseContentDir, courseId);
  if (!fs.existsSync(courseContentDir)) return [];

  const files = fs.readdirSync(courseContentDir).filter((f) => f.startsWith("day-") && f.endsWith(".md"));

  const days = files.map((filename) => {
    const filePath = path.join(courseContentDir, filename);
    const raw = fs.readFileSync(filePath, "utf-8");
    const { data } = matter(raw);

    return {
      day: data.day as number,
      title: (data.title as string) || `Day ${data.day}`,
      concept: (data.concept as string) || "",
      chapter: (data.chapter as number) || 1,
      chapterTitle: (data.chapterTitle as string) || "Chapter 1",
      slug: `${data.day}`,
    };
  });

  return days.sort((a, b) => a.day - b.day);
}

/**
 * Get full content for a single day in a course.
 */
export function getDayContent(courseId: string, day: number): DayContent | null {
  const filename = `day-${day}.md`;
  const filePath = path.join(baseContentDir, courseId, filename);

  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);

  return {
    day: data.day as number,
    title: (data.title as string) || `Day ${data.day}`,
    concept: (data.concept as string) || "",
    chapter: (data.chapter as number) || 1,
    chapterTitle: (data.chapterTitle as string) || "Chapter 1",
    slug: `${data.day}`,
    content,
  };
}

/**
 * Group days into chapters.
 */
export function getChapters(courseId: string): Chapter[] {
  const days = getAllDays(courseId);
  const chapterMap = new Map<number, Chapter>();

  for (const day of days) {
    if (!chapterMap.has(day.chapter)) {
      chapterMap.set(day.chapter, {
        chapter: day.chapter,
        title: day.chapterTitle,
        days: [],
      });
    }
    chapterMap.get(day.chapter)!.days.push(day);
  }

  return Array.from(chapterMap.values()).sort(
    (a, b) => a.chapter - b.chapter
  );
}
