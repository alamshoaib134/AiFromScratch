"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Key,
  X,
  CheckCircle,
  Warning,
  Spinner,
} from "@phosphor-icons/react";

interface PasscodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseId: string;
  localStorageKey: string;
}

export default function PasscodeModal({
  isOpen,
  onClose,
  courseId,
  localStorageKey,
}: PasscodeModalProps) {
  const router = useRouter();
  const [blocks, setBlocks] = useState(["", "", "", ""]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && !success) onClose();
    },
    [onClose, success]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
      // Focus first input
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleEscape]);



  const handleBlockChange = (index: number, value: string) => {
    // Only allow alphanumeric characters
    const cleaned = value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    const truncated = cleaned.slice(0, 4);

    const newBlocks = [...blocks];
    newBlocks[index] = truncated;
    setBlocks(newBlocks);
    setError("");

    // Auto-advance to next block when current one is full
    if (truncated.length === 4 && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all blocks are filled
    if (truncated.length === 4 && index === 3) {
      const fullCode = [...newBlocks.slice(0, 3), truncated].join("-");
      verifyCode(fullCode);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    // Handle backspace to go to previous block
    if (e.key === "Backspace" && blocks[index] === "" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/[^a-zA-Z0-9]/g, "")
      .toUpperCase();

    if (pasted.length >= 16) {
      const newBlocks = [
        pasted.slice(0, 4),
        pasted.slice(4, 8),
        pasted.slice(8, 12),
        pasted.slice(12, 16),
      ];
      setBlocks(newBlocks);
      setError("");

      const fullCode = newBlocks.join("-");
      verifyCode(fullCode);
    }
  };

  const verifyCode = (code: string) => {
    setVerifying(true);
    setError("");

    // Small delay for visual feedback
    setTimeout(() => {
      const expected = process.env.NEXT_PUBLIC_COURSE_ACCESS_CODE;

      if (code === expected) {
        setSuccess(true);
        localStorage.setItem(localStorageKey, "true");

        // Redirect after success animation
        setTimeout(() => {
          router.push(`/course/${courseId}`);
        }, 1500);
      } else {
        setError("Invalid verification code. Please check your access key.");
        setVerifying(false);
        // Shake animation would apply via CSS
        setBlocks(["", "", "", ""]);
        setTimeout(() => inputRefs.current[0]?.focus(), 100);
      }
    }, 600);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[var(--color-accent)]/50 backdrop-blur-sm animate-fade-in"
        onClick={() => !success && onClose()}
      />

      {/* Modal */}
      <div className="animate-scale-in relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-[var(--color-border-light)] bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--color-border-light)] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-accent)] text-white">
              <Key size={20} weight="duotone" />
            </div>
            <div>
              <h3 className="font-[family-name:var(--font-serif)] text-lg font-bold text-[var(--color-accent)]">
                Unlock Course
              </h3>
              <p className="text-xs text-[var(--color-accent-light)]">
                Enter your 16-character access code
              </p>
            </div>
          </div>
          {!success && (
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-[var(--color-accent-light)] transition-colors hover:bg-[var(--color-border-light)]"
            >
              <X size={18} weight="bold" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="px-6 py-8">
          {success ? (
            /* Success State */
            <div className="animate-scale-in flex flex-col items-center gap-4 py-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-success-light)]">
                <CheckCircle
                  size={36}
                  weight="fill"
                  className="text-[var(--color-success)]"
                />
              </div>
              <h4 className="font-[family-name:var(--font-serif)] text-xl font-bold text-[var(--color-accent)]">
                Course Unlocked!
              </h4>
              <p className="text-sm text-[var(--color-accent-light)]">
                Redirecting you to the course...
              </p>
              <div className="mt-2 h-1 w-32 overflow-hidden rounded-full bg-[var(--color-border-light)]">
                <div
                  className="h-full rounded-full bg-[var(--color-success)]"
                  style={{
                    animation: "shimmer 1.5s ease-out forwards",
                    backgroundSize: "200% 100%",
                    width: "100%",
                  }}
                />
              </div>
            </div>
          ) : (
            /* Input State */
            <>
              <p className="mb-6 text-center text-sm text-[var(--color-accent-light)]">
                Enter your verification code in the format{" "}
                <span className="font-mono font-semibold text-[var(--color-accent)]">
                  XXXX-XXXX-XXXX-XXXX
                </span>
              </p>

              {/* 4-Block Input */}
              <div className="flex items-center justify-center gap-2">
                {blocks.map((block, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      ref={(el) => {
                        inputRefs.current[index] = el;
                      }}
                      type="text"
                      value={block}
                      onChange={(e) =>
                        handleBlockChange(index, e.target.value)
                      }
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      onPaste={index === 0 ? handlePaste : undefined}
                      maxLength={4}
                      disabled={verifying}
                      className={`w-[4.5rem] rounded-xl border bg-[var(--color-alabaster)] px-2 py-3 text-center font-mono text-base font-bold tracking-widest text-[var(--color-accent)] outline-none transition-all ${
                        error
                          ? "border-red-300 ring-2 ring-red-100"
                          : "border-[var(--color-border)] focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/10"
                      } disabled:opacity-50`}
                      placeholder="····"
                    />
                    {index < 3 && (
                      <span className="text-lg font-bold text-[var(--color-border)]">
                        –
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* Error Message */}
              {error && (
                <div className="mt-4 flex items-center justify-center gap-2 text-sm text-red-500">
                  <Warning size={16} weight="bold" />
                  <span>{error}</span>
                </div>
              )}

              {/* Loading */}
              {verifying && (
                <div className="mt-4 flex items-center justify-center gap-2 text-sm text-[var(--color-accent-light)]">
                  <Spinner size={16} className="animate-spin" />
                  <span>Verifying code...</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
