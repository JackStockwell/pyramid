import { useMutation } from "convex/react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { getSavedName, getSessionId, saveName } from "@/lib/session";

export default function Home() {
  const navigate = useNavigate();
  const createRoom = useMutation(api.rooms.createRoom);
  const joinRoom = useMutation(api.rooms.joinRoom);

  const [name, setName] = useState(getSavedName());
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState<"create" | "join" | null>(null);

  async function handleCreate() {
    if (!name.trim()) return toast.error("Enter your name first.");
    setBusy("create");
    try {
      saveName(name.trim());
      const { code } = await createRoom({ hostName: name.trim(), sessionId: getSessionId() });
      navigate(`/room/${code}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't create room.");
    } finally {
      setBusy(null);
    }
  }

  async function handleJoin() {
    if (!name.trim()) return toast.error("Enter your name first.");
    if (!code.trim()) return toast.error("Enter a room code.");
    setBusy("join");
    try {
      saveName(name.trim());
      await joinRoom({ code: code.trim().toUpperCase(), name: name.trim(), sessionId: getSessionId() });
      navigate(`/room/${code.trim().toUpperCase()}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't join room.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mx-auto flex min-h-svh max-w-md flex-col items-center justify-center gap-8 px-4 py-10">
      <div className="text-center">
        <div className="mb-2 text-5xl">🔺</div>
        <h1 className="text-3xl font-bold tracking-tight">Pyramid</h1>
        <p className="text-muted-foreground mt-1">The classic bluffing card game, online.</p>
      </div>

      <Card className="w-full">
        <CardHeader>
          <CardTitle>Your name</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="e.g. Jack"
            value={name}
            maxLength={24}
            onChange={(e) => setName(e.target.value)}
          />
        </CardContent>
      </Card>

      <Card className="w-full">
        <CardHeader>
          <CardTitle>Start a new game</CardTitle>
          <CardDescription>You'll get a room code to share with friends.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="w-full" onClick={handleCreate} disabled={busy !== null}>
            {busy === "create" ? "Creating…" : "Create room"}
          </Button>
        </CardContent>
      </Card>

      <div className="flex w-full items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-muted-foreground text-xs uppercase tracking-wide">or</span>
        <Separator className="flex-1" />
      </div>

      <Card className="w-full">
        <CardHeader>
          <CardTitle>Join a game</CardTitle>
          <CardDescription>Enter the code someone shared with you.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="code">Room code</Label>
            <Input
              id="code"
              placeholder="ABCDE"
              value={code}
              maxLength={5}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="tracking-[0.3em] font-mono uppercase"
            />
          </div>
          <Button className="w-full" variant="secondary" onClick={handleJoin} disabled={busy !== null}>
            {busy === "join" ? "Joining…" : "Join room"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
