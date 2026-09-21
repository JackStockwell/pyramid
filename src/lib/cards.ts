export type Suit = "S" | "H" | "D" | "C";
export type Rank =
  | "A"
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "10"
  | "J"
  | "Q"
  | "K";

export interface Card {
  rank: Rank;
  suit: Suit;
}

export const SUIT_SYMBOL: Record<Suit, string> = {
  S: "♠",
  H: "♥",
  D: "♦",
  C: "♣",
};

export const SUIT_NAME: Record<Suit, string> = {
  S: "Spades",
  H: "Hearts",
  D: "Diamonds",
  C: "Clubs",
};

export function isRed(suit: Suit): boolean {
  return suit === "H" || suit === "D";
}

export function cardLabel(card: Card): string {
  return `${card.rank}${SUIT_SYMBOL[card.suit]}`;
}

const RANK_ORDER: Rank[] = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
const RANK_VALUE: Record<Rank, number> = Object.fromEntries(
  RANK_ORDER.map((rank, i) => [rank, i + 1]),
) as Record<Rank, number>;

/** Drink value of a card: its own rank (7 = 7, King = 13, Ace = 1). */
export function cardValue(rank: Rank): number {
  return RANK_VALUE[rank];
}

/** Sort a hand low to high, Ace low. Doesn't mutate the input. */
export function sortByRank<T extends { card: Card }>(cards: T[]): T[] {
  return [...cards].sort((a, b) => RANK_VALUE[a.card.rank] - RANK_VALUE[b.card.rank]);
}

export function pyramidSize(rows: number): number {
  return (rows * (rows + 1)) / 2;
}

/** Largest number of full pyramid rows that fit in `remaining` cards. */
export function maxPyramidRows(remaining: number): number {
  let rows = 0;
  while (pyramidSize(rows + 1) <= remaining) rows++;
  return rows;
}
