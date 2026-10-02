import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { courses } from "@/lib/courses";
import Link from "next/link";
import type { Metadata } from "next";
import HomepageInteractions from "@/components/HomepageInteractions";

/* ─── Page-level SEO Metadata ─── */
export const metadata: Metadata = {
  title: "AI Academy — Learn AI for Beginners | Daily Research & Practical Guides",
  description:
    "Free educational platform to learn artificial intelligence from scratch. Explore beginner-friendly AI tutorials, step-by-step guides, and daily simplified research papers.",
  keywords: [
    "learn AI",
    "artificial intelligence for beginners",
    "AI tutorials",
    "machine learning course",
    "AI research papers",
    "beginner AI guide",
    "learn machine learning",
    "AI academy",
  ],
  alternates: {
    canonical: "https://aieveryday.vercel.app/",
  },
  openGraph: {
    title: "AI Academy — Learn AI for Beginners | Daily Research & Practical Guides",
    description:
      "Free educational platform to learn artificial intelligence from scratch. Explore beginner-friendly AI tutorials, step-by-step guides, and daily simplified research papers.",
    url: "https://aieveryday.vercel.app/",
    siteName: "AI Academy",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Academy — Learn AI for Beginners",
    description:
      "Free educational platform to learn AI from scratch. Beginner-friendly tutorials, step-by-step guides, and daily simplified research papers.",
  },
};

/* ─── Server-side content helpers ─── */
function getOverviewContent(): string {
  const filePath = path.join(process.cwd(), "content", "overview.md");
  if (!fs.existsSync(filePath)) return "";
  const raw = fs.readFileSync(filePath, "utf-8");
  const { content } = matter(raw);
  return content;
}

/* ─── JSON-LD Structured Data ─── */
const BASE_URL = "https://aieveryday.vercel.app";

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "EducationalOrganization",
  name: "AI Academy",
  url: BASE_URL,
  description:
    "A free, beginner-friendly educational sharing platform dedicated to breaking down artificial intelligence into easy-to-understand concepts, step-by-step guides, and daily research paper breakdowns.",
  founder: {
    "@type": "Person",
    name: "Shoaib Alam",
    jobTitle: "AI Engineer & NLP Researcher",
    url: "https://shoaibalam.vercel.app/",
  },
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "AI Academy",
  url: BASE_URL,
  description:
    "Free educational platform to learn artificial intelligence from scratch with beginner-friendly guides and daily research paper breakdowns.",
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${BASE_URL}/papers?search={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};

function buildCourseSchemas() {
  return courses
    .filter((c) => c.status === "available")
    .map((course) => ({
      "@context": "https://schema.org",
      "@type": "Course",
      name: course.title,
      description: course.description,
      url: `${BASE_URL}/course/${course.id}`,
      provider: {
        "@type": "EducationalOrganization",
        name: "AI Academy",
        url: BASE_URL,
      },
      educationalLevel: "Beginner",
      isAccessibleForFree: false,
      offers: {
        "@type": "Offer",
        price: course.discountPrice,
        priceCurrency: "INR",
        availability: "https://schema.org/InStock",
      },
      hasCourseInstance: {
        "@type": "CourseInstance",
        courseMode: "Online",
        duration: course.duration,
      },
    }));
}

const learningResourceSchema = {
  "@context": "https://schema.org",
  "@type": "LearningResource",
  name: "Daily AI Research Paper Breakdowns",
  description:
    "Simplified daily breakdowns of landmark and emerging AI research papers, designed for beginners and curious builders.",
  url: `${BASE_URL}/papers`,
  educationalLevel: "Beginner",
  learningResourceType: "Article",
  isAccessibleForFree: true,
  provider: {
    "@type": "EducationalOrganization",
    name: "AI Academy",
    url: BASE_URL,
  },
};

/* ─── Page Component (Server Component — full HTML rendered on server) ─── */
export default function HomePage() {
  const overviewContent = getOverviewContent();
  const courseSchemas = buildCourseSchemas();

  // Combine all schemas into a single @graph for reliable rendering
  const combinedSchema = {
    "@context": "https://schema.org",
    "@graph": [
      { ...organizationSchema, "@context": undefined },
      { ...websiteSchema, "@context": undefined },
      ...courseSchemas.map((s) => ({ ...s, "@context": undefined })),
      { ...learningResourceSchema, "@context": undefined },
    ],
  };

  return (
    <>
      {/* JSON-LD Structured Data — single @graph block */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(combinedSchema) }}
      />

      {/* ─── Server-rendered Content ─── */}
      <div className="mx-auto max-w-6xl px-6 py-16">
        {/* Hero Section */}
        <header className="mb-20 text-left border-b-4 border-[var(--color-border)] pb-12">
          <h1 className="font-[family-name:var(--font-serif)] text-5xl font-medium leading-tight text-[var(--color-ink)] sm:text-7xl mb-6">
            Learn AI for Beginners: Step-by-Step &amp; Practical
          </h1>
          <p className="max-w-3xl text-xl leading-relaxed text-[var(--color-ink)]">
            Demystifying Artificial Intelligence through simple, hands-on
            lessons and bite-sized daily paper breakdowns. Designed for anyone
            to learn, build, and share.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <a
              href="#courses"
              className="inline-flex items-center border-2 border-[var(--color-border)] bg-[var(--color-ink)] px-6 py-3 text-base font-medium text-[var(--color-canvas)] transition-colors hover:bg-[var(--color-accent)] hover:border-[var(--color-accent)]"
            >
              Start Learning Free
            </a>
            <Link
              href="/papers"
              className="inline-flex items-center border-2 border-[var(--color-border)] bg-[var(--color-canvas)] px-6 py-3 text-base font-medium text-[var(--color-ink)] transition-colors hover:bg-[var(--color-surface)]"
            >
              Read Today&apos;s Paper
            </Link>
          </div>
        </header>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          {/* Main Content (Courses) */}
          <section
            id="courses"
            className="lg:col-span-8"
            aria-labelledby="courses-heading"
          >
            <h2
              id="courses-heading"
              className="font-[family-name:var(--font-serif)] text-3xl font-medium text-[var(--color-ink)] mb-8"
            >
              Explore Beginner Guides &amp; Courses
            </h2>
            <div className="flex flex-col border-b border-[var(--color-border)]">
              {courses.map((course) => {
                const isAvailable = course.status === "available";
                return (
                  <article
                    key={course.id}
                    id={`course-${course.id}`}
                    data-course-id={course.id}
                    className={`w-full flex flex-col md:flex-row md:items-start justify-between border-t border-[var(--color-border)] py-6 text-left transition-colors ${
                      isAvailable
                        ? "cursor-pointer hover:bg-[var(--color-surface)]"
                        : "cursor-not-allowed opacity-60 bg-[var(--color-canvas)]"
                    }`}
                  >
                    <div className="flex-1 pr-8">
                      <div className="flex items-center gap-4 mb-2">
                        <h3 className="font-[family-name:var(--font-serif)] text-2xl font-medium text-[var(--color-ink)]">
                          {course.title}
                        </h3>
                        {!isAvailable && (
                          <span className="text-sm text-[var(--color-muted)] italic">
                            Coming soon
                          </span>
                        )}
                        {course.discountPercentage > 0 && isAvailable && (
                          <span className="bg-[var(--color-ink)] text-[var(--color-canvas)] text-xs px-2 py-0.5 border border-[var(--color-border)]">
                            {course.discountPercentage}% off
                          </span>
                        )}
                      </div>
                      <p className="text-base text-[var(--color-ink)] mb-1">
                        {course.description}
                      </p>
                      <p className="text-sm text-[var(--color-muted)]">
                        {course.subtitle}
                      </p>
                    </div>

                    <div className="mt-4 md:mt-0 flex flex-col md:items-end min-w-[150px]">
                      {course.lessons > 0 ? (
                        <div className="text-sm text-[var(--color-ink)] mb-2">
                          {course.lessons} lessons, {course.duration}
                        </div>
                      ) : null}

                      <div className="flex items-center gap-3">
                        {isAvailable &&
                        course.originalPrice > course.discountPrice ? (
                          <span className="text-[var(--color-muted)] line-through text-sm">
                            ₹{course.originalPrice}
                          </span>
                        ) : null}
                        <span className="text-lg font-medium text-[var(--color-ink)]">
                          ₹{course.discountPrice}
                        </span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          {/* Sidebar */}
          <div className="lg:col-span-4 flex flex-col gap-12">
            {/* Daily Papers */}
            <section>
              <h2 className="font-[family-name:var(--font-serif)] text-2xl font-medium text-[var(--color-ink)] mb-6 border-b border-[var(--color-border)] pb-2">
                Daily Research Papers
              </h2>
              <div className="border border-[var(--color-border)] p-6 bg-[var(--color-surface)]">
                <div className="mb-4">
                  <span className="bg-[var(--color-ink)] text-[var(--color-canvas)] text-xs px-2 py-0.5 border border-[var(--color-border)]">
                    Free • Daily
                  </span>
                </div>
                <h3 className="font-[family-name:var(--font-serif)] text-xl font-medium text-[var(--color-ink)] mb-2">
                  Research Simplified
                </h3>
                <p className="text-base leading-relaxed text-[var(--color-ink)] mb-6">
                  One AI research paper explained clearly every day. Stay at the
                  frontier of AI research — no jargon, just insight. Designed
                  for curious beginners and builders alike.
                </p>
                <Link
                  href="/papers"
                  className="inline-flex items-center text-base font-medium text-[var(--color-accent)] hover:underline underline-offset-4"
                >
                  Read Today&apos;s Paper →
                </Link>
              </div>
            </section>

            {/* Author */}
            <section>
              <h2 className="font-[family-name:var(--font-serif)] text-2xl font-medium text-[var(--color-ink)] mb-6 border-b border-[var(--color-border)] pb-2">
                About the Author
              </h2>
              <div className="flex flex-col">
                <img
                  src="https://avatars.githubusercontent.com/u/52914419?v=4"
                  alt="Shoaib Alam — AI Engineer and creator of AI Academy"
                  className="w-full h-auto grayscale border border-[var(--color-border)] mb-4"
                />
                <h3 className="font-[family-name:var(--font-serif)] text-xl font-medium text-[var(--color-ink)] mb-1">
                  Shoaib Alam
                </h3>
                <p className="text-sm font-medium text-[var(--color-muted)] mb-4">
                  AI Engineer at JPMC &bull; NLP Researcher (IIT Gandhinagar)
                </p>
                <p className="text-base leading-relaxed text-[var(--color-ink)] mb-6">
                  I specialize in building fiduciary-grade hybrid RAG solutions
                  and scalable AI systems for institutional finance. As a pioneer
                  of Hybrid RAG at JPMC and published researcher at EMNLP 2024
                  (LEGOBench), I bridge the gap between cutting-edge AI research
                  and production-ready enterprise applications.
                </p>
                <a
                  href="https://shoaibalam.vercel.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-base font-medium text-[var(--color-accent)] hover:underline underline-offset-4"
                >
                  View Full Portfolio →
                </a>
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* Client-only interactive layer (modals, unlock state) */}
      <HomepageInteractions overviewContent={overviewContent} />
    </>
  );
}
