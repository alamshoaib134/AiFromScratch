import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { Suspense } from "react";
import HomepageClient from "@/components/HomepageClient";

function getOverviewContent(): string {
  const filePath = path.join(process.cwd(), "content", "overview.md");
  if (!fs.existsSync(filePath)) return "";
  const raw = fs.readFileSync(filePath, "utf-8");
  const { content } = matter(raw);
  return content;
}

export default function HomePage() {
  const overviewContent = getOverviewContent();

  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-accent)]" />
        </div>
      }
    >
      <HomepageClient overviewContent={overviewContent} />
    </Suspense>
  );
}
