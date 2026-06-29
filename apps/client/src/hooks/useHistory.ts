import { useState, useEffect, useCallback } from "react";

export interface HistoryEntry {
  id: string;
  date: number;
  wpm: number;
  acc: number;
  rawWpm: number;
  duration: number;
  consistency?: number;
  correct?: number;
  incorrect?: number;
  skipped?: number;
  keystrokes?: number;
}

const STORAGE_KEY = "mechboard_history";

export function useHistory() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setHistory(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load history from localStorage", e);
    }
  }, []);

  const addEntry = useCallback((wpm: number, acc: number, rawWpm: number, duration: number, consistency: number, correct: number, incorrect: number, skipped: number, keystrokes: number) => {
    setHistory((prev) => {
      const newEntry: HistoryEntry = {
        id: crypto.randomUUID(),
        date: Date.now(),
        wpm,
        acc,
        rawWpm,
        duration,
        consistency,
        correct,
        incorrect,
        skipped,
        keystrokes,
      };
      const updated = [...prev, newEntry];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error("Failed to save history to localStorage", e);
      }
      return updated;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return { history, addEntry, clearHistory };
}
