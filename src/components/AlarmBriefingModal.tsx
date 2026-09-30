"use client";

import React, { useRef, useEffect } from "react";
import type { ChallengeClient } from "@/lib/server/challenges";

interface AlarmBriefingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInitiateBypass: () => void;
  isFirstLaunch?: boolean;
  challenge?: ChallengeClient | null;
}

export default function AlarmBriefingModal({
  isOpen,
  onClose,
  onInitiateBypass,
  isFirstLaunch = false,
  challenge,
}: AlarmBriefingModalProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/95 backdrop-blur-md overflow-y-auto">
      {/* Symmetrical, centered ambient red atmospheric glow */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 60% at 50% 50%, rgba(220, 38, 38, 0.14) 0%, rgba(15, 5, 5, 0.65) 55%, rgba(0, 0, 0, 0.95) 100%)",
        }}
      />

      <div className="relative w-full max-w-3xl bg-[#0a0a0d] border border-red-600/50 rounded-xl shadow-[0_0_60px_rgba(220,38,38,0.3),0_25px_60px_rgba(0,0,0,0.9)] text-neutral-200 overflow-hidden font-mono flex flex-col my-auto max-h-[90vh]">
        {/* Terminal Header Bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-neutral-900/90 border-b border-red-600/30 shrink-0">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
            </span>
            <span className="text-xs sm:text-sm font-bold uppercase tracking-widest text-red-500">
              EMERGENCY TRANSMISSION // EL PROFESOR
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-block text-[11px] text-neutral-400 bg-red-950/60 px-2 py-0.5 rounded border border-red-800/40">
              CHANNEL: ENCRYPTED-256
            </span>
            {!isFirstLaunch && (
              <button
                onClick={onClose}
                className="text-neutral-400 hover:text-white p-1 rounded hover:bg-neutral-800 transition text-sm cursor-pointer"
                title="Close Briefing"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div
          ref={contentRef}
          className="p-5 sm:p-7 space-y-5 overflow-y-auto text-[13px] leading-relaxed select-text"
        >
          {/* Main Title */}
          <div>
            <div className="flex items-center gap-2 text-xs text-red-400 uppercase tracking-widest mb-1">
              <span>🎭 LA CASA DE PAPEL</span>
              <span>•</span>
              <span>SPECIAL COMMITTEE EVENT</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <span className="text-red-600">02 |</span> ALARM SYSTEM — Debugging
            </h1>
          </div>

          {/* Professor Transmission Banner */}
          <div className="p-4 rounded-lg bg-red-950/20 border border-red-600/30 text-neutral-300 space-y-2.5">
            <div className="flex items-center gap-2 text-red-400 text-xs font-bold uppercase tracking-wider">
              <span>🚨 TRANSMISSION AUDIO TRANSCRIPT</span>
            </div>
            <p className="italic text-neutral-200">
              &quot;Listen closely, team. The Royal Mint&apos;s perimeter and vault mainframe are armed and flashing red. We have successfully tapped into their internal telemetry cables, but the subroutine responsible for generating the cryptographic disarm sequence arrived corrupted with subtle defects.
            </p>
            <p className="italic text-neutral-200">
              If the alarm countdown expires before we neutralize this defense layer, the Spanish National Police will deploy. Inspect the intercepted Python script assigned to your terminal, diagnose the logic flaw, repair the code, and emit the exact disarm sequence string. No casualties. No second chances.&quot;
            </p>
            <div className="text-right text-xs text-red-400 font-semibold">— Sergio Marquina (El Profesor)</div>
          </div>

          {/* Assigned Challenge & Problem Description */}
          {challenge && (
            <div className="p-4 rounded-lg bg-neutral-900/90 border border-red-500/40 space-y-2.5 shadow-sm">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-[10px] font-mono tracking-widest text-red-400 bg-red-950/70 px-2 py-0.5 rounded border border-red-700/50 uppercase">
                  ASSIGNED TARGET // SUBROUTINE {challenge.stageNumber} // {challenge.category}
                </span>
                <span className="text-[10px] text-amber-300 font-bold bg-amber-950/50 px-2 py-0.5 rounded border border-amber-600/40">
                  {challenge.points} PTS
                </span>
              </div>
              <h2 className="text-base font-bold text-white tracking-wide">
                {challenge.title}
              </h2>
              <div className="p-3 rounded bg-black/60 border border-white/5 text-[12.5px] text-neutral-300 whitespace-pre-line leading-relaxed font-mono">
                {challenge.description}
              </div>
            </div>
          )}

          {/* Mission Directives & Rules Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="p-3.5 rounded-lg bg-neutral-900/60 border border-white/5 space-y-1.5">
              <div className="text-red-400 font-bold text-xs uppercase flex items-center gap-1.5">
                <span>🎯 MISSION OBJECTIVE</span>
              </div>
              <ul className="list-disc list-inside text-neutral-400 text-xs space-y-1">
                <li>Debug your assigned corrupted Python script.</li>
                <li>Identify the root logic flaw on your own — no hints provided.</li>
                <li>Output format must strictly match: <code className="text-red-300">DISARM_SEQ: &lt;KEY&gt;</code>.</li>
              </ul>
            </div>

            <div className="p-3.5 rounded-lg bg-neutral-900/60 border border-white/5 space-y-1.5">
              <div className="text-amber-400 font-bold text-xs uppercase flex items-center gap-1.5">
                <span>⚡ SCORING &amp; SPEED BONUSES</span>
              </div>
              <ul className="list-disc list-inside text-neutral-400 text-xs space-y-1">
                <li><strong className="text-white">100 Base Points</strong> for a verified disarm sequence.</li>
                <li><strong className="text-amber-300">Up to 50 Speed Bonus Points</strong> for fast bypass.</li>
                <li>Total available: <strong className="text-red-400">150 Max Points</strong>.</li>
              </ul>
            </div>
          </div>

          {/* Technical Diagnostics Clues */}
          <div className="p-3.5 rounded-lg bg-black/60 border border-red-900/30 space-y-2">
            <div className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
              <span>🛠️ DETECTED ANOMALIES IN INTERCEPTED CODE</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] text-neutral-400">
              <div className="bg-neutral-900/80 p-2 rounded border border-white/5">
                • Off-by-one loop bounds
              </div>
              <div className="bg-neutral-900/80 p-2 rounded border border-white/5">
                • Mutable default arguments
              </div>
              <div className="bg-neutral-900/80 p-2 rounded border border-white/5">
                • Late-binding lambda closures
              </div>
              <div className="bg-neutral-900/80 p-2 rounded border border-white/5">
                • Bitwise operator precedence
              </div>
              <div className="bg-neutral-900/80 p-2 rounded border border-white/5">
                • Dict mutation during iteration
              </div>
              <div className="bg-neutral-900/80 p-2 rounded border border-white/5">
                • Matrix coordinate indexing
              </div>
            </div>
          </div>
        </div>

        {/* CTA Footer Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-4 bg-neutral-900/90 border-t border-red-600/30 shrink-0">
          <div className="text-xs text-neutral-400 text-center sm:text-left">
            <span>READY TO BREACH SYSTEM MAINFRAME?</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            {!isFirstLaunch && (
              <button
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-lg transition"
              >
                RETURN TO TERMINAL
              </button>
            )}
            <button
              onClick={onInitiateBypass}
              className="relative group w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 text-xs sm:text-sm font-bold tracking-wider uppercase text-white bg-red-600 hover:bg-red-500 rounded-lg transition-all shadow-[0_0_20px_rgba(220,38,38,0.5)] active:scale-95 cursor-pointer overflow-hidden"
            >
              <span className="absolute inset-0 w-full h-full bg-red-400/20 animate-pulse group-hover:opacity-0 transition-opacity" />
              <span className="relative flex items-center gap-2">
                <span>⚡ INITIATE BYPASS</span>
                <span className="text-red-200">›</span>
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
