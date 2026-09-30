# 🎭 02 | ALARM SYSTEM — Debugging (Money Heist Edition)

> **"No casualties. No second chances."** — El Profesor  
> A high-stakes, competitive hacker debugging event where participants race against a 15-minute countdown to diagnose corrupted cryptographic Python subroutines and disarm the Royal Mint vault security mainframe.

---

## 📖 Table of Contents

- [🎯 Overview & Lore](#-overview--lore)
- [🚀 Quick Start](#-quick-start)
- [🔐 Environment Configuration (.env.local)](#-environment-configuration-envlocal)
- [🕹️ Gameplay Loop & Mechanics](#-gameplay-loop--mechanics)
  - [1. Pre-Game Briefing Screen](#1-pre-game-briefing-screen)
  - [2. Monaco Hacker Terminal](#2-monaco-hacker-terminal)
  - [3. Python Execution & Scoring](#3-python-execution--scoring)
  - [4. Success Dialog & Next Game Loop](#4-success-dialog--next-game-loop)
- [📂 File Locations & Directory Map](#-file-locations--directory-map)
- [🐍 Adding Custom Python Challenges & Expected Outputs](#-adding-custom-python-challenges--expected-outputs)
  - [Challenge Schema](#the-challengeserver-schema)
  - [Evaluation Protocol](#how-evaluation-works)
  - [Step-by-Step Code Example](#example-adding-a-new-challenge)
- [🎨 Design Aesthetics & Web Audio Engine](#-design-aesthetics--web-audio-engine)

---

## 🎯 Overview & Lore

The Royal Mint's vault mainframe and defense perimeter are armed and flashing red. We have successfully intercepted telemetry cables carrying the internal cryptographic disarm routine, but the Python script arrived corrupted with subtle defects.

If the 15-minute alarm countdown expires before participants neutralize this defense layer, the security mainframe triggers a permanent lockdown. Participants must inspect the intercepted Python script, diagnose the root logic flaw, repair the code, and emit the exact cryptographic disarm sequence string (`DISARM_SEQ: ...`).

### Key Rules
- **Single-Challenge Session:** When a session begins, the backend randomly assigns exactly **one** challenge from the security database. No challenge lists, dropdowns, or tabs are revealed to the player.
- **Strict Zero-Hint Policy:** No hints, clues, or giveaway comments (e.g. `# BUG: fix this`) exist in the problem descriptions or code. Participants must analyze the algorithms and isolate the defects purely through debugging.
- **15-Minute Breaching Timer:** A live 900-second countdown runs at the top of the interface, shifting from white to amber and pulsing red as time depletes.
- **Scoring & Speed Bonuses:** Successfully disarming the sector awards base points (100–150 PTS) plus an elapsed-time speed bonus (up to 50 PTS).

---

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) (v20 or newer) and `npm`
- [Python 3](https://www.python.org/) installed locally on your system PATH (`python` command) **or** Docker Desktop

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment File
```powershell
# On Windows PowerShell:
Copy-Item .env.local.example .env.local
```
```bash
# On macOS / Linux:
cp .env.local.example .env.local
```

### 3. Start the Development Server
```bash
npm run dev
```

### 4. Launch the Game
Open your browser and navigate directly to:
👉 **[http://localhost:3000](http://localhost:3000)**

---

## 🔐 Environment Configuration (.env.local)

The application reads its environment configuration from `.env.local` located at the project root:
`./.env.local` (e.g., `c:\Users\Sanchit\OneDrive\Desktop\CodeAI G3\.env.local`)

### Template Setup

Copy `.env.local.example` to `.env.local` to create your active configuration:

```env
# ---------------------------------------------------------------------------
# 1. Supabase Cloud Database (Optional for the Alarm System Game)
# ---------------------------------------------------------------------------
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-anon-or-publishable-key

# ---------------------------------------------------------------------------
# 2. Isolated Code Execution Microservice
# ---------------------------------------------------------------------------
EXECUTOR_URL=http://localhost:4000

# ---------------------------------------------------------------------------
# 3. Interactive Web Terminal (Optional WebSocket PTY server)
# ---------------------------------------------------------------------------
NEXT_PUBLIC_TERMINAL_WS_URL=
```

### Variables Reference

| Variable Name | Required For | Default / Value | Description |
| :--- | :--- | :--- | :--- |
| `EXECUTOR_URL` | Code Execution | `http://localhost:4000` | Address of the optional Docker sandbox microservice. |
| `NEXT_PUBLIC_SUPABASE_URL` | Cloud IDE (legacy) | `https://...` | Supabase project URL (not required for playing the Alarm System game). |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Cloud IDE (legacy) | `sb_publishable_...` | Supabase public client key. |
| `NEXT_PUBLIC_TERMINAL_WS_URL` | Web Terminal | *(Empty / Optional)* | Optional WebSocket URL for interactive terminal sessions. |

> 💡 **Seamless Host Python Execution (No Docker Required!)**:  
> The Alarm System game backend (`src/lib/server/pythonRunner.ts`) is built with automatic fallback resilience:
> 1. It first checks if the microservice at `EXECUTOR_URL` is active.
> 2. If Docker is not running or unreachable, it **automatically falls back to running the Python script directly via your local machine's host Python** (`python` on system PATH) with a strict 4-second timeout limit.
> 3. **You do NOT need Docker running to play, test, or host the game.**

> 🔒 **Security Notice**:
> `.env.local` is ignored by `.gitignore`. Never commit `.env.local` or expose service keys.

---

## 🕹️ Gameplay Loop & Mechanics

```
┌────────────────────────────────────────────────────────────────────────┐
│                        1. PRE-GAME BRIEFING SCREEN                     │
│    • El Profesor emergency audio transcript & lore                    │
│    • Assigned target subroutine & full problem description             │
│    • Base points (150 PTS) & speed bonus rules                        │
│    • Click [⚡ INITIATE BYPASS ›] to open IDE                          │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        2. MONACO HACKER TERMINAL                       │
│    • Monaco Editor with custom 'heist-dark' theme & line numbers       │
│    • Corrupted Python script loaded (disarm_sequence.py)               │
│    • Live 15-minute countdown breach timer (900s)                      │
│    • Zero hints / No spoilers — participant diagnoses the flaw         │
│    • Click [⚡ SUBMIT SEQUENCE] to run & evaluate                      │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     3. PYTHON EXECUTION & EVALUATION                   │
│    • POST /api/game/evaluate (Docker microservice or host Python)      │
│    • Normalizes stdout and compares against expected disarm signature  │
│    • Calculates base points + dynamic time decay speed bonus           │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                  4. SUCCESS STATE (AlarmSuccessModal)                  │
│    • Themed Money Heist modal dialog (bg-neutral-950, red accents)     │
│    • "ALARM BYPASSED. The vault sector is clear."                      │
│    • Points Awarded (+184 PTS: base + speed bonus) & Time Elapsed      │
│    • Verified disarm signature output display                          │
│    • Click [⚡ CONTINUE TO NEXT GAME ›]                                │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                    5. EXCLUSION RANDOMIZER & RESET                     │
│    • GET /api/game/challenges?exclude=<currentId>                      │
│    • Guarantees a different, distinct challenge is assigned            │
│    • Resets code editor buffer and countdown timer (900s)              │
│    • Returns to Briefing Screen to read the new problem description    │
└────────────────────────────────────────────────────────────────────────┘
```

### 1. Pre-Game Briefing Screen
- Rendered by [`AlarmBriefingModal.tsx`](src/components/AlarmBriefingModal.tsx).
- Displays the narrative from El Profesor, tactical rules, and the assigned challenge's **target subroutine, category, points, and complete problem description**.
- Participants review the problem statement before clicking **`⚡ INITIATE BYPASS`** to launch into the IDE and start the 15-minute countdown.

### 2. Monaco Hacker Terminal
- Rendered by [`src/app/page.tsx`](src/app/page.tsx) with [`Editor.tsx`](src/components/Editor.tsx).
- Left panel displays the target subroutine info, sequence protocol, reset button, and new assignment option.
- Center panel embeds the Monaco Editor running the custom `heist-dark` theme with the corrupted `disarm_sequence.py` script.
- Right panel hosts the Mission Diagnostics console with standard output (stdout), traceback error stream (stderr), and evaluation results.

### 3. Python Execution & Scoring
- Handled by [`src/app/api/game/evaluate/route.ts`](src/app/api/game/evaluate/route.ts).
- Validates that the program runs cleanly with exit code 0, emits output starting with `DISARM_SEQ:`, and matches the expected signature.
- **Scoring Formula:**
  - Base points: `challenge.points` (typically 150 PTS).
  - Speed bonus: `Math.max(5, Math.round(timeBonusMax * (1 - elapsedSeconds / 300)))` (up to 50 PTS).

### 4. Success Dialog & Next Game Loop
- Rendered by [`AlarmSuccessModal.tsx`](src/components/AlarmSuccessModal.tsx).
- Matches the briefing screen's Money Heist aesthetic (`bg-neutral-950`, red borders, ambient glow, monospace typography).
- Displays:
  - **"ALARM BYPASSED. The vault sector is clear."**
  - **Points Awarded:** e.g., `+184 PTS` (`150 Base + 34 Speed`).
  - **Time Taken:** Formatted `MM:SS` and total seconds.
  - **Verified Disarm Signature:** Exact stdout from the patched script.
- **Continue to Next Game (`⚡ CONTINUE TO NEXT GAME ›`):**
  - Calls `/api/game/challenges?exclude=<currentId>` to fetch a guaranteed **different** random challenge.
  - Resets all execution states, editor buffers, and the timer.
  - Returns to the initial **Briefing Screen**, where the newly assigned problem statement is presented before opening the IDE again.

---

## 📂 File Locations & Directory Map

All game-specific code lives within the following files:

```
src/
├── app/
│   ├── page.tsx                  # 🎮 Main Game Coordinator (IDE, Timer, Submission flow)
│   └── api/
│       └── game/
│           ├── challenges/
│           │   └── route.ts      # 🎲 Random challenge endpoint with ?exclude=<id> support
│           └── evaluate/
│               └── route.ts      # ⚡ Python evaluation, signature checking, & score calculation
├── components/
│   ├── AlarmBriefingModal.tsx    # 📜 Pre-game Money Heist briefing screen & problem card
│   ├── AlarmSuccessModal.tsx     # 🏆 Post-game success dialog (points, time, next game CTA)
│   └── Editor.tsx                # 💻 Monaco editor wrapper with custom 'heist-dark' theme
└── lib/
    ├── alarmAudio.ts             # 🔊 Web Audio API sound engine (sirens, keyclicks, chimes)
    └── server/
        ├── challenges.ts         # 📚 10 Hard Python challenges database & randomizer
        └── pythonRunner.ts       # 🐍 Python execution service (Docker + host Python fallback)
```

| File Path | Description |
| :--- | :--- |
| [`src/app/page.tsx`](src/app/page.tsx) | Main game page containing state management, timer (15 min), audio toggles, and modal coordinators (served directly at `http://localhost:3000`). |
| [`src/components/AlarmBriefingModal.tsx`](src/components/AlarmBriefingModal.tsx) | Pre-game modal presenting El Profesor's lore, mission objectives, and the assigned challenge's problem description. |
| [`src/components/AlarmSuccessModal.tsx`](src/components/AlarmSuccessModal.tsx) | Success modal dialog matching briefing screen aesthetics (`bg-neutral-950`, red accents), showing points, time, and "Continue to Next Game" button. |
| [`src/lib/alarmAudio.ts`](src/lib/alarmAudio.ts) | Pure Web Audio API synthesized audio engine (siren drone, mechanical keyclicks, victory chords) with zero external audio assets. |
| [`src/lib/server/challenges.ts`](src/lib/server/challenges.ts) | Challenge registry containing 10 competitive Python debugging problems, `ChallengeServer` interfaces, and random selection logic. |
| [`src/app/api/game/challenges/route.ts`](src/app/api/game/challenges/route.ts) | Serverless route handler returning exactly one client-safe challenge, respecting the `?exclude=` query parameter. |
| [`src/app/api/game/evaluate/route.ts`](src/app/api/game/evaluate/route.ts) | Evaluates user-submitted Python code against expected output, verifying the `DISARM_SEQ:` format and computing points + speed bonus. |
| [`src/lib/server/pythonRunner.ts`](src/lib/server/pythonRunner.ts) | Python execution service with Docker microservice support and automatic fallback to host Python with a 4s timeout. |
| [`src/components/Editor.tsx`](src/components/Editor.tsx) | Monaco editor component configured with the custom `heist-dark` theme. |
| [`.env.local`](.env.local) | Root environment configuration file. |

---

## 🐍 Adding Custom Python Challenges & Expected Outputs

All challenges are stored and configured in:
👉 [`src/lib/server/challenges.ts`](src/lib/server/challenges.ts)

### The `ChallengeServer` Schema

Each challenge object implements the following TypeScript interface:

```typescript
export interface ChallengeServer {
  id: string;             // Unique identifier (e.g. "alarm-11")
  stageNumber: number;    // Display order / phase number
  title: string;          // Challenge title
  category: string;       // Algorithm or vulnerability category
  points: number;         // Base score awarded (e.g. 100 - 150)
  timeBonusMax: number;   // Maximum speed bonus points (e.g. 50)
  description: string;    // Problem statement displayed to player (NO SPOILERS/HINTS)
  buggyCode: string;      // Corrupted Python script loaded into editor (NO GIVEAWAY COMMENTS)
  correctCode: string;    // Reference working solution (kept private on server)
  expectedOutput: string; // Exact stdout string required to pass evaluation
}
```

### How Evaluation Works
When the participant clicks **"Submit Sequence"**:
1. The backend executes the Python script using [`pythonRunner.ts`](src/lib/server/pythonRunner.ts).
2. The evaluator in [`src/app/api/game/evaluate/route.ts`](src/app/api/game/evaluate/route.ts) normalizes and checks the output:
   ```typescript
   const passed =
     runResult.exitCode === 0 &&
     runResult.stdout.trim() === challenge.expectedOutput.trim();
   ```
3. The output **must** begin with the required sequence prefix `DISARM_SEQ:`.

### Example: Adding a New Challenge

To add a new challenge to the database, open [`src/lib/server/challenges.ts`](src/lib/server/challenges.ts) and append an object to the `CHALLENGES` array:

```typescript
{
  id: "alarm-11",
  stageNumber: 11,
  title: "Substation Frequency Fast Fourier Transform",
  category: "Signal Processing & FFT",
  points: 150,
  timeBonusMax: 50,
  description: `The electrical substation grid telemetry reports harmonic interference.
Compute the discrete frequency spectral magnitude vector for the power grid wave.

The script must evaluate the grid sample vector and output the verified key in the format:
\`DISARM_SEQ: FFT-MAG-<INT>\``,
  buggyCode: `import math

def compute_dominant_frequency(samples: list[float]) -> str:
    n = len(samples)
    magnitudes = []
    # Logic flaw: inverted trigonometric rotation angle
    for k in range(n // 2):
        real = sum(samples[t] * math.cos(2 * math.pi * t / n) for t in range(n))
        imag = sum(samples[t] * math.sin(2 * math.pi * t / n) for t in range(n))
        mag = math.sqrt(real * real + imag * imag)
        magnitudes.append(mag)

    max_mag = int(round(max(magnitudes)))
    return f"DISARM_SEQ: FFT-MAG-{max_mag}"

if __name__ == "__main__":
    grid_wave = [0.8, 1.2, 0.4, -0.6, -1.1, -0.3, 0.9, 1.3]
    result = compute_dominant_frequency(grid_wave)
    print(result)
`,
  correctCode: `import math

def compute_dominant_frequency(samples: list[float]) -> str:
    n = len(samples)
    magnitudes = []
    for k in range(n // 2):
        real = sum(samples[t] * math.cos(2 * math.pi * k * t / n) for t in range(n))
        imag = sum(samples[t] * math.sin(2 * math.pi * k * t / n) for t in range(n))
        mag = math.sqrt(real * real + imag * imag)
        magnitudes.append(mag)

    max_mag = int(round(max(magnitudes)))
    return f"DISARM_SEQ: FFT-MAG-{max_mag}"

if __name__ == "__main__":
    grid_wave = [0.8, 1.2, 0.4, -0.6, -1.1, -0.3, 0.9, 1.3]
    result = compute_dominant_frequency(grid_wave)
    print(result)
`,
  expectedOutput: "DISARM_SEQ: FFT-MAG-4\n",
}
```

> **Rules for Authoring Challenges**:
> - **Zero Giveaway Comments:** Do not include comments like `# BUG: fix this line` or `# Hint: check loop bounds`. Participants must diagnose the flaw on their own.
> - **Self-Contained:** Use the Python standard library only (`math`, `re`, `heapq`, `collections`, `itertools`, `struct`, `hashlib`, etc.). No external pip packages needed.
> - **Deterministic Output:** Ensure consistent output across platforms and Python versions without random seeds or floating-point precision drift.
> - **Output Format:** The output must always produce the formula `DISARM_SEQ: <IDENTIFIER>`.

---

## 🎨 Design Aesthetics & Web Audio Engine

### Money Heist Aesthetic
- **Color Palette:** Deep dark backgrounds (`bg-[#08080a]` and `bg-neutral-950`), glowing red alarm borders (`border-red-600/40`), amber warnings for urgency, and emerald green (`text-emerald-400`, `border-emerald-500/40`) for verified sequence overrides.
- **Monaco Editor Skin (`heist-dark`):** Registered in [`src/components/Editor.tsx`](src/components/Editor.tsx), inheriting from `vs-dark` with a deep `#0b0c10` canvas.
- **Micro-Interactions:** Pulsing beacons, ping animations, and glowing CTA buttons.

### Web Audio Engine
The audio system in [`src/lib/alarmAudio.ts`](src/lib/alarmAudio.ts) synthesizes sounds programmatically via the **Web Audio API** with zero external audio assets:
- **`toggleSirenDrone()`**: Dual-oscillator low-frequency modulated siren drone (440Hz / 444Hz with an LFO).
- **`playKeyBlip()`**: High-frequency short sine pulse simulating retro terminal mechanical keystrokes.
- **`playSuccessSound()`**: Rising major-seventh arpeggio chord signaling an accepted bypass.
- **`playErrorSound()`**: Descending dissonant sawtooth buzz signaling sequence rejection.
- **Audio Toggle:** A dedicated mute/unmute control in the top navigation bar allows participants to toggle sound effects at any time.
