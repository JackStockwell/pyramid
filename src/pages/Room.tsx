import { useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { api } from "../../convex/_generated/api";
import { GameBoard } from "@/components/GameBoard";
import { Lobby } from "@/components/Lobby";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getSavedName, getSessionId, saveName } from "@/lib/session";

export default function Room() {
  const { code = "" } = useParams();
  const sessionId = getSessionId();
  const roomPreview = useQuery(api.rooms.getRoomByCode, { code });

  if (roomPreview === undefined) {
    return <CenteredMessage>Loading…</CenteredMessage>;
  }
  if (roomPreview === null) {
    return <RoomGone message={`No room found for code ${code.toUpperCase()}.`} />;
  }

  return <RoomInner roomId={roomPreview.roomId} code={roomPreview.code} sessionId={sessionId} />;
}

function RoomInner({
  roomId,
  code,
  sessionId,
}: {
  roomId: import("../../convex/_generated/dataModel").Id<"rooms">;
  code: string;
  sessionId: string;
}) {
  const state = useQuery(api.game.getGameState, { roomId, sessionId });
  const joinRoom = useMutation(api.rooms.joinRoom);
  const [name, setName] = useState(getSavedName());
  const [joining, setJoining] = useState(false);

  if (state === undefined) {
    return <CenteredMessage>Loading…</CenteredMessage>;
  }
  if (state === null) {
    return <RoomGone message="This room closed after sitting inactive for a while." />;
  }

  if (!state.me) {
    async function handleJoin() {
      if (!name.trim()) return toast.error("Enter your name first.");
      setJoining(true);
      try {
        saveName(name.trim());
        await joinRoom({ code, name: name.trim(), sessionId });
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Couldn't join room.");
      } finally {
        setJoining(false);
      }
    }

    return (
      <CenteredMessage>
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Join room {code}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Input
              placeholder="Your name"
              value={name}
              maxLength={24}
              onChange={(e) => setName(e.target.value)}
            />
            <Button onClick={handleJoin} disabled={joining}>
              {joining ? "Joining…" : "Join"}
            </Button>
          </CardContent>
        </Card>
      </CenteredMessage>
    );
  }

  if (state.status === "lobby") {
    return (
      <Lobby
        roomId={roomId}
        code={state.code}
        handSize={state.handSize}
        isHost={state.me.isHost}
        sessionId={sessionId}
        players={state.players}
      />
    );
  }

  return <GameBoard roomId={roomId} sessionId={sessionId} state={state} />;
}

function RoomGone({ message }: { message: string }) {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => navigate("/"), 4000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <CenteredMessage>
      <p>{message}</p>
      <Link to="/" className={buttonVariants()}>
        Back home
      </Link>
      <p className="text-muted-foreground text-xs">Taking you home in a few seconds…</p>
    </CenteredMessage>
  );
}

function CenteredMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-svh max-w-md flex-col items-center justify-center gap-4 px-4 py-10 text-center">
      {children}
    </div>
  );
}
