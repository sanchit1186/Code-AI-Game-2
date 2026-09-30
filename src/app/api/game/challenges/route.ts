import { NextRequest, NextResponse } from "next/server";
import { getRandomClientChallenge } from "@/lib/server/challenges";

export const dynamic = "force-dynamic";

/**
 * Public challenge endpoint:
 * Strictly selects and returns ONE randomized challenge per session/request.
 * Supports optional `exclude` query param to ensure consecutive challenges are distinct.
 * ZERO frontend leakage: no other challenges, no challenge lists, no solutions, no hints, no expected output.
 */
export async function GET(req: NextRequest) {
  const excludeId = req.nextUrl.searchParams.get("exclude") ?? undefined;
  const challenge = getRandomClientChallenge(excludeId);
  return NextResponse.json({
    success: true,
    challenge,
  });
}
