"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeRaw from "rehype-raw";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export default function MarkdownRenderer({
  content,
  className = "",
}: MarkdownRendererProps) {
  return (
    <div className={`prose prose-stone max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeRaw, rehypeKatex]}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
