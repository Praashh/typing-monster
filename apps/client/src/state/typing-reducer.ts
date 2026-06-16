import { makePassage } from "../data/words";

export interface Snapshot {
  elapsed: number;
  totalTyped: number;
  totalCorrect: number;
}

export interface TypingState {
  text: string;
  typed: string;
  started: boolean;
  finished: boolean;
  startTime: number;
  now: number;
  duration: number;
  snapshots: Snapshot[];
}

export type TypingAction =
  | { type: "TYPE_CHAR"; key: string; time: number }
  | { type: "BACKSPACE" }
  | { type: "TICK"; now: number }
  | { type: "RESET" }
  | { type: "SET_DURATION"; duration: number };

export function makeInitialState(duration = 60): TypingState {
  return {
    text: makePassage(),
    typed: "",
    started: false,
    finished: false,
    startTime: 0,
    now: 0,
    duration,
    snapshots: [],
  };
}

export function countCorrect(typed: string, text: string): number {
  let c = 0;
  for (let i = 0; i < typed.length; i++) if (typed[i] === text[i]) c++;
  return c;
}

export function typingReducer(state: TypingState, action: TypingAction): TypingState {
  switch (action.type) {
    case "TYPE_CHAR": {
      if (state.finished) return state;
      const typed = state.typed.length >= state.text.length ? state.typed : state.typed + action.key;
      if (!state.started) {
        return { ...state, typed, started: true, startTime: action.time };
      }
      return { ...state, typed };
    }
    case "BACKSPACE":
      if (state.finished) return state;
      return { ...state, typed: state.typed.slice(0, -1) };
    case "TICK": {
      if (!state.started || state.finished) return state;
      const elapsed = action.now - state.startTime;
      const elapsedSec = Math.floor(elapsed / 1000);
      const lastSec = state.snapshots.length > 0 ? state.snapshots[state.snapshots.length - 1].elapsed : 0;

      let snapshots = state.snapshots;
      if (elapsedSec > lastSec && elapsedSec > 0) {
        const correct = countCorrect(state.typed, state.text);
        snapshots = [
          ...snapshots,
          { elapsed: elapsedSec, totalTyped: state.typed.length, totalCorrect: correct },
        ];
      }

      if (elapsed >= state.duration * 1000) {
        const correct = countCorrect(state.typed, state.text);
        if (snapshots.length === 0 || snapshots[snapshots.length - 1].elapsed < state.duration) {
          snapshots = [
            ...snapshots,
            { elapsed: state.duration, totalTyped: state.typed.length, totalCorrect: correct },
          ];
        }
        return { ...state, now: action.now, finished: true, snapshots };
      }

      return { ...state, now: action.now, snapshots };
    }
    case "RESET":
      return makeInitialState(state.duration);
    case "SET_DURATION":
      return makeInitialState(action.duration);
  }
}
