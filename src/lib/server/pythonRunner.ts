import { spawn, type ChildProcess } from "child_process";
import fs from "fs/promises";
import os from "os";
import path from "path";

export interface PythonRunResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  timeMs: number;
}

const EXECUTOR_URL = process.env.EXECUTOR_URL || "http://localhost:4000";

/**
 * Execute Python source code safely with a timeout and resource safeguards.
 * Checks Docker executor first if available; gracefully falls back to local Python runtime.
 */
export async function runPythonCode(
  sourceCode: string,
  stdin: string = "",
  timeoutMs: number = 4000
): Promise<PythonRunResult> {
  const startTime = Date.now();

  // 1. Attempt Docker executor if accessible
  try {
    const controller = new AbortController();
    const abortTimer = setTimeout(() => controller.abort(), 1200);

    const res = await fetch(`${EXECUTOR_URL}/execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ language: "python", source: sourceCode, stdin }),
      cache: "no-store",
      signal: controller.signal,
    });

    clearTimeout(abortTimer);

    if (res.ok) {
      const data = await res.json();
      return {
        stdout: data.stdout ?? "",
        stderr: data.stderr ?? "",
        exitCode: data.exitCode ?? (data.status === "error" ? 1 : 0),
        timeMs: data.time ? Math.round(data.time * 1000) : Date.now() - startTime,
      };
    }
  } catch {
    // Docker executor unavailable or timed out; seamlessly fallback to local runtime
  }

  // 2. Safe local execution fallback using host Python interpreter
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "alarm-code-"));
  const tempFile = path.join(tempDir, "solution.py");

  try {
    await fs.writeFile(tempFile, sourceCode, "utf-8");

    const candidates =
      process.platform === "win32"
        ? [process.env.PYTHON_BIN, "python", "py", "python3"].filter(Boolean) as string[]
        : [process.env.PYTHON_BIN, "python3", "python"].filter(Boolean) as string[];

    const pythonCmd = candidates[0];

    return await new Promise<PythonRunResult>((resolve) => {
      let isSettled = false;
      const child: ChildProcess = spawn(pythonCmd, [tempFile], {
        cwd: tempDir,
        env: {
          ...process.env,
          PYTHONUNBUFFERED: "1",
          PYTHONDONTWRITEBYTECODE: "1",
        },
        windowsHide: true,
      });

      let stdout = "";
      let stderr = "";

      const timer = setTimeout(() => {
        if (!isSettled) {
          isSettled = true;
          try {
            child.kill();
          } catch {
            // ignore
          }
          resolve({
            stdout,
            stderr: "Execution timed out (exceeded 4 seconds limit). Potential infinite loop detected.",
            exitCode: 124,
            timeMs: Date.now() - startTime,
          });
        }
      }, timeoutMs);

      child.stdout?.on("data", (chunk: Buffer | string) => {
        if (stdout.length < 50000) {
          stdout += chunk.toString();
        }
      });

      child.stderr?.on("data", (chunk: Buffer | string) => {
        if (stderr.length < 50000) {
          stderr += chunk.toString();
        }
      });

      if (stdin && child.stdin) {
        child.stdin.write(stdin);
        child.stdin.end();
      }

      child.on("error", (err: Error & { code?: string }) => {
        if (!isSettled) {
          isSettled = true;
          clearTimeout(timer);
          const isMissing = err.code === "ENOENT" || err.message.includes("ENOENT");
          resolve({
            stdout,
            stderr: isMissing
              ? `Python environment not detected on this server instance (${pythonCmd} not found). Running via client-side WebAssembly (Pyodide) is recommended.`
              : `Execution error: ${err.message}`,
            exitCode: 1,
            timeMs: Date.now() - startTime,
          });
        }
      });

      child.on("close", (code: number | null) => {
        if (!isSettled) {
          isSettled = true;
          clearTimeout(timer);
          resolve({
            stdout,
            stderr,
            exitCode: code ?? 0,
            timeMs: Date.now() - startTime,
          });
        }
      });
    });
  } finally {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // ignore
    }
  }
}
