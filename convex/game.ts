import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { cardValue } from "./lib/deck";
import type { Card } from "./types";

export const getGameState = query({
  args: { roomId: v.id("rooms"), sessionId: v.string() },
  handler: async (ctx, { roomId, sessionId }) => {
    const room = await ctx.db.get(roomId);
    if (!room) return null;

    const players = await ctx.db
      .query("players")
      .withIndex("by_room", (q) => q.eq("roomId", roomId))
      .collect();

    const me = players.find((p) => p.sessionId === sessionId) ?? null;

    const pyramid = room.pyramid.map((slot, index) => ({
      row: slot.row,
      col: slot.col,
      index,
      revealed: slot.revealed,
      card: slot.revealed ? slot.card : null,
      value: slot.revealed ? cardValue(slot.card.rank) : null,
    }));

    return {
      roomId: room._id,
      code: room.code,
      status: room.status,
      handSize: room.handSize,
      rows: room.rows,
      currentIndex: room.currentIndex,
      total: room.pyramid.length,
      peekEndsAt: room.peekEndsAt ?? null,
      peekSeconds: room.peekSeconds,
      log: room.log.slice(-60),
      pyramid,
      players: players
        .sort((a, b) => a.joinedAt - b.joinedAt)
        .map((p) => ({
          sessionId: p.sessionId,
          name: p.name,
          isHost: p.isHost,
          handCount: p.hand.length,
          isMe: p.sessionId === sessionId,
        })),
      me: me
        ? {
            sessionId: me.sessionId,
            name: me.name,
            isHost: me.isHost,
            hand: me.hand,
          }
        : null,
    };
  },
});

export const flipNext = mutation({
  args: { roomId: v.id("rooms"), sessionId: v.string() },
  handler: async (ctx, { roomId, sessionId }) => {
    const room = await ctx.db.get(roomId);
    if (!room) throw new Error("Room not found.");
    if (room.status !== "playing") throw new Error("The game isn't in play.");
    const player = await ctx.db
      .query("players")
      .withIndex("by_room_and_session", (q) =>
        q.eq("roomId", roomId).eq("sessionId", sessionId),
      )
      .unique();
    if (!player) throw new Error("You're not in this room.");
    if (room.currentIndex >= room.pyramid.length) return;

    const pyramid = [...room.pyramid];
    const slot = pyramid[room.currentIndex];
    pyramid[room.currentIndex] = { ...slot, revealed: true };

    const nextIndex = room.currentIndex + 1;
    const finished = nextIndex >= pyramid.length;

    await ctx.db.patch(roomId, {
      pyramid,
      currentIndex: nextIndex,
      status: finished ? "finished" : "playing",
      log: [
        ...room.log,
        {
          id: crypto.randomUUID(),
          ts: Date.now(),
          message: `${player.name} flipped the ${cardLabel(slot.card)} (worth ${cardValue(slot.card.rank)}).`,
        },
        ...(finished
          ? [{ id: crypto.randomUUID(), ts: Date.now(), message: "Pyramid cleared. Game over!" }]
          : []),
      ],
    });
  },
});

// Claiming a card, calling someone out, and settling bluffs all happen out
// loud around the table — the app just deals and reveals. This only logs
// that someone looked at their own hand, since that's worth the table
// knowing about even though the app can't stop it.
export const logHandPeek = mutation({
  args: { roomId: v.id("rooms"), sessionId: v.string() },
  handler: async (ctx, { roomId, sessionId }) => {
    const room = await ctx.db.get(roomId);
    if (!room) return;
    if (room.status !== "playing") return;
    const player = await ctx.db
      .query("players")
      .withIndex("by_room_and_session", (q) =>
        q.eq("roomId", roomId).eq("sessionId", sessionId),
      )
      .unique();
    if (!player) return;
    await ctx.db.patch(roomId, {
      log: [
        ...room.log,
        { id: crypto.randomUUID(), ts: Date.now(), message: `${player.name} peeked at their hand.` },
      ],
    });
  },
});

function cardLabel(card: Card): string {
  const suitSymbol = { S: "♠", H: "♥", D: "♦", C: "♣" }[card.suit];
  return `${card.rank}${suitSymbol}`;
}
