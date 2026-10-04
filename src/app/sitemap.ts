import { MetadataRoute } from 'next';
import { courses } from '@/lib/courses';
import { getAllPapersWithSlugs } from '@/lib/papers';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://aieveryday.vercel.app';
  
  const courseUrls = courses
    .filter(course => course.status === 'available')
    .map(course => ({
      url: `${baseUrl}/course/${course.id}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));

  const paperUrls = getAllPapersWithSlugs().map(paper => ({
    url: `${baseUrl}/papers/${paper.slug}`,
    lastModified: new Date(paper.gen_timestamp),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/learn-ai-roadmap`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.95,
    },
    {
      url: `${baseUrl}/papers`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    ...courseUrls,
    ...paperUrls,
  ];
}
