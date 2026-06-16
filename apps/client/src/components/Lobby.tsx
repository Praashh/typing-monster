import { useState } from "react";
import { Button } from "@freetyping/ui";
import type { MultiplayerPhase } from "../hooks/useMultiplayer";

interface LobbyProps {
  phase: MultiplayerPhase;
  players: string[];
  countdown: number | null;
  error: string | null;
  onJoin: (roomId: string, username: string) => void;
  onStart: () => void;
  onLeave: () => void;
}

export function Lobby({
  phase,
  players,
  countdown,
  error,
  onJoin,
  onStart,
  onLeave,
}: LobbyProps) {
  const [roomName, setRoomName] = useState("");
  const [username, setUsername] = useState("");

  // Countdown overlay
  if (phase === "countdown" && countdown !== null) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-24 animate-fade">
        <p className="text-sm text-txt-dim uppercase tracking-widest font-semibold">
          Get ready!
        </p>
        <span className="text-8xl font-bold tabular-nums text-accent [text-shadow:0_0_40px_rgba(57,189,248,0.4)] animate-pulse">
          {countdown}
        </span>
        <div className="flex gap-3 text-sm text-txt-dim">
          {players.map((p) => (
            <span key={p} className="px-3 py-1 rounded-full bg-white/[0.05]">
              {p}
            </span>
          ))}
        </div>
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

        <div className="flex gap-3">
          <Button onClick={onStart} disabled={!canStart}>
            Start Race
          </Button>
          <Button variant="ghost" onClick={onLeave}>
            Leave
          </Button>
        </div>
      </div>
    );
  }

  // Idle — join form
  return (
    <div className="flex flex-col items-center gap-8 py-12 animate-fade">
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
              onJoin(roomName.trim(), username.trim());
            }
          }}
          disabled={!username.trim() || !roomName.trim()}
        >
          Join Room
        </Button>

        <div className="flex justify-center pt-2">
          <Button variant="ghost" onClick={onLeave}>
            Back to Solo
          </Button>
        </div>
      </div>
    </div>
  );
}
