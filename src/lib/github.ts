/**
 * GitHub API utility functions for the Git-backed CMS.
 *
 * Uses native fetch against the GitHub REST API to:
 * - Read file SHA (needed before updates)
 * - Save/update markdown files
 * - Upload images to the repo
 */

const GITHUB_API = "https://api.github.com";

function getConfig() {
  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  const branch = process.env.GITHUB_BRANCH || "main";

  if (!token || !owner || !repo) {
    throw new Error(
      "Missing GitHub environment variables. Set GITHUB_TOKEN, GITHUB_OWNER, and GITHUB_REPO."
    );
  }

  return { token, owner, repo, branch };
}

function headers(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github.v3+json",
    "Content-Type": "application/json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

/**
 * Get the SHA of a file in the repository.
 * Returns null if the file doesn't exist.
 */
export async function getFileSha(
  filePath: string
): Promise<string | null> {
  const { token, owner, repo, branch } = getConfig();

  const url = `${GITHUB_API}/repos/${owner}/${repo}/contents/${filePath}?ref=${branch}`;

  const res = await fetch(url, {
    method: "GET",
    headers: headers(token),
  });

  if (res.status === 404) return null;

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`GitHub API error (getFileSha): ${res.status} - ${error}`);
  }

  const data = await res.json();
  return data.sha;
}

/**
 * Save (create or update) a markdown file in the repository.
 */
export async function saveMarkdownFile(
  filePath: string,
  content: string,
  commitMessage?: string
): Promise<{ success: boolean; sha: string }> {
  const { token, owner, repo, branch } = getConfig();

  // Get current SHA if file exists (required for updates)
  const currentSha = await getFileSha(filePath);

  const url = `${GITHUB_API}/repos/${owner}/${repo}/contents/${filePath}`;

  // GitHub API requires base64-encoded content
  const encodedContent = Buffer.from(content, "utf-8").toString("base64");

  const body: Record<string, string> = {
    message: commitMessage || `Update ${filePath}`,
    content: encodedContent,
    branch,
  };

  if (currentSha) {
    body.sha = currentSha;
  }

  const res = await fetch(url, {
    method: "PUT",
    headers: headers(token),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(
      `GitHub API error (saveMarkdownFile): ${res.status} - ${error}`
    );
  }

  const data = await res.json();
  return {
    success: true,
    sha: data.content.sha,
  };
}

/**
 * Upload an image to the repository under /public/images/.
 * Returns the public URL path for the image.
 */
export async function uploadImage(
  filename: string,
  base64Content: string
): Promise<{ success: boolean; path: string }> {
  const { token, owner, repo, branch } = getConfig();

  const filePath = `public/images/${filename}`;

  // Check if file already exists
  const currentSha = await getFileSha(filePath);

  const url = `${GITHUB_API}/repos/${owner}/${repo}/contents/${filePath}`;

  const body: Record<string, string> = {
    message: `Upload image: ${filename}`,
    content: base64Content, // Already base64-encoded from the client
    branch,
  };

  if (currentSha) {
    body.sha = currentSha;
  }

  const res = await fetch(url, {
    method: "PUT",
    headers: headers(token),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(
      `GitHub API error (uploadImage): ${res.status} - ${error}`
    );
  }

  return {
    success: true,
    path: `/images/${filename}`,
  };
}
