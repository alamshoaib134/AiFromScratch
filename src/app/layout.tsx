import type { Metadata } from "next";
import { Playfair_Display, Lato } from "next/font/google";
import Navbar from "@/components/Navbar";
import "./globals.css";

const playfairDisplay = Playfair_Display({
  variable: "--font-serif",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const lato = Lato({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "700", "900"],
});

export const metadata: Metadata = {
  title: "30-Day AI Challenge | Master AI from Scratch",
  description:
    "A comprehensive 30-day course to master Artificial Intelligence — from foundational concepts to building real-world AI applications. Learn at your own pace with daily lessons and hands-on exercises.",
  keywords: ["AI", "artificial intelligence", "machine learning", "course", "30-day challenge"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${playfairDisplay.variable} ${lato.variable} h-full`}
    >
      <body className="flex min-h-full flex-col antialiased">
        <Navbar />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-[var(--color-border-light)] bg-[var(--color-alabaster)]">
          <div className="mx-auto max-w-6xl px-6 py-8">
            <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
              <p className="text-sm text-[var(--color-accent-light)]">
                © {new Date().getFullYear()} 30-Day AI Challenge. Built with passion.
              </p>
              <p className="font-[family-name:var(--font-serif)] text-xs italic text-[var(--color-border)]">
                &ldquo;The only way to learn AI is to build with AI.&rdquo;
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
