import { v } from "convex/values";

export const RANKS = [
  "A",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "J",
  "Q",
  "K",
] as const;

export const SUITS = ["S", "H", "D", "C"] as const;

export type Rank = (typeof RANKS)[number];
export type Suit = (typeof SUITS)[number];

export interface Card {
  rank: Rank;
  suit: Suit;
}

export const cardValidator = v.object({
  rank: v.union(...RANKS.map((r) => v.literal(r))),
  suit: v.union(...SUITS.map((s) => v.literal(s))),
});

export const pyramidSlotValidator = v.object({
  row: v.number(),
  col: v.number(),
  card: cardValidator,
  revealed: v.boolean(),
});

export const logEntryValidator = v.object({
  id: v.string(),
  ts: v.number(),
  message: v.string(),
});

export const handCardValidator = v.object({
  id: v.string(),
  card: cardValidator,
});
