import { useMemo } from "react";
import { Button, LineChart } from "@freetyping/ui";
import type { ChartLine, ErrorDot } from "@freetyping/ui";
import type { Snapshot } from "../state/typing-reducer";
import type { RaceResult } from "../hooks/useMultiplayer";

interface ResultsProps {
  wpm: number;
  acc: number;
  rawWpm: number;
  duration: number;
  snapshots: Snapshot[];
  typed: string;
  text: string;
  onReset: () => void;
  raceResult?: RaceResult | null;
  myUsername?: string;
  isCreator?: boolean;
  onRaceAgain?: () => void;
}

function computeConsistency(snapshots: Snapshot[]): number {
  if (snapshots.length < 2) return 100;
  const perSec: number[] = [];
  for (let i = 0; i < snapshots.length; i++) {
    const prev = i > 0 ? snapshots[i - 1] : { elapsed: 0, totalCorrect: 0 };
    const dt = (snapshots[i].elapsed - prev.elapsed) / 60;
    if (dt <= 0) continue;
    perSec.push((snapshots[i].totalCorrect - prev.totalCorrect) / 5 / dt);
  }
  if (perSec.length < 2) return 100;
  const mean = perSec.reduce((a, b) => a + b, 0) / perSec.length;
  if (mean <= 0) return 0;
  const variance = perSec.reduce((a, b) => a + (b - mean) ** 2, 0) / perSec.length;
  const cv = (Math.sqrt(variance) / mean) * 100;
  return Math.max(0, Math.round(100 - cv));
}

function getPlayerStats(typed: string, text: string, snapshots: Snapshot[]) {
  let c = 0;
  let inc = 0;
  let s = 0;
  for (let i = 0; i < typed.length; i++) {
    if (typed[i] === '-') s++;
    else if (typed[i] === text[i]) c++;
    else inc++;
  }
  const consistency = computeConsistency(snapshots);
  return { correct: c, incorrect: inc, skipped: s, consistency, keystrokes: typed.length };
}

function buildChartData(snapshots: Snapshot[], raceResult?: RaceResult | null) {
  if (raceResult && raceResult.players.some(p => p.snapshots && p.snapshots.length > 0)) {
    const lines: ChartLine[] = [];
    const colors = ["#39bdf8", "#f43f5e", "#facc15", "#4ade80"];
    
    raceResult.players.forEach((p, pIdx) => {
      const wpmLine: ChartLine = { data: [], color: colors[pIdx % colors.length], label: p.username + " (net)" };
      const snaps = p.snapshots || [];
      
      for (let i = 0; i < snaps.length; i++) {
        const s = snaps[i];
        const mins = s.elapsed / 60;
        if (mins <= 0) continue;
        wpmLine.data.push({ x: s.elapsed, y: Math.round(s.totalCorrect / 5 / mins) });
      }
      lines.push(wpmLine);
    });
    return { lines, errors: [] };
  }

  const wpmLine: ChartLine = { data: [], color: "#39bdf8", label: "net wpm" };
  const rawLine: ChartLine = { data: [], color: "#facc15", label: "raw wpm", dashed: true };
  const errors: ErrorDot[] = [];

  for (let i = 0; i < snapshots.length; i++) {
    const s = snapshots[i];
    const mins = s.elapsed / 60;
    if (mins <= 0) continue;
    wpmLine.data.push({ x: s.elapsed, y: Math.round(s.totalCorrect / 5 / mins) });
    rawLine.data.push({ x: s.elapsed, y: Math.round(s.totalTyped / 5 / mins) });

    const prev = i > 0 ? snapshots[i - 1] : { totalTyped: 0, totalCorrect: 0 };
    const errCount =
      (s.totalTyped - s.totalCorrect) - (prev.totalTyped - prev.totalCorrect);
    if (errCount > 0) errors.push({ x: s.elapsed, count: errCount });
  }

  return { lines: [wpmLine, rawLine], errors };
}

function ReviewPassage({ text, typed }: { text: string; typed: string }) {
  const chars = [];
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const isTyped = i < typed.length;
    const tChar = isTyped ? typed[i] : null;
    let colorClass = "text-txt-dim";
    if (isTyped) {
      if (tChar === char) {
        colorClass = "text-txt [text-shadow:0_0_1px_rgba(255,255,255,0.1)]";
      } else if (tChar === "-") {
        colorClass = "text-txt-dim opacity-40";
      } else {
        colorClass = char === " " 
          ? "text-bad [text-shadow:0_0_8px_rgba(244,63,94,0.3)] bg-bad/[0.18] rounded"
          : "text-bad [text-shadow:0_0_8px_rgba(244,63,94,0.3)]";
      }
    }
    chars.push(
      <span key={i} className={`transition-colors duration-100 ${colorClass}`}>
        {char === " " ? "\u00A0" : char}
      </span>
    );
    if (char === " ") {
      chars.push(<wbr key={`wbr-${i}`} />);
    }
  }

  return (
    <div className="bg-black/20 rounded-xl border border-white/[0.05] shadow-inner overflow-hidden flex flex-col h-48 md:h-64 2xl:h-96">
      <div className="font-mono text-base md:text-[1.1rem] 2xl:text-xl leading-relaxed md:leading-[1.8rem] 2xl:leading-[2.2rem] tracking-tight whitespace-normal break-normal text-left overflow-y-auto p-5 2xl:p-8 custom-scrollbar h-full w-full">
        {chars}
      </div>
    </div>
  );
}

function Tooltip({ content, children, position = "top" }: { content: string; children: React.ReactNode; position?: "top" | "bottom" }) {
  return (
    <div className="relative group inline-flex justify-center">
      {children}
      <div 
        className={`absolute pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 w-max max-w-[240px] bg-slate-800 border border-white/10 text-white text-[12px] leading-relaxed font-medium px-3 py-2 rounded-lg shadow-xl z-50 text-center ${
          position === "top" ? "bottom-full mb-2" : "top-full mt-2"
        }`}
      >
        {content}
      </div>
    </div>
  );
}

function StatCell({ label, tooltip, children, className = "items-start" }: { label: string; tooltip: string; children: React.ReactNode; className?: string }) {
  return (
    <Tooltip content={tooltip} position="top">
      <div className={`flex flex-col gap-1.5 cursor-help ${className}`}>
        <span className="text-[12px] 2xl:text-sm text-txt-dim uppercase tracking-[0.16em] font-extrabold border-b border-dashed border-txt-dim/30 pb-[2px] w-fit">
          {label}
        </span>
        <strong className="text-xl 2xl:text-2xl font-bold tabular-nums tracking-tight text-white leading-none mt-0.5">
          {children}
        </strong>
      </div>
    </Tooltip>
  );
}

export function Results({
  wpm,
  acc,
  rawWpm,
  duration,
  snapshots,
  typed,
  text,
  onReset,
  raceResult,
  myUsername,
  isCreator,
  onRaceAgain,
}: ResultsProps) {
  const { correct, incorrect, skipped, consistency, keystrokes } = useMemo(() => getPlayerStats(typed, text, snapshots), [typed, text, snapshots]);

  const { lines, errors } = useMemo(() => buildChartData(snapshots, raceResult), [snapshots, raceResult]);

  const isWinner = raceResult?.winner === myUsername;

  return (
    <div className="animate-fade">
      <div className="flex justify-end items-center gap-4 mb-6">
        {raceResult && (
          isCreator ? (
            <Button onClick={onRaceAgain} className="bg-accent/20 border-accent/40 text-accent hover:bg-accent/30 hover:border-accent shadow-[0_0_12px_rgba(57,189,248,0.15)]">
              race again 🏁
            </Button>
          ) : (
            <span className="text-txt-dim text-sm italic tracking-wide mr-2">waiting for host to restart...</span>
          )
        )}
        <Button onClick={onReset} variant="outline">
          {raceResult ? "back to lobby" : "next run"} ⏎
        </Button>
      </div>
      {/* Race result banner */}
      {raceResult && (
        <div className="mb-10 text-center">
          <h2 className="text-3xl md:text-4xl 2xl:text-5xl font-bold mb-6">
            {isWinner ? (
              <span className="text-accent [text-shadow:0_0_24px_rgba(57,189,248,0.4)]">
                You Won!
              </span>
            ) : (
              <span className="text-bad [text-shadow:0_0_24px_rgba(244,63,94,0.3)]">
                You Lost
              </span>
            )}
          </h2>

          <div className="flex flex-col lg:flex-row justify-center gap-8 2xl:gap-12">
            {raceResult.players.map((p, i) => {
              const pStats = getPlayerStats(p.typed || "", text, p.snapshots || []);
              return (
              <div
                key={p.username}
                className={`flex flex-col items-center gap-4 px-6 2xl:px-10 py-6 2xl:py-10 rounded-3xl border flex-1 w-full lg:min-w-[320px] 2xl:min-w-[420px] transition-all ${
                  p.username === myUsername
                    ? "bg-accent/[0.08] border-accent/40 shadow-[0_0_40px_rgba(57,189,248,0.15)] scale-[1.02]"
                    : "bg-white/[0.02] border-white/[0.06] opacity-90"
                }`}
              >
                <div className="flex flex-col items-center gap-1.5">
                  <span className={`text-[12px] uppercase tracking-[0.25em] font-extrabold ${
                    i === 0 ? "text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" : "text-slate-400"
                  }`}>
                    {i === 0 ? "1st Place" : "2nd Place"}
                  </span>
                  <span className="text-2xl font-bold text-white tracking-wide">{p.username}</span>
                </div>
                
                <div className="flex flex-col items-center">
                  <span className="text-6xl md:text-[64px] 2xl:text-[88px] leading-none font-bold tabular-nums text-accent tracking-tighter drop-shadow-[0_0_12px_rgba(57,189,248,0.3)]">
                    {p.wpm}
                  </span>
                  <span className="text-[12px] 2xl:text-sm text-accent/70 uppercase tracking-[0.2em] font-bold mt-2">
                    net wpm
                  </span>
                </div>

                <div className="w-full h-px bg-white/10 my-4" />

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-6 gap-x-2 w-full mt-2">
                  <StatCell className="items-center text-center" label="accuracy" tooltip="Percentage of correctly typed characters.">
                    {p.acc}%
                  </StatCell>
                  <StatCell className="items-center text-center" label="raw wpm" tooltip="Raw WPM ignoring errors.">
                    {p.rawWpm || p.wpm}
                  </StatCell>
                  <StatCell className="items-center text-center" label="time" tooltip="Duration of the race in seconds.">
                    {p.elapsed}s
                  </StatCell>
                  <StatCell className="items-center text-center" label="characters" tooltip="Correct / Incorrect / Skipped characters.">
                    <span className="text-[16px]">
                      <span className="text-emerald-400">{pStats.correct}</span>
                      <span className="text-txt-dim/50 mx-1">/</span>
                      <span className="text-bad">{pStats.incorrect}</span>
                      <span className="text-txt-dim/50 mx-1">/</span>
                      <span className="text-txt-dim">{pStats.skipped}</span>
                    </span>
                  </StatCell>
                  <StatCell className="items-center text-center" label="consistency" tooltip="Typing speed stability.">
                    {pStats.consistency}%
                  </StatCell>
                  <StatCell className="items-center text-center" label="keystrokes" tooltip="Total keystrokes.">
                    {pStats.keystrokes}
                  </StatCell>
                </div>
              </div>
            )})}
          </div>
        </div>
      )}

      {/* Solo result card */}
      {!raceResult && (
        <div className="flex justify-center mb-10 text-center">
          <div className="flex flex-col items-center gap-6 2xl:gap-10 px-8 2xl:px-12 py-8 2xl:py-12 rounded-3xl border bg-accent/[0.04] border-accent/20 shadow-[0_0_40px_rgba(57,189,248,0.08)] w-full max-w-4xl transition-all">
            
            <div className="flex flex-col items-center gap-1.5 mb-2">
              <span className="text-[12px] uppercase tracking-[0.25em] font-extrabold text-slate-400">
                Solo Run
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center sm:items-end justify-center gap-12 sm:gap-24 2xl:gap-32">
              <Tooltip content="Net Words Per Minute: Your typing speed calculated as (correct characters / 5) / time, penalizing for any uncorrected errors." position="bottom">
                <div className="flex flex-col items-center leading-none cursor-help">
                  <strong className="text-7xl md:text-[88px] 2xl:text-[110px] font-bold tabular-nums tracking-tighter text-accent [text-shadow:0_0_24px_rgba(57,189,248,0.3)]">
                    {wpm}
                  </strong>
                  <span className="text-[12px] 2xl:text-sm text-accent/70 uppercase tracking-[0.2em] font-bold mt-3">
                    net wpm
                  </span>
                </div>
              </Tooltip>
              <Tooltip content="Accuracy: The percentage of characters you typed correctly." position="bottom">
                <div className="flex flex-col items-center leading-none cursor-help">
                  <strong className="text-7xl md:text-[88px] 2xl:text-[110px] font-bold tabular-nums tracking-tight text-white">
                    {acc}%
                  </strong>
                  <span className="text-[12px] 2xl:text-sm text-txt-dim uppercase tracking-[0.2em] font-bold mt-3">
                    accuracy
                  </span>
                </div>
              </Tooltip>
            </div>

            <div className="w-full h-px bg-white/10 my-4" />

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-y-8 gap-x-4 w-full">
              <StatCell className="items-center text-center" label="raw wpm" tooltip="Raw WPM is your typing speed ignoring all errors. Calculated as (total keystrokes / 5) / time.">
                {rawWpm}
              </StatCell>
              <StatCell className="items-center text-center" label="characters" tooltip="Your keystrokes categorized as Correct, Incorrect, and Skipped.">
                <span className="text-[20px]">
                  <span className="text-emerald-400">{correct}</span>
                  <span className="text-txt-dim/50 mx-1">/</span>
                  <span className="text-bad">{incorrect}</span>
                  <span className="text-txt-dim/50 mx-1">/</span>
                  <span className="text-txt-dim">{skipped}</span>
                </span>
              </StatCell>
              <StatCell className="items-center text-center" label="consistency" tooltip="How stable your typing speed was during the test. 100% means zero variation in speed. Starts at 0% if you pause for too long.">
                {consistency}%
              </StatCell>
              <StatCell className="items-center text-center" label="keystrokes" tooltip="The total number of keys you pressed during the test.">
                {keystrokes}
              </StatCell>
              <StatCell className="items-center text-center" label="time" tooltip="The duration of the typing test in seconds.">
                {duration}s
              </StatCell>
            </div>

          </div>
        </div>
      )}

      <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-4 2xl:p-8 mb-8 2xl:mb-12">
        <LineChart lines={lines} errors={errors} yLabel="net wpm" />
      </div>



      {raceResult ? (
        <div className="mb-10 w-full animate-fade-up animate-delay-150">
          <h3 className="text-lg font-bold text-center tracking-wide uppercase text-txt-dim mb-6">
            Mistake Review
          </h3>
          <div className="flex flex-col gap-12">
            {raceResult.players.map(p => (
              <div key={p.username} className="flex flex-col gap-3">
                <span className="text-xs font-semibold uppercase tracking-widest text-accent pl-2">
                  {p.username}'s Run
                </span>
                <ReviewPassage text={text} typed={p.typed || ""} />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="mb-10 w-full animate-fade-up animate-delay-150">
          <h3 className="text-lg font-bold text-center tracking-wide uppercase text-txt-dim mb-6">
            Mistake Review
          </h3>
          <ReviewPassage text={text} typed={typed} />
        </div>
      )}

      <div className="flex justify-center">
        <Button onClick={onReset}>
          {raceResult ? "back to lobby" : "next run"} ⏎
        </Button>
      </div>
    </div>
  );
}
