import { LAYOUT } from "../data/keyboard-layout";

export function Keyboard({
  pressed,
  onKeyClick,
}: {
  pressed: Set<string>;
  onKeyClick?: (code: string, label: string) => void;
}) {
  return (
    <div
      className="mt-8 border border-white/5 rounded-[20px] p-4 flex flex-col gap-2 max-md:p-2.5 max-md:gap-1.5 max-sm:p-2 max-sm:gap-1"
      style={{
        background: "linear-gradient(180deg, #151821, #0c0e14)",
        boxShadow: "0 24px 50px -25px rgba(0,0,0,0.8), 0 1px 0 rgba(255,255,255,0.02) inset",
      }}
      aria-label="On-screen mechanical keyboard"
    >
      {LAYOUT.map((row, r) => (
        <div className="flex gap-2 justify-center max-md:gap-1.5 max-sm:gap-1" key={r}>
          {row.map(([label, code, w]) => {
            const isActive = pressed.has(code);
            return (
              <button
                type="button"
                key={code}
                className={`h-[--u] flex-none rounded-[9px] flex items-center justify-center font-mono text-[0.74rem] font-semibold relative border-none outline-none p-0 cursor-pointer select-none motion-reduce:transition-none max-md:text-[0.58rem] max-md:rounded-md max-sm:text-[0.48rem] max-sm:rounded ${
                  isActive
                    ? "translate-y-[2.5px] text-white [text-shadow:0_0_8px_rgba(255,255,255,0.8)]"
                    : "text-label hover:text-txt hover:-translate-y-px"
                }`}
                style={{
                  "--u": "2.7rem",
                  width: `calc(2.7rem * ${w || 1})`,
                  background: isActive
                    ? "linear-gradient(180deg, var(--color-accent) 0%, rgba(57,189,248,0.45) 100%)"
                    : "linear-gradient(180deg, var(--color-cap-top) 0%, var(--color-cap-mid) 55%, var(--color-cap-bot) 100%)",
                  boxShadow: isActive
                    ? "0 0 0 1px var(--color-accent) inset, 0 0 22px rgba(57,189,248,0.55), 0 1px 2px rgba(0,0,0,0.4)"
                    : "0 1px 0 var(--color-cap-edge) inset, 0 -3px 0 var(--color-cap-shadow) inset, 0 4px 6px rgba(0,0,0,0.5)",
                  transition: "transform 0.08s cubic-bezier(0.25,0.46,0.45,0.94), box-shadow 0.08s cubic-bezier(0.25,0.46,0.45,0.94), background 0.08s, color 0.08s",
                } as React.CSSProperties}
                onClick={() => onKeyClick?.(code, label)}
              >
                <span className="relative -top-px">{label}</span>
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
