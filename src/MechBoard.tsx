import { useReducer, useState, useEffect, useCallback } from "react";
import { typingReducer, makeInitialState } from "./state/typing-reducer";
import { useKeySound } from "./hooks/useKeySound";
import { Keyboard } from "./components/Keyboard";
import { Passage } from "./components/Passage";
import { ResultsOverlay } from "./components/ResultsOverlay";
import { Stat } from "./components/Stat";
import "./MechBoard.css";

const ACCENT = "#39BDF8";
const DURATIONS = [15, 30, 60, 120] as const;

export default function MechBoard() {
  const [state, dispatch] = useReducer(typingReducer, 60, makeInitialState);
  const { text, typed, started, finished, startTime, now, duration } = state;

  const [pressed, setPressed] = useState<Set<string>>(() => new Set());
  const playSound = useKeySound();

  const reset = useCallback(() => dispatch({ type: "RESET" }), []);

  /* ---- key handling ---- */
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      setPressed((p) => { const n = new Set(p); n.add(e.code); return n; });
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
    const up = (e: KeyboardEvent) => {
      setPressed((p) => { const n = new Set(p); n.delete(e.code); return n; });
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [playSound]);

  /* ---- live timer ---- */
  useEffect(() => {
    if (!started || finished) return;
    const id = setInterval(() => dispatch({ type: "TICK", now: Date.now() }), 150);
    return () => clearInterval(id);
  }, [started, finished]);

  /* ---- stats (derived during render) ---- */
  let correct = 0;
  for (let i = 0; i < typed.length; i++) if (typed[i] === text[i]) correct++;
  const endTime = startTime + duration * 1000;
  const elapsedMs = started ? (finished ? endTime : now || Date.now()) - startTime : 0;
  const minutes = elapsedMs / 60000;
  const wpm = minutes > 0 ? Math.round(correct / 5 / minutes) : 0;
  const acc = typed.length ? Math.round((correct / typed.length) * 100) : 100;
  const timeLeft = Math.max(0, duration - Math.floor(elapsedMs / 1000));
  const progress = Math.round(Math.min(100, (elapsedMs / (duration * 1000)) * 100));

  return (
    <div className="mb-root" style={{ "--accent": ACCENT } as React.CSSProperties}>
      <div className="mb-shell">
        <header className="mb-head">
          <div className="mb-brand">
            <span className="mb-logo" />
            <div>
              <h1>MechBoard</h1>
              <p>type to feel the click</p>
            </div>
          </div>

          <div className="mb-controls">
            <fieldset className="mb-durations" aria-label="Test duration">
              {DURATIONS.map((d) => (
                <button
                  type="button"
                  key={d}
                  className={"mb-dur" + (duration === d ? " on" : "")}
                  onClick={() => dispatch({ type: "SET_DURATION", duration: d })}
                  disabled={started && !finished}
                >
                  {d}s
                </button>
              ))}
            </fieldset>
          </div>
        </header>

        <div className="mb-stats">
          <Stat label="wpm" value={wpm} accent />
          <Stat label="acc" value={acc + "%"} />
          <Stat label="time" value={timeLeft + "s"} />
          <div className="mb-prog">
            <div className="mb-prog-bar" style={{ width: progress + "%" }} />
          </div>
        </div>

        <Passage text={text} typed={typed} finished={finished} />

        {!started && !finished && (
          <p className="mb-hint">start typing — your keys light up below</p>
        )}

        <Keyboard pressed={pressed} />

        {finished && <ResultsOverlay wpm={wpm} acc={acc} duration={duration} onReset={reset} />}

        <footer className="mb-foot">
          <button type="button" className="mb-link" onClick={reset}>
            ⟳ restart
          </button>
          <span>esc-free · just start typing · backspace to fix</span>
        </footer>
      </div>
    </div>
  );
}
