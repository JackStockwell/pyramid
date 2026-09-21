import { PlayingCard } from "@/components/PlayingCard";
import { cn } from "@/lib/utils";
import type { Card } from "@/lib/cards";

export interface PyramidSlotView {
  row: number;
  col: number;
  index: number;
  value: number | null;
  revealed: boolean;
  card: Card | null;
}

interface PyramidProps {
  slots: PyramidSlotView[];
  currentIndex: number;
}

export function Pyramid({ slots, currentIndex }: PyramidProps) {
  const rows = new Map<number, PyramidSlotView[]>();
  for (const slot of slots) {
    if (!rows.has(slot.row)) rows.set(slot.row, []);
    rows.get(slot.row)!.push(slot);
  }
  const rowNumbers = [...rows.keys()].sort((a, b) => b - a);

  return (
    <div className="flex flex-col items-center gap-2 py-4">
      {rowNumbers.map((row) => (
        <div key={row} className="flex items-center gap-2">
          {rows
            .get(row)!
            .sort((a, b) => a.col - b.col)
            .map((slot) => {
              const isActive = slot.index === currentIndex - 1;
              const isNext = slot.index === currentIndex;
              return (
                <div key={slot.index} className="flex flex-col items-center gap-1">
                  <PlayingCard
                    card={slot.card}
                    faceDown={!slot.revealed}
                    size="md"
                    dimmed={!slot.revealed && !isNext}
                  />
                  <span
                    className={cn(
                      "text-[10px] font-medium text-muted-foreground",
                      isActive && "text-amber-500",
                    )}
                  >
                    {slot.value !== null ? `${slot.value} sip${slot.value === 1 ? "" : "s"}` : " "}
                  </span>
                </div>
              );
            })}
        </div>
      ))}
    </div>
  );
}
