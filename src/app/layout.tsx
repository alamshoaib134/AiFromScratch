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
  metadataBase: new URL("https://aifromscratch.in"),
  title: {
    default:
      "Learn AI from Scratch | Free Beginner Guides & Research",
    template: "%s | AI From Scratch",
  },
  description:
    "Learn artificial intelligence from scratch for free. Explore beginner-friendly AI tutorials, step-by-step guides, and daily simplified research paper breakdowns.",
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
  publisher: "AI From Scratch",
  alternates: {
    canonical: "https://aifromscratch.in/",
  },
  openGraph: {
    title:
      "Learn AI from Scratch | Free Beginner Guides & Research",
    description:
      "Learn artificial intelligence from scratch for free. Explore beginner-friendly AI tutorials, step-by-step guides, and daily simplified research paper breakdowns.",
    url: "https://aifromscratch.in/",
    siteName: "AI From Scratch",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "https://aifromscratch.in/images/og-default.png",
        width: 1200,
        height: 630,
        alt: "AI From Scratch — Learn AI for Beginners",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Learn AI from Scratch | Free Beginner Guides & Research",
    description:
      "Learn artificial intelligence from scratch for free. Explore beginner-friendly AI tutorials, step-by-step guides, and daily simplified research paper breakdowns.",
    images: ["https://aifromscratch.in/images/og-default.png"],
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
  verification: {
    google: "bVaYGk9l8_tVky3OxrUoAWHF2m9hmKZSp7hG6vlLhrg",
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
                © {new Date().getFullYear()} AI From Scratch
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
