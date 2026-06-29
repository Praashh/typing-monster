import { useState } from "react";
import { Button } from "@freetyping/ui";
import type { MultiplayerPhase } from "../hooks/useMultiplayer";

interface LobbyProps {
  phase: MultiplayerPhase;
  isCreator: boolean;
  players: string[];
  countdown: number | null;
  error: string | null;
  initialRoom?: string | null;
  onJoin: (roomId: string, username: string) => void;
  onStart: () => void;
  onLeave: () => void;
}

export function Lobby({
  phase,
  isCreator,
  players,
  countdown,
  error,
  initialRoom,
  onJoin,
  onStart,
  onLeave,
}: LobbyProps) {
  const [roomName, setRoomName] = useState(initialRoom || "");
  const [username, setUsername] = useState("");
  const [showToast, setShowToast] = useState(false);

  const toastElement = showToast && (
    <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-accent/20 border border-accent/40 text-accent px-6 py-3 rounded-full shadow-[0_0_15px_rgba(57,189,248,0.2)] animate-fade-up pointer-events-none z-50 flex items-center gap-2 font-semibold tracking-wide">
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
      Invite link copied!
    </div>
  );

  // Countdown overlay
  if (phase === "countdown" && countdown !== null) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-24 animate-fade">
        <p className="text-sm text-txt-dim uppercase tracking-widest font-semibold">
          Get ready!
        </p>
        <span className="text-6xl sm:text-8xl font-bold tabular-nums text-accent [text-shadow:0_0_40px_rgba(57,189,248,0.4)] animate-pulse">
          {countdown}
        </span>
        <div className="flex gap-3 text-sm text-txt-dim">
          {players.map((p) => (
            <span key={p} className="px-3 py-1 rounded-full bg-white/[0.05]">
              {p}
            </span>
          ))}
        </div>
        {toastElement}
      </div>
    );
  }

  // Lobby — waiting for opponent / ready to start
  if (phase === "lobby") {
    const canStart = players.length >= 2;

    return (
      <div className="flex flex-col items-center gap-8 py-12 animate-fade">
        <h2 className="text-2xl font-bold text-txt">Room</h2>

        {error && (
          <p className="text-sm text-bad bg-bad/10 px-4 py-2 rounded-lg">
            {error}
          </p>
        )}

        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-4 text-sm">
            {players.map((p) => (
              <span
                key={p}
                className="px-4 py-2 rounded-xl bg-white/[0.05] border border-white/[0.08] text-txt font-mono"
              >
                {p}
              </span>
            ))}
            {players.length < 2 && (
              <span className="px-4 py-2 rounded-xl border border-dashed border-white/[0.1] text-txt-dim font-mono flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-accent animate-pulse" />
                waiting...
              </span>
            )}
          </div>

          {!canStart && (
            <p className="text-sm text-txt-dim mt-2">
              Share the room name with your opponent to join
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto px-4 sm:px-0">
          {isCreator ? (
            <Button onClick={onStart} disabled={!canStart}>
              Start Race
            </Button>
          ) : (
            <div className="px-4 py-2 text-txt-dim text-sm flex items-center border border-transparent">
              Waiting for host to start...
            </div>
          )}
          <Button 
            variant="outline" 
            onClick={() => {
              const url = new URL(window.location.href);
              url.searchParams.set("room", roomName);
              navigator.clipboard.writeText(url.toString());
              setShowToast(true);
              setTimeout(() => setShowToast(false), 3000);
            }}
          >
            Copy Invite Link
          </Button>
          <Button variant="ghost" onClick={onLeave}>
            Leave
          </Button>
        </div>
        
        {toastElement}
      </div>
    );
  }

  // Idle — join form
  return (
    <div className="flex flex-col items-center gap-8 py-12 px-4 sm:px-0 animate-fade">
      <h2 className="text-2xl font-bold text-txt">Multiplayer Race</h2>

      {error && (
        <p className="text-sm text-bad bg-bad/10 px-4 py-2 rounded-lg">
          {error}
        </p>
      )}

      <div className="w-full max-w-sm space-y-4">
        <input
          type="text"
          placeholder="Your username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          maxLength={20}
          className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-txt font-mono text-sm outline-none focus:border-accent/50 transition-colors placeholder:text-txt-dim/50"
        />

        <input
          type="text"
          placeholder="Room name"
          value={roomName}
          onChange={(e) => setRoomName(e.target.value)}
          maxLength={30}
          className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-txt font-mono text-sm outline-none focus:border-accent/50 transition-colors placeholder:text-txt-dim/50"
        />

        <Button
          onClick={() => {
            if (username.trim() && roomName.trim()) {
              const rName = roomName.trim();
              onJoin(rName, username.trim());
              
              const url = new URL(window.location.href);
              url.searchParams.set("room", rName);
              navigator.clipboard.writeText(url.toString());
              setShowToast(true);
              setTimeout(() => setShowToast(false), 3000);
            }
          }}
          disabled={!username.trim() || !roomName.trim()}
        >
          Join / Create Room
        </Button>

        <div className="flex justify-center pt-2">
          <Button variant="ghost" onClick={onLeave}>
            Back to Solo
          </Button>
        </div>
      </div>
      {toastElement}
    </div>
  );
}
