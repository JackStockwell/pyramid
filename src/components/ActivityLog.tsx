import { useEffect, useRef } from "react";
import { CardChip } from "@/components/CardChip";
import { cn } from "@/lib/utils";
import type { Card } from "@/lib/cards";

export interface LogEntry {
  id: string;
  ts: number;
  kind: "info" | "flip" | "peek" | "reveal";
  text?: string | null;
  actorName?: string | null;
  card?: Card | null;
  value?: number | null;
}

export function ActivityLog({ entries }: { entries: LogEntry[] }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Set scrollTop directly rather than scrollIntoView — scrollIntoView can
    // walk up and scroll ancestor containers (the whole page) into view too,
    // which is what was causing the page to jump on every new log entry.
    const el = containerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [entries.length]);

  return (
    <div
      ref={containerRef}
      className="flex h-40 flex-col gap-1.5 overflow-y-auto rounded-md border bg-muted/30 p-3 text-sm"
    >
      {entries.length === 0 && (
        <p className="text-muted-foreground text-xs">Nothing's happened yet.</p>
      )}
      {entries.map((entry) => (
        <LogLine key={entry.id} entry={entry} />
      ))}
    </div>
  );
}

function LogLine({ entry }: { entry: LogEntry }) {
  if (entry.kind === "peek") {
    return (
      <p className="leading-snug font-medium text-red-600 dark:text-red-400">
        {entry.actorName} peeked at their hand.
      </p>
    );
  }

  if (entry.kind === "reveal" && entry.card) {
    return (
      <p className="rounded bg-amber-400/15 px-1.5 py-1 leading-snug font-medium text-amber-600 dark:text-amber-400">
        {entry.actorName} has <CardChip card={entry.card} />.
      </p>
    );
  }

  if (entry.kind === "flip" && entry.card) {
    return (
      <p className="text-foreground/90 leading-snug">
        {entry.actorName} flipped <CardChip card={entry.card} /> (worth {entry.value}).
      </p>
    );
  }

  return <p className={cn("text-foreground/90 leading-snug")}>{entry.text}</p>;
}
