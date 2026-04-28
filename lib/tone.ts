import type { Tone } from "./captions";

export type { Tone };

export interface ToneMeta {
  id: Tone;
  label: string;
  emoji: string;
  description: string;
  preview: string;
}

export const TONES: ToneMeta[] = [
  {
    id: "family",
    label: "Family",
    emoji: "🧢",
    description: "Honest. PG. Read aloud at the ballpark.",
    preview: "The bats need to wake up.",
  },
  {
    id: "spicy",
    label: "Spicy",
    emoji: "🌶️",
    description: "House voice. A little bite.",
    preview: "The bats are dogshit.",
  },
  {
    id: "profane",
    label: "Profane",
    emoji: "🚫",
    description: "Unhinged group chat. Adult mode.",
    preview: "The bats are fucking dogshit.",
  },
];

const STORAGE_KEY = "trident:tone";
const EVENT_NAME = "trident:tone-changed";
const VALID: Set<Tone> = new Set(TONES.map((t) => t.id));
const DEFAULT_TONE: Tone = "spicy";

function isTone(value: unknown): value is Tone {
  return typeof value === "string" && VALID.has(value as Tone);
}

export function loadTone(): Tone {
  if (typeof window === "undefined") return DEFAULT_TONE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (isTone(raw)) return raw;
  } catch {
    // storage blocked
  }
  return DEFAULT_TONE;
}

export function saveTone(tone: Tone): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, tone);
  } catch {
    // storage blocked — still broadcast so in-tab listeners update
  }
  window.dispatchEvent(new CustomEvent<Tone>(EVENT_NAME, { detail: tone }));
}

export function subscribeTone(handler: (tone: Tone) => void): () => void {
  if (typeof window === "undefined") return () => {};

  function onCustom(e: Event) {
    const detail = (e as CustomEvent<Tone>).detail;
    if (isTone(detail)) handler(detail);
  }
  function onStorage(e: StorageEvent) {
    if (e.key !== STORAGE_KEY) return;
    handler(isTone(e.newValue) ? e.newValue : DEFAULT_TONE);
  }

  window.addEventListener(EVENT_NAME, onCustom as EventListener);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(EVENT_NAME, onCustom as EventListener);
    window.removeEventListener("storage", onStorage);
  };
}

export function cycleTone(current: Tone): Tone {
  const idx = TONES.findIndex((t) => t.id === current);
  return TONES[(idx + 1) % TONES.length].id;
}

export function getToneMeta(tone: Tone): ToneMeta {
  return TONES.find((t) => t.id === tone) ?? TONES[1];
}
