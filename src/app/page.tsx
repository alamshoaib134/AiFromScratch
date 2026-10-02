import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { Suspense } from "react";
import HomepageClient from "@/components/HomepageClient";
import { courses } from "@/lib/courses";
import Script from "next/script";

function getOverviewContent(): string {
  const filePath = path.join(process.cwd(), "content", "overview.md");
  if (!fs.existsSync(filePath)) return "";
  const raw = fs.readFileSync(filePath, "utf-8");
  const { content } = matter(raw);
  return content;
}

export default function HomePage() {
  const overviewContent = getOverviewContent();
  const baseUrl = "https://aiacademy.com"; // Adjust to real domain

  // Generate structured data for the organization / author
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    "name": "AI Academy",
    "url": baseUrl,
    "description": "A curated collection of courses designed to take you from AI fundamentals to advanced systems.",
    "founder": {
      "@type": "Person",
      "name": "Shoaib Alam",
      "jobTitle": "AI Engineer & NLP Researcher",
      "url": "https://shoaibalam.vercel.app/"
    }
  };

  // Generate structured data for the courses
  const courseListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "itemListElement": courses.map((course, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "Course",
        "url": `${baseUrl}/course/${course.id}`,
        "name": course.title,
        "description": course.description,
        "provider": {
          "@type": "EducationalOrganization",
          "name": "AI Academy"
        },
        "offers": course.status === "available" ? {
          "@type": "Offer",
          "price": course.discountPrice,
          "priceCurrency": "INR",
          "availability": "https://schema.org/InStock"
        } : undefined
      }
    }))
  };

  return (
    <>
      <Script
        id="schema-org"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <Script
        id="schema-course-list"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(courseListSchema) }}
      />
      <Suspense
        fallback={
          <div className="flex min-h-[60vh] items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-accent)]" />
          </div>
        }
      >
        <HomepageClient overviewContent={overviewContent} />
      </Suspense>
    </>
  );
}
