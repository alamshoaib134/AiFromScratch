"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  List,
  X,
} from "@phosphor-icons/react";
import { useState } from "react";

export default function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAdmin = pathname.startsWith("/admin");

  return (
    <header className="sticky top-0 z-50 border-b-2 border-[var(--color-border)] bg-[var(--color-canvas)]">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 transition-opacity hover:opacity-70"
        >
          <div>
            <h1 className="font-[family-name:var(--font-serif)] text-2xl font-bold tracking-tight text-[var(--color-ink)]">
              AI Academy
            </h1>
          </div>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden items-center gap-6 md:flex">
          <Link
            href="/"
            className={`text-base font-medium transition-colors ${
              pathname === "/"
                ? "text-[var(--color-ink)]"
                : "text-[var(--color-muted)] hover:text-[var(--color-ink)]"
            }`}
          >
            Courses
          </Link>
          <Link
            href="/papers"
            className={`flex items-center gap-1.5 text-base font-medium transition-colors ${
              pathname.startsWith("/papers")
                ? "text-[var(--color-ink)]"
                : "text-[var(--color-muted)] hover:text-[var(--color-ink)]"
            }`}
          >
            Paper Everyday
          </Link>
          <Link
            href="/admin"
            className={`flex items-center gap-1.5 text-base font-medium transition-colors ${
              isAdmin
                ? "text-[var(--color-ink)]"
                : "text-[var(--color-muted)] hover:text-[var(--color-ink)]"
            }`}
          >
            Admin
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-[var(--color-ink)] transition-colors hover:bg-[var(--color-border-light)] md:hidden"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? (
            <X size={24} weight="regular" />
          ) : (
            <List size={24} weight="regular" />
          )}
        </button>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="border-t border-[var(--color-border)] px-6 py-4 md:hidden bg-[var(--color-canvas)]">
          <div className="flex flex-col gap-4">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="text-base font-medium text-[var(--color-ink)] transition-colors"
            >
              Courses
            </Link>
            <Link
              href="/papers"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-1.5 text-base font-medium text-[var(--color-ink)] transition-colors"
            >
              Paper Everyday
            </Link>
            <Link
              href="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-1.5 text-base font-medium text-[var(--color-ink)] transition-colors"
            >
              Admin
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
