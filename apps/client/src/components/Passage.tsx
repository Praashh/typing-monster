import { useRef, useEffect, useState, useMemo, memo } from "react";

interface CharInfo {
  char: string;
  globalIndex: number;
}

interface WordInfo {
  chars: CharInfo[];
  space: CharInfo | null;
}

interface PassageProps {
  text: string;
  typed: string;
  finished: boolean;
}

const CharSpan = memo(function CharSpan({
  char,
  globalIndex,
  isTyped,
  isCorrect,
  isSpace,
}: {
  char: string;
  globalIndex: number;
  isTyped: boolean;
  isCorrect: boolean;
  isSpace: boolean;
}) {
  const colorClass = isTyped
    ? isCorrect
      ? "text-txt [text-shadow:0_0_1px_rgba(255,255,255,0.1)]"
      : isSpace
        ? "text-bad [text-shadow:0_0_8px_rgba(244,63,94,0.3)] bg-bad/[0.18] rounded"
        : "text-bad [text-shadow:0_0_8px_rgba(244,63,94,0.3)]"
    : "text-txt-dim";

  return (
    <span
      id={`mb-char-${globalIndex}`}
      className={`transition-colors duration-100 ${colorClass}`}
    >
      {isSpace ? "\u00A0" : char}
    </span>
  );
});

export function Passage({ text, typed, finished }: PassageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [caretPos, setCaretPos] = useState({ left: 0, top: 0, height: 0 });

  const words = useMemo(() => {
    const result: WordInfo[] = [];
    let globalIndex = 0;
    const splitWords = text.split(" ");
    for (let w = 0; w < splitWords.length; w++) {
      const wordStr = splitWords[w];
      const chars: CharInfo[] = [];
      for (let c = 0; c < wordStr.length; c++) {
        chars.push({ char: wordStr[c], globalIndex: globalIndex++ });
      }
      const space: CharInfo | null =
        w < splitWords.length - 1 ? { char: " ", globalIndex: globalIndex++ } : null;
      result.push({ chars, space });
    }
    return result;
  }, [text]);

  useEffect(() => {
    const activeIndex = typed.length;
    let activeEl = document.getElementById(`mb-char-${activeIndex}`);
    let isLast = false;
    if (!activeEl && text.length > 0 && activeIndex === text.length) {
      activeEl = document.getElementById(`mb-char-${text.length - 1}`);
      isLast = true;
    }
    if (!activeEl) return;

    const left = isLast ? activeEl.offsetLeft + activeEl.offsetWidth : activeEl.offsetLeft;
    const top = activeEl.offsetTop;
    const height = activeEl.offsetHeight;
    setCaretPos({ left, top, height });

    const container = containerRef.current;
    if (container) {
      const targetScrollTop = Math.max(0, top - height);
      if (container.scrollTop !== targetScrollTop) {
        container.scrollTo({ top: targetScrollTop, behavior: "smooth" });
      }
    }
  }, [typed.length, text]);

  return (
    <div
      ref={containerRef}
      className="text-center font-mono text-[1.7rem] leading-[3rem] tracking-tight whitespace-normal break-normal bg-transparent border-none p-0 h-[calc(3rem*3)] overflow-hidden select-none relative my-9 max-md:text-[1.3rem] max-md:leading-[2.2rem] max-md:h-[calc(2.2rem*3)] max-md:my-6 max-sm:text-[1.15rem] max-sm:leading-[1.8rem] max-sm:h-[calc(1.8rem*3)]"
      aria-label="Typing passage"
    >
      {!finished && caretPos.height > 0 && (
        <div
          className="absolute w-[2.5px] bg-accent rounded-sm shadow-[0_0_12px_var(--color-accent),0_0_4px_var(--color-accent)] animate-caret-blink pointer-events-none z-[2] motion-reduce:transition-none motion-reduce:animate-none"
          style={{
            left: caretPos.left,
            top: caretPos.top,
            height: caretPos.height,
            transition: "left 0.11s cubic-bezier(0.215,0.61,0.355,1), top 0.11s cubic-bezier(0.215,0.61,0.355,1)",
          }}
        />
      )}

      {words.map((word, wIdx) => {
        const isWordActive =
          word.chars.some((c) => c.globalIndex === typed.length) ||
          (word.space !== null && word.space.globalIndex === typed.length);

        return (
          <div
            key={wIdx}
            className={`inline-block pb-0.5 border-b-2 transition-[border-color] duration-200 ${
              isWordActive
                ? "border-b-[color-mix(in_srgb,var(--color-accent)_30%,transparent)]"
                : "border-transparent"
            }`}
          >
            {word.chars.map((c) => (
              <CharSpan
                key={c.globalIndex}
                char={c.char}
                globalIndex={c.globalIndex}
                isTyped={c.globalIndex < typed.length}
                isCorrect={c.globalIndex < typed.length && typed[c.globalIndex] === c.char}
                isSpace={false}
              />
            ))}
            {word.space && (
              <CharSpan
                key={word.space.globalIndex}
                char={word.space.char}
                globalIndex={word.space.globalIndex}
                isTyped={word.space.globalIndex < typed.length}
                isCorrect={word.space.globalIndex < typed.length && typed[word.space.globalIndex] === " "}
                isSpace={true}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
