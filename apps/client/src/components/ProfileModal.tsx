import { useMemo } from "react";
import { Button, LineChart } from "@freetyping/ui";
import type { ChartLine } from "@freetyping/ui";
import type { HistoryEntry } from "../hooks/useHistory";

interface ProfileModalProps {
  history: HistoryEntry[];
  onClose: () => void;
}

export function ProfileModal({ history, onClose }: ProfileModalProps) {
  const stats = useMemo(() => {
    if (history.length === 0) return { avgWpm: 0, avgAcc: 0, total: 0 };
    const sumWpm = history.reduce((acc, curr) => acc + curr.wpm, 0);
    const sumAcc = history.reduce((acc, curr) => acc + curr.acc, 0);
    return {
      avgWpm: Math.round(sumWpm / history.length),
      avgAcc: Math.round(sumAcc / history.length),
      total: history.length,
    };
  }, [history]);

  const lines = useMemo(() => {
    const wpmLine: ChartLine = { data: [], color: "#39bdf8", label: "wpm" };
    const accLine: ChartLine = { data: [], color: "#4ade80", label: "accuracy" };

    history.forEach((entry, i) => {
      // Map x to the index of the test (1st test, 2nd test, etc.)
      wpmLine.data.push({ x: i + 1, y: entry.wpm });
      accLine.data.push({ x: i + 1, y: entry.acc });
    });

    return [wpmLine, accLine];
  }, [history]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-5 bg-black/60 backdrop-blur-sm animate-fade">
      <div className="bg-[#0f1118] border border-white/10 rounded-3xl w-full max-w-4xl 2xl:max-w-6xl relative shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 sm:p-8 2xl:p-12 overflow-y-auto w-full h-full custom-scrollbar">
        <div className="flex justify-between items-center mb-6 2xl:mb-10">
          <h2 className="text-2xl 2xl:text-4xl font-bold text-white tracking-wide">
            Your Profile
          </h2>
          <Button variant="ghost" onClick={onClose} className="px-3">
            ✕
          </Button>
        </div>

        {history.length === 0 ? (
          <div className="text-center py-20 text-txt-dim">
            <p className="text-lg">No history found.</p>
            <p className="text-sm mt-2">Complete a solo typing test to see your stats here!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-10 2xl:gap-14">
            {/* Lifetime Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 2xl:gap-10 text-center">
              <div className="flex flex-col bg-white/[0.02] border border-white/[0.05] rounded-2xl py-6 2xl:py-10 px-4">
                <span className="text-xs 2xl:text-sm text-txt-dim uppercase tracking-widest font-semibold mb-2">Tests Completed</span>
                <span className="text-4xl 2xl:text-6xl font-bold tabular-nums text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.2)]">{stats.total}</span>
              </div>
              <div className="flex flex-col bg-white/[0.02] border border-white/[0.05] rounded-2xl py-6 2xl:py-10 px-4">
                <span className="text-xs 2xl:text-sm text-txt-dim uppercase tracking-widest font-semibold mb-2">Average Speed</span>
                <span className="text-4xl 2xl:text-6xl font-bold tabular-nums text-accent drop-shadow-[0_0_12px_rgba(57,189,248,0.3)]">{stats.avgWpm}</span>
              </div>
              <div className="flex flex-col bg-white/[0.02] border border-white/[0.05] rounded-2xl py-6 2xl:py-10 px-4">
                <span className="text-xs 2xl:text-sm text-txt-dim uppercase tracking-widest font-semibold mb-2">Average Accuracy</span>
                <span className="text-4xl 2xl:text-6xl font-bold tabular-nums text-emerald-400 drop-shadow-[0_0_12px_rgba(74,222,128,0.3)]">{stats.avgAcc}%</span>
              </div>
            </div>

            {/* Chart */}
            <div>
              <h3 className="text-sm 2xl:text-lg font-semibold uppercase tracking-widest text-txt-dim mb-4 2xl:mb-6">Progression over time</h3>
              <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-6 2xl:p-10">
                <LineChart lines={lines} xLabel="Test #" yLabel="WPM / Acc" />
              </div>
            </div>

            {/* Test History List */}
            <div>
              <h3 className="text-sm 2xl:text-lg font-semibold uppercase tracking-widest text-txt-dim mb-4 2xl:mb-6">Past Tests</h3>
              <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl overflow-hidden">
                <div className="grid grid-cols-4 md:grid-cols-8 gap-4 px-6 py-4 border-b border-white/[0.05] bg-white/[0.01] text-[10px] sm:text-xs 2xl:text-sm uppercase tracking-widest font-semibold text-txt-dim">
                  <div>Date</div>
                  <div className="text-right">WPM</div>
                  <div className="text-right">Acc</div>
                  <div className="text-right hidden md:block">Raw</div>
                  <div className="text-right hidden md:block">Cons.</div>
                  <div className="text-right hidden md:block">Chars</div>
                  <div className="text-right hidden md:block">Keys</div>
                  <div className="text-right">Time</div>
                </div>
                <div className="flex flex-col max-h-[400px] overflow-y-auto custom-scrollbar">
                  {[...history].reverse().map((entry) => (
                    <div key={entry.id} className="grid grid-cols-4 md:grid-cols-8 gap-4 px-6 py-4 border-b border-white/[0.02] last:border-0 items-center text-sm 2xl:text-base hover:bg-white/[0.02] transition-colors">
                      <div className="text-txt-dim font-medium whitespace-nowrap">
                        {new Date(entry.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                      </div>
                      <div className="text-right font-bold text-accent">{entry.wpm}</div>
                      <div className="text-right font-bold text-emerald-400">{entry.acc}%</div>
                      <div className="text-right font-mono text-txt-dim hidden md:block">{entry.rawWpm}</div>
                      <div className="text-right font-mono text-txt-dim hidden md:block">{entry.consistency !== undefined ? `${entry.consistency}%` : '-'}</div>
                      <div className="text-right font-mono text-txt-dim hidden md:block text-[12px] 2xl:text-sm whitespace-nowrap">
                        {entry.correct !== undefined ? (
                          <>
                            <span className="text-emerald-400">{entry.correct}</span>
                            <span className="text-txt-dim/50 mx-0.5">/</span>
                            <span className="text-bad">{entry.incorrect}</span>
                            <span className="text-txt-dim/50 mx-0.5">/</span>
                            <span className="text-txt-dim">{entry.skipped}</span>
                          </>
                        ) : '-'}
                      </div>
                      <div className="text-right font-mono text-txt-dim hidden md:block">{entry.keystrokes !== undefined ? entry.keystrokes : '-'}</div>
                      <div className="text-right font-mono text-txt-dim">{entry.duration}s</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
