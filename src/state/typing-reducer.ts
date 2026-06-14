import { makePassage } from "../data/words";

export interface TypingState {
  text: string;
  typed: string;
  started: boolean;
  finished: boolean;
  startTime: number;
  now: number;
  duration: number;
}

export type TypingAction =
  | { type: "TYPE_CHAR"; key: string; time: number }
  | { type: "BACKSPACE" }
  | { type: "TICK"; now: number }
  | { type: "RESET" }
  | { type: "SET_DURATION"; duration: number };

export function makeInitialState(duration = 60): TypingState {
  return { text: makePassage(), typed: "", started: false, finished: false, startTime: 0, now: 0, duration };
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
      if (elapsed >= state.duration * 1000) {
        return { ...state, now: action.now, finished: true };
      }
      return { ...state, now: action.now };
    }
    case "RESET":
      return makeInitialState(state.duration);
    case "SET_DURATION":
      return makeInitialState(action.duration);
  }
}
