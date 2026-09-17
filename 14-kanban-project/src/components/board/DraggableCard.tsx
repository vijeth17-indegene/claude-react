import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CardItem } from '@/components/board/CardItem';
import type { KanbanCard } from '@/types/board';

type Props = { card: KanbanCard; onDelete: () => void };

export default function DraggableCard({ card, onDelete }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: card.id });

  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={isDragging ? 'card--dragging' : undefined}
      {...attributes}
      {...listeners}
    >
      <CardItem card={card} onDelete={onDelete} />
    </div>
  );
}