import { useReducer, useEffect, useCallback, useMemo } from "react";
import { typingReducer, makeInitialState, countCorrect } from "./state/typing-reducer";
import { useKeySound } from "./hooks/useKeySound";

import { Button, Stat, ProgressBar } from "@freetyping/ui";
import { Passage } from "./components/Passage";
import { Results } from "./components/Results";

const DURATIONS = [15, 30, 60, 120] as const;

export default function MechBoard() {
  const [state, dispatch] = useReducer(typingReducer, 60, makeInitialState);
  const { text, typed, started, finished, startTime, now, duration, snapshots } = state;

  const playSound = useKeySound();

  const reset = useCallback(() => {
    dispatch({ type: "RESET" });
  }, []);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      playSound(e.code);
      if (e.code === "Tab") e.preventDefault();
      if (e.key === "Backspace") {
        e.preventDefault();
        dispatch({ type: "BACKSPACE" });
        return;
      }
      if (e.key === " ") e.preventDefault();
      if (e.key.length === 1) {
        dispatch({ type: "TYPE_CHAR", key: e.key, time: Date.now() });
      }
    };

    window.addEventListener("keydown", down);
    return () => {
      window.removeEventListener("keydown", down);
    };
  }, [playSound]);

  useEffect(() => {
    if (!started || finished) return;
    const id = setInterval(() => dispatch({ type: "TICK", now: Date.now() }), 150);
    return () => clearInterval(id);
  }, [started, finished]);

  const { wpm, rawWpm, acc, timeLeft, progress } = useMemo(() => {
    const correct = countCorrect(typed, text);
    const endTime = startTime + duration * 1000;
    const elapsedMs = started ? (finished ? endTime : now || Date.now()) - startTime : 0;
    const minutes = elapsedMs / 60000;
    return {
      wpm: minutes > 0 ? Math.round(correct / 5 / minutes) : 0,
      rawWpm: minutes > 0 ? Math.round(typed.length / 5 / minutes) : 0,
      acc: typed.length ? Math.round((correct / typed.length) * 100) : 100,
      timeLeft: Math.max(0, duration - Math.floor(elapsedMs / 1000)),
      progress: Math.round(Math.min(100, (elapsedMs / (duration * 1000)) * 100)),
    };
  }, [typed, text, startTime, duration, started, finished, now]);

  return (
    <div
      className="font-sans min-h-full text-txt px-5 py-12 box-border flex flex-col justify-center items-center"
      style={{
        background:
          "radial-gradient(1300px 700px at 50% -10%, rgba(57,189,248,0.08), transparent 60%), radial-gradient(800px 400px at 50% 50%, rgba(57,189,248,0.02), transparent 50%), var(--color-bg)",
      }}
    >
      <div className="w-full max-w-[900px]">
        <header className="flex justify-between items-center gap-4 flex-wrap mb-9 border-b border-white/[0.03] pb-5">
          <div className="flex items-center gap-3.5">
            <span
              className="w-9 h-9 rounded-[10px] flex-none relative"
              style={{
                background: "linear-gradient(180deg, var(--color-cap-top), var(--color-cap-bot))",
                boxShadow:
                  "0 1px 0 var(--color-cap-edge) inset, 0 -3px 0 var(--color-cap-shadow) inset, 0 0 16px rgba(57,189,248,0.35), 0 0 0 1px var(--color-accent)",
              }}
            >
              <span className="absolute inset-[10px] rounded bg-accent opacity-95 shadow-[0_0_14px_var(--color-accent)]" />
            </span>
            <div>
              <h1 className="text-[22px] font-bold tracking-tight">MechBoard</h1>
              <p className="mt-0.5 text-xs text-txt-dim tracking-wide">type to feel the click</p>
            </div>
          </div>

          <fieldset className="flex gap-2 border-0 p-0 m-0" aria-label="Test duration">
            {DURATIONS.map((d) => (
              <Button
                key={d}
                variant="outline"
                active={duration === d}
                onClick={() => dispatch({ type: "SET_DURATION", duration: d })}
                disabled={started && !finished}
              >
                {d}s
              </Button>
            ))}
          </fieldset>
        </header>

        {finished ? (
          <Results
            wpm={wpm}
            acc={acc}
            rawWpm={rawWpm}
            duration={duration}
            snapshots={snapshots}
            typed={typed}
            text={text}
            onReset={reset}
          />
        ) : (
          <>
            <div className="flex items-center gap-7 flex-wrap mb-6 bg-white/[0.015] border border-white/[0.03] backdrop-blur-[12px] px-6 py-4 rounded-2xl">
              <Stat label="wpm" value={wpm} accent />
              <Stat label="acc" value={acc + "%"} />
              <Stat label="time" value={timeLeft + "s"} />
              <ProgressBar value={progress} />
            </div>

            <Passage text={text} typed={typed} finished={finished} />

            {!started && (
              <p className="font-mono text-[13px] text-txt-dim text-center -mt-2.5 mb-6 tracking-wide opacity-80">
                start typing to begin the test
              </p>
            )}

            <footer className="flex flex-col items-center justify-center gap-4 mt-9 font-mono text-xs text-txt-dim">
              <Button variant="ghost" onClick={reset} title="Restart Test">
                ⟳
              </Button>
              <span>esc-free · just start typing · backspace to fix</span>
            </footer>
          </>
        )}
      </div>
    </div>
  );
}
