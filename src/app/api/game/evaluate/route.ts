import { NextRequest, NextResponse } from "next/server";
import { getChallengeById } from "@/lib/server/challenges";
import { runPythonCode, type PythonRunResult } from "@/lib/server/pythonRunner";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      challengeId,
      code,
      stdin = "",
      timeSpentSeconds = 0,
      clientRunResult,
    } = body;

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
    // If client-side WebAssembly execution (Pyodide) already ran the code, use those results;
    // otherwise fallback to server runner (Docker executor or host Python).
    let runResult: PythonRunResult;
    if (
      clientRunResult &&
      typeof clientRunResult.stdout === "string" &&
      typeof clientRunResult.exitCode === "number"
    ) {
      runResult = {
        stdout: clientRunResult.stdout,
        stderr: clientRunResult.stderr ?? "",
        exitCode: clientRunResult.exitCode,
        timeMs:
          typeof clientRunResult.timeMs === "number"
            ? clientRunResult.timeMs
            : 0,
      };
    } else {
      runResult = await runPythonCode(code, stdin);
    }

    // Normalize outputs for comparison (trim trailing whitespace/newlines)
    const normalizedStdout = runResult.stdout.trim();
    const normalizedExpected = challenge.expectedOutput.trim();

    const passed =
      runResult.exitCode === 0 &&
      normalizedStdout === normalizedExpected;

    let scoreAwarded = 0;
    const bonusAwarded = 0;

    if (passed) {
      // 10-point decay system over 15 minutes (900 seconds)
      // >= 13 mins left (<= 120s elapsed): 10 points
      // Gradually decays from 9 down to 1 over the remaining 780 seconds
      const elapsed = Math.max(0, Number(timeSpentSeconds) || 0);
      const timeLeft = Math.max(0, 900 - elapsed);
      if (timeLeft >= 780) {
        scoreAwarded = 10;
      } else if (timeLeft > 0) {
        scoreAwarded = Math.min(9, Math.max(1, 1 + Math.floor((timeLeft / 780) * 9)));
      } else {
        scoreAwarded = 1; // Minimum completion point if submitted at expiration
      }
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
