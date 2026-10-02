"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  Warning,
  Spinner,
  ArrowRight
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
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleEscape]);

  const handleBlockChange = (index: number, value: string) => {
    const cleaned = value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    const truncated = cleaned.slice(0, 4);

    const newBlocks = [...blocks];
    newBlocks[index] = truncated;
    setBlocks(newBlocks);
    setError("");

    if (truncated.length === 4 && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }

    if (truncated.length === 4 && index === 3) {
      const fullCode = [...newBlocks.slice(0, 3), truncated].join("-");
      verifyCode(fullCode);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
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

    setTimeout(() => {
      const expected = process.env.NEXT_PUBLIC_COURSE_ACCESS_CODE;

      if (code === expected) {
        setSuccess(true);
        localStorage.setItem(localStorageKey, "true");

        setTimeout(() => {
          router.push(`/course/${courseId}`);
        }, 1500);
      } else {
        setError("Invalid verification code. Please check your access key.");
        setVerifying(false);
        setBlocks(["", "", "", ""]);
        setTimeout(() => inputRefs.current[0]?.focus(), 100);
      }
    }, 600);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-[var(--color-ink)] opacity-75"
        onClick={() => !success && onClose()}
      />

      <div className="relative z-10 w-full max-w-lg border-2 border-[var(--color-border)] bg-[var(--color-surface)] shadow-[8px_8px_0px_0px_var(--color-ink)]">
        <div className="flex items-center justify-between border-b-2 border-[var(--color-border)] px-8 py-6 bg-[var(--color-canvas)]">
          <h3 className="font-[family-name:var(--font-serif)] text-2xl font-medium text-[var(--color-ink)]">
            Unlock Course
          </h3>
          {!success && (
            <button
              onClick={onClose}
              className="p-2 text-[var(--color-ink)] border border-[var(--color-border)] hover:bg-[var(--color-ink)] hover:text-[var(--color-surface)] transition-colors"
            >
              <X size={24} weight="regular" />
            </button>
          )}
        </div>

        <div className="px-8 py-12">
          {success ? (
            <div className="flex flex-col items-center gap-6 py-8">
              <div className="text-[var(--color-success)] border-2 border-[var(--color-success)] p-4">
                <h4 className="font-[family-name:var(--font-serif)] text-2xl font-medium">
                  Course Unlocked
                </h4>
              </div>
              <p className="text-base text-[var(--color-ink)] flex items-center gap-2">
                Redirecting <ArrowRight className="animate-pulse" />
              </p>
            </div>
          ) : (
            <>
              <p className="mb-8 text-base text-[var(--color-ink)]">
                Enter your 16-character access code:
              </p>

              <div className="flex items-center justify-between gap-2">
                {blocks.map((block, index) => (
                  <div key={index} className="flex-1">
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
                      className={`w-full border-2 bg-[var(--color-canvas)] px-2 py-4 text-center font-mono text-xl font-medium text-[var(--color-ink)] outline-none transition-colors ${
                        error
                          ? "border-red-500 bg-red-50"
                          : "border-[var(--color-border)] focus:border-[var(--color-accent)] focus:bg-[var(--color-surface)]"
                      } disabled:opacity-50`}
                      placeholder="----"
                    />
                  </div>
                ))}
              </div>

              {error && (
                <div className="mt-6 flex items-center gap-2 text-base font-medium text-red-600 bg-red-50 p-3 border-l-4 border-red-600">
                  <Warning size={20} weight="fill" />
                  <span>{error}</span>
                </div>
              )}

              {verifying && (
                <div className="mt-6 flex items-center gap-3 text-base text-[var(--color-ink)] font-medium">
                  <Spinner size={20} className="animate-spin" />
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
