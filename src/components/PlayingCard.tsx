import { cn } from "@/lib/utils";
import { SUIT_SYMBOL, isRed, type Card } from "@/lib/cards";

interface PlayingCardProps {
  card?: Card | null;
  faceDown?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
  highlighted?: boolean;
  dimmed?: boolean;
  className?: string;
  onClick?: () => void;
}

const SIZE_CLASSES: Record<NonNullable<PlayingCardProps["size"]>, string> = {
  sm: "h-14 w-10 text-[10px] rounded-md",
  md: "h-20 w-14 text-sm rounded-lg",
  lg: "h-28 w-20 text-lg rounded-xl",
  xl: "h-44 w-32 text-3xl rounded-2xl",
};

export function PlayingCard({
  card,
  faceDown,
  size = "md",
  highlighted,
  dimmed,
  className,
  onClick,
}: PlayingCardProps) {
  const showBack = faceDown || !card;

  return (
    <div
      onClick={onClick}
      className={cn(
        "relative select-none border shadow-sm transition-all",
        SIZE_CLASSES[size],
        showBack
          ? "bg-gradient-to-br from-primary to-primary/70 border-primary/40"
          : "bg-card border-border",
        highlighted && "ring-2 ring-amber-400 -translate-y-1",
        dimmed && "opacity-40",
        onClick && "cursor-pointer hover:-translate-y-1",
        className,
      )}
    >
      {showBack ? (
        <div className="absolute inset-1 rounded-[inherit] border border-primary-foreground/20 bg-[repeating-linear-gradient(45deg,transparent,transparent_3px,rgba(255,255,255,0.08)_3px,rgba(255,255,255,0.08)_6px)]" />
      ) : (
        <div
          className={cn(
            "flex h-full w-full flex-col items-center justify-center gap-0.5 font-semibold",
            isRed(card.suit) ? "text-red-600" : "text-foreground",
          )}
        >
          <span className="leading-none">{card.rank}</span>
          <span className="text-[1.3em] leading-none">{SUIT_SYMBOL[card.suit]}</span>
        </div>
      )}
    </div>
  );
}
