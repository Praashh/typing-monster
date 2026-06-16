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

function buildChartData(snapshots: Snapshot[]) {
  const wpmLine: ChartLine = { data: [], color: "#39bdf8", label: "wpm" };
  const rawLine: ChartLine = { data: [], color: "#facc15", label: "raw", dashed: true };
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

function StatCell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[10px] text-txt-dim uppercase tracking-[0.16em] font-semibold">
        {label}
      </span>
      <strong className="text-[22px] font-bold tabular-nums tracking-tight text-white leading-none">
        {children}
      </strong>
    </div>
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
}: ResultsProps) {
  const { correct, incorrect, missed } = useMemo(() => {
    let c = 0;
    for (let i = 0; i < typed.length; i++) if (typed[i] === text[i]) c++;
    return { correct: c, incorrect: typed.length - c, missed: text.length - typed.length };
  }, [typed, text]);

  const consistency = useMemo(() => computeConsistency(snapshots), [snapshots]);
  const { lines, errors } = useMemo(() => buildChartData(snapshots), [snapshots]);

  const isWinner = raceResult?.winner === myUsername;

  return (
    <div className="animate-fade">
      {/* Race result banner */}
      {raceResult && (
        <div className="mb-10 text-center">
          <h2 className="text-4xl font-bold mb-6">
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

          <div className="flex justify-center gap-6">
            {raceResult.players.map((p, i) => (
              <div
                key={p.username}
                className={`flex flex-col items-center gap-2 px-6 py-4 rounded-2xl border ${
                  p.username === myUsername
                    ? "bg-accent/[0.06] border-accent/30"
                    : "bg-white/[0.02] border-white/[0.06]"
                }`}
              >
                <span className="text-xs text-txt-dim uppercase tracking-widest font-semibold">
                  {i === 0 ? "1st" : "2nd"}
                </span>
                <span className="text-lg font-bold text-txt">{p.username}</span>
                <span className="text-3xl font-bold tabular-nums text-accent">
                  {p.wpm}
                </span>
                <span className="text-xs text-txt-dim">wpm</span>
                <span className="text-sm text-txt tabular-nums">{p.acc}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* WPM / acc hero */}
      {!raceResult && (
        <div className="flex items-end justify-center gap-12 mb-8">
          <div className="flex flex-col leading-none">
            <strong className="text-[64px] font-bold tabular-nums tracking-tight text-accent [text-shadow:0_0_24px_rgba(57,189,248,0.3)]">
              {wpm}
            </strong>
            <span className="text-[10px] text-txt-dim uppercase tracking-[0.16em] font-semibold mt-2">
              wpm
            </span>
          </div>
          <div className="flex flex-col leading-none pb-1">
            <strong className="text-[36px] font-bold tabular-nums tracking-tight text-white">
              {acc}%
            </strong>
            <span className="text-[10px] text-txt-dim uppercase tracking-[0.16em] font-semibold mt-2">
              acc
            </span>
          </div>
        </div>
      )}

      <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-4 mb-8">
        <LineChart lines={lines} errors={errors} yLabel="wpm" />
      </div>

      <div className="grid grid-cols-3 gap-6 sm:grid-cols-6 bg-white/[0.02] border border-white/[0.05] rounded-2xl px-6 py-5 mb-8">
        <StatCell label="test type">{duration}s</StatCell>
        <StatCell label="raw">{rawWpm}</StatCell>
        <StatCell label="characters">
          <span className="text-[18px]">
            <span className="text-emerald-400">{correct}</span>
            <span className="text-txt-dim">/</span>
            <span className="text-bad">{incorrect}</span>
            <span className="text-txt-dim">/</span>
            <span className="text-txt-dim">{missed}</span>
          </span>
        </StatCell>
        <StatCell label="consistency">{consistency}%</StatCell>
        <StatCell label="typed">{typed.length}</StatCell>
        <StatCell label="time">{duration}s</StatCell>
      </div>

      <div className="flex justify-center">
        <Button onClick={onReset}>
          {raceResult ? "back to lobby" : "next run"} ⏎
        </Button>
      </div>
    </div>
  );
}
