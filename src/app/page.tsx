"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Editor from "@/components/Editor";
import AlarmBriefingModal from "@/components/AlarmBriefingModal";
import AlarmSuccessModal from "@/components/AlarmSuccessModal";
import {
  playKeyBlip,
  playSuccessSound,
  playErrorSound,
  toggleSirenDrone,
} from "@/lib/alarmAudio";
import type { ChallengeClient } from "@/lib/server/challenges";

interface EvaluateResponse {
  success: boolean;
  passed: boolean;
  stdout: string;
  stderr: string;
  exitCode: number;
  timeMs: number;
  scoreAwarded: number;
  bonusAwarded: number;
  totalScore: number;
  message: string;
  error?: string;
}

export default function AlarmSystemGamePage() {
  const [challenge, setChallenge] = useState<ChallengeClient | null>(null);
  const [userCode, setUserCode] = useState("");
  const [isPassed, setIsPassed] = useState(false);
  const [totalScore, setTotalScore] = useState(0);
  const [stdin, setStdin] = useState("");
  const [isExecuting, setIsExecuting] = useState(false);
  const [evalResult, setEvalResult] = useState<EvaluateResponse | null>(null);
  const [loadingChallenge, setLoadingChallenge] = useState(true);

  // UI state
  const [showBriefing, setShowBriefing] = useState(true);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isContinuing, setIsContinuing] = useState(false);
  const [isFirstLaunch, setIsFirstLaunch] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(false);

  // Countdown Timer (15 minutes default: 900 seconds)
  const [timeLeft, setTimeLeft] = useState(900);
  const [timerRunning, setTimerRunning] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Load exactly ONE randomly selected challenge from backend (excluding previous)
  const loadRandomChallenge = useCallback(async (excludeId?: string) => {
    setLoadingChallenge(true);
    try {
      const url = excludeId
        ? `/api/game/challenges?exclude=${encodeURIComponent(excludeId)}`
        : "/api/game/challenges";
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.challenge) {
          setChallenge(data.challenge);
          setUserCode(data.challenge.buggyCode);
          setIsPassed(false);
          setEvalResult(null);
          setTimeLeft(900);
          setTimerRunning(false);
          return data.challenge;
        }
      }
    } catch (err) {
      console.error("Failed to load random challenge:", err);
    } finally {
      setLoadingChallenge(false);
    }
  }, []);

  useEffect(() => {
    loadRandomChallenge();
  }, [loadRandomChallenge]);

  // Continue to Next Game flow:
  // Resets game state, fetches a distinct new random challenge, and returns to initial Briefing Screen
  const handleContinueToNext = async () => {
    playKeyBlip();
    setIsContinuing(true);
    const prevId = challenge?.id;
    await loadRandomChallenge(prevId);
    setShowSuccessModal(false);
    setIsContinuing(false);
    setIsFirstLaunch(true);
    setShowBriefing(true); // Return to initial Briefing Screen state
  };

  // Timer effect
  useEffect(() => {
    if (timerRunning && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setTimerRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerRunning, timeLeft]);

  // Audio effect toggle
  const handleToggleAudio = () => {
    const nextState = !audioEnabled;
    setAudioEnabled(nextState);
    toggleSirenDrone(nextState);
    playKeyBlip();
  };

  const handleResetCode = () => {
    if (!challenge) return;
    playKeyBlip();
    setUserCode(challenge.buggyCode);
    setEvalResult(null);
  };

  const handleInitiateBypass = () => {
    playKeyBlip();
    setShowBriefing(false);
    setIsFirstLaunch(false);
    if (!timerRunning && timeLeft > 0) {
      setTimerRunning(true);
    }
  };

  // Run and Evaluate code against secure backend
  const handleSubmitCode = useCallback(async () => {
    if (!challenge || isExecuting) return;
    playKeyBlip();
    setIsExecuting(true);
    setEvalResult(null);

    const timeSpentSeconds = 900 - timeLeft;

    try {
      const res = await fetch("/api/game/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challengeId: challenge.id,
          code: userCode,
          stdin,
          timeSpentSeconds,
        }),
      });

      const data: EvaluateResponse = await res.json();
      setEvalResult(data);

      if (data.passed) {
        playSuccessSound();
        setIsPassed(true);
        setTotalScore(data.totalScore);
        setTimerRunning(false);
        // Render prominent success modal
        setShowSuccessModal(true);
      } else {
        playErrorSound();
      }
    } catch (err) {
      playErrorSound();
      setEvalResult({
        success: false,
        passed: false,
        stdout: "",
        stderr: err instanceof Error ? err.message : "Evaluation failed",
        exitCode: 1,
        timeMs: 0,
        scoreAwarded: 0,
        bonusAwarded: 0,
        totalScore: 0,
        message: "Failed to communicate with evaluation server.",
      });
    } finally {
      setIsExecuting(false);
    }
  }, [challenge, isExecuting, userCode, stdin, timeLeft]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-[#08080a] text-neutral-200 font-mono select-none overflow-hidden">
      {/* 1. Homescreen / Briefing Screen Modal */}
      <AlarmBriefingModal
        isOpen={showBriefing}
        onClose={() => setShowBriefing(false)}
        onInitiateBypass={handleInitiateBypass}
        isFirstLaunch={isFirstLaunch}
        challenge={challenge}
      />

      {/* 1b. Success Screen Modal */}
      <AlarmSuccessModal
        isOpen={showSuccessModal}
        challenge={challenge}
        timeSpentSeconds={900 - timeLeft}
        scoreAwarded={evalResult?.scoreAwarded ?? 0}
        bonusAwarded={evalResult?.bonusAwarded ?? 0}
        totalScore={evalResult?.totalScore ?? totalScore}
        emittedOutput={evalResult?.stdout ?? ""}
        onContinueToNext={handleContinueToNext}
        isContinuing={isContinuing}
      />

      {/* 2. Top Navigation Bar (Money Heist Themed) */}
      <header className="h-14 flex items-center justify-between px-4 sm:px-6 bg-[#0c0d11] border-b border-red-600/30 shrink-0 gap-3 sm:gap-6 z-20">
        {/* Left: Branding & Navigation with generous spacing */}
        <div className="flex items-center gap-3.5 shrink-0">
          <button
            onClick={() => setShowBriefing(true)}
            className="flex items-center justify-center w-8 h-8 rounded-lg border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] hover:border-red-500/40 text-neutral-400 hover:text-white transition-all text-xs shadow-sm cursor-pointer"
            title="Open Mission Briefing & Directives"
          >
            📋
          </button>

          <div className="h-5 w-px bg-white/10" />

          <div className="flex items-center gap-2.5">
            <span className="text-base select-none">🎭</span>

            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-bold text-white tracking-wider uppercase font-mono">
                  02 | ALARM SYSTEM
                </span>
                <span className="hidden md:inline-flex items-center text-[9.5px] font-bold text-red-400 font-mono tracking-widest bg-red-950/80 px-2 py-0.5 rounded-full border border-red-700/50">
                  LA CASA DE PAPEL
                </span>
              </div>

              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
                <span className="text-[10px] text-neutral-400 uppercase tracking-widest font-mono">
                  ROYAL MINT // EMERGENCY BYPASS
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Center: Mission Target & Countdown Timer */}
        <div className="hidden sm:flex items-center gap-3.5">
          {/* Target Defense Subroutine */}
          <div className="flex items-center gap-2 px-3 py-1 rounded bg-[#13141a] border border-white/5 text-xs">
            <span className="text-neutral-400 text-[11px]">TARGET:</span>
            <span className="font-bold text-white tracking-wide truncate max-w-[180px] lg:max-w-none">
              {challenge ? challenge.title.toUpperCase() : "ASSIGNING..."}
            </span>
            <span
              className={`text-[9.5px] px-2 py-0.5 rounded font-bold font-mono uppercase tracking-wider ${
                isPassed
                  ? "bg-emerald-950 text-emerald-400 border border-emerald-600/40"
                  : "bg-red-950 text-red-400 border border-red-800/40"
              }`}
            >
              {isPassed ? "DISARMED" : "ARMED"}
            </span>
          </div>

          {/* Countdown Timer */}
          <div
            className={`flex items-center gap-2 px-3 py-1 rounded border font-mono text-xs transition-colors ${
              timeLeft < 180
                ? "bg-red-950/70 border-red-600/80 text-red-400 animate-pulse"
                : timeLeft < 360
                ? "bg-amber-950/40 border-amber-600/50 text-amber-300"
                : "bg-[#13141a] border-white/10 text-neutral-200"
            }`}
            title="Lockdown Breach Countdown Timer"
          >
            <span>⏱️</span>
            <span className="font-bold text-sm tracking-widest">{formatTimer(timeLeft)}</span>
            <span className="text-[9px] uppercase tracking-wider text-neutral-500">REMAINING</span>
          </div>

          {/* Score Counter */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded bg-red-950/30 border border-red-600/30 text-xs">
            <span className="text-neutral-400 text-[11px]">SCORE:</span>
            <span className="font-bold text-white text-sm tracking-wider">{totalScore}</span>
            <span className="text-[10px] text-red-400">PTS</span>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Audio Synthesizer Toggle */}
          <button
            onClick={handleToggleAudio}
            className={`flex items-center justify-center w-8 h-8 rounded border transition text-xs cursor-pointer ${
              audioEnabled
                ? "border-red-500/50 bg-red-950/50 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.3)]"
                : "border-white/10 bg-white/5 text-neutral-400 hover:text-white"
            }`}
            title={audioEnabled ? "Mute Siren Drone Audio" : "Enable Heist Siren Drone Audio"}
          >
            {audioEnabled ? "🔊" : "🔇"}
          </button>

          {/* Briefing Toggle Button */}
          <button
            onClick={() => {
              playKeyBlip();
              setShowBriefing(true);
            }}
            className="flex items-center gap-1.5 px-2.5 h-8 rounded border border-red-600/40 bg-red-950/30 hover:bg-red-900/40 text-red-300 text-xs font-semibold tracking-wide transition cursor-pointer"
            title="Open Mission Briefing from The Professor"
          >
            <span>📜</span>
            <span className="hidden lg:inline">Briefing</span>
          </button>

          {/* Execute / Submit Button */}
          <button
            onClick={handleSubmitCode}
            disabled={isExecuting || !challenge}
            className={`flex items-center gap-2 px-3.5 h-8 rounded font-bold text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer ${
              isExecuting
                ? "bg-neutral-800 text-neutral-500 cursor-not-allowed"
                : "bg-red-600 hover:bg-red-500 active:scale-95 text-white shadow-[0_0_15px_rgba(220,38,38,0.4)]"
            }`}
            title="Run Python script and verify against backend disarm sequence"
          >
            {isExecuting ? (
              <>
                <span className="inline-block w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                <span>Evaluating...</span>
              </>
            ) : (
              <>
                <span>🚨</span>
                <span>Submit Sequence</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* 3. Main Workspace Area */}
      <div className="flex-1 min-h-0 flex overflow-hidden">
        {/* Left: Problem Briefing Panel (Focused on the single assigned mission) */}
        <aside
          className={`shrink-0 bg-[#0b0c10] border-r border-white/10 flex flex-col transition-all duration-200 select-none overflow-hidden ${
            sidebarOpen ? "w-[300px] sm:w-[340px]" : "w-10"
          }`}
        >
          {/* Sidebar Toggle Bar */}
          <div className="h-9 px-2.5 flex items-center justify-between border-b border-white/10 bg-[#0f1015] shrink-0 text-xs">
            {sidebarOpen ? (
              <>
                <span className="font-bold text-[11px] uppercase tracking-wider text-red-400 flex items-center gap-1.5">
                  <span>🎯</span>
                  <span>ASSIGNED MISSION DOSSIER</span>
                </span>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-1 text-neutral-400 hover:text-white rounded hover:bg-white/5 cursor-pointer text-xs"
                  title="Collapse Challenge Panel"
                >
                  ◀
                </button>
              </>
            ) : (
              <button
                onClick={() => setSidebarOpen(true)}
                className="w-full text-center text-neutral-400 hover:text-white cursor-pointer text-xs"
                title="Expand Challenge Panel"
              >
                ▶
              </button>
            )}
          </div>

          {sidebarOpen && (
            <div className="flex-1 overflow-y-auto flex flex-col text-xs leading-relaxed select-text p-4 space-y-4">
              {loadingChallenge ? (
                <div className="p-4 text-center text-neutral-500">Interception telemetry loading...</div>
              ) : challenge ? (
                <>
                  {/* Phase & Points Header */}
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-[10px] font-mono tracking-widest text-red-400 bg-red-950/60 px-2 py-0.5 rounded border border-red-800/40 uppercase">
                        SUBROUTINE {challenge.stageNumber} // {challenge.category}
                      </span>
                      <span className="text-[10px] text-amber-300 font-bold bg-amber-950/40 px-2 py-0.5 rounded border border-amber-600/30">
                        {challenge.points} PTS
                      </span>
                    </div>

                    <h2 className="text-base font-bold text-white tracking-wide">
                      {challenge.title}
                    </h2>
                  </div>

                  {/* Problem Description */}
                  <div className="p-3.5 rounded-lg bg-[#121319] border border-white/5 text-[12.5px] text-neutral-300 whitespace-pre-line leading-relaxed shadow-sm">
                    {challenge.description}
                  </div>

                  {/* Target Requirement Card */}
                  <div className="p-3 rounded-lg bg-red-950/20 border border-red-600/30 text-neutral-300 space-y-1.5">
                    <div className="text-[11px] font-bold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                      <span>⚡ SEQUENCE PROTOCOL</span>
                    </div>
                    <p className="text-[11.5px] text-neutral-400">
                      Produce the exact bypass string matching the required formula format. No hints are permitted. Diagnose the corrupted script and patch the flaw directly.
                    </p>
                  </div>

                  {/* Reset Code Action */}
                  <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                    <button
                      onClick={handleResetCode}
                      className="text-[11.5px] text-neutral-400 hover:text-red-400 transition flex items-center gap-1.5 cursor-pointer"
                      title="Reset editor back to initial buggy script"
                    >
                      <span>🔄</span>
                      <span>Reset to Intercepted Code</span>
                    </button>

                    <button
                      onClick={() => loadRandomChallenge(challenge?.id)}
                      className="text-[11px] text-neutral-500 hover:text-neutral-300 transition flex items-center gap-1 cursor-pointer"
                      title="Request a new random mission assignment"
                    >
                      <span>🎲</span>
                      <span>New Assignment</span>
                    </button>
                  </div>
                </>
              ) : (
                <div className="p-4 text-center text-neutral-500">No challenge assigned.</div>
              )}
            </div>
          )}
        </aside>

        {/* Center: Monaco Code Editor Pane */}
        <section className="flex-1 min-w-0 flex flex-col bg-[#0b0c10]">
          {/* Editor Header Tab Bar */}
          <div className="h-9 flex items-center justify-between border-b border-white/10 bg-[#111218] px-3 shrink-0">
            <div className="flex items-center gap-1 h-full">
              <div className="flex items-center gap-2 px-3 h-full border-b-2 border-red-600 bg-white/[0.03] text-white text-xs font-semibold">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isPassed ? "bg-emerald-500" : "bg-red-500 animate-pulse"
                  }`}
                />
                <span>disarm_sequence.py</span>
                {isPassed && (
                  <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/60 px-1.5 rounded border border-emerald-600/30">
                    BYPASS VERIFIED
                  </span>
                )}
              </div>
            </div>

            <div className="text-[10px] font-mono text-neutral-500 flex items-center gap-2">
              <span className="hidden sm:inline">PYTHON 3.10+ // MONACO</span>
            </div>
          </div>

          {/* Monaco Editor Container */}
          <div className="flex-1 min-h-0 relative bg-[#0b0c10]">
            <Editor
              filename="disarm_sequence.py"
              value={userCode}
              onChange={setUserCode}
              theme="heist-dark"
            />
          </div>
        </section>

        {/* Right: Mission Console & Diagnostics */}
        <section className="w-[360px] sm:w-[420px] shrink-0 bg-[#0a0a0d] border-l border-white/10 flex flex-col text-xs font-mono">
          {/* Console Header Bar */}
          <div className="h-9 px-3 flex items-center justify-between border-b border-white/10 bg-[#0f1015] shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-neutral-600" />
              <span className="font-bold text-[11px] uppercase tracking-wider text-neutral-300">
                MISSION CONSOLE // EXECUTION
              </span>
            </div>

            {evalResult && (
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                  evalResult.passed
                    ? "bg-emerald-950 text-emerald-400 border-emerald-500/50"
                    : "bg-red-950 text-red-400 border-red-500/50"
                }`}
              >
                {evalResult.passed ? "BYPASS VERIFIED" : "ACCESS DENIED"}
              </span>
            )}
          </div>

          {/* Console Content */}
          <div className="flex-1 min-h-0 flex flex-col">
            {/* STDIN Input Stream (Optional) */}
            <div className="p-2.5 border-b border-white/5 bg-[#0d0e13] shrink-0">
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] font-bold uppercase text-neutral-400 tracking-wider">
                  CONSOLE INPUT STREAM (STDIN)
                </label>
                <span className="text-[9px] text-neutral-600">OPTIONAL</span>
              </div>
              <textarea
                value={stdin}
                onChange={(e) => setStdin(e.target.value)}
                placeholder="Custom stdin passed to execution..."
                rows={2}
                className="w-full resize-y rounded border border-white/10 bg-[#070709] px-2.5 py-1.5 text-neutral-200 outline-none placeholder:text-neutral-700 focus:border-red-600 text-[11px] font-mono"
              />
            </div>

            {/* Execution Diagnostic Results */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 select-text bg-[#070709]">
              {evalResult ? (
                <div className="space-y-3">
                  {/* Status Banner */}
                  <div
                    className={`p-3 rounded-lg border text-[11.5px] leading-relaxed ${
                      evalResult.passed
                        ? "bg-emerald-950/30 border-emerald-500/40 text-emerald-200 shadow-[0_0_15px_rgba(16,185,129,0.15)]"
                        : "bg-red-950/30 border-red-500/40 text-red-200 shadow-[0_0_15px_rgba(239,68,68,0.15)]"
                    }`}
                  >
                    <div className="font-bold flex items-center justify-between mb-1">
                      <span>
                        {evalResult.passed ? "✅ DISARM SEQUENCE ACCEPTED" : "❌ SEQUENCE REJECTED"}
                      </span>
                      <span className="text-[10px] font-mono text-neutral-400">
                        {evalResult.timeMs}ms
                      </span>
                    </div>
                    <p>{evalResult.message}</p>

                    {evalResult.passed && (
                      <div className="mt-2.5 pt-2 border-t border-emerald-500/30 flex items-center justify-between text-xs font-mono">
                        <span className="text-emerald-400 font-bold">
                          +{evalResult.scoreAwarded} PTS BASE + {evalResult.bonusAwarded} SPEED BONUS
                        </span>
                        <span className="text-white font-bold">
                          TOTAL: +{evalResult.totalScore} PTS
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Single Mission Cleared Card */}
                  {evalResult.passed && (
                    <div className="p-3.5 rounded-lg bg-emerald-950/20 border border-emerald-500/40 text-emerald-300 space-y-2">
                      <div className="font-bold text-xs uppercase flex items-center justify-between">
                        <span className="flex items-center gap-1.5">🎉 MISSION OBJECTIVE COMPLETED</span>
                        <button
                          onClick={() => setShowSuccessModal(true)}
                          className="text-[10px] text-emerald-400 hover:text-emerald-300 underline font-mono cursor-pointer"
                        >
                          View Debriefing
                        </button>
                      </div>
                      <p className="text-[11px] text-neutral-300 leading-normal">
                        The alarm subroutine has been fully decrypted and bypassed. The security lockdown is disarmed!
                      </p>
                      <button
                        onClick={handleContinueToNext}
                        disabled={isContinuing}
                        className="w-full mt-1 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded font-bold text-xs uppercase tracking-wider transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {isContinuing ? (
                          <>
                            <span className="inline-block w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                            <span>INITIALIZING NEXT GAME...</span>
                          </>
                        ) : (
                          <>
                            <span>⚡ CONTINUE TO NEXT GAME</span>
                            <span>›</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Standard Output (STDOUT) */}
                  {evalResult.stdout && (
                    <div>
                      <div className="text-[10px] font-bold uppercase text-neutral-400 mb-1 flex items-center justify-between">
                        <span>EMITTED OUTPUT (STDOUT)</span>
                      </div>
                      <pre className="p-2.5 rounded bg-black border border-white/10 text-emerald-400 font-mono text-[11px] overflow-x-auto whitespace-pre-wrap">
                        {evalResult.stdout}
                      </pre>
                    </div>
                  )}

                  {/* Standard Error / Traceback (STDERR) */}
                  {evalResult.stderr && (
                    <div>
                      <div className="text-[10px] font-bold uppercase text-red-400 mb-1 flex items-center justify-between">
                        <span>TRACEBACK / ERROR STREAM (STDERR)</span>
                      </div>
                      <pre className="p-2.5 rounded bg-red-950/20 border border-red-900/50 text-red-300 font-mono text-[11px] overflow-x-auto whitespace-pre-wrap">
                        {evalResult.stderr}
                      </pre>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center text-neutral-600 space-y-2 py-8">
                  <span className="text-2xl">⚡</span>
                  <p className="text-xs max-w-[220px]">
                    Click &quot;Submit Sequence&quot; above to run your Python script and verify your disarm algorithm against the security mainframe.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
