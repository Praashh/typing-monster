import { Elysia } from "elysia";
import {
  rooms,
  createRoom,
  removePlayer,
  makePassage,
  broadcast,
  sendToOpponents,
  nextId,
} from "../helper";

const wsPlayerIds = new WeakMap<object, string>();

function getRoomId(ws: any): string {
  return ws.data.params.roomId;
}

function findPlayerIdByWs(roomId: string, ws: any): string | undefined {
  const room = rooms.get(roomId);
  if (!room) return undefined;
  for (const [id, p] of room.players) {
    if (p.ws === ws) return id;
  }
  // Fallback to WeakMap
  return wsPlayerIds.get(ws);
}

const wsRoutes = new Elysia({
  prefix: "/ws",
  websocket: { idleTimeout: 120 },
}).ws("/:roomId", {
  open(ws) {
    console.log(`WS connected for room ${getRoomId(ws)}`);
  },

  message(ws, raw) {
    const roomId = getRoomId(ws);
    let data: any;
    try {
      data = typeof raw === "string" ? JSON.parse(raw) : raw;
    } catch {
      ws.send(JSON.stringify({ type: "error", message: "Invalid JSON" }));
      return;
    }

    switch (data.type) {
      case "join": {
        let room = rooms.get(roomId);
        if (!room) room = createRoom(roomId);

        if (room.players.size >= 2) {
          ws.send(JSON.stringify({ type: "error", message: "Room is full" }));
          return;
        }
        if (room.phase !== "waiting") {
          ws.send(
            JSON.stringify({ type: "error", message: "Race already in progress" })
          );
          return;
        }

        const playerId = nextId();
        room.players.set(playerId, {
          id: playerId,
          username: data.username || `Player ${playerId}`,
          ws,
          finished: false,
        });
        wsPlayerIds.set(ws, playerId);

        const players = [...room.players.values()].map((p) => p.username);

        ws.send(JSON.stringify({ type: "room_joined", playerId, players }));

        sendToOpponents(room, playerId, {
          type: "player_joined",
          username: data.username,
          playerCount: room.players.size,
        });

        console.log(`${data.username} joined room ${roomId} (${room.players.size}/2)`);
        break;
      }

      case "start_race": {
        const room = rooms.get(roomId);
        if (!room || room.phase !== "waiting") return;

        if (room.players.size < 2) {
          ws.send(
            JSON.stringify({ type: "error", message: "Need 2 players to start" })
          );
          return;
        }

        room.phase = "countdown";
        room.passage = makePassage(50);
        room.finishResults = [];

        for (const p of room.players.values()) {
          p.finished = false;
          p.finishData = undefined;
        }

        let count = 3;
        const tick = () => {
          broadcast(room, { type: "countdown", value: count });
          count--;
          if (count > 0) {
            room.countdownTimer = setTimeout(tick, 1000);
          } else {
            room.countdownTimer = setTimeout(() => {
              room.phase = "racing";
              broadcast(room, {
                type: "race_go",
                passage: room.passage,
                duration: room.duration,
              });
              console.log(`Room ${roomId} race started`);
            }, 1000);
          }
        };
        tick();
        break;
      }

      case "progress": {
        const room = rooms.get(roomId);
        if (!room || room.phase !== "racing") return;
        const playerId = findPlayerIdByWs(roomId, ws);
        if (!playerId) return;
        const player = room.players.get(playerId);
        if (!player) return;

        sendToOpponents(room, playerId, {
          type: "opponent_progress",
          username: player.username,
          wpm: data.wpm ?? 0,
          acc: data.acc ?? 100,
          errors: data.errors ?? 0,
          progress: data.progress ?? 0,
        });
        break;
      }

      case "finished": {
        const room = rooms.get(roomId);
        if (!room || room.phase !== "racing") return;
        const playerId = findPlayerIdByWs(roomId, ws);
        if (!playerId) return;
        const player = room.players.get(playerId);
        if (!player || player.finished) return;

        player.finished = true;
        player.finishData = {
          wpm: data.wpm ?? 0,
          acc: data.acc ?? 0,
          elapsed: data.elapsed ?? 0,
        };
        room.finishResults.push({
          username: player.username,
          ...player.finishData,
        });

        broadcast(room, {
          type: "player_finished",
          username: player.username,
          wpm: data.wpm ?? 0,
          acc: data.acc ?? 0,
          elapsed: data.elapsed ?? 0,
        });

        const allDone = [...room.players.values()].every((p) => p.finished);
        if (allDone) {
          room.phase = "finished";
          const sorted = [...room.finishResults].sort((a, b) => b.wpm - a.wpm);
          broadcast(room, {
            type: "race_result",
            winner: sorted[0].username,
            players: sorted,
          });
          // Allow rematch
          room.phase = "waiting";
          room.passage = null;
          console.log(`Room ${roomId} race finished — winner: ${sorted[0].username}`);
        }
        break;
      }

      default:
        ws.send(
          JSON.stringify({ type: "error", message: `Unknown message type: ${data.type}` })
        );
    }
  },

  close(ws) {
    const roomId = getRoomId(ws);
    if (!roomId) return;

    const playerId = findPlayerIdByWs(roomId, ws);
    if (!playerId) return;

    const room = rooms.get(roomId);
    if (!room) return;

    const player = room.players.get(playerId);
    const username = player?.username ?? "Unknown";

    removePlayer(room, playerId);

    if (rooms.has(roomId)) {
      const remaining = rooms.get(roomId)!;

      if (remaining.phase === "racing" || remaining.phase === "countdown") {
        remaining.phase = "waiting";
        remaining.passage = null;
        if (remaining.countdownTimer) clearTimeout(remaining.countdownTimer);
      }

      broadcast(remaining, {
        type: "player_left",
        username,
        playerCount: remaining.players.size,
      });
    }

    console.log(`${username} left room ${roomId}`);
  },
});

export default wsRoutes;
