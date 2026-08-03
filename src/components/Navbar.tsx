"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Brain,
  List,
  X,
  GearSix,
} from "@phosphor-icons/react";
import { useState } from "react";

export default function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAdmin = pathname.startsWith("/admin");

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--color-border-light)] bg-[var(--color-alabaster)]/95 backdrop-blur-md">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-3 transition-opacity hover:opacity-70"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-accent)] text-white">
            <Brain size={22} weight="duotone" />
          </div>
          <div>
            <h1 className="font-[family-name:var(--font-serif)] text-lg font-bold tracking-tight text-[var(--color-accent)]">
              AI Academy
            </h1>
            <p className="text-xs text-[var(--color-accent-light)]">
              Master AI from Scratch
            </p>
          </div>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden items-center gap-6 md:flex">
          <Link
            href="/"
            className={`text-sm font-medium transition-colors ${
              pathname === "/"
                ? "text-[var(--color-accent)]"
                : "text-[var(--color-accent-light)] hover:text-[var(--color-accent)]"
            }`}
          >
            Courses
          </Link>
          <Link
            href="/admin"
            className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${
              isAdmin
                ? "text-[var(--color-accent)]"
                : "text-[var(--color-accent-light)] hover:text-[var(--color-accent)]"
            }`}
          >
            <GearSix size={16} />
            Admin
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="rounded-lg p-2 text-[var(--color-accent-light)] transition-colors hover:bg-[var(--color-border-light)] md:hidden"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? (
            <X size={22} weight="bold" />
          ) : (
            <List size={22} weight="bold" />
          )}
        </button>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="animate-fade-in border-t border-[var(--color-border-light)] px-6 py-4 md:hidden">
          <div className="flex flex-col gap-3">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-medium text-[var(--color-accent-light)] transition-colors hover:text-[var(--color-accent)]"
            >
              Courses
            </Link>
            <Link
              href="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-1.5 text-sm font-medium text-[var(--color-accent-light)] transition-colors hover:text-[var(--color-accent)]"
            >
              <GearSix size={16} />
              Admin
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
