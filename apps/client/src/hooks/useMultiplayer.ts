import { useRef, useState, useCallback, useEffect } from "react";

let sharedAudioContext: AudioContext | null = null;
export function playCountdownBeep(type: "tick" | "go") {
  try {
    if (!sharedAudioContext) {
      const AC = window.AudioContext || (window as any).webkitAudioContext;
      if (!AC) return;
      sharedAudioContext = new AC();
    }
    const ac = sharedAudioContext;
    if (ac.state === "suspended") ac.resume();

    const osc = ac.createOscillator();
    const gain = ac.createGain();
    const filter = ac.createBiquadFilter();
    
    // Retro arcade racing style: square wave with a lowpass filter
    osc.type = "square";
    osc.frequency.setValueAtTime(type === "tick" ? 392.0 : 784.0, ac.currentTime);
    
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(2000, ac.currentTime);
    
    // Simple decay envelope that won't throw overlap errors
    gain.gain.setValueAtTime(0.3, ac.currentTime);
    
    const duration = type === "tick" ? 0.15 : 0.5;
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration);
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ac.destination);
    
    osc.start(ac.currentTime);
    osc.stop(ac.currentTime + duration);
  } catch (e) {
    console.error("Audio beep error:", e);
  }
}

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
  players: Array<{ username: string; wpm: number; acc: number; rawWpm: number; elapsed: number; typed: string; snapshots: any[] }>;
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
  const [roomId, setRoomId] = useState<string | null>(null);
  const [players, setPlayers] = useState<string[]>([]);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [passage, setPassage] = useState<string | null>(null);
  const [duration, setDuration] = useState(60);
  const [isCreator, setIsCreator] = useState(false);
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
    setRoomId(null);
    setPhase("idle");
    setPlayers([]);
    setCountdown(null);
    setPassage(null);
    setOpponent(null);
    setRaceResult(null);
    setError(null);
  }, []);

  const joinRoom = useCallback(
    (newRoomId: string, username: string) => {
      setRoomId(newRoomId);
      usernameRef.current = username;

      // Close any existing connection
      wsRef.current?.close();

      let wsBase = "";
      if (import.meta.env.VITE_WS_URL) {
        wsBase = import.meta.env.VITE_WS_URL.replace(/^http/, "ws");
      } else if (import.meta.env.DEV) {
        wsBase = "ws://localhost:3000";
      } else {
        wsBase = `${location.protocol === "https:" ? "wss:" : "ws:"}//${location.host}`;
      }
      const ws = new WebSocket(`${wsBase}/ws/${newRoomId}`);
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
            if (msg.username) {
              usernameRef.current = msg.username;
            }
            const self = usernameRef.current;
            const opponentName = msg.players.find((p: string) => p !== self);
            setPhase("lobby");
            setPlayers(msg.players);
            setIsCreator(msg.isCreator);
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
            if (msg.newCreator === usernameRef.current) {
              setIsCreator(true);
            }
            break;

          case "countdown":
            setPhase("countdown");
            setCountdown(msg.value);
            playCountdownBeep("tick");
            break;

          case "race_go":
            setPhase("racing");
            setPassage(msg.passage);
            setDuration(msg.duration);
            setCountdown(null);
            setRaceResult(null);
            playCountdownBeep("go");
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

  const startRace = useCallback((duration: number = 60) => {
    send({ type: "start_race", duration });
  }, [send]);

  const sendProgress = useCallback(
    (stats: { wpm: number; acc: number; errors: number; progress: number }) => {
      send({ type: "progress", ...stats });
    },
    [send]
  );

  const sendFinish = useCallback((wpm: number, acc: number, rawWpm: number, elapsed: number, typed: string, snapshots: any[]) => {
    send({ type: "finished", wpm, acc, rawWpm, elapsed, typed, snapshots });
  }, [send]);

  const backToLobby = useCallback(() => {
    setPhase("lobby");
    setRaceResult(null);
    setPassage(null);
    setOpponent((o) => (o ? { ...o, wpm: 0, acc: 100, errors: 0, progress: 0 } : null));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      wsRef.current?.close();
    };
  }, []);

  return {
    phase,
    roomId,
    players,
    countdown,
    passage,
    duration,
    opponent,
    raceResult,
    error,
    isCreator,
    username: usernameRef.current,
    joinRoom,
    startRace,
    sendProgress,
    sendFinish,
    backToLobby,
    disconnect,
  };
}
