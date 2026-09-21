import { useMutation } from "convex/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "../../convex/_generated/api";
import { ActivityLog } from "@/components/ActivityLog";
import { Hand } from "@/components/Hand";
import { PlayingCard } from "@/components/PlayingCard";
import { Pyramid } from "@/components/Pyramid";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { sortByRank, type Card } from "@/lib/cards";
import type { Id } from "../../convex/_generated/dataModel";

interface PyramidSlotState {
  row: number;
  col: number;
  index: number;
  value: number | null;
  revealed: boolean;
  card: Card | null;
}

interface PlayerView {
  sessionId: string;
  name: string;
  isHost: boolean;
  handCount: number;
  isMe: boolean;
}

export interface GameState {
  roomId: Id<"rooms">;
  code: string;
  status: "lobby" | "peeking" | "playing" | "finished";
  handSize: number;
  rows: number;
  currentIndex: number;
  total: number;
  peekEndsAt: number | null;
  peekSeconds: number;
  log: { id: string; ts: number; message: string }[];
  pyramid: PyramidSlotState[];
  players: PlayerView[];
  me: { sessionId: string; name: string; isHost: boolean; hand: { id: string; card: Card }[] } | null;
}

interface GameBoardProps {
  roomId: Id<"rooms">;
  sessionId: string;
  state: GameState;
}

export function GameBoard({ roomId, sessionId, state }: GameBoardProps) {
  const advanceFromPeek = useMutation(api.rooms.advanceFromPeek);
  const flip = useMutation(api.game.flipNext);
  const logHandPeek = useMutation(api.game.logHandPeek);
  const playAgain = useMutation(api.rooms.playAgain);

  const [flipping, setFlipping] = useState(false);
  const [handRevealed, setHandRevealed] = useState(false);

  // Hand starts hidden the moment the pyramid goes live, so players have to
  // rely on memory from the peek phase rather than leaving cards on display.
  useEffect(() => {
    if (state.status === "playing") setHandRevealed(false);
  }, [state.status]);

  const activeSlot =
    state.currentIndex > 0 ? state.pyramid[state.currentIndex - 1] : null;

  // Peek countdown + auto-advance.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (state.status !== "peeking") return;
    const interval = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(interval);
  }, [state.status]);

  useEffect(() => {
    if (state.status !== "peeking" || !state.peekEndsAt) return;
    if (Date.now() >= state.peekEndsAt) {
      advanceFromPeek({ roomId }).catch(() => {});
    }
  }, [state.status, state.peekEndsAt, now, advanceFromPeek, roomId]);

  if (!state.me) return null;

  const myHand = sortByRank(state.me.hand);

  async function togglePeek() {
    const next = !handRevealed;
    setHandRevealed(next);
    if (next && state.status === "playing") {
      logHandPeek({ roomId, sessionId }).catch(() => {});
    }
  }

  async function handleFlip() {
    setFlipping(true);
    try {
      await flip({ roomId, sessionId });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't flip the card.");
    } finally {
      setFlipping(false);
    }
  }

  if (state.status === "peeking") {
    const remaining = state.peekEndsAt ? Math.max(0, Math.ceil((state.peekEndsAt - now) / 1000)) : 0;
    return (
      <div className="mx-auto flex min-h-svh max-w-md flex-col items-center justify-center gap-6 px-4 py-10 text-center">
        <p className="text-muted-foreground">Memorize your hand!</p>
        <p className="text-6xl font-bold tabular-nums">{remaining}</p>
        <div className="flex flex-wrap justify-center gap-2">
          {myHand.map((hc) => (
            <PlayingCard key={hc.id} card={hc.card} size="lg" />
          ))}
        </div>
      </div>
    );
  }

  if (state.status === "finished") {
    return (
      <div className="mx-auto flex min-h-svh max-w-md flex-col justify-center gap-6 px-4 py-10">
        <div className="text-center">
          <div className="text-4xl">🏁</div>
          <h2 className="text-2xl font-bold">Game over</h2>
        </div>
        <ActivityLog entries={state.log} />
        {state.me.isHost && (
          <Button onClick={() => playAgain({ roomId, sessionId })}>Play again</Button>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-svh max-w-lg flex-col gap-4 px-4 py-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-1">
          {state.players.map((p) => (
            <Badge key={p.sessionId} variant={p.isMe ? "default" : "outline"}>
              {p.name} · {p.handCount}
            </Badge>
          ))}
        </div>
        <Badge variant="secondary">
          {state.currentIndex}/{state.total}
        </Badge>
      </div>

      <Pyramid slots={state.pyramid} currentIndex={state.currentIndex} />

      {activeSlot?.revealed && activeSlot.card && (
        <div className="flex flex-col items-center gap-1 py-2">
          <PlayingCard card={activeSlot.card} size="xl" highlighted />
          <span className="text-sm font-medium text-amber-500">
            {activeSlot.value} sip{activeSlot.value === 1 ? "" : "s"}
          </span>
        </div>
      )}

      <Button onClick={handleFlip} disabled={flipping}>
        {state.currentIndex === 0 ? "Flip first card" : "Flip next card"}
      </Button>

      <Separator />

      <div>
        <div className="mb-2 flex items-center justify-center gap-2">
          <p className="text-sm font-medium">Your hand</p>
          <Button size="sm" variant="outline" onClick={togglePeek}>
            {handRevealed ? "Hide hand" : "Peek at hand"}
          </Button>
        </div>
        <p className="mb-2 text-center text-xs text-muted-foreground">
          Peeking mid-round gets announced to the table.
        </p>
        <Hand cards={myHand} revealed={handRevealed} />
      </div>

      <ActivityLog entries={state.log} />
    </div>
  );
}
