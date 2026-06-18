import { ProgressBar } from "@freetyping/ui";
import type { OpponentStats } from "../hooks/useMultiplayer";

interface OpponentBarProps {
  opponent: OpponentStats;
}

export function OpponentBar({ opponent }: OpponentBarProps) {
  return (
    <div className="flex items-center gap-4 bg-white/[0.03] border border-white/[0.05] rounded-xl px-5 py-3 mb-4">
      <span className="text-xs text-txt-dim uppercase tracking-wider font-semibold shrink-0">
        {opponent.username}
      </span>
      <ProgressBar value={opponent.progress} />
      <div className="flex items-center gap-4 shrink-0 tabular-nums">
        <span className="text-sm font-mono">
          <span className="text-accent font-bold">{opponent.wpm}</span>
          <span className="text-txt-dim text-xs ml-1">wpm</span>
        </span>
        <span className="text-sm font-mono">
          <span className="text-txt">{opponent.acc}%</span>
          <span className="text-txt-dim text-xs ml-1">acc</span>
        </span>
      </div>
    </div>
  );
}
