import { SUIT_SYMBOL, isRed, type Card } from "@/lib/cards";
import { cn } from "@/lib/utils";

interface CardChipProps {
  card: Card;
  className?: string;
}

export function CardChip({ card, className }: CardChipProps) {
  return (
    <span className={cn("font-semibold", isRed(card.suit) ? "text-red-600" : "text-foreground", className)}>
      {card.rank}
      {SUIT_SYMBOL[card.suit]}
    </span>
  );
}
