"use client";

import React, { useRef, useEffect } from "react";
import type { ChallengeClient } from "@/lib/server/challenges";

interface AlarmSuccessModalProps {
  isOpen: boolean;
  challenge: ChallengeClient | null;
  timeSpentSeconds: number;
  scoreAwarded: number;
  bonusAwarded: number;
  totalScore: number;
  emittedOutput: string;
  onContinueToNext: () => void;
  isContinuing?: boolean;
}

export default function AlarmSuccessModal({
  isOpen,
  challenge,
  timeSpentSeconds,
  scoreAwarded,
  bonusAwarded,
  totalScore,
  emittedOutput,
  onContinueToNext,
  isContinuing = false,
}: AlarmSuccessModalProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  }, [isOpen]);

  if (!isOpen || !challenge) return null;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/95 backdrop-blur-md overflow-y-auto">
      {/* Centered Money Heist atmospheric glow (red + emerald ambient flare) */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 60% at 50% 50%, rgba(220, 38, 38, 0.15) 0%, rgba(16, 185, 129, 0.10) 35%, rgba(10, 10, 12, 0.8) 70%, rgba(0, 0, 0, 0.98) 100%)",
        }}
      />

      <div className="relative w-full max-w-2xl bg-neutral-950 border border-red-600/40 rounded-xl shadow-[0_0_60px_rgba(220,38,38,0.25),0_0_40px_rgba(16,185,129,0.15),0_25px_60px_rgba(0,0,0,0.9)] text-neutral-200 overflow-hidden font-mono flex flex-col my-auto max-h-[90vh]">
        {/* Terminal Header Bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-neutral-900/90 border-b border-red-600/30 shrink-0">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span className="text-xs sm:text-sm font-bold uppercase tracking-widest text-emerald-400">
              TRANSMISSION // OVERRIDE VERIFIED
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-red-400 font-bold bg-red-950/80 px-2 py-0.5 rounded border border-red-700/50 uppercase tracking-widest">
              02 | ALARM SYSTEM
            </span>
            <span className="text-[10px] text-emerald-300 font-bold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-600/40 uppercase tracking-wider">
              SECTOR CLEARED
            </span>
          </div>
        </div>

        {/* Content Body */}
        <div
          ref={contentRef}
          className="p-5 sm:p-7 space-y-5 overflow-y-auto text-[13px] leading-relaxed select-text"
        >
          {/* Main Title Banner */}
          <div>
            <div className="flex items-center gap-2 text-xs text-red-400 uppercase tracking-widest mb-1.5 font-bold">
              <span>🎭 LA CASA DE PAPEL</span>
              <span>•</span>
              <span className="text-emerald-400">MISSION SUCCESSFUL</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex flex-wrap items-center gap-2">
              <span className="text-emerald-400">ALARM BYPASSED.</span>
              <span className="text-neutral-200">The vault sector is clear.</span>
            </h1>
          </div>

          {/* Professor Transmission Transcript */}
          <div className="p-4 rounded-lg bg-neutral-900/80 border border-red-600/30 text-neutral-300 space-y-2.5">
            <div className="flex items-center gap-2 text-red-400 text-xs font-bold uppercase tracking-wider">
              <span>🚨 TRANSMISSION FROM EL PROFESOR</span>
            </div>
            <p className="italic text-neutral-200">
              &quot;Brilliant work, team. The disarm sequence signature for <strong className="text-white">[{challenge.title}]</strong> was accepted by the Royal Mint mainframe. The acoustic sirens have halted and the sensor grid has powered down. We bought ourselves precious time, but the next vault layer is already arming. Prepare for the next phase.&quot;
            </p>
            <div className="text-right text-xs text-red-400 font-semibold">
              — Sergio Marquina (El Profesor)
            </div>
          </div>

          {/* Performance & Score Breakdown Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Points Awarded */}
            <div className="p-3.5 rounded-lg bg-neutral-900/90 border border-emerald-500/30 space-y-1">
              <div className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
                POINTS AWARDED
              </div>
              <div className="text-2xl font-bold text-emerald-400 tracking-wide font-mono">
                +{totalScore} <span className="text-xs text-neutral-400">PTS</span>
              </div>
              <div className="text-[10px] text-neutral-500 font-mono">
                {scoreAwarded} Base + {bonusAwarded} Speed
              </div>
            </div>

            {/* Time Taken */}
            <div className="p-3.5 rounded-lg bg-neutral-900/90 border border-amber-500/30 space-y-1">
              <div className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
                TIME TAKEN
              </div>
              <div className="text-2xl font-bold text-amber-400 tracking-wide font-mono">
                {formatTime(timeSpentSeconds)}
              </div>
              <div className="text-[10px] text-neutral-500 font-mono">
                {timeSpentSeconds}s elapsed
              </div>
            </div>

            {/* Subroutine Info */}
            <div className="p-3.5 rounded-lg bg-neutral-900/90 border border-white/5 space-y-1">
              <div className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
                SUBROUTINE SOLVED
              </div>
              <div className="text-sm font-bold text-white truncate" title={challenge.title}>
                {challenge.title}
              </div>
              <div className="text-[10px] text-red-400 uppercase tracking-wider font-semibold">
                SUBROUTINE {challenge.stageNumber} // {challenge.category}
              </div>
            </div>
          </div>

          {/* Emitted Sequence Signature */}
          {emittedOutput && (
            <div className="p-3 rounded-lg bg-black/70 border border-emerald-500/30 space-y-1.5">
              <div className="text-[10.5px] font-bold text-neutral-400 uppercase tracking-wider flex items-center justify-between">
                <span>VERIFIED DISARM SIGNATURE</span>
                <span className="text-emerald-400 text-[10px]">MAINFRAME BYPASS ACCEPTED</span>
              </div>
              <div className="p-2.5 rounded bg-black border border-white/10 text-emerald-400 font-mono text-xs overflow-x-auto whitespace-pre-wrap">
                {emittedOutput.trim()}
              </div>
            </div>
          )}
        </div>

        {/* Action Footer with prominent Continue to Next Game button */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-4 bg-neutral-900/90 border-t border-red-600/30 shrink-0">
          <div className="text-xs text-neutral-400 text-center sm:text-left">
            <span>PROCEED TO NEXT EMERGENCY BREACH SECTOR</span>
          </div>

          <button
            onClick={onContinueToNext}
            disabled={isContinuing}
            className="relative group w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 text-xs sm:text-sm font-bold tracking-wider uppercase text-white bg-red-600 hover:bg-red-500 rounded-lg transition-all shadow-[0_0_25px_rgba(220,38,38,0.5)] active:scale-95 cursor-pointer overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="absolute inset-0 w-full h-full bg-red-400/20 animate-pulse group-hover:opacity-0 transition-opacity" />
            <span className="relative flex items-center gap-2">
              {isContinuing ? (
                <>
                  <span className="inline-block w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span>PREPARING NEXT PHASE...</span>
                </>
              ) : (
                <>
                  <span>⚡ CONTINUE TO NEXT GAME</span>
                  <span className="text-red-200">›</span>
                </>
              )}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
