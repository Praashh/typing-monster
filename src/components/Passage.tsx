import { useRef, useCallback } from "react";

export function Passage({ text, typed, finished }: { text: string; typed: string; finished: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);

  const cursorRef = useCallback((el: HTMLSpanElement | null) => {
    if (!el || !containerRef.current) return;
    const container = containerRef.current;
    const elTop = el.offsetTop;
    const elH = el.offsetHeight;
    const scrollTop = container.scrollTop;
    const viewH = container.clientHeight;
    if (elTop + elH > scrollTop + viewH) {
      container.scrollTop = elTop - viewH + elH + 10;
    }
    if (elTop < scrollTop) {
      container.scrollTop = elTop - 10;
    }
  }, []);

  return (
    <div className="mb-passage" ref={containerRef} aria-label="Typing passage">
      {text.split("").map((ch, i) => {
        let cls = "mb-char";
        if (i < typed.length) cls += typed[i] === ch ? " ok" : " bad";
        if (i === typed.length && !finished) cls += " cur";
        if (ch === " ") cls += " sp";
        return (
          <span
            key={i}
            className={cls}
            ref={i === typed.length ? cursorRef : undefined}
          >
            {ch === " " ? "\u00A0" : ch}
          </span>
        );
      })}
    </div>
  );
}
