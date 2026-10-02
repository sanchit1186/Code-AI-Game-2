/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

export interface ClientRunResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  timeMs: number;
}

let pyodidePromise: Promise<any> | null = null;

/**
 * Preload Pyodide WebAssembly runtime from CDN in the browser.
 */
export function preloadPyodide(): Promise<any> {
  if (typeof window === "undefined") return Promise.resolve(null);

  if ((window as any).__pyodideInstance) {
    return Promise.resolve((window as any).__pyodideInstance);
  }

  if (pyodidePromise) return pyodidePromise;

  pyodidePromise = new Promise((resolve, reject) => {
    const SCRIPT_URL = "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js";

    const initInstance = async () => {
      try {
        if (typeof (window as any).loadPyodide !== "function") {
          throw new Error("loadPyodide is not defined on window");
        }
        const pyodide = await (window as any).loadPyodide({
          indexURL: "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/",
        });
        (window as any).__pyodideInstance = pyodide;
        // Background warm-up of core data science packages
        if (typeof pyodide.loadPackage === "function") {
          pyodide.loadPackage(["numpy", "pandas", "scikit-learn"]).catch(() => {});
        }
        resolve(pyodide);
      } catch (err) {
        pyodidePromise = null;
        reject(err);
      }
    };

    const existingScript = document.querySelector(`script[src="${SCRIPT_URL}"]`) as HTMLScriptElement | null;
    if (existingScript) {
      if ((window as any).loadPyodide) {
        initInstance();
      } else {
        existingScript.addEventListener("load", initInstance);
        existingScript.addEventListener("error", () => {
          pyodidePromise = null;
          reject(new Error("Failed to load Pyodide script from CDN"));
        });
      }
      return;
    }

    const script = document.createElement("script");
    script.src = SCRIPT_URL;
    script.async = true;
    script.onload = () => initInstance();
    script.onerror = () => {
      pyodidePromise = null;
      reject(new Error("Failed to load Pyodide script from CDN"));
    };
    document.head.appendChild(script);
  });

  return pyodidePromise;
}

/**
 * Execute Python code in the browser with full stdout, stderr and stdin support.
 */
export async function runPythonInBrowser(
  sourceCode: string,
  stdin: string = "",
  timeoutMs: number = 15000
): Promise<ClientRunResult> {
  const pyodide = await preloadPyodide();
  if (!pyodide) {
    throw new Error("Pyodide engine is not available in current environment");
  }

  // Dynamically load any imported packages (numpy, pandas, scikit-learn, etc.)
  if (typeof pyodide.loadPackagesFromImports === "function") {
    try {
      await pyodide.loadPackagesFromImports(sourceCode);
    } catch {
      // ignore if offline or fallback
    }
  }

  const startTime = Date.now();

  const runnerScript = `
import sys, io, traceback

__captured_stdout = io.StringIO()
__captured_stderr = io.StringIO()
__old_stdout = sys.stdout
__old_stderr = sys.stderr
__old_stdin = sys.stdin

sys.stdout = __captured_stdout
sys.stderr = __captured_stderr

__stdin_val = ${JSON.stringify(stdin || "")}
if __stdin_val:
    sys.stdin = io.StringIO(__stdin_val)

__has_error = False
try:
    __user_globals = {
        '__name__': '__main__',
        '__doc__': None,
        '__builtins__': __builtins__,
    }
    exec(${JSON.stringify(sourceCode)}, __user_globals)
except (Exception, SystemExit) as __e:
    __has_error = True
    traceback.print_exc(file=__captured_stderr)
finally:
    sys.stdout = __old_stdout
    sys.stderr = __old_stderr
    sys.stdin = __old_stdin

__result_stdout = __captured_stdout.getvalue()
__result_stderr = __captured_stderr.getvalue()
__result_code = 1 if __has_error else 0
`;

  try {
    let timeoutId: any;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error("Execution timed out (exceeded limit). Potential infinite loop detected."));
      }, timeoutMs);
    });

    await Promise.race([pyodide.runPythonAsync(runnerScript), timeoutPromise]);
    clearTimeout(timeoutId);

    const stdout = pyodide.globals.get("__result_stdout") ?? "";
    const stderr = pyodide.globals.get("__result_stderr") ?? "";
    const exitCode = pyodide.globals.get("__result_code") ?? 0;

    return {
      stdout: String(stdout),
      stderr: String(stderr),
      exitCode: Number(exitCode),
      timeMs: Date.now() - startTime,
    };
  } catch (err: any) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return {
      stdout: "",
      stderr: errorMsg,
      exitCode: 1,
      timeMs: Date.now() - startTime,
    };
  }
}
