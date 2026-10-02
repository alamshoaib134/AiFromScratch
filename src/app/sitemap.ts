import { MetadataRoute } from 'next';
import { courses } from '@/lib/courses';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://aiacademy.com'; // Adjust to actual production URL
  
  const courseUrls = courses
    .filter(course => course.status === 'available')
    .map(course => ({
      url: `${baseUrl}/course/${course.id}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/papers`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    ...courseUrls,
  ];
}
