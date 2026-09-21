import { PlayingCard } from "@/components/PlayingCard";
import type { Card } from "@/lib/cards";

export interface HandCardView {
  id: string;
  card: Card;
}

interface HandProps {
  cards: HandCardView[];
  revealed: boolean;
  matchRank?: string | null;
  onRevealCard?: (handCardId: string) => void;
}

export function Hand({ cards, revealed, matchRank, onRevealCard }: HandProps) {
  if (cards.length === 0) {
    return <p className="text-muted-foreground text-sm">Your hand is empty.</p>;
  }

  return (
    <div className="flex flex-wrap justify-center gap-2">
      {cards.map((hc) => (
        <PlayingCard
          key={hc.id}
          card={hc.card}
          faceDown={!revealed}
          size="md"
          highlighted={revealed && !!matchRank && hc.card.rank === matchRank}
          onClick={revealed && onRevealCard ? () => onRevealCard(hc.id) : undefined}
        />
      ))}
    </div>
  );
}
