import { useMutation } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "../../convex/_generated/api";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { maxPyramidRows, pyramidSize } from "@/lib/cards";
import type { Id } from "../../convex/_generated/dataModel";

interface LobbyProps {
  roomId: Id<"rooms">;
  code: string;
  handSize: number;
  isHost: boolean;
  sessionId: string;
  players: { sessionId: string; name: string; isHost: boolean; isMe: boolean }[];
}

export function Lobby({ roomId, code, handSize, isHost, sessionId, players }: LobbyProps) {
  const setHandSize = useMutation(api.rooms.setHandSize);
  const startGame = useMutation(api.rooms.startGame);
  const [starting, setStarting] = useState(false);

  async function handleStart() {
    setStarting(true);
    try {
      await startGame({ roomId, sessionId });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't start the game.");
    } finally {
      setStarting(false);
    }
  }

  async function handleHandSizeChange(next: number) {
    try {
      await setHandSize({ roomId, sessionId, handSize: next });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't update hand size.");
    }
  }

  const remaining = Math.max(0, 52 - handSize * players.length);
  const rows = maxPyramidRows(remaining);
  const extraBottom = remaining - pyramidSize(rows);
  const bottomRowWidth = rows + extraBottom;
  const pyramidFits = rows >= 3;

  return (
    <div className="mx-auto flex min-h-svh max-w-md flex-col justify-center gap-6 px-4 py-10">
      <div className="text-center">
        <p className="text-muted-foreground text-sm">Room code</p>
        <p className="font-mono text-4xl font-bold tracking-[0.3em]">{code}</p>
        <p className="text-muted-foreground mt-1 text-xs">Share this code so others can join.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Players ({players.length})</CardTitle>
          <CardDescription>Waiting in the lobby.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {players.map((p) => (
            <div key={p.sessionId} className="flex items-center gap-2">
              <Avatar size="sm">
                <AvatarFallback>{p.name.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium">
                {p.name} {p.isMe && <span className="text-muted-foreground">(you)</span>}
              </span>
              {p.isHost && <Badge variant="secondary">Host</Badge>}
            </div>
          ))}
        </CardContent>
      </Card>

      {isHost ? (
        <Card>
          <CardHeader>
            <CardTitle>Game settings</CardTitle>
            <CardDescription>
              {handSize} cards each
              {players.length > 0 && (
                <>
                  {" "}
                  &middot;{" "}
                  {pyramidFits
                    ? `≈${rows} rows (${remaining} cards, bottom row of ${bottomRowWidth})`
                    : "not enough cards left for a pyramid"}
                </>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-center gap-2">
              {[3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                <Button
                  key={n}
                  size="sm"
                  variant={handSize === n ? "default" : "outline"}
                  onClick={() => handleHandSizeChange(n)}
                >
                  {n}
                </Button>
              ))}
            </div>
            <Button onClick={handleStart} disabled={players.length < 2 || starting || !pyramidFits}>
              {starting
                ? "Starting…"
                : players.length < 2
                  ? "Need at least 2 players"
                  : !pyramidFits
                    ? "Lower the hand size"
                    : "Start game"}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <p className="text-muted-foreground text-center text-sm">
          Waiting for the host to start the game…
        </p>
      )}
    </div>
  );
}
