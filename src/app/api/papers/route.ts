import { NextResponse } from "next/server";
import { getPapers, getTotalPapersCount } from "@/lib/papers";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 50);
    const offset = parseInt(searchParams.get("offset") || "0");

    const papers = getPapers(limit, offset);
    const total = getTotalPapersCount();

    return NextResponse.json({ papers, total, limit, offset });
  } catch (err) {
    console.error("Papers API error:", err);
    return NextResponse.json(
      { error: "Failed to load papers" },
      { status: 500 }
    );
  }
}
