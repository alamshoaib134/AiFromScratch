"use server";

import { saveMarkdownFile, uploadImage } from "@/lib/github";
import { isAuthenticated } from "@/lib/auth";
import { getDayContent } from "@/lib/content";
import matter from "gray-matter";

export async function saveDayAction(
  day: number,
  content: string
): Promise<{ success: boolean; error?: string }> {
  // Verify authentication
  const authed = await isAuthenticated();
  if (!authed) {
    return { success: false, error: "Not authenticated" };
  }

  try {
    // Validate the content has valid frontmatter
    const { data } = matter(content);
    if (!data.title || !data.day) {
      return {
        success: false,
        error: "Content must include valid frontmatter with at least 'title' and 'day' fields.",
      };
    }

    const filePath = `content/day-${day}.md`;
    const commitMessage = `Update Day ${day}: ${data.title}`;

    await saveMarkdownFile(filePath, content, commitMessage);

    // If running locally in development, also save to local disk so changes reflect instantly
    if (process.env.NODE_ENV === "development") {
      const fs = await import("fs");
      const path = await import("path");
      const fullPath = path.join(process.cwd(), filePath);
      fs.writeFileSync(fullPath, content, "utf-8");
    }

    return { success: true };
  } catch (error) {
    console.error("Error saving day:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to save changes",
    };
  }
}

export async function uploadImageAction(
  filename: string,
  base64Content: string
): Promise<{ success: boolean; path?: string; error?: string }> {
  // Verify authentication
  const authed = await isAuthenticated();
  if (!authed) {
    return { success: false, error: "Not authenticated" };
  }

  try {
    // Sanitize filename
    const sanitized = filename
      .replace(/[^a-zA-Z0-9._-]/g, "-")
      .toLowerCase();

    const result = await uploadImage(sanitized, base64Content);

    // If running locally in development, also save to local disk so images render instantly
    if (process.env.NODE_ENV === "development" && result.path) {
      const fs = await import("fs");
      const path = await import("path");
      const fullPath = path.join(process.cwd(), "public", result.path);
      const buffer = Buffer.from(base64Content, "base64");
      fs.writeFileSync(fullPath, buffer);
    }

    return {
      success: true,
      path: result.path,
    };
  } catch (error) {
    console.error("Error uploading image:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to upload image",
    };
  }
}

export async function getDayRawContent(
  day: number
): Promise<{ success: boolean; content?: string; error?: string }> {
  try {
    const dayContent = getDayContent(day);
    if (!dayContent) {
      return { success: false, error: "Day not found" };
    }

    // Read the raw file including frontmatter
    const fs = await import("fs");
    const path = await import("path");
    const filePath = path.join(process.cwd(), "content", `day-${day}.md`);
    const raw = fs.readFileSync(filePath, "utf-8");

    return { success: true, content: raw };
  } catch (error) {
    console.error("Error reading day:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to read content",
    };
  }
}
