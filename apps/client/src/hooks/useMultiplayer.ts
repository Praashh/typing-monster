import { useRef, useState, useCallback, useEffect } from "react";

export type MultiplayerPhase = "idle" | "lobby" | "countdown" | "racing" | "finished";

export interface OpponentStats {
  username: string;
  wpm: number;
  acc: number;
  errors: number;
  progress: number;
}

export interface RaceResult {
  winner: string;
  players: Array<{ username: string; wpm: number; acc: number; elapsed: number }>;
}

const INITIAL_OPPONENT: OpponentStats = {
  username: "",
  wpm: 0,
  acc: 100,
  errors: 0,
  progress: 0,
};

export function useMultiplayer() {
  const [phase, setPhase] = useState<MultiplayerPhase>("idle");
  const [players, setPlayers] = useState<string[]>([]);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [passage, setPassage] = useState<string | null>(null);
  const [duration, setDuration] = useState(60);
  const [opponent, setOpponent] = useState<OpponentStats | null>(null);
  const [raceResult, setRaceResult] = useState<RaceResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const usernameRef = useRef("");

  const send = useCallback((data: unknown) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  }, []);

  const disconnect = useCallback(() => {
    wsRef.current?.close();
    wsRef.current = null;
    setPhase("idle");
    setPlayers([]);
    setCountdown(null);
    setPassage(null);
    setOpponent(null);
    setRaceResult(null);
    setError(null);
  }, []);

  const joinRoom = useCallback(
    (roomId: string, username: string) => {
      usernameRef.current = username;

      // Close any existing connection
      wsRef.current?.close();

      const protocol = location.protocol === "https:" ? "wss:" : "ws:";
      const ws = new WebSocket(`${protocol}//${location.host}/ws/${roomId}`);
      wsRef.current = ws;

      ws.onopen = () => {
        setError(null);
        ws.send(JSON.stringify({ type: "join", username }));
      };

      ws.onclose = () => {
        wsRef.current = null;
      };

      ws.onerror = () => {
        setError("Connection failed. Is the server running?");
      };

      ws.onmessage = (event) => {
        let msg: any;
        try {
          msg = JSON.parse(event.data);
        } catch {
          return;
        }

        switch (msg.type) {
          case "room_joined": {
            const self = usernameRef.current;
            const opponentName = msg.players.find((p: string) => p !== self);
            setPhase("lobby");
            setPlayers(msg.players);
            setRaceResult(null);
            setError(null);
            if (opponentName) {
              setOpponent({ ...INITIAL_OPPONENT, username: opponentName });
            }
            break;
          }

          case "player_joined":
            setPlayers((prev) => [...prev, msg.username]);
            setOpponent({ ...INITIAL_OPPONENT, username: msg.username });
            break;

          case "player_left":
            setPlayers(
              msg.playerCount === 0
                ? []
                : (prev) => prev.filter((p) => p !== msg.username)
            );
            setOpponent(null);
            if (msg.playerCount < 2) {
              setPhase("lobby");
              setPassage(null);
              setCountdown(null);
            }
            break;

          case "countdown":
            setPhase("countdown");
            setCountdown(msg.value);
            break;

          case "race_go":
            setPhase("racing");
            setPassage(msg.passage);
            setDuration(msg.duration);
            setCountdown(null);
            setRaceResult(null);
            setOpponent((o) =>
              o ? { ...o, wpm: 0, acc: 100, errors: 0, progress: 0 } : null
            );
            break;

          case "opponent_progress":
            setOpponent((o) =>
              o
                ? {
                    ...o,
                    wpm: msg.wpm,
                    acc: msg.acc,
                    errors: msg.errors,
                    progress: msg.progress,
                  }
                : null
            );
            break;

          case "player_finished":
            // If it's the opponent who finished, mark them
            if (msg.username !== usernameRef.current) {
              setOpponent((o) => (o ? { ...o, progress: 100 } : null));
            }
            break;

          case "race_result":
            setPhase("finished");
            setRaceResult({ winner: msg.winner, players: msg.players });
            break;

          case "error":
            setError(msg.message);
            break;
        }
      };
    },
    []
  );

  const startRace = useCallback(() => {
    send({ type: "start_race" });
  }, [send]);

  const sendProgress = useCallback(
    (stats: { wpm: number; acc: number; errors: number; progress: number }) => {
      send({ type: "progress", ...stats });
    },
    [send]
  );

  const sendFinished = useCallback(
    (stats: { wpm: number; acc: number; elapsed: number }) => {
      send({ type: "finished", ...stats });
    },
    [send]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      wsRef.current?.close();
    };
  }, []);

  return {
    phase,
    players,
    countdown,
    passage,
    duration,
    opponent,
    raceResult,
    error,
    username: usernameRef.current,
    joinRoom,
    startRace,
    sendProgress,
    sendFinished,
    disconnect,
  };
}
