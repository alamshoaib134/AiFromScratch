import type { Metadata } from "next";
import { IBM_Plex_Serif, IBM_Plex_Sans } from "next/font/google";
import Navbar from "@/components/Navbar";
import "./globals.css";

const ibmPlexSerif = IBM_Plex_Serif({
  variable: "--font-serif",
  subsets: ["latin"],
  display: "swap",
  weight: "400",
});

const ibmPlexSans = IBM_Plex_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
  weight: "400",
});

export const metadata: Metadata = {
  title: "AI Academy | Master AI from Scratch",
  description:
    "A curated collection of courses designed to take you from AI fundamentals to advanced systems. Master Artificial Intelligence with comprehensive lessons and hands-on projects.",
  keywords: ["AI", "artificial intelligence", "machine learning", "course", "academy"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${ibmPlexSerif.variable} ${ibmPlexSans.variable} h-full`}
    >
      <body className="flex min-h-full flex-col antialiased">
        <Navbar />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-[var(--color-border)] bg-[var(--color-canvas)]">
          <div className="mx-auto max-w-6xl px-6 py-12">
            <div className="flex flex-col items-start gap-4">
              <p className="text-base font-medium">
                © {new Date().getFullYear()} AI Academy
              </p>
              <p className="font-[family-name:var(--font-serif)] text-xl text-[var(--color-muted)]">
                The only way to learn AI is to build with AI.
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
