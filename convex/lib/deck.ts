import { RANKS, SUITS, type Card, type Rank } from "../types";

export function buildDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ rank, suit });
    }
  }
  return deck;
}

/** Fisher-Yates shuffle. Convex replaces Math.random with a deterministic
 * per-mutation PRNG, so this is safe to use inside mutations. */
export function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export interface PyramidLayoutSlot {
  row: number;
  col: number;
}

/**
 * Row 1 is the bottom (widest, flipped first) up to `rows` at the tip.
 * `extraBottom` widens row 1 further so every card in the pool gets used —
 * cards that don't fit a clean triangle just get added to the base, same as
 * dealing them out by hand.
 */
export function pyramidLayout(rows: number, extraBottom = 0): PyramidLayoutSlot[] {
  const slots: PyramidLayoutSlot[] = [];
  for (let row = 1; row <= rows; row++) {
    const width = rows - row + 1 + (row === 1 ? extraBottom : 0);
    for (let col = 0; col < width; col++) {
      slots.push({ row, col });
    }
  }
  return slots;
}

export function pyramidSize(rows: number): number {
  return (rows * (rows + 1)) / 2;
}

/** Largest number of full pyramid rows that fit in `pool` cards. */
export function maxPyramidRows(pool: number): number {
  let rows = 0;
  while (pyramidSize(rows + 1) <= pool) rows++;
  return rows;
}

const RANK_VALUE: Record<Rank, number> = {
  A: 1,
  "2": 2,
  "3": 3,
  "4": 4,
  "5": 5,
  "6": 6,
  "7": 7,
  "8": 8,
  "9": 9,
  "10": 10,
  J: 11,
  Q: 12,
  K: 13,
};

/** Drink value of a flipped card: its own rank (7 = 7, King = 13, Ace = 1). */
export function cardValue(rank: Rank): number {
  return RANK_VALUE[rank];
}

/** Deal a fixed number of cards to each player first; whatever's left over
 * forms the pyramid pool. */
export function dealFixedHands(
  deck: Card[],
  playerCount: number,
  handSize: number,
): { hands: Card[][]; remaining: Card[] } {
  const handTotal = handSize * playerCount;
  const hands: Card[][] = [];
  for (let p = 0; p < playerCount; p++) {
    hands.push(deck.slice(p * handSize, (p + 1) * handSize));
  }
  const remaining = deck.slice(handTotal);
  return { hands, remaining };
}
