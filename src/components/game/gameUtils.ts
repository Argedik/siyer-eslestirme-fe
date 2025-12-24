/**
 * Game Utilities - Ortak fonksiyonlar ve tipler
 */

import type { Term } from "@/lib/terms";
import type { MemoryCardData } from "@/components/game/MemoryCard";

// Renk paletleri
export const colorPalettes = {
  "su-yesili": {
    primary: "#20b2aa",
    secondary: "#40e0d0",
    tertiary: "#48d1cc",
    quaternary: "#7fffd4",
    name: "Su Yeşili"
  },
  "mavi": {
    primary: "#4169e1",
    secondary: "#6495ed",
    tertiary: "#87ceeb",
    quaternary: "#b0e0e6",
    name: "Mavi"
  },
  "kirmizi": {
    primary: "#dc143c",
    secondary: "#ff6347",
    tertiary: "#ff7f50",
    quaternary: "#ffa07a",
    name: "Kırmızı"
  },
  "pembe": {
    primary: "#ff1493",
    secondary: "#ff69b4",
    tertiary: "#ffb6c1",
    quaternary: "#ffc0cb",
    name: "Pembe"
  },
  "turuncu": {
    primary: "#ff8c00",
    secondary: "#ffa500",
    tertiary: "#ffb347",
    quaternary: "#ffd700",
    name: "Turuncu"
  },
  "mor": {
    primary: "#9370db",
    secondary: "#ba55d3",
    tertiary: "#da70d6",
    quaternary: "#dda0dd",
    name: "Mor"
  }
};

export type ColorTheme = keyof typeof colorPalettes;

export const DEFAULT_PAIR_TARGET = 6;
export const MIN_PAIR_COUNT = 4;
export const MAX_PAIR_COUNT = 18;

export type GameStatus = "idle" | "playing" | "complete";

export type Player = {
  id: string;
  name: string;
  score: number;
  color: string;
};

export type RankedPlayer = Player & { originalIndex: number };

export type TurnPopup = {
  name: string;
  color: string;
};

/**
 * Array'i karıştırır (Fisher-Yates shuffle)
 */
export function shuffle<T>(items: T[]): T[] {
  const array = [...items];
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

/**
 * Kart destesi oluşturur
 */
export function createDeck(pool: Term[], pairCount: number, duplicateCount: number = 2): MemoryCardData[] {
  const source = shuffle(pool).slice(0, pairCount);
  const multiplied = source.flatMap((term) => {
    const base = {
      matchId: term.id,
      term,
      isFlipped: false,
      isMatched: false,
    } as const;
    // Mükerrer sayısına göre kart oluştur (2, 3 veya 4 adet)
    return Array.from({ length: duplicateCount }, (_, index) => ({
      ...base,
      id: `${term.id}-${String.fromCharCode(97 + index)}-${Math.random().toString(16).slice(2, 8)}`,
      tilt: (Math.random() - 0.5) * 6,
    }));
  });
  return shuffle(multiplied);
}

