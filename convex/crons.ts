import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval(
  "close inactive rooms",
  { minutes: 5 },
  internal.rooms.closeInactiveRooms,
);

export default crons;
