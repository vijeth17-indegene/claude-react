import { useReducer, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import Column from '@/components/board/Column';
import { CardItem } from '@/components/board/CardItem';
import { boardReducer, findColumnIdByCard } from '@/state/boardReducer';
import { seedColumns } from '@/data/seed';
import type { KanbanCard } from '@/types/board';

export default function Board() {
  const [state, dispatch] = useReducer(boardReducer, { columns: seedColumns });
  const [activeCard, setActiveCard] = useState<KanbanCard | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor),
  );

  function findCard(cardId: string): KanbanCard | undefined {
    for (const col of state.columns) {
      const card = col.cards.find((c) => c.id === cardId);
      if (card) return card;
    }
    return undefined;
  }

  function handleDragStart(event: DragStartEvent) {
    const card = findCard(String(event.active.id));
    setActiveCard(card ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
  setActiveCard(null);
  const { active, over } = event;
  if (!over) return;

  const cardId = String(active.id);
  const overId = String(over.id);
  const fromColumnId = findColumnIdByCard(state.columns, cardId);
  if (!fromColumnId) return;

  const isColumn = state.columns.some((c) => c.id === overId);
  const toColumnId = isColumn ? overId : findColumnIdByCard(state.columns, overId);
  if (!toColumnId) return;

  const toColumn = state.columns.find((c) => c.id === toColumnId)!;
  const toIndex = isColumn
    ? toColumn.cards.length                          // dropped on empty space in the column
    : toColumn.cards.findIndex((c) => c.id === overId); // dropped on a specific card

  if (fromColumnId === toColumnId) {
    const fromIndex = toColumn.cards.findIndex((c) => c.id === cardId);
    if (fromIndex === toIndex) return;
  }

  dispatch({ type: 'MOVE_CARD', cardId, fromColumnId, toColumnId, toIndex });
}

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveCard(null)}
    >
      <div className="board">
        {state.columns.map((col) => (
          <Column
            key={col.id}
            column={col}
            onAddCard={(title) =>
              dispatch({
                type: 'ADD_CARD',
                columnId: col.id,
                card: { id: crypto.randomUUID(), title, labels: [] },
              })
            }
            onDeleteCard={(cardId) =>
              dispatch({ type: 'DELETE_CARD', columnId: col.id, cardId })
            }
          />
        ))}
      </div>

      <DragOverlay>
        {activeCard ? <CardItem card={activeCard} className="card--overlay" /> : null}
      </DragOverlay>
    </DndContext>
  );
}