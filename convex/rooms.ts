import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import {
  buildDeck,
  dealFixedHands,
  maxPyramidRows,
  pyramidLayout,
  pyramidSize,
  shuffle,
} from "./lib/deck";

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomCode(): string {
  let code = "";
  for (let i = 0; i < 5; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return code;
}

export const createRoom = mutation({
  args: { hostName: v.string(), sessionId: v.string() },
  handler: async (ctx, { hostName, sessionId }) => {
    const name = hostName.trim().slice(0, 24) || "Host";

    let code = randomCode();
    for (let attempts = 0; attempts < 5; attempts++) {
      const existing = await ctx.db
        .query("rooms")
        .withIndex("by_code", (q) => q.eq("code", code))
        .unique();
      if (!existing) break;
      code = randomCode();
    }

    const roomId = await ctx.db.insert("rooms", {
      code,
      hostSessionId: sessionId,
      status: "lobby",
      handSize: 4,
      rows: 0,
      pyramid: [],
      currentIndex: 0,
      peekSeconds: 12,
      log: [],
      createdAt: Date.now(),
    });

    await ctx.db.insert("players", {
      roomId,
      sessionId,
      name,
      isHost: true,
      hand: [],
      joinedAt: Date.now(),
    });

    return { roomId, code };
  },
});

export const joinRoom = mutation({
  args: { code: v.string(), name: v.string(), sessionId: v.string() },
  handler: async (ctx, { code, name, sessionId }) => {
    const room = await ctx.db
      .query("rooms")
      .withIndex("by_code", (q) => q.eq("code", code.trim().toUpperCase()))
      .unique();
    if (!room) throw new Error("Room not found. Check the code and try again.");

    const existing = await ctx.db
      .query("players")
      .withIndex("by_room_and_session", (q) =>
        q.eq("roomId", room._id).eq("sessionId", sessionId),
      )
      .unique();
    if (existing) return { roomId: room._id };

    if (room.status !== "lobby") {
      throw new Error("This game has already started.");
    }

    const players = await ctx.db
      .query("players")
      .withIndex("by_room", (q) => q.eq("roomId", room._id))
      .collect();
    if (players.length >= 12) throw new Error("This room is full.");
    if (players.some((p) => p.name.toLowerCase() === name.trim().toLowerCase())) {
      throw new Error("Someone in this room already has that name.");
    }

    await ctx.db.insert("players", {
      roomId: room._id,
      sessionId,
      name: name.trim().slice(0, 24) || "Player",
      isHost: false,
      hand: [],
      joinedAt: Date.now(),
    });

    return { roomId: room._id };
  },
});

export const getRoomByCode = query({
  args: { code: v.string() },
  handler: async (ctx, { code }) => {
    const room = await ctx.db
      .query("rooms")
      .withIndex("by_code", (q) => q.eq("code", code.trim().toUpperCase()))
      .unique();
    if (!room) return null;
    const players = await ctx.db
      .query("players")
      .withIndex("by_room", (q) => q.eq("roomId", room._id))
      .collect();
    return {
      roomId: room._id,
      code: room.code,
      status: room.status,
      playerCount: players.length,
      playerNames: players.map((p) => p.name),
    };
  },
});

export const setHandSize = mutation({
  args: { roomId: v.id("rooms"), sessionId: v.string(), handSize: v.number() },
  handler: async (ctx, { roomId, sessionId, handSize }) => {
    const room = await ctx.db.get(roomId);
    if (!room) throw new Error("Room not found.");
    if (room.hostSessionId !== sessionId) throw new Error("Only the host can do that.");
    if (room.status !== "lobby") throw new Error("Game already started.");
    if (handSize < 2 || handSize > 15) throw new Error("Hand size must be between 2 and 15.");
    await ctx.db.patch(roomId, { handSize });
  },
});

export const startGame = mutation({
  args: { roomId: v.id("rooms"), sessionId: v.string() },
  handler: async (ctx, { roomId, sessionId }) => {
    const room = await ctx.db.get(roomId);
    if (!room) throw new Error("Room not found.");
    if (room.hostSessionId !== sessionId) throw new Error("Only the host can start the game.");
    if (room.status !== "lobby") throw new Error("Game already started.");

    const players = await ctx.db
      .query("players")
      .withIndex("by_room", (q) => q.eq("roomId", roomId))
      .collect();
    if (players.length < 2) throw new Error("Need at least 2 players to start.");

    const deck = shuffle(buildDeck());
    if (room.handSize * players.length > deck.length) {
      throw new Error("That hand size is too big for this many players.");
    }

    const { hands, remaining } = dealFixedHands(deck, players.length, room.handSize);
    const rows = maxPyramidRows(remaining.length);
    if (rows < 3) {
      throw new Error("Not enough cards left for a pyramid — try a smaller hand size.");
    }

    // Every remaining card gets used: whatever doesn't fit a clean triangle
    // widens the bottom row instead of getting burned.
    const extraBottom = remaining.length - pyramidSize(rows);
    const layout = pyramidLayout(rows, extraBottom);
    const pyramid = layout.map((slot, i) => ({
      row: slot.row,
      col: slot.col,
      card: remaining[i],
      revealed: false,
    }));

    for (let i = 0; i < players.length; i++) {
      await ctx.db.patch(players[i]._id, {
        hand: hands[i].map((card) => ({
          id: `${players[i]._id}-${card.rank}${card.suit}-${Math.random().toString(36).slice(2, 8)}`,
          card,
        })),
      });
    }

    const peekEndsAt = Date.now() + room.peekSeconds * 1000;

    await ctx.db.patch(roomId, {
      status: "peeking",
      rows,
      pyramid,
      currentIndex: 0,
      peekEndsAt,
      log: [
        {
          id: crypto.randomUUID(),
          ts: Date.now(),
          kind: "info" as const,
          text: `Cards dealt. Peek at your hand — it hides in ${room.peekSeconds}s.`,
        },
      ],
    });
  },
});

export const advanceFromPeek = mutation({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, { roomId }) => {
    const room = await ctx.db.get(roomId);
    if (!room) return;
    if (room.status !== "peeking") return;
    if (!room.peekEndsAt || Date.now() < room.peekEndsAt) return;
    await ctx.db.patch(roomId, {
      status: "playing",
      log: [
        ...room.log,
        { id: crypto.randomUUID(), ts: Date.now(), kind: "info" as const, text: "The pyramid is live. First card, flip it!" },
      ],
    });
  },
});

export const playAgain = mutation({
  args: { roomId: v.id("rooms"), sessionId: v.string() },
  handler: async (ctx, { roomId, sessionId }) => {
    const room = await ctx.db.get(roomId);
    if (!room) throw new Error("Room not found.");
    if (room.hostSessionId !== sessionId) throw new Error("Only the host can do that.");
    await ctx.db.patch(roomId, {
      status: "lobby",
      rows: 0,
      pyramid: [],
      currentIndex: 0,
      peekEndsAt: undefined,
      log: [],
    });
    const players = await ctx.db
      .query("players")
      .withIndex("by_room", (q) => q.eq("roomId", roomId))
      .collect();
    for (const p of players) {
      await ctx.db.patch(p._id, { hand: [] });
    }
  },
});

export const leaveRoom = mutation({
  args: { roomId: v.id("rooms"), sessionId: v.string() },
  handler: async (ctx, { roomId, sessionId }) => {
    const player = await ctx.db
      .query("players")
      .withIndex("by_room_and_session", (q) =>
        q.eq("roomId", roomId).eq("sessionId", sessionId),
      )
      .unique();
    if (!player) return;
    await ctx.db.delete(player._id);
  },
});
