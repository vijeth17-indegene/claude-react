export type Label = { id: string; name: string; color: string };

export type KanbanCard = {
  id: string;
  title: string;
  description?: string;
  labels: Label[];
};

export type BoardColumn = {
  id: string;
  title: string;
  cards: KanbanCard[];
};