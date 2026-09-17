import Card from '@/components/ui/Card';
import LabelChip from '@/components/board/LabelChip';
import type { KanbanCard } from '@/types/board';

type Props = { card: KanbanCard; onDelete?: () => void; className?: string };

export function CardItem({ card, onDelete, className }: Props) {
  const { title, description, labels } = card;

  return (
    <Card className={className}>
      <h3 className="card__title">{title}</h3>
      {description && <p className="card__desc">{description}</p>}
      {labels.length > 0 && (
        <div className="card__labels">
          {labels.map((l) => (
            <LabelChip key={l.id} name={l.name} color={l.color} />
          ))}
        </div>
      )}
      {onDelete && (
        <button
          type="button"
          className="card__delete"
          aria-label={`Delete card: ${title}`}
          onClick={onDelete}
          onPointerDown={(e) => e.stopPropagation()}
        >
          ×
        </button>
      )}
    </Card>
  );
}