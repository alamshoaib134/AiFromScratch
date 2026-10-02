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
  metadataBase: new URL("https://aieveryday.vercel.app"),
  title: {
    default:
      "AI Academy — Learn AI for Beginners | Daily Research & Practical Guides",
    template: "%s | AI Academy",
  },
  description:
    "Free educational platform to learn artificial intelligence from scratch. Explore beginner-friendly AI tutorials, step-by-step guides, and daily simplified research papers.",
  keywords: [
    "learn AI",
    "artificial intelligence for beginners",
    "AI tutorials",
    "machine learning course",
    "AI research papers",
    "beginner AI guide",
    "learn machine learning",
    "AI academy",
  ],
  authors: [{ name: "Shoaib Alam", url: "https://shoaibalam.vercel.app/" }],
  creator: "Shoaib Alam",
  publisher: "AI Academy",
  alternates: {
    canonical: "https://aieveryday.vercel.app/",
  },
  openGraph: {
    title:
      "AI Academy — Learn AI for Beginners | Daily Research & Practical Guides",
    description:
      "Free educational platform to learn artificial intelligence from scratch. Explore beginner-friendly AI tutorials, step-by-step guides, and daily simplified research papers.",
    url: "https://aieveryday.vercel.app/",
    siteName: "AI Academy",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Academy — Learn AI for Beginners",
    description:
      "Free educational platform to learn AI from scratch. Beginner-friendly tutorials, step-by-step guides, and daily simplified research papers.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
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
                Demystifying AI — one lesson, one paper, one day at a time.
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
