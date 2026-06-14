import { LAYOUT } from "../data/keyboard-layout";

export function Keyboard({ pressed }: { pressed: Set<string> }) {
  return (
    <div className="mb-board" aria-hidden="true">
      {LAYOUT.map((row, r) => (
        <div className="mb-row" key={r}>
          {row.map(([label, code, w]) => (
            <div
              key={code}
              className={
                "mb-key" +
                (pressed.has(code) ? " active" : "") +
                (code === "Space" ? " space" : "")
              }
              style={{ "--w": w || 1 } as React.CSSProperties}
            >
              <span>{label}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
