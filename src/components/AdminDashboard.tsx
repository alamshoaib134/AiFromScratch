"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  FloppyDisk,
  ImageSquare,
  SignOut,
  Check,
  Warning,
  Spinner,
  Eye,
  PencilSimple,
} from "@phosphor-icons/react";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import { saveDayAction, uploadImageAction, getDayRawContent } from "@/app/admin/actions";

interface DayInfo {
  day: number;
  title: string;
}

export default function AdminDashboard({ days }: { days: DayInfo[] }) {
  const router = useRouter();
  const [selectedDay, setSelectedDay] = useState(1);
  const [content, setContent] = useState("");
  const [originalContent, setOriginalContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [saveError, setSaveError] = useState("");
  const [uploading, setUploading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const initialLoadRef = useRef<boolean | null>(null);

  // Load day content
  const loadDay = useCallback(async (day: number) => {
    setLoading(true);
    setSaveStatus("idle");
    setSaveError("");

    const result = await getDayRawContent(day);
    if (result.success && result.content) {
      setContent(result.content);
      setOriginalContent(result.content);
    } else {
      setContent("");
      setOriginalContent("");
    }
    setLoading(false);
  }, []);

  // Load initial day content on mount (React 19 safe pattern)
  if (initialLoadRef.current === null) {
    initialLoadRef.current = true;
    loadDay(selectedDay);
  }

  // Select a day and load its content
  const selectDay = (day: number) => {
    setSelectedDay(day);
    loadDay(day);
  };

  const hasChanges = content !== originalContent;

  // Save
  const handleSave = async () => {
    setSaving(true);
    setSaveStatus("saving");
    setSaveError("");

    const result = await saveDayAction(selectedDay, content);

    if (result.success) {
      setSaveStatus("saved");
      setOriginalContent(content);
      setTimeout(() => setSaveStatus("idle"), 3000);
    } else {
      setSaveStatus("error");
      setSaveError(result.error || "Save failed");
    }

    setSaving(false);
  };

  // Image upload
  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    try {
      // Convert to base64
      const buffer = await file.arrayBuffer();
      const base64 = btoa(
        String.fromCharCode(...new Uint8Array(buffer))
      );

      // Generate unique filename
      const timestamp = Date.now();
      const ext = file.name.split(".").pop() || "jpg";
      const filename = `${file.name
        .replace(/\.[^.]+$/, "")
        .replace(/[^a-zA-Z0-9]/g, "-")
        .toLowerCase()}-${timestamp}.${ext}`;

      const result = await uploadImageAction(filename, base64);

      if (result.success && result.path) {
        // Insert markdown image tag at cursor position
        const textarea = textareaRef.current;
        if (textarea) {
          const start = textarea.selectionStart;
          const end = textarea.selectionEnd;
          const imageTag = `![${file.name}](${result.path})`;
          const newContent =
            content.substring(0, start) +
            imageTag +
            content.substring(end);
          setContent(newContent);

          // Restore cursor position after the image tag
          setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd =
              start + imageTag.length;
            textarea.focus();
          }, 0);
        }
      } else {
        alert(`Image upload failed: ${result.error}`);
      }
    } catch (err) {
      alert("Image upload failed: " + (err instanceof Error ? err.message : "Unknown error"));
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Logout
  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  };

  return (
    <div className="flex h-[calc(100vh-5rem)] overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 overflow-y-auto border-r border-[var(--color-border-light)] bg-white">
        <div className="flex items-center justify-between border-b border-[var(--color-border-light)] px-4 py-3">
          <h2 className="font-[family-name:var(--font-serif)] text-sm font-bold text-[var(--color-accent)]">
            Content Editor
          </h2>
          <button
            onClick={handleLogout}
            className="rounded-lg p-1.5 text-[var(--color-accent-light)] transition-colors hover:bg-[var(--color-border-light)] hover:text-red-500"
            title="Sign out"
          >
            <SignOut size={18} />
          </button>
        </div>
        <nav className="p-2">
          {days.map((day) => (
            <button
              key={day.day}
              onClick={() => selectDay(day.day)}
              className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                day.day === selectedDay
                  ? "bg-[var(--color-accent)] font-medium text-white"
                  : "text-[var(--color-accent-light)] hover:bg-[var(--color-border-light)]"
              }`}
            >
              <span
                className={`w-5 shrink-0 text-xs ${
                  day.day === selectedDay
                    ? "text-white/60"
                    : "text-[var(--color-border)]"
                }`}
              >
                {day.day}
              </span>
              <span className="truncate">{day.title}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Editor Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center justify-between border-b border-[var(--color-border-light)] bg-white px-4 py-2.5">
          <div className="flex items-center gap-3">
            <h3 className="font-[family-name:var(--font-serif)] text-sm font-bold text-[var(--color-accent)]">
              Day {selectedDay}
            </h3>
            {hasChanges && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                Unsaved changes
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Image Upload */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border-light)] bg-white px-3 py-1.5 text-xs font-medium text-[var(--color-accent-light)] transition-all hover:border-[var(--color-border)] hover:text-[var(--color-accent)] disabled:opacity-50"
            >
              {uploading ? (
                <>
                  <Spinner size={14} className="animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <ImageSquare size={14} />
                  Upload Image
                </>
              )}
            </button>

            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={saving || !hasChanges}
              className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-semibold transition-all ${
                saveStatus === "saved"
                  ? "bg-[var(--color-success)] text-white"
                  : saveStatus === "error"
                    ? "bg-red-500 text-white"
                    : "bg-[var(--color-accent)] text-white shadow-sm hover:shadow-md disabled:opacity-50"
              }`}
            >
              {saveStatus === "saving" ? (
                <>
                  <Spinner size={14} className="animate-spin" />
                  Saving...
                </>
              ) : saveStatus === "saved" ? (
                <>
                  <Check size={14} weight="bold" />
                  Saved!
                </>
              ) : saveStatus === "error" ? (
                <>
                  <Warning size={14} weight="bold" />
                  Error
                </>
              ) : (
                <>
                  <FloppyDisk size={14} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>

        {saveError && (
          <div className="border-b border-red-200 bg-red-50 px-4 py-2 text-xs text-red-600">
            {saveError}
          </div>
        )}

        {/* Split Editor */}
        {loading ? (
          <div className="flex flex-1 items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <Spinner
                size={28}
                className="animate-spin text-[var(--color-accent-light)]"
              />
              <span className="text-sm text-[var(--color-accent-light)]">
                Loading content...
              </span>
            </div>
          </div>
        ) : (
          <div className="flex flex-1 overflow-hidden">
            {/* Editor (Left) */}
            <div className="flex flex-1 flex-col border-r border-[var(--color-border-light)]">
              <div className="flex items-center gap-2 border-b border-[var(--color-border-light)] bg-[var(--color-alabaster)] px-4 py-1.5">
                <PencilSimple
                  size={13}
                  className="text-[var(--color-accent-light)]"
                />
                <span className="text-xs font-medium text-[var(--color-accent-light)]">
                  Markdown Editor
                </span>
              </div>
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                spellCheck={false}
                className="flex-1 resize-none bg-white px-6 py-5 font-mono text-sm leading-relaxed text-[var(--color-accent)] outline-none placeholder:text-[var(--color-border)]"
                placeholder="Write your markdown content here..."
              />
            </div>

            {/* Preview (Right) */}
            <div className="flex flex-1 flex-col">
              <div className="flex items-center gap-2 border-b border-[var(--color-border-light)] bg-[var(--color-alabaster)] px-4 py-1.5">
                <Eye
                  size={13}
                  className="text-[var(--color-accent-light)]"
                />
                <span className="text-xs font-medium text-[var(--color-accent-light)]">
                  Live Preview
                </span>
              </div>
              <div className="flex-1 overflow-y-auto bg-white px-6 py-5">
                <MarkdownRenderer content={content} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
