import { MetadataRoute } from 'next';
import { courses } from '@/lib/courses';
import { getAllPapersWithSlugs } from '@/lib/papers';
import { getAllDays } from '@/lib/content';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://aifromscratch.in';

  /* ─── Static pages ─── */
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/learn-ai-roadmap`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/papers`,
      lastModified: new Date(),
    },
  ];

  /* ─── Course listing pages ─── */
  const courseListingUrls: MetadataRoute.Sitemap = courses
    .filter(course => course.status === 'available')
    .map(course => ({
      url: `${baseUrl}/course/${course.id}`,
      lastModified: new Date(),
    }));

  /* ─── Individual lesson (day) pages ─── */
  const lessonUrls: MetadataRoute.Sitemap = courses
    .filter(course => course.status === 'available')
    .flatMap(course => {
      const days = getAllDays(course.id);
      return days.map(day => ({
        url: `${baseUrl}/course/${course.id}/day/${day.day}`,
        lastModified: new Date(),
      }));
    });

  /* ─── Paper detail pages ─── */
  const paperUrls: MetadataRoute.Sitemap = getAllPapersWithSlugs().map(paper => ({
    url: `${baseUrl}/papers/${paper.slug}`,
    lastModified: new Date(paper.gen_timestamp),
  }));

  return [
    ...staticPages,
    ...courseListingUrls,
    ...lessonUrls,
    ...paperUrls,
  ];
}
