import { useEffect, useRef } from "react";

interface LogEntry {
  id: string;
  ts: number;
  message: string;
}

export function ActivityLog({ entries }: { entries: LogEntry[] }) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [entries.length]);

  return (
    <div className="flex h-40 flex-col gap-1 overflow-y-auto rounded-md border bg-muted/30 p-3 text-sm">
      {entries.length === 0 && (
        <p className="text-muted-foreground text-xs">Nothing's happened yet.</p>
      )}
      {entries.map((entry) => (
        <p key={entry.id} className="text-foreground/90 leading-snug">
          {entry.message}
        </p>
      ))}
      <div ref={endRef} />
    </div>
  );
}
