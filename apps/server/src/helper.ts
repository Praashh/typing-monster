const WORDS = Array.from(
  new Set(
    `the of and to in is was he for it with as his on be at by had not are but from or have an they which one you were her all she there would their we him been has when who will more no if out so said what up its about into than them can only other new some could time these two may then do first any my now such like our over man me even most made after also did many before must through back years where much your way well down should because each just those people how too little state good very make world still own see men work long get here between both life being under never day same another know while last might us great old year off come since against go came right used take three states himself few house use during without again place around however home small found thought went say part once general high upon school every don does got united left number course war until always away something fact though water less public put thing almost hand enough far took head yet government system better set told nothing night end why called eyes find going look ask later knew point next city business give group toward young days let room side given several order ran keep word feel light power line type sound learn quick brown fox jumps lazy dog`.split(
      /\s+/
    )
  )
);

export function makePassage(n = 50): string {
  const out: string[] = [];
  let prev = -1;
  for (let i = 0; i < n; i++) {
    let idx: number;
    do {
      idx = Math.floor(Math.random() * WORDS.length);
    } while (idx === prev);
    prev = idx;
    out.push(WORDS[idx]);
  }
  return out.join(" ");
}

export interface PlayerInfo {
  id: string;
  username: string;
  ws: any;
  finished: boolean;
  finishData?: { wpm: number; acc: number; elapsed: number };
}

export interface RoomState {
  id: string;
  players: Map<string, PlayerInfo>;
  passage: string | null;
  duration: number;
  phase: "waiting" | "countdown" | "racing" | "finished";
  countdownTimer?: ReturnType<typeof setTimeout>;
  finishResults: Array<{ username: string; wpm: number; acc: number; elapsed: number }>;
}

export const rooms = new Map<string, RoomState>();

let nextPlayerId = 0;
export function nextId(): string {
  return String(nextPlayerId++);
}

export function createRoom(roomId: string): RoomState {
  const room: RoomState = {
    id: roomId,
    players: new Map(),
    passage: null,
    duration: 60,
    phase: "waiting",
    finishResults: [],
  };
  rooms.set(roomId, room);
  return room;
}

export function removePlayer(room: RoomState, playerId: string): void {
  room.players.delete(playerId);
  if (room.players.size === 0) {
    if (room.countdownTimer) clearTimeout(room.countdownTimer);
    rooms.delete(room.id);
    console.log(`Room ${room.id} cleaned up`);
  }
}

export function broadcast(room: RoomState, data: unknown) {
  const msg = JSON.stringify(data);
  for (const p of room.players.values()) {
    p.ws.send(msg);
  }
}

export function sendToOpponents(room: RoomState, senderId: string, data: unknown) {
  const msg = JSON.stringify(data);
  for (const [id, p] of room.players) {
    if (id !== senderId) p.ws.send(msg);
  }
}
