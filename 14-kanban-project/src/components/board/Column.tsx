import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import DraggableCard from '@/components/board/DraggableCard';
import AddCardForm from '@/components/board/AddCardForm';
import type { BoardColumn } from '@/types/board';

type Props = {
  column: BoardColumn;
  onAddCard: (title: string) => void;
  onDeleteCard: (cardId: string) => void;
};

export default function Column({ column, onAddCard, onDeleteCard }: Props) {
  const { title, cards } = column;
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  return (
    <section className="column">
      <header className="column__header">
        <h2>{title}</h2>
        <span className="column__count">{cards.length}</span>
      </header>

      <ul
        ref={setNodeRef}
        className={`column__list${isOver ? ' column__list--over' : ''}`}
      >
        <SortableContext
          items={cards.map((c) => c.id)}
          strategy={verticalListSortingStrategy}
        >
          {cards.map((c) => (
            <li key={c.id}>
              <DraggableCard card={c} onDelete={() => onDeleteCard(c.id)} />
            </li>
          ))}
        </SortableContext>
      </ul>

      <div className="column__footer">
        <AddCardForm onAdd={onAddCard} />
      </div>
    </section>
  );
}