import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import {
  handCardValidator,
  logEntryValidator,
  pyramidSlotValidator,
} from "./types";

export default defineSchema({
  rooms: defineTable({
    code: v.string(),
    hostSessionId: v.string(),
    status: v.union(
      v.literal("lobby"),
      v.literal("peeking"),
      v.literal("playing"),
      v.literal("finished"),
    ),
    handSize: v.number(),
    rows: v.number(),
    pyramid: v.array(pyramidSlotValidator),
    currentIndex: v.number(),
    peekEndsAt: v.optional(v.number()),
    peekSeconds: v.number(),
    log: v.array(logEntryValidator),
    createdAt: v.number(),
    lastActivityAt: v.number(),
  })
    .index("by_code", ["code"])
    .index("by_last_activity", ["lastActivityAt"]),

  players: defineTable({
    roomId: v.id("rooms"),
    sessionId: v.string(),
    name: v.string(),
    isHost: v.boolean(),
    hand: v.array(handCardValidator),
    joinedAt: v.number(),
  })
    .index("by_room", ["roomId"])
    .index("by_room_and_session", ["roomId", "sessionId"]),
});
