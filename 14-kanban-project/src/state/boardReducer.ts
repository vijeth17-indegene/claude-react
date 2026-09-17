import { arrayMove } from '@dnd-kit/sortable';
import type { BoardColumn, KanbanCard } from '@/types/board';

export type BoardState = { columns: BoardColumn[] };

export type BoardAction =
  | { type: 'ADD_CARD'; columnId: string; card: KanbanCard }
  | { type: 'DELETE_CARD'; columnId: string; cardId: string }
  | { type: 'MOVE_CARD'; cardId: string; fromColumnId: string; toColumnId: string; toIndex: number };

export function findColumnIdByCard(
  columns: BoardColumn[],
  cardId: string,
): string | undefined {
  return columns.find((col) => col.cards.some((c) => c.id === cardId))?.id;
}


export function boardReducer(state: BoardState, action: BoardAction): BoardState {
  switch (action.type) {
    case 'ADD_CARD':
      return {
        columns: state.columns.map((col) =>
          col.id === action.columnId
            ? { ...col, cards: [...col.cards, action.card] }
            : col,
        ),
      };

    case 'DELETE_CARD':
      return {
        columns: state.columns.map((col) =>
          col.id === action.columnId
            ? { ...col, cards: col.cards.filter((c) => c.id !== action.cardId) }
            : col,
        ),
      };

    case 'MOVE_CARD': {
      const fromCol = state.columns.find((c) => c.id === action.fromColumnId);
      const card = fromCol?.cards.find((c) => c.id === action.cardId);
      if (!fromCol || !card) return state;

      if (action.fromColumnId === action.toColumnId) {
        const fromIndex = fromCol.cards.findIndex((c) => c.id === action.cardId);
        if (fromIndex === action.toIndex) return state;

        return {
          columns: state.columns.map((col) =>
            col.id === action.fromColumnId
              ? { ...col, cards: arrayMove(col.cards, fromIndex, action.toIndex) }
              : col,
          ),
        };
      }

      return {
        columns: state.columns.map((col) => {
          if (col.id === action.fromColumnId) {
            return { ...col, cards: col.cards.filter((c) => c.id !== action.cardId) };
          }
          if (col.id === action.toColumnId) {
            const cards = [...col.cards];
            cards.splice(action.toIndex, 0, card);
            return { ...col, cards };
          }
          return col;
        }),
      };
    }

    default:
      action satisfies never;
      return state;
  }
}