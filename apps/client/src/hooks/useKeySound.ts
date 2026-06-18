import { useRef, useCallback } from "react";
import { SOUND_DEFINES, CODE_TO_SCANCODE } from "../data/sound-map";
import soundUrl from "../assets/sounds/cherry-blue/sound.ogg";

let _soundRaw: ArrayBuffer | null = null;
fetch(soundUrl)
  .then((r) => r.arrayBuffer())
  .then((buf) => { _soundRaw = buf; })
  .catch(() => {});

export function useKeySound() {
  const audioRef = useRef<AudioContext | null>(null);
  const masterRef = useRef<GainNode | null>(null);
  const soundBufferRef = useRef<AudioBuffer | null>(null);
  const decodingRef = useRef(false);

  const ensureAudio = useCallback((): AudioContext => {
    if (!audioRef.current) {
      const ctx = new AudioContext();
      const master = ctx.createGain();
      master.gain.value = 0.5;
      master.connect(ctx.destination);
      audioRef.current = ctx;
      masterRef.current = master;
    }
    if (audioRef.current.state === "suspended") audioRef.current.resume();

    if (!soundBufferRef.current && _soundRaw && !decodingRef.current) {
      decodingRef.current = true;
      audioRef.current
        .decodeAudioData(_soundRaw.slice(0))
        .then((decoded) => { soundBufferRef.current = decoded; })
        .catch(() => {})
        .finally(() => { decodingRef.current = false; });
    }

    return audioRef.current;
  }, []);

  const playSound = useCallback(
    (code: string) => {
      ensureAudio();
      const ctx = audioRef.current;
      const buffer = soundBufferRef.current;
      const master = masterRef.current;
      if (!ctx || !buffer || !master) return;

      const scancode = CODE_TO_SCANCODE[code];
      const def = scancode != null ? SOUND_DEFINES[scancode] : undefined;
      if (!def) return;

      const [offsetMs, durationMs] = def;
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(master);
      source.start(0, offsetMs / 1000, durationMs / 1000);
    },
    [ensureAudio],
  );

  return playSound;
}
