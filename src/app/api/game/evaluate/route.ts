import { NextRequest, NextResponse } from "next/server";
import { getChallengeById } from "@/lib/server/challenges";
import { runPythonCode } from "@/lib/server/pythonRunner";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { challengeId, code, stdin = "", timeSpentSeconds = 0 } = body;

    if (!challengeId || typeof code !== "string") {
      return NextResponse.json(
        { success: false, error: "Missing challengeId or code payload." },
        { status: 400 }
      );
    }

    const challenge = getChallengeById(challengeId);
    if (!challenge) {
      return NextResponse.json(
        { success: false, error: "Challenge not found in security database." },
        { status: 404 }
      );
    }

    // Execute the submitted Python code
    const runResult = await runPythonCode(code, stdin);

    // Normalize outputs for comparison (trim trailing whitespace/newlines)
    const normalizedStdout = runResult.stdout.trim();
    const normalizedExpected = challenge.expectedOutput.trim();

    const passed =
      runResult.exitCode === 0 &&
      normalizedStdout === normalizedExpected;

    let scoreAwarded = 0;
    let bonusAwarded = 0;

    if (passed) {
      scoreAwarded = challenge.points;
      // Calculate speed bonus: max bonus decayed by elapsed time (minimum 5 pts)
      const elapsed = Math.max(0, Number(timeSpentSeconds) || 0);
      bonusAwarded = Math.max(5, Math.round(challenge.timeBonusMax * Math.max(0, 1 - elapsed / 300)));
    }

    let message = "";
    if (passed) {
      message = `SECURITY OVERRIDE ACCEPTED: Disarm sequence verified! Subroutine [${challenge.title}] neutralized.`;
    } else if (runResult.exitCode !== 0) {
      message = `RUNTIME EXCEPTION: The script exited with error code ${runResult.exitCode}. Inspect the traceback below.`;
    } else if (!normalizedStdout.startsWith("DISARM_SEQ:")) {
      message = `FORMAT REJECTED: Output must produce the required "DISARM_SEQ: ..." format string.`;
    } else {
      message = `DISARM SEQUENCE MISMATCH: The calculated sequence signature does not match the vault frequency. Review the algorithm logic.`;
    }

    return NextResponse.json({
      success: true,
      passed,
      stdout: runResult.stdout,
      stderr: runResult.stderr,
      exitCode: runResult.exitCode,
      timeMs: runResult.timeMs,
      scoreAwarded,
      bonusAwarded,
      totalScore: scoreAwarded + bonusAwarded,
      message,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal evaluation error",
      },
      { status: 500 }
    );
  }
}
